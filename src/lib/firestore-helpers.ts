import * as admin from 'firebase-admin';
import loadJsonFile from 'load-json-file';
import {IFirebaseCredentials} from '../interfaces/IFirebaseCredentials';


const getCredentialsFromFile = (credentialsFilename: string): Promise<IFirebaseCredentials> => {
  return loadJsonFile(credentialsFilename);
};

const getFirestoreDBReference = (credentials: IFirebaseCredentials): admin.firestore.Firestore => {
  admin.initializeApp({
    credential: admin.credential.cert(credentials as any),
    databaseURL: `https://${(credentials as any).project_id}.firebaseio.com`,
  });

  const firestore = admin.firestore();
  firestore.settings({timestampsInSnapshots: true});
  return firestore;
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

const batchExecutor = async function<T>(promises: Promise<T>[], batchSize: number = 50) {
  const res: T[] = [];
  while (promises.length > batchSize) {
    const temp = await Promise.all(promises.splice(0, batchSize));
    res.push(...temp)
  }
  if (promises.length > 0) {
    const temp = await Promise.all(promises);
    res.push(...temp)
  }
  return res;
};

export {
  getCredentialsFromFile,
  getFirestoreDBReference,
  getDBReferenceFromPath,
  isLikeDocument,
  isRootOfDatabase,
  sleep,
  batchExecutor
};
