// From https://stackoverflow.com/questions/8495687/split-array-into-chunks
const array_chunks = (array: Array<any>, chunk_size: number): Array<Array<any>> => {
    return Array(Math.ceil(array.length / chunk_size))
        .fill(null)
        .map(
            (_: any, index: number) => index * chunk_size)
        .map((begin: number) => array.slice(begin, begin + chunk_size));
};
export {array_chunks};