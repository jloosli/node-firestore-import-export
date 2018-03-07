import * as commander from 'commander';

import * as colors from 'colors';
const packageInfo = require('../../package.json');
import * as process from 'process';
import * as fs from 'fs';

const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file';

const backupPathParamKey = 'backupPath';
const backupPathParamDescription = 'File Path to store backup.';

const prettyPrintParamKey = 'prettyPrint';
const prettyPrintParamDescription = 'JSON backups done with pretty-printing.';

commander.version(packageInfo.version)
    .option(`-a, --${accountCredentialsPathParamKey} <path>`, accountCredentialsPathParamDescription)
    .option(`-B, --${backupPathParamKey} <path>`, backupPathParamDescription)
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

const prettyPrint = commander[prettyPrintParamKey] !== undefined && commander[prettyPrintParamKey] !== null

const firestoreBackup = require('../dist/index.js');
try {
    firestoreBackup.default(accountCredentialsPath, backupPath, prettyPrint)
        .then(() => {
            console.log(colors.bold(colors.green('All done 💫')));
        })
} catch (error) {
    console.log(colors.red(error));
    process.exit(1);
}