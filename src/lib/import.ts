import {anyFirebaseRef, batchExecutor, isLikeDocument, isRootOfDatabase} from './firestore-helpers';
import {array_chunks, ConcurrencyLimit, limitConcurrency, unserializeSpecialTypes} from './helpers';
import {ICollection} from '../interfaces/ICollection';

const importData = (data: any,
                    startingRef: anyFirebaseRef,
                    mergeWithExisting: boolean = true,
                    maxConcurrency: number = 0,
                    logs = false,
): Promise<any> => {

  const dataToImport = {...data};
  const writeLimit = limitConcurrency(maxConcurrency);
  if (isLikeDocument(startingRef)) {
    if (!dataToImport.hasOwnProperty('__collections__')) {
      throw new Error('Root or document reference doesn\'t contain a __collections__ property.');
    }
    const collections = dataToImport['__collections__'];
    const collectionPromises: Array<Promise<any>> = [];
    for (const collection in collections) {
      if (collections.hasOwnProperty(collection)) {
        collectionPromises.push(setDocuments(collections[collection], startingRef.collection(collection), mergeWithExisting, writeLimit,logs));
      }
    }
    if (isRootOfDatabase(startingRef)) {
      return batchExecutor(collectionPromises);
    } else {
      const documentID = startingRef.id;
      const documentData: any = {};
      documentData[documentID] = dataToImport;
      const documentPromise = setDocuments(documentData, startingRef.parent, mergeWithExisting, writeLimit, logs);
      return documentPromise.then(() => batchExecutor(collectionPromises));
    }
  } else {
    return setDocuments(dataToImport, <FirebaseFirestore.CollectionReference>startingRef, mergeWithExisting, writeLimit, logs);
  }
};

const setDocuments = async (data: ICollection, startingRef: FirebaseFirestore.CollectionReference, mergeWithExisting: boolean = true, batchLimit: ConcurrencyLimit, logs = false): Promise<any> => {
  logs && console.log(`Writing documents for ${startingRef.path}`);
  if ('__collections__' in data) {
    throw new Error('Found unexpected "__collection__" in collection data. Does the starting node match' +
      ' the root of the incoming data?');
  }
  const collections: Array<any> = [];
  const chunks = array_chunks(Object.keys(data), 100);
  const chunkPromises = chunks.map(async (documentKeys: string[], index: number) => {
    await batchLimit.wait();

    const batch = startingRef.firestore.batch();
    documentKeys.map((documentKey: string) => {
      if (data[documentKey]['__collections__']) {
        Object.keys(data[documentKey]['__collections__']).map(collection => {
          collections.push({
            path: startingRef.doc(documentKey).collection(collection),
            collection: data[documentKey]['__collections__'][collection],
          });
        });
      }
      const {__collections__, ...documents} = data[documentKey];
      const documentData: any = unserializeSpecialTypes(documents);
      batch.set(startingRef.doc(documentKey), documentData, {merge: mergeWithExisting});
    });
    return batch.commit().finally(batchLimit.done);
  });
  return batchExecutor(chunkPromises)
    .then(() => {
      return collections.map((col) => {
        return setDocuments(col.collection, col.path, mergeWithExisting, batchLimit, logs);
      });
    })
    .then(subCollectionPromises => batchExecutor(subCollectionPromises))
    .catch(err => {
      logs && console.error(err);

    });
};

export default importData;
export {setDocuments};
