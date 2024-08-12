import {DocumentData, DocumentReference, DocumentSnapshot, Firestore} from '@google-cloud/firestore';
import {
  batchExecutor,
  isLikeDocument,
  isRootOfDatabase,
  safelyGetCollectionsSnapshot,
  safelyGetDocumentReferences,
} from './firestore-helpers';
import {serializeSpecialTypes} from './helpers';

const exportData = async (
  startingRef:
    | Firestore
    | FirebaseFirestore.DocumentReference
    | FirebaseFirestore.CollectionReference,
  options: any = {},
) => {
  let {logs = false} = options;
  if (isLikeDocument(startingRef)) {
    const collectionsPromise = () => getCollections(startingRef, options);
    let dataPromise: () => Promise<any>;
    if (isRootOfDatabase(startingRef)) {
      dataPromise = () => Promise.resolve({});
    } else {
      dataPromise = () =>
        (<FirebaseFirestore.DocumentReference>startingRef)
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
      options
    );
  }
};

const getCollections = async (
  startingRef: Firestore | FirebaseFirestore.DocumentReference,
  options: any = {}
) => {
  const collectionNames: Array<string> = [];
  const collectionPromises: Array<() => Promise<any>> = [];
  const collectionsSnapshot = await safelyGetCollectionsSnapshot(
    startingRef,
    options
  );
  collectionsSnapshot.map(
    (collectionRef: FirebaseFirestore.CollectionReference) => {
      collectionNames.push(collectionRef.id);
      collectionPromises.push(() => getDocuments(collectionRef, options));
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
  options: any = {}
) => {
  const {logs = false, isDocAccepted = (doc: DocumentSnapshot) => true} = options;
  logs && console.log(`Retrieving documents from ${collectionRef.path}`);
  const results: any = {};
  const documentPromises: Array<() => Promise<object>> = [];
  const allDocuments = await safelyGetDocumentReferences(collectionRef, options);
  allDocuments.forEach((doc: DocumentReference | DocumentSnapshot) => {
    documentPromises.push(
      () =>
        new Promise(async resolve => {
          let docSnapshot: DocumentSnapshot;

          // console.log("doc.constructor.name2: ", doc.constructor.name);
          // console.log("doc instanceof DocumentReference: ", doc instanceof DocumentReference);
          // console.log("doc instanceof DocumentSnapshot: ", doc instanceof DocumentSnapshot);
          //
          if ('exists' in doc) {
            docSnapshot = doc as DocumentSnapshot;
          } else {
            docSnapshot = await (doc as DocumentReference).get();
          }

          const docDetails: any = {};
          if (docSnapshot.exists && isDocAccepted(docSnapshot)) {
            docDetails[docSnapshot.id] = serializeSpecialTypes(
              docSnapshot.data()
            );
          } else {
            docDetails[docSnapshot.id] = {
              '_import-export-flag-doesnotexists_': true,
            };
          }
          docDetails[docSnapshot.id]['__collections__'] = await getCollections(
            docSnapshot.ref,
            options
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
