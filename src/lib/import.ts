import * as admin from "firebase-admin";
import {isDocument} from "./firestore-helpers";
import {ICollection} from "./interfaces";

const importData = (data: any,
                    startingRef: admin.firestore.Firestore |
                        FirebaseFirestore.DocumentReference |
                        FirebaseFirestore.CollectionReference): Promise<any> => {

    if (isDocument(startingRef) && data.hasOwnProperty('__collections__')) {
        const collections = data['__collections__'];
        delete(data['__collections__']);
        const documentID = startingRef.id;
        const documentData: any = {};
        documentData[documentID] = data;
        const documentPromise = setDocuments(documentData, startingRef.parent);
        const collectionPromises: Array<Promise<any>> = [];
        for (const collection in collections) {
            if (collections.hasOwnProperty(collection)) {
                collectionPromises.push(setDocuments(collections[collection], startingRef.collection(collection)));
            }
        }
        return documentPromise.then(() => Promise.all(collectionPromises));
    }
    else {
        return setDocuments(data, <FirebaseFirestore.CollectionReference>startingRef);
    }
};

const setDocuments = async (data: ICollection, startingRef: FirebaseFirestore.CollectionReference) => {
    const collections: Array<any> = [];
    const batch = startingRef.firestore.batch();
    for (let documentKey in data) {
        if (data.hasOwnProperty(documentKey) && documentKey !== '__collections__') {
            const documentData: any = {};
            for (let field in data[documentKey]) {
                if (data[documentKey].hasOwnProperty(field)) {
                    if (field !== '__collections__') {
                        documentData[field] = data[documentKey][field];
                    } else {
                        for (let collection in data[documentKey][field]) {
                            if (data[documentKey][field].hasOwnProperty(collection)) {
                                collections.push({
                                    path: startingRef.doc(documentKey).collection(collection),
                                    collection: data[documentKey][field][collection]
                                });
                            }
                        }
                    }
                }
            }
            batch.set(startingRef.doc(documentKey), documentData, {merge: true});
        }
    }
    return batch.commit()
        .then(() => {
            collections.map((col) => {
                return setDocuments(col.collection, col.path);
            })
        });
};

export default importData;