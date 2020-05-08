#!/usr/bin/env node
import commander from 'commander';
import {prompt} from 'enquirer';
import colors from 'colors';
import process from 'process';
import fs from 'fs';
import {firestoreImport} from '../lib';
import {getCredentialsFromFile, getDBReferenceFromPath, getFirestoreDBReference} from '../lib/firestore-helpers';
import loadJsonFile from 'load-json-file';
import {
  accountCredentialsEnvironmentKey,
  ActionAbortedError,
  buildOption,
  commandLineParams as params,
  packageInfo,
} from './bin-common';

commander.version(packageInfo.version)
  .option(...buildOption(params.accountCredentialsPath))
  .option(...buildOption(params.backupFileImport))
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.yesToImport))
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

const backupFile = commander[params.backupFileImport.key];
if (!backupFile) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(params.backupFileImport.key) + ' - ' + params.backupFileImport.description);
  commander.help();
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.log(colors.bold(colors.red('Backup file does not exist: ')) + colors.bold(backupFile));
  commander.help();
  process.exit(1);
}

const nodePath = commander[params.nodePath.key];

const importPathPromise = getCredentialsFromFile(accountCredentialsPath)
  .then(credentials => {
    const db = getFirestoreDBReference(credentials);
    return getDBReferenceFromPath(db, nodePath);
  });

const unattendedConfirmation = commander[params.yesToImport.key];

(async () => {
  const [data, pathReference, credentials] = await Promise.all([
    loadJsonFile(backupFile), importPathPromise, getCredentialsFromFile(accountCredentialsPath),
  ]);

  if (!unattendedConfirmation) {
    const nodeLocation = (<FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference>pathReference)
      .path || '[database root]';
    const projectID = process.env.FIRESTORE_EMULATOR_HOST || (credentials as any).project_id;
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
  // @ts-ignore
  await firestoreImport(data, pathReference);
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

