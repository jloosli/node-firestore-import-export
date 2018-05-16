import {isLikeDocument, isRootOfDatabase, sleep} from "./firestore-helpers";
import * as admin from "firebase-admin";
import {serializeSpecialTypes} from "./helpers";

const SLEEP_TIME = 1000;

const exportData = async (startingRef: admin.firestore.Firestore |
  FirebaseFirestore.DocumentReference |
  FirebaseFirestore.CollectionReference) => {
  if (isLikeDocument(startingRef)) {
    const collectionsPromise = getCollections(startingRef);
    let dataPromise: Promise<any>;
    if (isRootOfDatabase(startingRef)) {
      dataPromise = Promise.resolve({});
    } else {
      dataPromise = (<FirebaseFirestore.DocumentReference>startingRef).get()
        .then(snapshot => snapshot.data())
        .then(data => serializeSpecialTypes(data));
    }
    return await Promise.all([collectionsPromise, dataPromise]).then(res => {
      return {'__collections__': res[0], ...res[1]};
    });
  }
  else {
    return await getDocuments(<FirebaseFirestore.CollectionReference>startingRef);
  }
};

const getCollections = async (startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference) => {
  let collectionsSnapshot, deadlineError = false;
  do {
    try {
      collectionsSnapshot = await startingRef.getCollections();
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

  const collectionNames: Array<string> = [];
  const collectionPromises: Array<Promise<any>> = [];
  collectionsSnapshot.map((collectionRef: FirebaseFirestore.CollectionReference) => {
    collectionNames.push(collectionRef.id);
    collectionPromises.push(getDocuments(collectionRef));
  });
  const results = await Promise.all(collectionPromises);
  const zipped: any = {};
  results.map((res: any, idx: number) => {
    zipped[collectionNames[idx]] = res
  });
  return zipped;
};

const getDocuments = async (collectionRef: FirebaseFirestore.CollectionReference) => {
  console.log(`Retrieving documents from ${collectionRef.path}`);
  let allDocuments, deadlineError = false;
  do {
    try {
      allDocuments = await collectionRef.get();
      deadlineError = false;
    } catch (e) {
      if (e.code && e.code === 4) {
        console.log(`Deadline Error in getDocuments()...waiting ${SLEEP_TIME / 1000} second(s) before retrying`);
        await sleep(SLEEP_TIME);
        deadlineError = true;
      } else {
        throw e;
      }
    }
  } while (deadlineError || !allDocuments);
  const results: any = {};
  const documentPromises: Array<Promise<object>> = [];
  allDocuments.forEach((docSnapshot) => {
    documentPromises.push(new Promise(async (resolve) => {
      const docDetails: any = {};
      // console.log(docSnapshot.id, '=>', docSnapshot.data());
      docDetails[docSnapshot.id] = serializeSpecialTypes(docSnapshot.data());
      const collections = await getCollections(docSnapshot.ref);
      docDetails[docSnapshot.id]['__collections__'] = collections;
      resolve(docDetails);
    }));
  });
  (await Promise.all(documentPromises))
    .map((res: any) => {
      Object.keys(res).map(key => (<any>results)[key] = res[key]);
    });
  return results;
};


export default exportData;