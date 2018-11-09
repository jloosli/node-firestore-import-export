import {ISpecialType} from "./ISpecialType";

export interface IGeopoint extends ISpecialType {
  __datatype__: 'geopoint';
  value: {
    _latitude: number;
    _longitude: number;
  }
}