#!/usr/bin/env node
import * as commander from 'commander';

import * as colors from 'colors';
import * as process from 'process';
import * as fs from 'fs';
import firestoreImport from '../lib/import';
import loadJsonFile = require("load-json-file");

const packageInfo = require('../../package.json');

const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file';

const backupFileParamKey = 'backupFile';
const backupFileParamDescription = 'Filename to store backup. (e.g. backups/full-backup.json)';

const nodePathParamKey = 'nodePath';
const nodePathParamDescription = 'Path to database node (has to be a collection) where import will to start (e.g. collectionA/docB/collectionC).' +
    ' Imports at root level if missing.';

commander.version(packageInfo.version)
    .option(`-a, --${accountCredentialsPathParamKey} <path>`, accountCredentialsPathParamDescription)
    .option(`-b, --${backupFileParamKey} <path>`, backupFileParamDescription)
    .option(`-n, --${nodePathParamKey} <path>`, nodePathParamDescription)
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

const backupFile = commander[backupFileParamKey];
if (!backupFile) {
    console.log(colors.bold(colors.red('Missing: ')) + colors.bold(backupFileParamKey) + ' - ' + backupFileParamDescription);
    commander.help();
    process.exit(1);
}

if (!fs.existsSync(backupFile)) {
    console.log(colors.bold(colors.red('Backup file does not exist: ')) + colors.bold(backupFile));
    commander.help();
    process.exit(1)
}

const nodePath = commander[nodePathParamKey];
loadJsonFile(backupFile)
    .then((data: any) => firestoreImport(accountCredentialsPath, data, nodePath))
    .then(() => {
        console.log(colors.bold(colors.green('All done 💫')));
    })
    .catch((error) => {
        console.log(colors.red(error));
        process.exit(1);
    });


