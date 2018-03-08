import loadJsonFile = require("load-json-file");
import * as admin from "firebase-admin";

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


const importData = async (data: any,
                          startingRef?: admin.firestore.Firestore |
                              FirebaseFirestore.DocumentReference |
                              FirebaseFirestore.CollectionReference) => {

    if (isDocument(startingRef) && data.hasOwnProperty('__collections__')) {
        console.log('Houston....we have a problem');
        // return await setCollections(data, startingRef);
    }
    else {
        return await setDocuments(data, <FirebaseFirestore.CollectionReference>startingRef);
    }
};

const cleanObject = (obj: any) => {
    const clean = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && key !== '__collections__') {
            clean[key] = obj[key];
        }
    }
    return clean;
};

const setDocuments = async (data, startingRef) => {
    const collections = [];
    const batch = db.batch();
    for (let documentKey in data) {
        if (data.hasOwnProperty(documentKey) && documentKey !== '__collections__') {
            const documentData: any = {};
            if (typeof data[documentKey] === 'object') {
                for (let field in data[documentKey]) {
                    if (data[documentKey].hasOwnProperty(field)) {
                        if (field !== '__collections__') {
                            documentData[field] = data[documentKey][field];
                        } else {
                            for (let collection in data[documentKey][field]) {
                                if(data[documentKey][field].hasOwnProperty(collection)) {
                                    collections.push({
                                        path: startingRef.doc(documentKey).collection(collection),
                                        collection: data[documentKey][field][collection]
                                    });
                                }
                            }
                        }
                    }
                }
            }
            batch.set(startingRef.doc(documentKey), documentData, {merge: true});
        }
    }
    return batch.commit()
        .then(()=>{
            collections.map((col)=>{
                setDocuments(col.collection, col.path);
            })
        });
};

const commandLine = (credentialsPath: string, data: any, dataPath?: string) => {
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
            return importData(data, startingRef)
        })
        .catch(err => {
            throw new Error(err);
        });
};
export default commandLine;