import firestore from '@google-cloud/firestore';
import {
  array_chunks,
  serializeSpecialTypes,
  unserializeSpecialTypes,
} from '../src/lib/helpers';
import {expect} from 'chai';
import 'mocha';

const special = {
  object: {
    name: 'object',
    timestamp: new firestore.Timestamp(1541579025, 0),
  },
  array: {
    0: 1,
    1: new Date(),
  },
  timestamp: new firestore.Timestamp(1541579025, 0),
  geopoint: new firestore.GeoPoint(12.3433, -111.324),
  number: 234234.234,
};

const sampleExportedDoc = require('./sampleExportedDoc.json');

describe('Helpers', () => {
  describe('array_chunks', () => {
    it('should break up an array into the right amount of chunks', () => {
      const startingArray = new Array(100).fill(null);
      const chunks = array_chunks(startingArray, 10);
      expect(chunks).to.have.lengthOf(10);
    });

    it('should have the final chunk size the same as the remainder of the chunk_size', () => {
      const startingArraySize = 100;

      for (let chunkSize = 1; chunkSize <= startingArraySize; ++chunkSize) {
        let expectedRemainder = startingArraySize % chunkSize;
        const expectedLengthOfChunks =
          Math.floor(startingArraySize / chunkSize) +
          (expectedRemainder === 0 ? 0 : 1);
        expectedRemainder =
          expectedRemainder === 0 ? chunkSize : expectedRemainder;
        const startingArray = new Array(startingArraySize).fill(null);
        const chunks = array_chunks(startingArray, chunkSize);
        expect(chunks).to.have.lengthOf(Math.floor(expectedLengthOfChunks));

        const lastItem = chunks.pop();
        expect(lastItem).to.have.lengthOf(expectedRemainder);
      }
    });
  });

  describe('serializeSpecialTypes', () => {
    it('should take special types and serialize them as expected.', () => {
      const results = serializeSpecialTypes(special);
      expect(results.timestamp).to.include.all.keys('__datatype__', 'value');
      expect(results.geopoint).to.include.all.keys('__datatype__', 'value');
    });

    it('should handle timestamp', () => {
      const results = serializeSpecialTypes(special);
      expect(results.timestamp.value).to.include.all.keys(
        '_seconds',
        '_nanoseconds'
      );
    });
  });

  describe('unserializeSpecialTypes', () => {
    const results = unserializeSpecialTypes(sampleExportedDoc);
    expect(results.sampleExportedDoc.timestamp).to.be.an.instanceof(
      firestore.Timestamp
    );
    expect(results.sampleExportedDoc.geopoint).to.be.an.instanceof(
      firestore.GeoPoint
    );
    expect(results.sampleExportedDoc.documentRef).to.be.an.instanceof(
      firestore.DocumentReference
    );
    expect(results.sampleExportedDoc.documentRef).to.be.an.instanceof(
      firestore.DocumentReference
    );
  });
});
