#!/usr/bin/env node
import commander from 'commander';
import colors from 'colors';
import process from 'process';
import fs from 'fs';
import {firestoreExport} from '../lib';
import {getCredentialsFromFile, getDBReferenceFromPath, getFirestoreDBReference} from '../lib/firestore-helpers';
import {accountCredentialsEnvironmentKey, buildOption, commandLineParams as params, packageInfo} from './bin-common';
import {stableStringify} from "../lib/helpers";

commander.version(packageInfo.version)
  .option(...buildOption(params.accountCredentialsPath))
  .option(...buildOption(params.backupFileExport))
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.prettyPrint))
  .option(...buildOption(params.sortKeys))
  .parse(process.argv);

const accountCredentialsPath = commander[params.accountCredentialsPath.key] || process.env[accountCredentialsEnvironmentKey];
if (!accountCredentialsPath) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(params.accountCredentialsPath.key) + ' - ' + params.accountCredentialsPath.description);
  commander.help();
  process.exit(1);
}

if (!fs.existsSync(accountCredentialsPath)) {
  console.log(colors.bold(colors.red('Account credentials file does not exist: ')) + colors.bold(accountCredentialsPath));
  commander.help();
  process.exit(1);
}

const backupFile = commander[params.backupFileExport.key];
if (!backupFile) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(params.backupFileExport.key) + ' - ' + params.backupFileExport.description);
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

const prettyPrint = Boolean(commander[params.prettyPrint.key]);
const sortKeys = Boolean(commander[params.sortKeys.key]);
const nodePath = commander[params.nodePath.key];

(async () => {
  const credentials = await getCredentialsFromFile(accountCredentialsPath);
  const db = getFirestoreDBReference(credentials);
  const pathReference = getDBReferenceFromPath(db, nodePath);
  console.log(colors.bold(colors.green('Starting Export 🏋️')));
  const results = await firestoreExport(pathReference, true);
  const stringResults = stringify(results, prettyPrint ? 2 : undefined);
  await writeResults(stringResults, backupFile);
  console.log(colors.yellow(`Results were saved to ${backupFile}`));
  console.log(colors.bold(colors.green('All done 🎉')));
})().catch((error) => {
  if (error instanceof Error) {
    console.log(colors.red(error.message));
    process.exit(1);
  } else {
    console.log(colors.red(error));
  }
});

function stringify(results: unknown, space?: number): string {
  if (sortKeys) {
    return stableStringify(results, space)
  }
  return JSON.stringify(results, undefined, space);
}


