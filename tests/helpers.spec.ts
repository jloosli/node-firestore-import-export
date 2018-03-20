import {array_chunks} from '../src/lib/helpers';
import {expect} from 'chai';
import 'mocha';

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
});