import {array_chunks, serializeSpecialTypes, unserializeSpecialTypes} from '../src/lib/helpers';
import {expect} from 'chai';
import 'mocha';
import * as admin from "firebase-admin";
import * as firebase from 'firebase/app';
import 'firebase/firestore';

const FirebaseServer = require('firebase-server');

const special = {
  object: {
    name: 'object',
    timestamp: new Date()
  },
  array: {
    0: 1,
    1: new Date()
  },
  timestamp: new Date(),
  geopoint: new admin.firestore.GeoPoint(12.3433, -111.324),
  number: 234234.234,
};

const serialized = {
  "object": {
    "name": "object",
    "timestamp": {
      "__datatype__": "timestamp",
      "value": "2018-03-27T18:02:15.127Z"
    }
  },
  "array": {
    "0": 1,
    "1": {
      "__datatype__": "timestamp",
      "value": "2018-03-27T18:02:15.127Z"
    }
  },
  "timestamp": {
    "__datatype__": "timestamp",
    "value": "2018-03-27T18:02:15.127Z"
  },
  "geopoint": {
    "__datatype__": "geopoint",
    "value": {
      "_latitude": 12.3433,
      "_longitude": -111.324
    }
  },
  "number": 234234.234
};

describe('Helpers', () => {
  describe('array_chunks', () => {
    it('should break up an array into the right amount of chunks', () => {
      const startingArray = new Array(100).fill(null);
      const chunks = array_chunks(startingArray, 10);
      expect(chunks).to.have.lengthOf(10);
    });

    it('should have the final chunk size the same as the remainder of the chunk_size', () => {
      const startingArraySize = 100;
      const randomChunkSize = Math.floor(Math.random() * startingArraySize) + 1;
      const expectedRemainder = startingArraySize % randomChunkSize;
      const expectedLengthOfChunks = Math.floor(startingArraySize / randomChunkSize) + (expectedRemainder === 0 ? 0 : 1);
      const startingArray = new Array(startingArraySize).fill(null);
      const chunks = array_chunks(startingArray, randomChunkSize);
      expect(chunks).to.have.lengthOf(Math.floor(expectedLengthOfChunks));

      const lastItem = chunks.pop();
      expect(lastItem).to.have.lengthOf(expectedRemainder);
    });
  });

  describe('serializeSpecialTypes', () => {
    it('should take special types and serialize them as expected.', () => {
      const results = serializeSpecialTypes(special);
      expect(results.timestamp).to.include.all.keys('__datatype__', 'value');
    });
  });

  // describe('unserializeSpecialTypes', () => {
  //   new FirebaseServer(5000, 'localhost');
  //   const app = firebase.initializeApp({
  //     databaseURL: `ws://localhost:5000`
  //   }, 'TestingEnvironment');
  //   const results = unserializeSpecialTypes(serialized, admin.firestore());
  //   expect(results.timestamp).to.be.an.instanceof(Date);
  //   expect(results.geopoint).to.be.an.instanceof(admin.firestore.GeoPoint);
  //   FirebaseServer.close(console.log(`\n — server closed — `));
  // })
});