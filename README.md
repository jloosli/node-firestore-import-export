# Notes

Since the main version of this repo is not maintained, this is a version with a few fixes that is released on npm with the id of `node-firestore-import-export-fix`

Also, I don't have any intention of maintaining this one. But if you have pull requests, send them my way and I'll try to release the changes to npm as well.


# node-firestore-import-export

Firestore data importing, exporting, and data clearing tool.

Export a Firestore database, including collections and documents, while keeping
the structure intact.

## Table of Contents

- [Data format](#data-format)
- [Installation](#installation)
- [Retrieving credentials](#retrieving-google-cloud-account-credentials)
- [Usage](#usage)
  - [Command line](#command-line)
    - [Export](#export)
    - [Import](#import)
    - [Clear](#clear)
  - [Using Firebase Firestore Emulator](#using-firebase-firestore-emulator)
  - [Library](#library)
    - [Export](#exporting)
    - [Import](#importing)
    - [Clear](#clearing)
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

where `__collections__` holds the collections for a given document (or the root
of the database).

Imports need to be from a file with the same structure (e.g. from an exported
file).

**Be careful!** This can easily overwrite or mess up your data if you import to
the wrong location.

#### Special Datatypes

Three types of data are serialized in the export:

- Timestamps
- Geopoints
- DocumentReferences

They each are serialized in the following format:

```json
{
  "__datatype__": "timestamp|geopoint|documentReference",
  "value": "The serialized value"
}
```

## Installation

```bash
npm install node-firestore-import-export-fix
```

### Retrieving Google Cloud Account Credentials

1. Visit the [Firebase Console](https://console.firebase.google.com)
1. Select your project
1. Navigate to **Project Settings** (at the time of writing the **gear** icon
   button at the top left of the page).
1. Navigate to **Service Accounts**
1. Click _Generate New Private Key_

This downloaded json file contains the proper credentials needed for
**node-firestore-import-export** to authenticate.

## Usage

### Command Line

The path to the account credentials can be placed in the
`GOOGLE_APPLICATION_CREDENTIALS` environment variable. For example:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-export -p
```

#### Export

- `-b`, `--backupFile` `<path>`- Filename to store backup. (e.g.
  backups/full-backup.json). Defaults to `firestore-export.json` if missing.
- `-n`, `--nodePath` `<path>`- Path to database node to start (e.g.
  collectionA/docB/collectionC). Backs up full database if empty or missing.
- `-p`, `--prettyPrint` - JSON backups done with pretty-printing.

##### Examples

###### Export full database

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-export --backupFile /backups/myDatabase.json
```

###### Export with pretty printing

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-export --backupFile /backups/myDatabase.json --prettyPrint
```

###### Export from a specific path (and all its children/collections)

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-export --backupFile /backups/myDatabase.json --nodePath collectionA/document1/collectionCC
```

#### Import

- `-b`, `--backupFile` `<path>`- Filename with backup data. (e.g.
  backups/full-backup.json).
- `-n`, `--nodePath` `<path>`- Path to database node to start (e.g.
  collectionA/docB/collectionC).
- `-y`, `--yes` - Unattended import without confirmation (like hitting "y" from
  the command line).

##### Examples

###### Import full database

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-import --backupFile /backups/myDatabase.json
```

###### Import to a specific path

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-import --backupFile /backups/myDatabase.json --nodePath collectionA/document1/collectionCC
```

#### Clear

- `-n`, `--nodePath` `<path>`- Path to database node to start (e.g.
  collectionA/docB/collectionC).
- `-y`, `--yes` - Unattended clear without confirmation (like hitting "y" from
  the command line). Command will wait 5 seconds so you can `Ctrl-C` to stop.
- `-w`, `--noWait` - Combine this with the `--yes` confirmation to not wait 5
  seconds

##### Example

###### Clear everything under a specific node

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json
firestore-clear --yes
```

### Using Firebase Firestore Emulator

If using
[Firebase Emulators](https://firebase.google.com/docs/rules/emulator-setup), set
the `FIRESTORE_EMULATOR_HOST` and `GOOGLE_CLOUD_PROJECT` environment variables
instead of `GOOGLE_APPLICATION_CREDENTIALS`.

For example:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8089
export GOOGLE_CLOUD_PROJECT=demo-
firestore-export -p
```

### Library

The underlying library can be used in a node or web application for importing
and exporting data in a similar fashion

#### Exporting

```typescript
import {firestoreExport} from 'node-firestore-import-export';
import * as firebase from 'firebase-admin';

firebase.initializeApp({
  apiKey: 'AIza....',
  authDomain: 'YOUR_APP.firebaseapp.com',
  databaseURL: 'https://YOUR_APP.firebaseio.com',
  storageBucket: 'YOUR_APP.appspot.com',
  messagingSenderId: '123456789',
});

const collectionRef = firebase
  .firestore()
  .collection('collectionA/docB/collectionC');

firestoreExport(collectionRef).then(data => console.log(data));
```

#### Importing

```typescript
import {firestoreImport} from 'node-firestore-import-export';
import * as firebase from 'firebase-admin';

firebase.initializeApp({
  apiKey: 'AIza....',
  authDomain: 'YOUR_APP.firebaseapp.com',
  databaseURL: 'https://YOUR_APP.firebaseio.com',
  storageBucket: 'YOUR_APP.appspot.com',
  messagingSenderId: '123456789',
});

const data = {
  docA: {
    name: 'bob',
    __collections__: {},
  },
  docB: {
    name: 'jill',
    __collections__: {},
  },
};

const collectionRef = firebase
  .firestore()
  .collection('collectionA/docB/collectionC');

firestoreImport(data, collectionRef).then(() =>
  console.log('Data was imported.')
);
```

#### Clearing

```typescript
import {firestoreClear} from 'node-firestore-import-export';
import * as firebase from 'firebase-admin';

firebase.initializeApp({
  apiKey: 'AIza....',
  authDomain: 'YOUR_APP.firebaseapp.com',
  databaseURL: 'https://YOUR_APP.firebaseio.com',
  storageBucket: 'YOUR_APP.appspot.com',
  messagingSenderId: '123456789',
});

const collectionRef = firebase
  .firestore()
  .collection('collectionA/docB/collectionC');

firestoreClear(collectionRef).then(() =>
  console.log('Everything under collectionA/docB/collectionC was removed.')
);
```

### Inspiration

The command line was inspired heavily by SteadyEquipment's
[node-firestore-backup](https://github.com/steadyequipment/node-firestore-backup)
