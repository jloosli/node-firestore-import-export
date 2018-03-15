// From https://stackoverflow.com/questions/8495687/split-array-into-chunks
const array_chunks = (array, chunk_size) => Array(
    Math.ceil(array.length / chunk_size)).fill()
    .map(
        (_, index) => index * chunk_size).map(
        begin => array.slice(begin, begin + chunk_size));
export {array_chunks};