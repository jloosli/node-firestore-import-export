import {
  batchExecutor,
  isLikeDocument,
  isRootOfDatabase,
  safelyGetCollectionsSnapshot,
  safelyGetDocumentReferences,
} from './firestore-helpers';
import DocumentReference = FirebaseFirestore.DocumentReference;
import {DocumentSnapshot, Firestore} from '@google-cloud/firestore';

const clearData = async (
  startingRef:
    | Firestore
    | FirebaseFirestore.DocumentReference
    | FirebaseFirestore.CollectionReference,
  logs = false
) => {
  if (isLikeDocument(startingRef)) {
    const promises: Promise<any>[] = [clearCollections(startingRef, logs)];
    if (!isRootOfDatabase(startingRef)) {
      promises.push(startingRef.delete() as Promise<any>);
    }
    return Promise.all(promises);
  } else {
    return clearDocuments(
      <FirebaseFirestore.CollectionReference>startingRef,
      logs
    );
  }
};

const clearCollections = async (
  startingRef: Firestore | FirebaseFirestore.DocumentReference,
  logs = false
) => {
  const collectionPromises: Array<() => Promise<any>> = [];
  const collectionsSnapshot = await safelyGetCollectionsSnapshot(
    startingRef,
    logs
  );
  collectionsSnapshot.map(
    (collectionRef: FirebaseFirestore.CollectionReference) => {
      collectionPromises.push(() => clearDocuments(collectionRef, logs));
    }
  );
  return batchExecutor(collectionPromises);
};

const clearDocuments = async (
  collectionRef: FirebaseFirestore.CollectionReference,
  logs = false,
  options: any = {}
) => {
  logs && console.log(`Retrieving documents from ${collectionRef.path}`);
  const allDocuments = await safelyGetDocumentReferences(collectionRef, options);
  const documentPromises: Array<() => Promise<object>> = [];
  allDocuments.forEach((doc: DocumentReference | DocumentSnapshot) => {
    let ref: DocumentReference;
    if ('delete' in doc && typeof doc['delete'] === 'function') {
      ref = doc as DocumentReference
    } else {
      ref = (doc as DocumentSnapshot).ref;
    }
    documentPromises.push(() => clearCollections(ref, logs));
    documentPromises.push(() => ref.delete());
  });
  return batchExecutor(documentPromises);
};

export default clearData;
