import {IDocument} from './IDocument';

export interface ICollection {
  [id: string]: IDocument;
}
