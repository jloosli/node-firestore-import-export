import 'mocha';
import {expect} from 'chai';
import {firestoreClear} from '../src/lib';

const firebasemock: any = require('firebase-mock');
const DocumentReference: any = require('firebase-mock/src/firestore-document');
const CollectionReference: any = require('firebase-mock/src/firestore-collection');
const sampleRootData = require('./sampleRootData.json');

const getCollections = function (this: any): Promise<FirebaseFirestore.CollectionReference[]> {
  const self = this;
  return new Promise((resolve, reject) => {
    let collections: Array<any>;
    if (Object.values) {
      collections = Object.values(self.children);
    } else {
      collections = Object.keys(self.children).map(collection => {
        return self.children[collection];
      });
    }
    resolve(collections);
  });
};


describe('Firestore Export', () => {
  let mockFirestore: any;

  before(() => {
    // Adding since this is missing as of 03/15/2018 in firebase-mock
    firebasemock.MockFirestore.prototype.getCollections = getCollections;
    DocumentReference.prototype.getCollections = getCollections;
    firebasemock.MockFirestore.prototype.listCollections = getCollections;
    DocumentReference.prototype.listCollections = getCollections;
    CollectionReference.prototype.listDocuments = async function () {
      return Object.keys(this.children).map(id => this.children[id]);
    };
  });
  beforeEach(() => {
    mockFirestore = new firebasemock.MockFirestore();
    mockFirestore.flushDelay = 1;
  });

  beforeEach((done) => {

    const promises = [];
    promises.push(mockFirestore.doc('collectionA/docA').set({
      name: sampleRootData.__collections__.collectionA.docA.name,
    }));
    promises.push(mockFirestore.doc('collectionA/docA/contacts/contactDocId').set({
      name: sampleRootData.__collections__.collectionA.docA.__collections__.contacts.contactDocId.name,
    }));
    promises.push(mockFirestore.doc('collectionA/docB').set({
      name: sampleRootData.__collections__.collectionA.docB.name,
    }));
    promises.push(mockFirestore.doc('collectionB/docC').set({
      name: sampleRootData.__collections__.collectionB.docC.name,
    }));
    promises.push(mockFirestore.doc('collectionB/docD').set({
      name: sampleRootData.__collections__.collectionB.docD.name,
    }));
    Promise.all(promises).then(() => {
      done();
    });
    mockFirestore.flush();
  });

  it('should remove only child document', async () => {
    const initial = await mockFirestore.doc('collectionA/docA/contacts/contactDocId').get();
    expect(initial.exists).to.equal(true);
    await firestoreClear(mockFirestore.doc('collectionA/docA/contacts/contactDocId'));
    const result = await mockFirestore.doc('collectionA/docA/contacts/contactDocId').get();
    expect(result.exists).to.equal(false);
    const parent = await mockFirestore.doc('collectionA/docA').get();
    expect(parent.exists).to.equal(true);
  });


  it('should remove everything', async () => {
    const initial = await mockFirestore.doc('collectionA/docA/contacts/contactDocId').get();
    expect(initial.exists).to.equal(true);
    await firestoreClear(mockFirestore);
    const result = await mockFirestore.doc('collectionA/docA').get();
    expect(result.exists).to.equal(false);
  });

});