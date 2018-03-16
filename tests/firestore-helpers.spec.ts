import 'mocha';
import {expect} from 'chai';
import {
    getCredentialsFromFile,
    getDBReferenceFromPath,
    isLikeDocument,
    isRootOfDatabase,
    sleep
} from "../src/lib/firestore-helpers";

const firebasemock = require('firebase-mock');


describe('Firestore Helpers', () => {
    describe('sleep()', () => {
        it('should sleep at least the specified amount of time', async () => {
            const timeToSleep = 1000;
            const start = Date.now();
            await sleep(timeToSleep);
            const end = Date.now();
            expect(end).to.be.above(start + timeToSleep);
        });
    });

    describe('isRootOfDatabase()', () => {
        it('should determine if reference is the root of a database', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            expect(isRootOfDatabase(mockFirestore)).to.be.true;
        });

        it('should return false if reference is not the root of a database', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            const ref = mockFirestore.doc('collection/doc');
            expect(isRootOfDatabase(ref)).to.be.false;
        });
        it('should return false if reference is not the root of a database (collection', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            const ref = mockFirestore.collection('collection/doc/subCollection');
            expect(isRootOfDatabase(ref)).to.be.false;
        });
    });

    describe('isLikeDocument()', () => {
        it('should see a document reference like a document', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            const documentReference = mockFirestore.doc('collection/document');
            expect(isLikeDocument(documentReference)).to.be.true;
        });
        it('should see a collection reference not like a document', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            const collectionReference = mockFirestore.collection('collection/document/subCollection');
            expect(isLikeDocument(collectionReference)).to.be.false;
        });
        it('should see a Firestore reference like a document', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            expect(isLikeDocument(mockFirestore)).to.be.true;
        });
    });

    describe('getCredentialsFromFile()', () => {
        it('should fail if the file doesn\'t exist', async () => {
            const dummyFilename = 'i_do_not_exist.json';
            try {
                await getCredentialsFromFile(dummyFilename);
                expect().fail(null, 'This should not be run');
            } catch (e) {
                expect(e).to.exist;
            }
        })
    });


    describe('getDBReferenceFromPath()', () => {
        it('should create a document reference with the requested path', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            const documentPath = 'collection/doc';
            const dbReference = getDBReferenceFromPath(mockFirestore, documentPath);
            expect(dbReference.path).to.equal(documentPath);
        });

        it('should create a collection reference with the requested path', () => {
            const mockFirestore = new firebasemock.MockFirestore();
            const documentPath = 'collection/doc/subCollection';
            const dbReference = getDBReferenceFromPath(mockFirestore, documentPath);
            expect(dbReference.path).to.equal(documentPath);
        });
    });

});
