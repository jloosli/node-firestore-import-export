export interface IDocument {
    __collections__: {
        [id: string]: ICollection;
    };

    [id: string]: any;
}

export interface ICollection {
    [id: string]: IDocument;
}