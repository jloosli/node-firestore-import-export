#!/usr/bin/env node
import commander from 'commander';
import colors from 'colors';
import process from 'process';
import fs from 'fs';
import {getCredentialsFromFile, getDBReferenceFromPath, getFirestoreDBReference, sleep} from '../lib/firestore-helpers';
import {firestoreClear} from '../lib';
import {prompt} from 'enquirer';
import {
  accountCredentialsEnvironmentKey,
  ActionAbortedError,
  buildOption,
  commandLineParams as params,
  packageInfo,
} from './bin-common';
import {measureTimeAsync} from "../lib/helpers";


commander.version(packageInfo.version)
  .option(...buildOption(params.accountCredentialsPath))
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.yesToClear))
  .option(...buildOption(params.yesToNoWait))
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

const nodePath = commander[params.nodePath.key];

const unattendedConfirmation = commander[params.yesToClear.key];
const noWait = commander[params.yesToNoWait.key];

(async () => {
  const credentials = await getCredentialsFromFile(accountCredentialsPath);
  const db = getFirestoreDBReference(credentials);
  const pathReference = getDBReferenceFromPath(db, nodePath);
  const nodeLocation = (<FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference>pathReference)
    .path || '[database root]';
  const projectID = process.env.FIRESTORE_EMULATOR_HOST || (credentials as any).project_id;
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
  await measureTimeAsync("firestore-clear", () => firestoreClear(pathReference, true));
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

