import {
  batchExecutor,
  isLikeDocument,
  isRootOfDatabase,
  safelyGetCollectionsSnapshot,
  safelyGetDocumentReferences,
} from './firestore-helpers';
import * as admin from 'firebase-admin';
import {serializeSpecialTypes} from './helpers';

const exportData = async (
  startingRef:
    | admin.firestore.Firestore
    | FirebaseFirestore.DocumentReference
    | FirebaseFirestore.CollectionReference,
  logs = false
) => {
  if (isLikeDocument(startingRef)) {
    const collectionsPromise = () => getCollections(startingRef, logs);
    let dataPromise: () => Promise<any>;
    if (isRootOfDatabase(startingRef)) {
      dataPromise = () => Promise.resolve({});
    } else {
      dataPromise = () => (<FirebaseFirestore.DocumentReference>startingRef)
        .get()
        .then(snapshot => snapshot.data())
        .then(data => serializeSpecialTypes(data));
    }
    return await batchExecutor([collectionsPromise, dataPromise]).then(res => {
      return {__collections__: res[0], ...res[1]};
    });
  } else {
    return await getDocuments(
      <FirebaseFirestore.CollectionReference>startingRef,
      logs
    );
  }
};

const getCollections = async (
  startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference,
  logs = false
) => {
  const collectionNames: Array<string> = [];
  const collectionPromises: Array<() => Promise<any>> = [];
  const collectionsSnapshot = await safelyGetCollectionsSnapshot(
    startingRef,
    logs
  );
  collectionsSnapshot.map(
    (collectionRef: FirebaseFirestore.CollectionReference) => {
      collectionNames.push(collectionRef.id);
      collectionPromises.push(() => getDocuments(collectionRef, logs));
    }
  );
  const results = await batchExecutor(collectionPromises);
  const zipped: any = {};
  results.map((res: any, idx: number) => {
    zipped[collectionNames[idx]] = res;
  });
  return zipped;
};

const getDocuments = async (
  collectionRef: FirebaseFirestore.CollectionReference,
  logs = false
) => {
  logs && console.log(`Retrieving documents from ${collectionRef.path}`);
  const results: any = {};
  const documentPromises: Array<() => Promise<object>> = [];
  const allDocuments = await safelyGetDocumentReferences(collectionRef, logs);
  allDocuments.forEach(doc => {
    documentPromises.push(
      () => new Promise(async resolve => {
        const docSnapshot = await doc.get();
        const docDetails: any = {};
        if (docSnapshot.exists) {
          docDetails[docSnapshot.id] = serializeSpecialTypes(
            docSnapshot.data()
          );
        } else {
          docDetails[docSnapshot.id] = {'_import-export-flag-doesnotexists_': true};
        }
        docDetails[docSnapshot.id]['__collections__'] = await getCollections(
          docSnapshot.ref,
          logs
        );
        resolve(docDetails);
      })
    );
  });
  (await batchExecutor(documentPromises)).forEach((res: any) => {
    Object.keys(res).map(key => ((<any>results)[key] = res[key]));
  });
  return results;
};

export default exportData;
