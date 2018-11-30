#!/usr/bin/env node
import * as commander from 'commander';
import * as colors from 'colors';
import * as process from 'process';
import * as fs from 'fs';
import {firestoreExport} from '../lib';
import {getCredentialsFromFile, getDBReferenceFromPath, getFirestoreDBReference} from '../lib/firestore-helpers';

const packageInfo = require('../../package.json');

const accountCredentialsEnvironmentKey = 'GOOGLE_APPLICATION_CREDENTIALS';
const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription = 'path to Google Cloud account credentials JSON file. If missing, will look ' +
  `at the ${accountCredentialsEnvironmentKey} environment variable for the path.`;

const defaultBackupFilename = 'firebase-export.json';
const backupFileParamKey = 'backupFile';
const backupFileParamDescription = `Filename to store backup. (e.g. backups/full-backup.json). ` +
  `Defaults to '${defaultBackupFilename}' if missing.`;

const nodePathParamKey = 'nodePath';
const nodePathParamDescription = 'Path to database node to start (e.g. collectionA/docB/collectionC). ' +
  'Backs up entire database from the root if missing.';

const prettyPrintParamKey = 'prettyPrint';
const prettyPrintParamDescription = 'JSON backups done with pretty-printing.';

commander.version(packageInfo.version)
  .option(`-a, --${accountCredentialsPathParamKey} <path>`, accountCredentialsPathParamDescription)
  .option(`-b, --${backupFileParamKey} <path>`, backupFileParamDescription)
  .option(`-n, --${nodePathParamKey} <path>`, nodePathParamDescription)
  .option(`-p, --${prettyPrintParamKey}`, prettyPrintParamDescription)
  .parse(process.argv);

const accountCredentialsPath = commander[accountCredentialsPathParamKey] || process.env[accountCredentialsEnvironmentKey];
if (!accountCredentialsPath) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(accountCredentialsPathParamKey) + ' - ' + accountCredentialsPathParamDescription);
  commander.help();
  process.exit(1);
}

if (!fs.existsSync(accountCredentialsPath)) {
  console.log(colors.bold(colors.red('Account credentials file does not exist: ')) + colors.bold(accountCredentialsPath));
  commander.help();
  process.exit(1);
}

const backupPath = commander[backupFileParamKey] || defaultBackupFilename;
if (!backupPath) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(backupFileParamKey) + ' - ' + backupFileParamDescription);
  commander.help();
  process.exit(1);
}

const writeResults = (results: string, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, results, 'utf8', err => {
      if (err) {
        reject(err);
      } else {
        resolve(filename);
      }
    });
  });
};

const prettyPrint = commander[prettyPrintParamKey] !== undefined && commander[prettyPrintParamKey] !== null;
const nodePath = commander[nodePathParamKey];
getCredentialsFromFile(accountCredentialsPath)
  .then(credentials => {
    const db = getFirestoreDBReference(credentials);
    const pathReference = getDBReferenceFromPath(db, nodePath);
    return pathReference;
  })
  .then(pathReference => firestoreExport(pathReference))
  .then(results => {
    let stringResults;
    if (prettyPrint) {
      stringResults = JSON.stringify(results, null, 2);
    } else {
      stringResults = JSON.stringify(results);
    }
    return stringResults;
  })
  .then((dataToWrite: string) => writeResults(dataToWrite, backupPath))
  .then((filename: string) => {
    console.log(colors.yellow(`Results were saved to ${filename}`));
    return;
  })
  .then(() => {
    console.log(colors.bold(colors.green('All done 🎉')));
  })
  .catch((error) => {
    if (error instanceof Error) {
      console.log(colors.red(error.message));
      process.exit(1);
    } else {
      console.log(colors.red(error));
    }
  });


