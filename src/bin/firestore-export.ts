#!/usr/bin/env node
import * as commander from 'commander';

import * as colors from 'colors';
import * as process from 'process';
import * as fs from 'fs';
import firestoreExport from '../lib/export';

const packageInfo = require('../../package.json');

const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file';

const backupPathParamKey = 'backupPath';
const backupPathParamDescription = 'File Path to store backup.';

const nodePathParamKey = 'nodePath';
const nodePathParamDescription = 'Path to database node to start (e.g. collectionA/docB/collectionC). Backs up entire database if missing';

const prettyPrintParamKey = 'prettyPrint';
const prettyPrintParamDescription = 'JSON backups done with pretty-printing.';

commander.version(packageInfo.version)
    .option(`-a, --${accountCredentialsPathParamKey} <path>`, accountCredentialsPathParamDescription)
    .option(`-b, --${backupPathParamKey} <path>`, backupPathParamDescription)
    .option(`-n, --${nodePathParamKey} <path>`, nodePathParamDescription)
    .option(`-P, --${prettyPrintParamKey}`, prettyPrintParamDescription)
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

const backupPath = commander[backupPathParamKey];
if (!backupPath) {
    console.log(colors.bold(colors.red('Missing: ')) + colors.bold(backupPathParamKey) + ' - ' + backupPathParamDescription);
    commander.help();
    process.exit(1);
}

const writeResults = (results: object, filename: string) => {
    const content = JSON.stringify(results);
    fs.writeFile(filename, content, 'utf8', err => {
        if (err) {
            return console.log(err);
        }
        console.log(`Results were saved to ${filename}`);
    })
};

const prettyPrint = commander[prettyPrintParamKey] !== undefined && commander[prettyPrintParamKey] !== null
const nodePath = commander[nodePathParamKey];
firestoreExport(accountCredentialsPath, nodePath)
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


