# node-firestore-import-export
Firestore data importing and exporting tool.

[![codebeat badge](https://codebeat.co/badges/c7db349c-8de5-4b49-b366-55a0448eb18a)](https://codebeat.co/projects/github-com-jloosli-node-firestore-import-export-master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/578282c87d824a1e9aa650cdcadcdd31)](https://www.codacy.com/app/jloosli/node-firestore-import-export?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=jloosli/node-firestore-import-export&amp;utm_campaign=Badge_Grade)
[![David badge](https://david-dm.org/jloosli/node-firestore-import-export.svg)](https://david-dm.org/jloosli/node-firestore-import-export)
[![Known Vulnerabilities](https://snyk.io/test/github/jloosli/node-firestore-import-export/badge.svg)](https://snyk.io/test/github/jloosli/node-firestore-import-export)
[![CircleCI](https://circleci.com/gh/jloosli/node-firestore-import-export.svg?style=svg)](https://circleci.com/gh/jloosli/node-firestore-import-export)

Export a Firestore database, including collections and documents, while keeping the structure 
intact. 

## Table of Contents

- [Data format](#data-format)
- [Installation](#installation)
- [Retrieving credentials](#retrieving-google-cloud-account-credentials)
- [Usage](#usage)
   - [Command line](#command-line)
     - [Export](#export)
     - [Import](#import)
   - [Library](#library)
     - [Export](#exporting)
     - [Import](#importing)
- [Contributions](#contributions)


### Data Format

Exports a json file with the following format:


```json
{
  "__collections__": {
    "companies": {
      "docA": {
        "name": "Big Co",
        "employee_count": 2012,
        "created": {
          "__datatype__": "timestamp",
          "value": {
            "_seconds": 12343456,
            "_nanoseconds": 7890
          }
        },
        "location": {
          "__datatype__": "geopoint",
          "value": {
            "_latitude": -123.456789,
            "_longitude": 34.5678
          }
        },
        "AdministratorRef": {
          "__datatype__": "documentReference",
          "value": "path/to/the/document"
        },
        "__collections__": {
          "employees": ...,
          "products": ...
        }
      },
      "docB": ...,
      "docC": ...
    },
    "administrators": {
      "docA": ...,
      "docB": ...
    }
  }
}
```

where `__collections__` holds the collections for a given document (or the root of the database).

Imports need to be from a file with the same structure (e.g. from an exported file). 

__Be careful!__ This can easily overwrite or mess up your data if you import 
to the wrong location.

#### Special Datatypes

Three types of data are serialized in the export: 

* Timestamps
* Geopoints
* DocumentReferences

They each are serialized in the following format:

```json
{
  "__datatype__": "timestamp|geopoint|documentReference",
  "value": "The serialized value"
}
```

## Installation
Install using [__npm__](https://www.npmjs.com/).

```sh
npm install -g node-firestore-import-export
```

 or [__yarn__](https://yarnpkg.com/en/)

```sh
yarn global add node-firestore-import-export
```

Alternatively download the source.

```sh
git clone https://github.com/jloosli/node-firestore-import-export.git
```

### Retrieving Google Cloud Account Credentials

1. Visit the [Firebase Console](https://console.firebase.google.com)
1. Select your project
1. Navigate to __Project Settings__ (at the time of writing the __gear__ icon button at the top left of the page).
1. Navigate to __Service Accounts__
1. Click _Generate New Private Key_

This downloaded json file contains the proper credentials needed for __node-firestore-import-export__ to authenticate.


## Usage

### Command Line
The path to the account credentials can either be passed with the `-a/--accountCredentials` flag, or placed in the
`GOOGLE_APPLICATION_CREDENTIALS` environment variable. For example:

```sh
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-export -p
```

#### Export
* `-a`, `--accountCredentials` `<path>` - path to Google Cloud account credentials JSON file. 
  If missing, will look at the `GOOGLE_APPLICATION_CREDENTIALS` environment variable for the path. 
* `-b`, `--backupFile` `<path>`- Filename to store backup. (e.g. backups/full-backup.json).
  Defaults to `firestore-export.json` if missing.
* `-n`, `--nodePath` `<path>`- Path to database node to start (e.g. collectionA/docB/collectionC).
  Backs up full database if empty or missing.
* `-p`, `--prettyPrint` - JSON backups done with pretty-printing.

##### Examples
###### Export full database
```sh
firestore-export --accountCredentials path/to/credentials/file.json --backupFile /backups/myDatabase.json
```

###### Export with pretty printing
```sh
firestore-export --accountCredentials path/to/credentials/file.json --backupFile /backups/myDatabase.json --prettyPrint
```

###### Export from a specific path (and all its children/collections)
```sh
firestore-export --accountCredentials path/to/credentials/file.json --backupFile /backups/myDatabase.json --nodePath collectionA/document1/collectionCC
```

#### Import
* `-a`, `--accountCredentials` `<path>` - path to Google Cloud account credentials JSON file. 
  If missing, will look at the `GOOGLE_APPLICATION_CREDENTIALS` environment variable for the path. 
* `-b`, `--backupFile` `<path>`- Filename with backup data. (e.g. backups/full-backup.json).
* `-n`, `--nodePath` `<path>`- Path to database node to start (e.g. collectionA/docB/collectionC).
* `-y`, `--yes` - Unattended import without confirmation (like hitting "y" from the command line).

##### Examples
###### Import full database
```sh
firestore-import --accountCredentials path/to/credentials/file.json --backupFile /backups/myDatabase.json
```

###### Import to a specific path
```sh
firestore-import --accountCredentials path/to/credentials/file.json --backupFile /backups/myDatabase.json --nodePath collectionA/document1/collectionCC
```

### Library
The underlying library can be used in a node or web application for importing and exporting data
in a similar fashion

#### Exporting

```typescript
import {firestoreExport} from 'node-firestore-import-export';
import * as firebase from 'firebase-admin';

firebase.initializeApp({
    apiKey: "AIza....",                             
    authDomain: "YOUR_APP.firebaseapp.com",         
    databaseURL: "https://YOUR_APP.firebaseio.com", 
    storageBucket: "YOUR_APP.appspot.com",          
    messagingSenderId: "123456789"                  
});

const collectionRef = firebase.firestore().collection('collectionA/docB/collectionC');

firestoreExport(collectionRef)
    .then(data=>console.log(data));
```

#### Importing

```typescript
import {firestoreImport} from 'node-firestore-import-export';
import * as firebase from 'firebase-admin';

firebase.initializeApp({
    apiKey: "AIza....",                             
    authDomain: "YOUR_APP.firebaseapp.com",         
    databaseURL: "https://YOUR_APP.firebaseio.com", 
    storageBucket: "YOUR_APP.appspot.com",          
    messagingSenderId: "123456789"                  
});

const data = {
  docA: {
    name: 'bob',
    __collections__: {}
  },
  docB: {
    name: 'jill',
    __collections__: {}
  }
};

const collectionRef = firebase.firestore().collection('collectionA/docB/collectionC');

firestoreImport(data, collectionRef)
    .then(()=>console.log('Data was imported.'));
```

## Contributions
Feel free to report bugs and make feature requests in the [Issue Tracker](https://github.com/jloosli/node-firestore-import-export/issues), fork and create pull requests!

### Inspiration
The command line was inspired heavily by SteadyEquipment's [node-firestore-backup](https://github.com/steadyequipment/node-firestore-backup) 
