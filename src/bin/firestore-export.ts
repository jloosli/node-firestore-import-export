#!/usr/bin/env node
import * as commander from 'commander';
import * as colors from 'colors';
import * as process from 'process';
import * as fs from 'fs';
import firestoreExport from '../lib/export';
import {getCredentialsFromFile, getDBReferenceFromPath, getFirestoreDBReference} from "../lib/firestore-helpers";

const packageInfo = require('../../package.json');

const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file';

const backupFileParamKey = 'backupFile';
const backupFileParamDescription = 'Filename to store backup. (e.g. backups/full-backup.json)';

const nodePathParamKey = 'nodePath';
const nodePathParamDescription = 'Path to database node to start (e.g. collectionA/docB/collectionC). ' +
    'Backs up entire database from the root if missing';

const prettyPrintParamKey = 'prettyPrint';
const prettyPrintParamDescription = 'JSON backups done with pretty-printing.';

commander.version(packageInfo.version)
    .option(`-a, --${accountCredentialsPathParamKey} <path>`, accountCredentialsPathParamDescription)
    .option(`-b, --${backupFileParamKey} <path>`, backupFileParamDescription)
    .option(`-n, --${nodePathParamKey} <path>`, nodePathParamDescription)
    .option(`-p, --${prettyPrintParamKey}`, prettyPrintParamDescription)
    .parse(process.argv);

const accountCredentialsPath = commander[accountCredentialsPathParamKey];
if (!accountCredentialsPath) {
    console.log(colors.bold(colors.red('Missing: ')) + colors.bold(accountCredentialsPathParamKey) + ' - ' + accountCredentialsPathParamDescription);
    commander.help();
    process.exit(1);
}

if (!fs.existsSync(accountCredentialsPath)) {
    console.log(colors.bold(colors.red('Account credentials file does not exist: ')) + colors.bold(accountCredentialsPath));
    commander.help();
    process.exit(1)
}

const backupPath = commander[backupFileParamKey] || 'firebase-export.json';
if (!backupPath) {
    console.log(colors.bold(colors.red('Missing: ')) + colors.bold(backupFileParamKey) + ' - ' + backupFileParamDescription);
    commander.help();
    process.exit(1);
}

const writeResults = (results: string, filename: string) => {
    fs.writeFile(filename, results, 'utf8', err => {
        if (err) {
            return console.log(err);
        }
        console.log(`Results were saved to ${filename}`);
    })
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
    .then(() => {
        console.log(colors.bold(colors.green('All done 💫')));
    })
    .catch((error) => {
        console.log(colors.red(error));
        process.exit(1);
    });


