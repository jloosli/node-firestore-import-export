import {ISpecialType} from './ISpecialType';

export interface IDocumentReference extends ISpecialType {
  __datatype__: 'documentReference';
  value: string
}