// From https://stackoverflow.com/questions/8495687/split-array-into-chunks
import * as admin from "firebase-admin";
import DocumentReference = admin.firestore.DocumentReference;
import GeoPoint = admin.firestore.GeoPoint;
import Firestore = FirebaseFirestore.Firestore;

const array_chunks = (array: Array<any>, chunk_size: number): Array<Array<any>> => {
  return Array(Math.ceil(array.length / chunk_size))
    .fill(null)
    .map(
      (_: any, index: number) => index * chunk_size)
    .map((begin: number) => array.slice(begin, begin + chunk_size));
};


const serializeSpecialTypes = (data: any) => {
  const cleaned: any = {};
  Object.keys(data).map(key => {
    let value = data[key];
    if (value instanceof Date) {
      value = {__datatype__: 'timestamp', value: value.toISOString()};
    } else if (value instanceof GeoPoint) {
      value = {__datatype__: 'geopoint', value: value};
    } else if (value instanceof DocumentReference) {
      value = {__datatype__: 'documentReference', value: value.path};
    } else if (value === Object(value)) {
      value = serializeSpecialTypes(value);
    }
    cleaned[key] = value;
  });
  return cleaned;
};

const unserializeSpecialTypes = (data: any, fs: Firestore) => {
  const cleaned: any = {};
  Object.keys(data).map(key => {
    let value = data[key];
    if (value instanceof Object) {
      if ('__datatype__' in value && 'value' in value) {
        switch (value.__datatype__) {
          case 'timestamp':
            value = new Date(value.value);
            break;
          case 'geopoint':
            value = new admin.firestore.GeoPoint(value.value._latitude, value.value._longitude);
            break;
          case 'documentReference':
            value = fs.doc(value.value);
            break;
        }
      } else {
        value = unserializeSpecialTypes(value, fs);
      }
    }
    cleaned[key] = value;
  });
  return cleaned;
};
export {array_chunks, serializeSpecialTypes, unserializeSpecialTypes};