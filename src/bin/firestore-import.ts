#!/usr/bin/env node
import commander from 'commander';
import {prompt} from 'enquirer';
import colors from 'colors';
import process from 'process';
import {firestoreImport} from '../lib';
import {
  getCredentialsFromFile,
  getProjectIdFromCredentials,
  getFirestoreDBReference, getDBReferenceFromPath
} from '../lib/firestore-helpers';
import loadJsonFile from 'load-json-file';
import {
  ActionAbortedError,
  buildOption,
  commandLineParams as params,
  packageInfo,
  checkAccountCredentialsPath,
  checkBackupFile,
} from './bin-common';

commander.version(packageInfo.version)
  .option(...buildOption(params.accountCredentialsPath))
  .option(...buildOption(params.backupFileImport))
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.yesToImport))
  .parse(process.argv);

const accountCredentialsPath = checkAccountCredentialsPath();
const backupFile = checkBackupFile(true);
const nodePath = commander[params.nodePath.key];
const unattendedConfirmation = commander[params.yesToImport.key];

(async () => {
  const credentials = await getCredentialsFromFile(accountCredentialsPath);
  const db = getFirestoreDBReference(credentials);
  const pathReference = getDBReferenceFromPath(db, nodePath);
  const data = await loadJsonFile(backupFile);

  if (!unattendedConfirmation) {
    const nodeLocation = (<FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference>pathReference)
      .path || '[database root]';
    const projectID = getProjectIdFromCredentials(credentials);
    const importText = `About to import data '${backupFile}' to the '${projectID}' firestore at '${nodeLocation}'.`;

    console.log(`\n\n${colors.bold(colors.blue(importText))}`);
    console.log(colors.bgYellow(colors.blue(' === Warning: This will overwrite existing data. Do you want to proceed? === ')));

    const response: { continue: boolean } = await prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Proceed with import?',
    });
    if (!response.continue) {
      throw new ActionAbortedError('Import Aborted');
    }

  }

  console.log(colors.bold(colors.green('Starting Import 🏋️')));
  await firestoreImport(data, pathReference, true, true);
  console.log(colors.bold(colors.green('All done 🎉')));
})().catch((error) => {
  if (error instanceof ActionAbortedError) {
    console.log(error.message);
  } else if (error instanceof Error) {
    console.log(colors.red(`${error.name}: ${error.message}`));
    console.log(colors.red(error.stack as string));
    process.exit(1);
  } else {
    console.log(colors.red(error));
  }
});

