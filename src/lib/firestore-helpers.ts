import {Firestore, Query} from '@google-cloud/firestore';

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

interface Clause {
  field: string;
  operation: FirebaseFirestore.WhereFilterOp;
  value: any;
}

interface Options {
  whereClauses?: Clause[];
  wherePaths?: string[];
  pageSize?: number;
  logs?: boolean;
}

async function getAllDocuments(
  collectionRef: FirebaseFirestore.CollectionReference,
  options: Options = {}
) : Promise<FirebaseFirestore.DocumentSnapshot[]>{
  const { whereClauses = [], pageSize = 500 } = options;

  let lastDocument: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let moreDocumentsAvailable = true;
  const allDocuments: FirebaseFirestore.DocumentSnapshot[] = [];

  while (moreDocumentsAvailable) {
    let query: Query = collectionRef;

    // Apply all the clauses to the query if any
    for (const clause of whereClauses) {
      query = query.where(clause.field, clause.operation, clause.value);
    }

    // Apply pagination
    query = query.limit(pageSize);
    if (lastDocument) {
      query = query.startAfter(lastDocument);
    }

    // Execute the query
    const querySnapshot = await query.get();
    const documents = querySnapshot.docs;

    // Check if there are more documents available
    if (documents.length < pageSize) {
      moreDocumentsAvailable = false;
    }

    // If documents are found, add them to the allDocuments array and set the lastDocument for the next iteration
    if (documents.length > 0) {
      // allDocuments.push(...documents.map(doc => doc.ref));
      allDocuments.push(...documents);
      lastDocument = documents[documents.length - 1];
    }
  }

  return allDocuments;
}

const safelyGetDocumentReferences = async (
  collectionRef: FirebaseFirestore.CollectionReference,
  options: Options = {}
): Promise<FirebaseFirestore.DocumentReference[] | FirebaseFirestore.DocumentSnapshot[]> => {
  let allDocuments,
    deadlineError = false;
  let { logs = false, whereClauses = [], wherePaths = [] } = options
  do {
    try {
      let path = collectionRef.path

      let contains = checkIfArrayContainsPortionOfString(path, wherePaths)

      if(contains && whereClauses.length > 0){
        // console.log("safelyGetDocumentReferences: executing getAllDocuments for ", path)
        allDocuments = await getAllDocuments(collectionRef, options); // orphaned documents are ignored here, so subcollections under nonexisting docs are not included.
      } else {
        // console.log("safelyGetDocumentReferences: executing listDocuments for ", path)
        allDocuments = await collectionRef.listDocuments(); //while it doesn't support "where" filters, it includes orphaned documents which are not available through getAllDocuments.
      }
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

const checkIfArrayContainsPortionOfString = (str: string, arr: string[]) => {
  for (let i = 0; i < arr.length; i++) {
    if (str.includes(arr[i])) {
      return true
    }
  }
  return false
}

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


