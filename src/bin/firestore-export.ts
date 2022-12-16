#!/usr/bin/env node
import {Command} from 'commander';
import colors from 'colors';
import process from 'process';
import fs from 'fs';
import {firestoreExport} from '../lib';
import {getDBReferenceFromPath, getFirestoreDBReference} from '../lib/firestore-helpers';
import {buildOption, commandLineParams as params, packageInfo} from './bin-common';

const commander = new Command();
commander.version(packageInfo.version)
  .option(...buildOption(params.backupFileExport))
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.prettyPrint))
  .parse(process.argv);

const backupFile = commander.opts()[params.backupFileExport.key];
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

const prettyPrint = Boolean(commander.opts()[params.prettyPrint.key]);
const nodePath = commander.opts()[params.nodePath.key];

(async () => {
  const db = getFirestoreDBReference();
  const pathReference = getDBReferenceFromPath(db, nodePath);
  console.log(colors.bold(colors.green('Starting Export 🏋️')));
  const results = await firestoreExport(pathReference, true);
  const stringResults = JSON.stringify(results, undefined, prettyPrint ? 2 : undefined);
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



