import * as admin from 'firebase-admin';
import loadJsonFile = require("load-json-file");

const SLEEP_TIME = 1000;

const isDocument = (ref: admin.firestore.Firestore |
    FirebaseFirestore.DocumentReference |
    FirebaseFirestore.CollectionReference): ref is FirebaseFirestore.DocumentReference => {
    return (<FirebaseFirestore.DocumentReference>ref).collection !== undefined;
};

let db: admin.firestore.Firestore;
const initialize = (credentials: admin.ServiceAccount) => {
    admin.initializeApp({
        credential: admin.credential.cert(credentials),
        databaseURL: `https://${credentials.project_id}.firebaseio.com`
    });

    db = admin.firestore();
};

const exportData = async (startingRef: admin.firestore.Firestore |
                              FirebaseFirestore.DocumentReference |
                              FirebaseFirestore.CollectionReference |
                              null = null,
                          depth = null) => {
    startingRef = startingRef || db;
    if (isDocument(startingRef)) {
        return await getCollections(startingRef);
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
            }
        }
    } while (deadlineError || !collectionsSnapshot);

    const collectionPromises = collectionsSnapshot.map((collectionRef: FirebaseFirestore.CollectionReference) => {
        return [collectionRef.id, getDocuments(collectionRef)];
    });
    const results = await Promise.all(collectionPromises.map(async (el) => [el[0], await el[1]]));
    const zipped: any = {};
    console.log(results);
    results.map((res: any) => {
        zipped[res[0]] = res[1]
    });
    return zipped;
};

const getDocuments = async (collectionRef: FirebaseFirestore.CollectionReference) => {
    let allDocuments, deadlineError = false;
    do {
        try {
            allDocuments = await collectionRef.get();
            deadlineError = false;
        } catch (e) {
            if (e.message === 'Deadline Exceeded') {
                console.log(`Deadline Error in getCollections()...waiting ${SLEEP_TIME / 1000} second(s) before retrying`);
                await sleep(SLEEP_TIME);
                deadlineError = true;
            }
        }
    } while (deadlineError || !allDocuments);
    const results: any = {};
    const documentPromises: Array<Promise<object>> = [];
    allDocuments.forEach((docSnapshot) => {
        documentPromises.push(new Promise(async (resolve) => {
            const docDetails: any = {};
            console.log(docSnapshot.id, '=>', docSnapshot.data());
            docDetails[docSnapshot.id] = docSnapshot.data();
            const collections = await getCollections(docSnapshot.ref);
            if (Object.keys(collections).length > 1 && collections.constructor === Object) {
                docDetails[docSnapshot.id]['__collections__'] = collections;
            }
            resolve(docDetails);
        }));
    });
    (await Promise.all(documentPromises))
        .map((res: any) => {
            console.log(res);
            for (let key in res) {
                if (res.hasOwnProperty(key)) {
                    (<any>results)[key] = res[key];
                }
            }
        });
    return results;
};

const sleep = (timeInMS: number): Promise<void> => new Promise(resolve => setTimeout(resolve, timeInMS));

const commandLine = (credentialsPath: string, dataPath?: string | null) => {
    return loadJsonFile(credentialsPath)
        .then((credentials: admin.ServiceAccount) => {
            initialize(credentials);
            let startingRef;
            if (dataPath) {
                const parts = dataPath.split('/').length;
                const isDoc = parts % 2 === 0;
                startingRef = isDoc ? db.doc(dataPath) : db.collection(dataPath);
            } else {
                startingRef = db;
            }
            return exportData(startingRef)
        })
        .catch(err => {
            throw new Error("Credentials file not found");
        });
};
export default commandLine;