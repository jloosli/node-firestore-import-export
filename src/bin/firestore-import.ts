#!/usr/bin/env node
import {Command} from 'commander';
import {prompt} from 'enquirer';
import colors from 'colors';
import process from 'process';
import * as admin from 'firebase-admin';
import fs from 'fs';
import {firestoreImport} from '../lib';
import {
  getDBReferenceFromPath,
  getFirestoreDBReference,
} from '../lib/firestore-helpers';
import {
  ActionAbortedError,
  buildOption,
  commandLineParams as params,
  packageInfo,
} from './bin-common';

const commander = new Command();
commander
  .version(packageInfo.version)
  .option(...buildOption(params.backupFileImport))
  .option(...buildOption(params.nodePath))
  .option(...buildOption(params.yesToImport))
  .parse(process.argv);

const backupFile = commander.opts()[params.backupFileImport.key];
if (!backupFile) {
  console.log(
    colors.bold(colors.red('Missing: ')) +
      colors.bold(params.backupFileImport.key) +
      ' - ' +
      params.backupFileImport.description
  );
  commander.help();
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.log(
    colors.bold(colors.red('Backup file does not exist: ')) +
      colors.bold(backupFile)
  );
  commander.help();
  process.exit(1);
}

const nodePath = commander.opts()[params.nodePath.key];

const unattendedConfirmation = commander.opts()[params.yesToImport.key];

(async () => {
  const db = getFirestoreDBReference();
  const pathReference = await getDBReferenceFromPath(db, nodePath);
  const buffer = await fs.promises.readFile(backupFile);
  const str = new TextDecoder().decode(buffer);
  const data = JSON.parse(str);
  if (!unattendedConfirmation) {
    const nodeLocation =
      (<
        | FirebaseFirestore.DocumentReference
        | FirebaseFirestore.CollectionReference
      >pathReference).path || '[database root]';
    const projectID =
      process.env.FIRESTORE_EMULATOR_HOST ||
      (admin.apps[0]?.options.credential as any).projectId;
    const importText = `About to import data '${backupFile}' to the '${projectID}' firestore at '${nodeLocation}'.`;

    console.log(`\n\n${colors.bold(colors.blue(importText))}`);
    console.log(
      colors.bgYellow(
        colors.blue(
          ' === Warning: This will overwrite existing data. Do you want to proceed? === '
        )
      )
    );

    const response: {continue: boolean} = await prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Proceed with import?',
    });
    if (!response.continue) {
      throw new ActionAbortedError('Import Aborted');
    }
  }

  console.log(colors.bold(colors.green('Starting Import 🏋️')));
  await firestoreImport(data, pathReference, false, true);
  console.log(colors.bold(colors.green('All done 🎉')));
})().catch(error => {
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
