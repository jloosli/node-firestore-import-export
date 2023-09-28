import {Firestore} from '@google-cloud/firestore';

const SLEEP_TIME = 1000;

const getFirestoreDBReference = (): Firestore => {
  return new Firestore();
};

const getDBReferenceFromPath = (
  db: Firestore,
  dataPath?: string
):
  | Firestore
  | FirebaseFirestore.DocumentReference
  | FirebaseFirestore.CollectionReference => {
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

const isLikeDocument = (
  ref:
    | Firestore
    | FirebaseFirestore.DocumentReference
    | FirebaseFirestore.CollectionReference
): ref is FirebaseFirestore.DocumentReference => {
  return (<FirebaseFirestore.DocumentReference>ref).collection !== undefined;
};

const isRootOfDatabase = (
  ref:
    | Firestore
    | FirebaseFirestore.DocumentReference
    | FirebaseFirestore.CollectionReference
): ref is Firestore => {
  return (<Firestore>ref).batch !== undefined;
};

const sleep = (timeInMS: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, timeInMS));

const batchExecutor = async function <T>(
  promises: (() => Promise<T>)[],
  batchSize = 50
) {
  const res: T[] = [];
  while (promises.length > 0) {
    const temp = await Promise.all(
      promises.splice(0, batchSize).map(fn => fn())
    );
    res.push(...temp);
  }
  return res;
};

const safelyGetCollectionsSnapshot = async (
  startingRef: Firestore | FirebaseFirestore.DocumentReference,
  logs = false
): Promise<FirebaseFirestore.CollectionReference[]> => {
  let collectionsSnapshot,
    deadlineError = false;
  do {
    try {
      collectionsSnapshot = await startingRef.listCollections();
      deadlineError = false;
    } catch (e: any) {
      if (e.message === 'Deadline Exceeded') {
        logs &&
          console.log(
            `Deadline Error in getCollections()...waiting ${
              SLEEP_TIME / 1000
            } second(s) before retrying`
          );
        await sleep(SLEEP_TIME);
        deadlineError = true;
      } else {
        throw e;
      }
    }
  } while (deadlineError || !collectionsSnapshot);
  return collectionsSnapshot;
};

const safelyGetDocumentReferences = async (
  collectionRef: FirebaseFirestore.CollectionReference,
  logs = false
): Promise<FirebaseFirestore.DocumentReference[]> => {
  let allDocuments,
    deadlineError = false;
  do {
    try {
      allDocuments = await collectionRef.listDocuments();
      deadlineError = false;
    } catch (e: any) {
      if (e.code && e.code === 4) {
        logs &&
          console.log(
            `Deadline Error in getDocuments()...waiting ${
              SLEEP_TIME / 1000
            } second(s) before retrying`
          );
        await sleep(SLEEP_TIME);
        deadlineError = true;
      } else {
        throw e;
      }
    }
  } while (deadlineError || !allDocuments);
  return allDocuments;
};

type anyFirebaseRef =
  | Firestore
  | FirebaseFirestore.DocumentReference
  | FirebaseFirestore.CollectionReference;

export {
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
