import {ITimestamp} from '../interfaces/ITimestamp';
import {IGeopoint} from '../interfaces/IGeopoint';
import {IDocumentReference} from '../interfaces/IDocumentReference';
import firestore = require('@google-cloud/firestore');
import {DocumentReference, GeoPoint} from '@google-cloud/firestore';
import {getFirestoreDBReference} from './firestore-helpers';

// From https://stackoverflow.com/questions/8495687/split-array-into-chunks
const array_chunks = (
  array: Array<any>,
  chunk_size: number
): Array<Array<any>> => {
  return Array(Math.ceil(array.length / chunk_size))
    .fill(null)
    .map((_: any, index: number) => index * chunk_size)
    .map((begin: number) => array.slice(begin, begin + chunk_size));
};

const serializeSpecialTypes = (data: any = {}) => {
  const cleaned: any = {};
  Object.keys(data).map(key => {
    let rawValue = data[key];
    if (rawValue instanceof firestore.Timestamp) {
      rawValue = {
        __datatype__: 'timestamp',
        value: {
          _seconds: rawValue.seconds,
          _nanoseconds: rawValue.nanoseconds,
        },
      } as ITimestamp;
    } else if (rawValue instanceof GeoPoint) {
      rawValue = {
        __datatype__: 'geopoint',
        value: {
          _latitude: rawValue.latitude,
          _longitude: rawValue.longitude,
        },
      } as IGeopoint;
    } else if (rawValue instanceof DocumentReference) {
      rawValue = {
        __datatype__: 'documentReference',
        value: rawValue.path,
      } as IDocumentReference;
    } else if (rawValue === Object(rawValue)) {
      const isArray = Array.isArray(rawValue);
      rawValue = serializeSpecialTypes(rawValue);
      if (isArray) {
        rawValue = Object.keys(rawValue).map(key => rawValue[key]);
      }
    }
    cleaned[key] = rawValue;
  });
  return cleaned;
};

const unserializeSpecialTypes = (data: any): any => {
  if (isScalar(data)) {
    return data;
  } else if (Array.isArray(data)) {
    return data.map((val: any) => unserializeSpecialTypes(val));
  } else if (data instanceof Object) {
    let rawValue = {...data}; // Object.assign({}, data);
    if ('__datatype__' in rawValue && 'value' in rawValue) {
      switch (rawValue.__datatype__) {
        case 'timestamp':
          rawValue = rawValue as ITimestamp;
          if (rawValue.value instanceof String) {
            const millis = Date.parse(rawValue.value);
            rawValue = new firestore.Timestamp(millis / 1000, 0);
          } else {
            rawValue = new firestore.Timestamp(
              rawValue.value._seconds,
              rawValue.value._nanoseconds
            );
          }
          break;
        case 'geopoint':
          rawValue = rawValue as IGeopoint;
          rawValue = new firestore.GeoPoint(
            rawValue.value._latitude,
            rawValue.value._longitude
          );
          break;
        case 'documentReference':
          rawValue = rawValue as IDocumentReference;
          rawValue = getFirestoreDBReference().doc(rawValue.value);
          break;
      }
    } else {
      const cleaned: any = {};
      Object.keys(rawValue).map(
        (key: string) => (cleaned[key] = unserializeSpecialTypes(data[key]))
      );
      rawValue = cleaned;
    }
    return rawValue;
  }
};

const isScalar = (val: any) =>
  typeof val === 'string' ||
  val instanceof String ||
  (typeof val === 'number' && isFinite(val)) ||
  val === null ||
  typeof val === 'boolean';

export {array_chunks, serializeSpecialTypes, unserializeSpecialTypes};
