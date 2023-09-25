#!/usr/bin/env node
import {Command} from 'commander';
import colors from 'colors';
import process from 'process';
import {
  getDBReferenceFromPath,
  getFirestoreDBReference,
  sleep,
} from '../lib/firestore-helpers';
import {firestoreClear} from '../lib';
import {prompt} from 'enquirer';
import {
  ActionAbortedError,
  buildOption,
  commandLineParams as params,
  packageInfo,
} from './bin-common';

const commander = new Command();
commander
  .version(packageInfo.version)
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.yesToClear))
  .option(...buildOption(params.yesToNoWait))
  .parse(process.argv);

const nodePath = commander.opts()[params.nodePath.key];

const unattendedConfirmation = commander.opts()[params.yesToClear.key];
const noWait = commander.opts()[params.yesToNoWait.key];

(async () => {
  const db = getFirestoreDBReference();
  const pathReference = getDBReferenceFromPath(db, nodePath);
  if (!unattendedConfirmation) {
    console.log(
      colors.bgYellow(
        colors.blue(
          ' === Warning: This will clear all existing data. Do you want to proceed? === '
        )
      )
    );
    const response: {continue: boolean} = await prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Proceed with clear?',
    });
    if (!response.continue) {
      throw new ActionAbortedError('Clear Aborted');
    }
  } else if (!noWait) {
    console.log(
      colors.bgYellow(
        colors.blue(
          ' === Warning: Deletion will start in 5 seconds. Hit Ctrl-C to cancel. === '
        )
      )
    );
    await sleep(5000);
  }
  console.log(colors.bold(colors.green('Starting clearing of records 🏋️')));
  await firestoreClear(pathReference, true);
  console.log(colors.bold(colors.green('All done 🎉')));
})().catch(error => {
  if (error instanceof ActionAbortedError) {
    console.log(error.message);
  } else if (error instanceof Error) {
    console.log(colors.red(error.message));
    process.exit(1);
  } else {
    console.log(colors.red(error));
  }
});
