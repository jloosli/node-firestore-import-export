import {ICollection} from "./ICollection";

export interface IDocument {
  __collections__: {
    [id: string]: ICollection;
  };

  [id: string]: any;
}