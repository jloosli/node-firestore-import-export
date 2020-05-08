import {AssertionError, expect} from 'chai';
import 'mocha';
import firestoreImport from '../src/lib/import';

const firebasemock = require('firebase-mock');
const sampleRootData = require('./sampleRootData.json');

const documentDataMissingCollections = {
  name: 'ashley',
  phone: '123456',
  pet: 'fluffy',
};

describe('Firestore Import', () => {
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = new firebasemock.MockFirestore();
  });

  it('should import root data', async () => {
    try {
      await firestoreImport(sampleRootData, mockFirestore);
      expect(true).to.be.true;
    } catch (err) {
      expect.fail(null, 'This should not be run.');
    }
  });

  it('should fail if trying to import malformed document to root of database', async () => {
    try {
      const results = firestoreImport(sampleRootData.__collections__, mockFirestore);
      await Promise.all([results]);
      expect.fail(null, 'This should not be run.');
    } catch (err) {
      if (err instanceof AssertionError) {
        expect.fail(null, 'This should not be run.');
      } else {
        expect(true).to.be.true;
      }
    }
  });

  it('should fail if trying to import a set of collections into a document location', async () => {
    try {
      const documentLocation = mockFirestore.collection('collectionA');
      const results = firestoreImport(sampleRootData, documentLocation);
      await Promise.all([results]);
      expect.fail(null, 'This will be passed to the catch statement.');
    } catch (err) {
      if (err instanceof AssertionError) {
        expect.fail(null, 'This should not be run.');
      } else {
        expect(true).to.be.true;
      }
    }
  });

  it('should fail if document is malformed', async () => {
    try {
      const documentLocation = mockFirestore.doc('collectionA/DocA');
      const results = firestoreImport(documentDataMissingCollections, documentLocation);
      await Promise.all([results]);
      expect.fail(null, 'This should not be run.');
    } catch (err) {
      if (err instanceof AssertionError) {
        expect.fail(null, 'This should not be run.');
      } else {
        expect(true).to.be.true;
      }
    }
  });

  it(`should not manipulate imported data object`, async () => {
    const dump = {name: 'Alice', __collections__: {jobs: {123: {name: 'doctor'}}}};
    await firestoreImport({['id1']: dump}, mockFirestore.collection('user'));
    expect(dump.__collections__.jobs['123'].name).to.eql('doctor');
  });
});