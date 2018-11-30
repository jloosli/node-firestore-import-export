import {isLikeDocument, isRootOfDatabase, sleep} from './firestore-helpers';
import * as admin from 'firebase-admin';
import DocumentReference = FirebaseFirestore.DocumentReference;

const SLEEP_TIME = 1000;

const clearData = async (startingRef: admin.firestore.Firestore |
  FirebaseFirestore.DocumentReference |
  FirebaseFirestore.CollectionReference) => {
  if (isLikeDocument(startingRef)) {
    const promises = [clearCollections(startingRef)];
    if (!isRootOfDatabase(startingRef)) {
      promises.push(startingRef.delete() as Promise<any>);
    }
    return Promise.all(promises);
  } else {
    return clearDocuments(<FirebaseFirestore.CollectionReference>startingRef);
  }
};

const clearCollections = async (startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference) => {
  let collectionsSnapshot, deadlineError = false;
  do {
    try {
      collectionsSnapshot = await startingRef.listCollections();
      deadlineError = false;
    } catch (e) {
      if (e.message === 'Deadline Exceeded') {
        console.log(`Deadline Error in getCollections()...waiting ${SLEEP_TIME / 1000} second(s) before retrying`);
        await sleep(SLEEP_TIME);
        deadlineError = true;
      } else {
        throw e;
      }
    }
  } while (deadlineError || !collectionsSnapshot);

  const collectionPromises: Array<Promise<any>> = [];
  collectionsSnapshot.map((collectionRef: FirebaseFirestore.CollectionReference) => {
    collectionPromises.push(clearDocuments(collectionRef));
  });
  return Promise.all(collectionPromises);
};

const clearDocuments = async (collectionRef: FirebaseFirestore.CollectionReference) => {
  console.log(`Retrieving documents from ${collectionRef.path}`);
  let allDocuments, deadlineError = false;
  do {
    try {
      allDocuments = await collectionRef.listDocuments();
      deadlineError = false;
    } catch (e) {
      if (e.code && e.code === 4) {
        console.log(`Deadline Error in listDocuments()...waiting ${SLEEP_TIME / 1000} second(s) before retrying`);
        await sleep(SLEEP_TIME);
        deadlineError = true;
      } else {
        throw e;
      }
    }
  } while (deadlineError || !allDocuments);
  const documentPromises: Array<Promise<object>> = [];
  allDocuments.forEach((docRef: DocumentReference) => {
    documentPromises.push(clearCollections(docRef));
    documentPromises.push(docRef.delete());
  });
  return Promise.all(documentPromises);
};

export default clearData;