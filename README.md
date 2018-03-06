# node-firestore-import-export
Firestore data backup and restoration

[![codebeat badge](https://codebeat.co/badges/c7db349c-8de5-4b49-b366-55a0448eb18a)](https://codebeat.co/projects/github-com-jloosli-node-firestore-import-export-master)[![Codacy Badge](https://api.codacy.com/project/badge/Grade/2ea2abb4fa0f47d383a4a7221cfae4e8)](https://www.codacy.com/app/jloosli/node-firestore-import-export?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=jloosli/node-firestore-import-export&amp;utm_campaign=Badge_Grade)
[![David badge](https://david-dm.org/jloosli/node-firestore-import-export.svg)](https://david-dm.org/jloosli/node-firestore-import-export.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/jloosli/node-firestore-import-export/badge.svg)](https://snyk.io/test/github/jloosli/node-firestore-import-export)

## Installation
Install using [__npm__](https://www.npmjs.com/).

```sh
npm install -g firestore-import-export
```

 or [__yarn__](https://yarnpkg.com/en/)

```sh
yarn global add firestore-import-export
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

This downloaded json file contains the proper credentials needed for __firestore-backup__ to authenticate.


## Usage

### Backup:
* `-a`, `--accountCredentials` `<path>` - Google Cloud account credentials JSON file.
* `-B`, `--backupFile` `<path>`- Path to store the backup.

Example:
```sh
firestore-import-export --accountCredentials path/to/credentials/file.json --backupFile /backups/myDatabase.json
```

### Backup with pretty printing:
* `-P`, `--prettyPrint` - JSON backups done with pretty-printing.

Example:
```sh
firestore-import-export --accountCredentials path/to/credentials/file.json --backupFile /backups/myDatabase.json --prettyPrint
```

### Relax:
That's it! ✨🌈

## Contributions
Feel free to report bugs and make feature requests in the [Issue Tracker](https://github.com/jloosli/node-firestore-import-export/issues), fork and create pull requests!

### Inspiration
The command line portion was inspired heavily by SteadyEquipment's [node-firestore-backup](https://github.com/steadyequipment/node-firestore-backup) 
