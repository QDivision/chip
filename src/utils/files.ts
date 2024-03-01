import fs from 'mz/fs';
import { homedir } from 'os';
import { basename, resolve } from 'path';

export const CWD = resolve('.');

export const PROJECT_NAME = basename(CWD);

export const CHIP_DIR = `${homedir()}/.chip`;
export const CHIP_LOGS_DIR = `${CHIP_DIR}/logs`;
export const CHIP_PROCESSES_FILE = `${CHIP_DIR}/processes.json`;

export const fileExists = async (path: string) => {
  try {
    await fs.stat(path);
    return true;
  } catch (e: NodeJS.ErrnoException) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
};

export const writeJsonFile = (path: string, value: any) =>
  fs.writeFile(path, JSON.stringify(value, null, '  '));

export const readJsonFile = (path: string) =>
  fs.readFile(path, 'utf8').then(JSON.parse);
