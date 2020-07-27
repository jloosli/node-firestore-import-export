import process from "process";
import commander from "commander";
import colors from "colors";
import fs from "fs";

const packageInfo = require('../../package.json');
const accountCredentialsEnvironmentKey = 'GOOGLE_APPLICATION_CREDENTIALS';
const defaultBackupFilename = 'firebase-export.json';


const commandLineParams: { [param: string]: Params } =
  {
    accountCredentialsPath: {
      shortKey: 'a',
      key: 'accountCredentials',
      args: '<path>',
      description: `path to Google Cloud account credentials JSON file. If missing, will look at the ${accountCredentialsEnvironmentKey} environment variable for the path. Defaults to '${defaultBackupFilename}' if missing.`,
    },
    backupFileImport: {
      shortKey: 'b',
      key: 'backupFile',
      args: '<path>',
      description: 'Filename to store backup. (e.g. backups/full-backup.json).',
    },
    backupFileExport: {
      shortKey: 'b',
      key: 'backupFile',
      args: '<path>',
      description: 'Filename to store backup. (e.g. backups/full-backup.json).',
    },
    nodePath: {
      shortKey: 'n',
      key: 'nodePath',
      args: '<path>',
      description: `Path to database node (has to be a collection) where import will to start (e.g. collectionA/docB/collectionC). Imports at root level if missing.`,
    },
    yesToImport: {
      shortKey: 'y',
      key: 'yes',
      description: 'Unattended import without confirmation (like hitting "y" from the command line).',
    },
    yesToClear: {
      shortKey: 'y',
      key: 'yes',
      description: 'Unattended clear without confirmation (like hitting "y" from the command line).',
    },
    yesToNoWait: {
      shortKey: 'w',
      key: 'noWait',
      description: 'Use with unattended confirmation to remove the 5 second delay.',
    },
    prettyPrint: {
      shortKey: 'p',
      key: 'prettyPrint',
      description: 'JSON backups done with pretty-printing.',
    },
  };

const buildOption = ({shortKey, key, args = '', description}: Params): [string, string] => [`-${shortKey} --${key} ${args}`, description];

/*
See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
 */
class ActionAbortedError extends Error {
  constructor(m?: string) {
    super(m);
    Object.setPrototypeOf(this, ActionAbortedError.prototype);
  }
}

const checkAccountCredentialsPath = (): string | undefined => {
  let accountCredentialsPath: string | undefined;
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    accountCredentialsPath = commander[commandLineParams.accountCredentialsPath.key] || process.env[accountCredentialsEnvironmentKey];
    if (!accountCredentialsPath) {
      console.log(colors.bold(colors.red('Missing: ')) + colors.bold(commandLineParams.accountCredentialsPath.key) + ' - ' + commandLineParams.accountCredentialsPath.description);
      commander.help();
      process.exit(1);
    }

    if (!fs.existsSync(accountCredentialsPath)) {
      console.log(colors.bold(colors.red('Account credentials file does not exist: ')) + colors.bold(accountCredentialsPath));
      commander.help();
      process.exit(1);
    }
  }

  return accountCredentialsPath;
};

const checkBackupFile = (checkFileExistence = false): string => {
  const backupFile = commander[commandLineParams.backupFileImport.key];
  if (!backupFile) {
    console.log(colors.bold(colors.red('Missing: ')) + colors.bold(commandLineParams.backupFileImport.key) + ' - ' + commandLineParams.backupFileImport.description);
    commander.help();
    process.exit(1);
  }

  if (checkFileExistence && !fs.existsSync(backupFile)) {
    console.log(colors.bold(colors.red('Backup file does not exist: ')) + colors.bold(backupFile));
    commander.help();
    process.exit(1);
  }

  return backupFile;
}

export {
  packageInfo,
  accountCredentialsEnvironmentKey,
  commandLineParams,
  buildOption,
  ActionAbortedError,
  checkAccountCredentialsPath,
  checkBackupFile,
};

interface Params {
  shortKey: string;
  key: string;
  args?: string;
  description: string;
}