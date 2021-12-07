import * as admin from 'firebase-admin';
import {ITimestamp} from '../interfaces/ITimestamp';
import {IGeopoint} from '../interfaces/IGeopoint';
import {IDocumentReference} from '../interfaces/IDocumentReference';
import DocumentReference = admin.firestore.DocumentReference;
import GeoPoint = admin.firestore.GeoPoint;
import Timeout = NodeJS.Timeout;

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
            rawValue = new admin.firestore.Timestamp(millis / 1000, 0);
          } else {
            rawValue = new admin.firestore.Timestamp(rawValue.value._seconds, rawValue.value._nanoseconds);
          }
          break;
        case 'geopoint':
          rawValue = rawValue as IGeopoint;
          rawValue = new admin.firestore.GeoPoint(rawValue.value._latitude, rawValue.value._longitude);
          break;
        case 'documentReference':
          rawValue = rawValue as IDocumentReference;
          rawValue = admin.firestore().doc(rawValue.value);
          break;
      }
    } else {
      let cleaned: any = {};
      Object.keys(rawValue).map((key: string) => cleaned[key] = unserializeSpecialTypes(data[key]));
      rawValue = cleaned;
    }
    return rawValue;
  }
};

const isScalar = (val: any) => (typeof val === 'string' || val instanceof String)
  || (typeof val === 'number' && isFinite(val))
  || (val === null)
  || (typeof val === 'boolean');

interface ConcurrencyLimit {
 wait(): Promise<void>;
 done(): void
}

function limitConcurrency(maxConcurrency: number = 0, interval: number = 10): ConcurrencyLimit {
  if (maxConcurrency === 0) {
    return {
      async wait(): Promise<void> { },
      done() { }
    }
  }
  let unfinishedCount = 0;
  let resolveQueue: Function[] = [];
  let intervalId: Timeout;
  let started = false;

  function start() {
    started = true;
    intervalId = setInterval(() => {
      if (resolveQueue.length === 0) {
        started = false;
        clearInterval(intervalId);
        return;
      }

      while (unfinishedCount <= maxConcurrency && resolveQueue.length > 0) {
        const resolveFn = resolveQueue.shift();
        unfinishedCount++;
        if (resolveFn) resolveFn();
      }

    }, interval);
  }

  return {
    wait(): Promise<void> {
      return new Promise(resolve => {
        if (!started) start();
        resolveQueue.push(resolve)
      });
    },
    done() {
      unfinishedCount--;
    }
  }
}

const measureTimeAsync = async <T>( info: string, fn: () => Promise<T>): Promise<T> => {
  const startTime = Date.now();
  const result = await fn();
  const timeDiff = Date.now() - startTime;
  console.log(`${info} took ${timeDiff}ms`);
  return result;
}

export {array_chunks, serializeSpecialTypes, unserializeSpecialTypes, ConcurrencyLimit, limitConcurrency, measureTimeAsync};