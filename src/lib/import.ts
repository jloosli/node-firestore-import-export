import * as admin from "firebase-admin";
import {isLikeDocument, isRootOfDatabase} from "./firestore-helpers";
import {array_chunks, unserializeSpecialTypes} from "./helpers";
import {ICollection} from "../interfaces/ICollection";

const importData = (data: any,
                    startingRef: admin.firestore.Firestore |
                      FirebaseFirestore.DocumentReference |
                      FirebaseFirestore.CollectionReference): Promise<any> => {

  const dataToImport = {...data};
  if (isLikeDocument(startingRef)) {
    if (!dataToImport.hasOwnProperty('__collections__')) {
      throw new Error('Root or document reference doesn\'t contain a __collections__ property.');
    }
    const collections = dataToImport['__collections__'];
    delete(dataToImport['__collections__']);
    const collectionPromises: Array<Promise<any>> = [];
    for (const collection in collections) {
      if (collections.hasOwnProperty(collection)) {
        collectionPromises.push(setDocuments(collections[collection], startingRef.collection(collection)));
      }
    }
    if (isRootOfDatabase(startingRef)) {
      return Promise.all(collectionPromises);
    } else {
      const documentID = startingRef.id;
      const documentData: any = {};
      documentData[documentID] = dataToImport;
      const documentPromise = setDocuments(documentData, startingRef.parent);
      return documentPromise.then(() => Promise.all(collectionPromises));
    }
  }
  else {
    return setDocuments(dataToImport, <FirebaseFirestore.CollectionReference>startingRef);
  }
};

const setDocuments = (data: ICollection, startingRef: FirebaseFirestore.CollectionReference): Promise<any> => {
  console.log(`Writing documents for ${startingRef.path}`);
  if ('__collections__' in data) {
    throw new Error('Found unexpected "__collection__" in collection data. Does the starting node match' +
      ' the root of the incoming data?');
  }
  const collections: Array<any> = [];
  const chunks = array_chunks(Object.keys(data), 500);
  const chunkPromises = chunks.map((documentKeys: string[]) => {
    const batch = startingRef.firestore.batch();
    documentKeys.map((documentKey: string) => {
      if (data[documentKey]['__collections__']) {
        Object.keys(data[documentKey]['__collections__']).map(collection => {
          collections.push({
            path: startingRef.doc(documentKey).collection(collection),
            collection: data[documentKey]['__collections__'][collection]
          });
        });
        delete(data[documentKey]['__collections__']);
      }
      const documentData: any = unserializeSpecialTypes(data[documentKey], startingRef.firestore);
      batch.set(startingRef.doc(documentKey), documentData, {merge: true});
    });
    return batch.commit();
  });
  return Promise.all(chunkPromises)
    .then(() => {
      return collections.map((col) => {
        return setDocuments(col.collection, col.path);
      })
    })
    .then(subCollectionPromises => Promise.all(subCollectionPromises))
    .catch(err => {
      console.log(err);

    });
};

export default importData;
export {setDocuments};