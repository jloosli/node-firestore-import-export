#!/usr/bin/env node
import * as admin from 'firebase-admin';

const credentials = require('./credentials.json');
import fs = require('fs');

admin.initializeApp({
    credential: admin.credential.cert(credentials),
    databaseURL: "https://tcs-appointments.firebaseio.com"
});
const db = admin.firestore();

const SLEEP_TIME = 1000;

const isDocument = (ref: admin.firestore.Firestore |
    FirebaseFirestore.DocumentReference |
    FirebaseFirestore.CollectionReference): ref is FirebaseFirestore.DocumentReference => {
    return (<FirebaseFirestore.DocumentReference>ref).collection !== undefined;
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
                console.log("Deadline Error in getCollections()");
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
                console.log('Deadline Error in getDocuments');
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
            docDetails[docSnapshot.id]['__collections__'] = await getCollections(docSnapshot.ref);
            resolve(docDetails);
        }));
    });
    (await Promise.all(documentPromises))
        .map((res:any) => {
            console.log(res);
            for (let key in res) {
                (<any>results)[key] = res[key];
            }
        });
    return results;
};

const sleep = (timeInMS: number): Promise<void> => new Promise(resolve => setTimeout(resolve, timeInMS));

const writeResults = (results: object, filename: string) => {
    const content = JSON.stringify(results);
    fs.writeFile(filename, content, 'utf8', err => {
        if (err) {
            return console.log(err);
        }
        console.log(`Results were saved to ${filename}`);
    })
};

const coll = 'organizations';
exportData()
    .then(res => {
        console.log('Received Results');
        // console.log(res);
        return res;
    })
    .then(res => {
        const obj: any = {};
        obj[coll] = res;
        writeResults(obj, 'organizations.json')
    })
    .catch(res => {
        console.error(res);
        writeResults(res, 'export.json');
    });

// @todo: See https://codeburst.io/https-chidume-nnamdi-com-npm-module-in-typescript-12b3b22f0724
export default exportData;