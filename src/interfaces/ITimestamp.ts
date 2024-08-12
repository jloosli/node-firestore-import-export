import {ISpecialType} from './ISpecialType';

export interface ITimestamp extends ISpecialType {
  __datatype__: 'timestamp';
  value: {
    _seconds: number;
    _nanoseconds: number;
  };
}
