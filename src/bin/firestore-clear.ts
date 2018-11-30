#!/usr/bin/env node
import * as commander from 'commander';
import * as colors from 'colors';
import * as process from 'process';
import * as fs from 'fs';
import {getCredentialsFromFile, getDBReferenceFromPath, getFirestoreDBReference, sleep} from '../lib/firestore-helpers';
import {firestoreClear} from '../lib';
import * as prompt from 'prompt';
import * as admin from 'firebase-admin';

const packageInfo = require('../../package.json');

const accountCredentialsEnvironmentKey = 'GOOGLE_APPLICATION_CREDENTIALS';
const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription = 'path to Google Cloud account credentials JSON file. If missing, will look ' +
  `at the ${accountCredentialsEnvironmentKey} environment variable for the path.`;

const nodePathParamKey = 'nodePath';
const nodePathParamDescription = 'Path to database node to start (e.g. collectionA/docB/collectionC). ' +
  'Backs up entire database from the root if missing.';

const yesToClearParamKey = 'yes';
const yesToClearParamDescription = 'Unattended clear without confirmation (like hitting "y" from the command line).';

commander.version(packageInfo.version)
  .option(`-a, --${accountCredentialsPathParamKey} <path>`, accountCredentialsPathParamDescription)
  .option(`-n, --${nodePathParamKey} <path>`, nodePathParamDescription)
  .option(`-y, --${yesToClearParamKey}`, yesToClearParamDescription)
  .parse(process.argv);

const accountCredentialsPath = commander[accountCredentialsPathParamKey] || process.env[accountCredentialsEnvironmentKey];
if (!accountCredentialsPath) {
  console.log(colors.bold(colors.red('Missing: ')) + colors.bold(accountCredentialsPathParamKey) + ' - ' + accountCredentialsPathParamDescription);
  commander.help();
  process.exit(1);
}

if (!fs.existsSync(accountCredentialsPath)) {
  console.log(colors.bold(colors.red('Account credentials file does not exist: ')) + colors.bold(accountCredentialsPath));
  commander.help();
  process.exit(1);
}

const nodePath = commander[nodePathParamKey];

const unattendedConfirmation = commander[yesToClearParamKey];

getCredentialsFromFile(accountCredentialsPath)
  .then(credentials => {
    const db = getFirestoreDBReference(credentials);
    const pathReference = getDBReferenceFromPath(db, nodePath);
    return {credentials, pathReference};
  })
  .then(async ({credentials, pathReference}): Promise<admin.firestore.Firestore |
    FirebaseFirestore.DocumentReference |
    FirebaseFirestore.CollectionReference> => {
    const nodeLocation = (<FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference>pathReference)
      .path || '[database root]';
    const projectID = (credentials as any).project_id;
    const deleteText = `About to clear all data from '${projectID}' firestore starting at '${nodeLocation}'.`;
    console.log(`\n\n${colors.bold(colors.blue(deleteText))}`);
    if (unattendedConfirmation) {
      console.log(colors.bgYellow(colors.blue(' === Warning: Deletion will start in 5 seconds. Hit Ctrl-C to cancel. === ')));
      await sleep(5000);
      return pathReference;
    }

    console.log(colors.bgYellow(colors.blue(' === Warning: This will clear all existing data. Do you want to proceed? === ')));
    prompt.message = 'firestore-clear';
    prompt.start();
    return new Promise((resolve, reject) => {
      prompt.get({
        properties: {
          response: {
            description: colors.red(`Proceed with clear? [y/N] `),
          },
        },
      }, (err: Error, result: any) => {
        if (err) {
          reject(err);
        } else if (result.response.trim().toLowerCase() !== 'y') {
          reject('Clear aborted.');
        } else {
          resolve(pathReference);
        }
      });
    });
  })
  .then(pathReference => firestoreClear(pathReference))
  .then(() => {
    console.log(colors.bold(colors.green('All done 🎉')));
  })
  .catch((error) => {
    if (error instanceof Error) {
      console.log(colors.red(error.message));
      process.exit(1);
    } else {
      console.log(colors.red(error));
    }
  });


