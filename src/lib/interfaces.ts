export interface IDocument {
  __collections__: {
    [id: string]: ICollection;
  };

  [id: string]: any;
}

export interface ICollection {
  [id: string]: IDocument;
}

export interface IFirebaseCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}