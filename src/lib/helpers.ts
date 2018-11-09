import * as admin from "firebase-admin";
import {ITimestamp} from "../interfaces/ITimestamp";
import {IGeopoint} from "../interfaces/IGeopoint";
import {IDocumentReference} from "../interfaces/IDocumentReference";
import DocumentReference = admin.firestore.DocumentReference;
import GeoPoint = admin.firestore.GeoPoint;
import Firestore = FirebaseFirestore.Firestore;

// From https://stackoverflow.com/questions/8495687/split-array-into-chunks
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
    let rawValue = data[key];
    if (rawValue instanceof admin.firestore.Timestamp) {
      rawValue = {
        __datatype__: 'timestamp',
        value: {
          _seconds: rawValue.seconds,
          _nanoseconds: rawValue.nanoseconds
        }
      } as ITimestamp;
    } else if (rawValue instanceof GeoPoint) {
      rawValue = {
        __datatype__: 'geopoint',
        value: {
          _latitude: rawValue.latitude,
          _longitude: rawValue.longitude
        }
      } as IGeopoint;
    } else if (rawValue instanceof DocumentReference) {
      rawValue = {
        __datatype__: 'documentReference',
        value: rawValue.path
      } as IDocumentReference;
    } else if (rawValue === Object(rawValue)) {
      let isArray = Array.isArray(rawValue);
      rawValue = serializeSpecialTypes(rawValue);
      if (isArray) {
        rawValue = Object.keys(rawValue).map(key => rawValue[key]);
      }
    }
    cleaned[key] = rawValue;
  });
  return cleaned;
};

const unserializeSpecialTypes = (data: any, fs: Firestore) => {
  const cleaned: any = {};
  Object.keys(data).map(key => {
    let rawValue: any = data[key];
    let cleanedValue: any;
    if (rawValue instanceof Object) {
      if ('__datatype__' in rawValue && 'value' in rawValue) {
        switch (rawValue.__datatype__) {
          case 'timestamp':
            rawValue = rawValue as ITimestamp;
            if (rawValue.value instanceof String) {
              const millis = Date.parse(rawValue.value);
              cleanedValue = new admin.firestore.Timestamp(millis / 1000, 0);
            } else {
              cleanedValue = new admin.firestore.Timestamp(rawValue.value._seconds, rawValue.value._nanoseconds);
            }
            break;
          case 'geopoint':
            rawValue = rawValue as IGeopoint;
            cleanedValue = new admin.firestore.GeoPoint(rawValue.value._latitude, rawValue.value._longitude);
            break;
          case 'documentReference':
            rawValue = rawValue as IDocumentReference;
            rawValue = fs.doc(rawValue.value);
            break;
        }
      } else {
        let isArray = Array.isArray(rawValue);
        cleanedValue = unserializeSpecialTypes(rawValue, fs);
        if (isArray) {
          cleanedValue = Object.keys(rawValue).map(key => rawValue[key])
        }
      }
    }
    cleaned[key] = cleanedValue;
  });
  return cleaned;
};

export {array_chunks, serializeSpecialTypes, unserializeSpecialTypes};