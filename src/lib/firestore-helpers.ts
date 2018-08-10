import * as admin from 'firebase-admin';
import * as loadJsonFile from "load-json-file";


const getCredentialsFromFile = (credentialsFilename: string): Promise<admin.ServiceAccount> => {
    return loadJsonFile(credentialsFilename);
};

const getFirestoreDBReference = (credentials: admin.ServiceAccount): admin.firestore.Firestore => {
    admin.initializeApp({
        credential: admin.credential.cert(credentials),
        databaseURL: `https://${(credentials as any).project_id}.firebaseio.com`
    });

    let firestore = admin.firestore();
    const settings = {timestampsInSnapshots: true};
    firestore.settings(settings);
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

export {
    getCredentialsFromFile,
    getFirestoreDBReference,
    getDBReferenceFromPath,
    isLikeDocument,
    isRootOfDatabase,
    sleep
};
