import 'mocha';
import {expect} from 'chai';
import {
  batchExecutor,
  getDBReferenceFromPath,
  isLikeDocument,
  isRootOfDatabase,
  safelyGetCollectionsSnapshot,
  sleep,
} from '../src/lib/firestore-helpers';
import DocumentReference = FirebaseFirestore.DocumentReference;
import CollectionReference = FirebaseFirestore.CollectionReference;

const firebasemock = require('firebase-mock');

describe('Firestore Helpers', () => {
  describe('sleep()', () => {
    it('should sleep at least the specified amount of time', done => {
      const timeToSleep = 1000;
      const start = Date.now();
      sleep(timeToSleep).then(() => {
        const end = Date.now();
        expect(end).to.be.at.least(start + timeToSleep);
        done();
      });
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
      const collectionReference = mockFirestore.collection(
        'collection/document/subCollection'
      );
      expect(isLikeDocument(collectionReference)).to.be.false;
    });
    it('should see a Firestore reference like a document', () => {
      const mockFirestore = new firebasemock.MockFirestore();
      expect(isLikeDocument(mockFirestore)).to.be.true;
    });
  });

  describe('getDBReferenceFromPath()', () => {
    it('should create a document reference with the requested path', () => {
      const mockFirestore = new firebasemock.MockFirestore();
      const documentPath = 'collection/doc';
      const dbReference = getDBReferenceFromPath(mockFirestore, documentPath);
      expect((dbReference as DocumentReference).path).to.equal(documentPath);
    });

    it('should create a collection reference with the requested path', () => {
      const mockFirestore = new firebasemock.MockFirestore();
      const collectionPath = 'collection/doc/subCollection';
      const dbReference = getDBReferenceFromPath(mockFirestore, collectionPath);
      expect((dbReference as CollectionReference).path).to.equal(
        collectionPath
      );
    });
  });

  describe('batchExecutor', () => {
    const toPromiseFactory = function (x: any) {
      return async () => x;
    };

    it('should resolve lists smaller then the batchsize', async () => {
      const input = [toPromiseFactory(1), toPromiseFactory(2)];
      const actual = await batchExecutor(input, 3);
      expect(actual).to.eql([1, 2]);
    });

    it('should resolve lists equal to the batchsize', async () => {
      const input = [toPromiseFactory(1), toPromiseFactory(2)];
      const actual = await batchExecutor(input, 1);
      expect(actual).to.eql([1, 2]);
    });

    it('should resolve lists larger then the batchsize', async () => {
      const input = [toPromiseFactory(1), toPromiseFactory(2)];
      const actual = await batchExecutor(input, 1);
      expect(actual).to.eql([1, 2]);
    });
  });

  describe('safelyGetCollectionsSnapshot', () => {
    const mockFirestore = new firebasemock.MockFirestore();
    it('should ', async () => {
      mockFirestore.collection('bob').add({name: 'bob', place: 'south'});
      mockFirestore.collection('sam').add({name: 'sam', place: 'north'});
      const snapshot = await safelyGetCollectionsSnapshot(mockFirestore);
      expect(snapshot.map(coll => coll.id)).to.eql(['bob', 'sam']);
    });
  });

  /**
   * listDocuments() doesn't seem to work on firebase-mocks...need to reimplement this with firestore emulators
   */

  // describe('safelyGetDocumentsSnapshot', () => {
  //   const mockFirestore = new firebasemock.MockFirestore();
  //   it(`should `, async () => {
  //     mockFirestore.collection('bob').add({name: 'bob', place: 'south'});
  //     mockFirestore.collection('bob').add({name: 'sam', place: 'north'});
  //     // mockFirestore.collection('bob').flush();
  //     const snapshot = await safelyGetDocumentReferences(mockFirestore.collection('bob'));
  //     // expect(snapshot.length).to.eql(2);
  //     const promises = snapshot.map(documentRef => documentRef.get());
  //     const snapshots = await Promise.all(promises);
  //     expect(snapshots.map(doc => doc.data())).to.eql(['bob', 'sam']);
  //   });
  //
  // });
});
