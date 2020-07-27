#!/usr/bin/env node
import commander from 'commander';
import colors from 'colors';
import process from 'process';
import {
  getCredentialsFromFile,
  getProjectIdFromCredentials,
  getFirestoreDBReference,
  getDBReferenceFromPath,
  sleep,
} from '../lib/firestore-helpers';
import {firestoreClear} from '../lib';
import {prompt} from 'enquirer';
import {
  ActionAbortedError,
  buildOption,
  commandLineParams as params,
  packageInfo,
  checkAccountCredentialsPath,
} from './bin-common';


commander.version(packageInfo.version)
  .option(...buildOption(params.accountCredentialsPath))
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.yesToClear))
  .option(...buildOption(params.yesToNoWait))
  .parse(process.argv);

const accountCredentialsPath = checkAccountCredentialsPath();
const nodePath = commander[params.nodePath.key];
const unattendedConfirmation = commander[params.yesToClear.key];
const noWait = commander[params.yesToNoWait.key];

(async () => {
  const credentials = await getCredentialsFromFile(accountCredentialsPath);
  const db = getFirestoreDBReference(credentials);
  const pathReference = getDBReferenceFromPath(db, nodePath);
  const nodeLocation = (<FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference>pathReference)
    .path || '[database root]';
  const projectID = getProjectIdFromCredentials(credentials);
  const deleteText = `About to clear all data from '${projectID}' firestore starting at '${nodeLocation}'.`;
  console.log(`\n\n${colors.bold(colors.blue(deleteText))}`);
  if (!unattendedConfirmation) {
    console.log(colors.bgYellow(colors.blue(' === Warning: This will clear all existing data. Do you want to proceed? === ')));
    const response: { continue: boolean } = await prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Proceed with clear?',
    });
    if (!response.continue) {
      throw new ActionAbortedError('Clear Aborted');
    }
  } else if (!noWait) {
    console.log(colors.bgYellow(colors.blue(' === Warning: Deletion will start in 5 seconds. Hit Ctrl-C to cancel. === ')));
    await sleep(5000);
  }
  console.log(colors.bold(colors.green('Starting clearing of records 🏋️')));
  await firestoreClear(pathReference, true);
  console.log(colors.bold(colors.green('All done 🎉')));
})().catch((error) => {
  if (error instanceof ActionAbortedError) {
    console.log(error.message);
  } else if (error instanceof Error) {
    console.log(colors.red(error.message));
    process.exit(1);
  } else {
    console.log(colors.red(error));
  }
});

