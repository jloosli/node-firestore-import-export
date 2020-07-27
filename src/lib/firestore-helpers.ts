import * as admin from 'firebase-admin';
import loadJsonFile from 'load-json-file';
import {IFirebaseCredentials} from '../interfaces/IFirebaseCredentials';
import process from "process";

const SLEEP_TIME = 1000;

const getCredentialsFromFile = (credentialsFilename?: string): Promise<IFirebaseCredentials> | undefined => {
  return credentialsFilename ?  loadJsonFile(credentialsFilename) : undefined;
};

const getProjectIdFromCredentials = (credentials?: any): string => {
  return process.env.FIRESTORE_EMULATOR_HOST || credentials.project_id;
}

const getFirestoreDBReference = (credentials?: IFirebaseCredentials): admin.firestore.Firestore => {
  admin.initializeApp(credentials ? {
    credential: admin.credential.cert(credentials as any),
    databaseURL: `https://${(credentials as any).project_id}.firebaseio.com`,
  } : {});

  return admin.firestore();
};

const getDBReferenceFromPath = (db: admin.firestore.Firestore, dataPath?: string): admin.firestore.Firestore |
  FirebaseFirestore.DocumentReference |
  FirebaseFirestore.CollectionReference => {
  let startingRef;
  if (dataPath) {
    const parts = dataPath.split('/').length;
    const isDoc = parts % 2 === 0;
    startingRef = isDoc ? db.doc(dataPath) : db.collection(dataPath);
  } else {
    startingRef = db;
  }
  return startingRef;
};

const isLikeDocument = (ref: admin.firestore.Firestore |
  FirebaseFirestore.DocumentReference |
  FirebaseFirestore.CollectionReference): ref is FirebaseFirestore.DocumentReference => {
  return (<FirebaseFirestore.DocumentReference>ref).collection !== undefined;
};

const isRootOfDatabase = (ref: admin.firestore.Firestore |
  FirebaseFirestore.DocumentReference |
  FirebaseFirestore.CollectionReference): ref is admin.firestore.Firestore => {
  return (<admin.firestore.Firestore>ref).batch !== undefined;
};

const sleep = (timeInMS: number): Promise<void> => new Promise(resolve => setTimeout(resolve, timeInMS));

const batchExecutor = async function <T>(promises: Promise<T>[], batchSize: number = 50) {
  const res: T[] = [];
  while (promises.length > 0) {
    const temp = await Promise.all(promises.splice(0, batchSize));
    res.push(...temp);
  }
  return res;
};

const safelyGetCollectionsSnapshot = async (startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference, logs = false): Promise<FirebaseFirestore.CollectionReference[]> => {
  let collectionsSnapshot, deadlineError = false;
  do {
    try {
      collectionsSnapshot = await startingRef.listCollections();
      deadlineError = false;
    } catch (e) {
      if (e.message === 'Deadline Exceeded') {
        logs && console.log(`Deadline Error in getCollections()...waiting ${SLEEP_TIME / 1000} second(s) before retrying`);
        await sleep(SLEEP_TIME);
        deadlineError = true;
      } else {
        throw e;
      }
    }
  } while (deadlineError || !collectionsSnapshot);
  return collectionsSnapshot;
};

const safelyGetDocumentReferences = async (collectionRef: FirebaseFirestore.CollectionReference, logs = false): Promise<FirebaseFirestore.DocumentReference[]> => {
  let allDocuments, deadlineError = false;
  do {
    try {
      allDocuments = await collectionRef.listDocuments();
      deadlineError = false;
    } catch (e) {
      if (e.code && e.code === 4) {
        logs && console.log(`Deadline Error in getDocuments()...waiting ${SLEEP_TIME / 1000} second(s) before retrying`);
        await sleep(SLEEP_TIME);
        deadlineError = true;
      } else {
        throw e;
      }
    }
  } while (deadlineError || !allDocuments);
  return allDocuments;
};

type anyFirebaseRef = admin.firestore.Firestore |
  FirebaseFirestore.DocumentReference |
  FirebaseFirestore.CollectionReference

export {
  getCredentialsFromFile,
  getProjectIdFromCredentials,
  getFirestoreDBReference,
  getDBReferenceFromPath,
  isLikeDocument,
  isRootOfDatabase,
  sleep,
  batchExecutor,
  anyFirebaseRef,
  safelyGetCollectionsSnapshot,
  safelyGetDocumentReferences,
};
