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
    maxConcurrency: {
      shortKey: 'm',
      key: 'maxConcurrency',
      args: '<maxConcurrency>',
      description: `Maximum import concurrency to prevent bandwidth exhausted and other load errors. The default (0) is unlimited.`,
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

export {packageInfo, accountCredentialsEnvironmentKey, commandLineParams, buildOption, ActionAbortedError};

interface Params {
  shortKey: string;
  key: string;
  args?: string;
  description: string;
}