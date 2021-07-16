import chalk from 'chalk';
import { maxBy } from 'lodash';
import readline from 'readline';
import { fs } from 'mz';

import { CHIP_LOGS_DIR, PROJECT_NAME } from '../utils/files';
import { readServices } from '../utils/config';
import { spawn } from 'child_process';
import { log } from '../utils/log';

export const logService = async (
  projectName: string,
  serviceName: string,
  padLength: number,
  color: chalk.Chalk,
  offset: number,
) => {
  const fileName = `${CHIP_LOGS_DIR}/${projectName}/${serviceName}.log`;
  const subprocess = spawn('tail', ['-f', '-c', `+${offset}`, fileName]);
  [subprocess.stdout, subprocess.stderr].forEach((stream) => {
    const rl = readline.createInterface({ input: stream });

    rl.on('line', (line) => {
      const paddedName = serviceName.padEnd(padLength);
      const prefix = color(chalk.bold(`${paddedName} | `));
      console.log(prefix + line);
    });

    stream.on('exit', (data) => {
      log`{blue ${serviceName} output stream exited: ${data}}`;
    });

    stream.on('error', ({ message }) => {
      log`{red ${serviceName} output stream exited with error: ${message}}`;
    });
  });
};

const prefixColors = [
  chalk.red,
  chalk.green,
  chalk.yellow,
  chalk.blue,
  chalk.magenta,
  chalk.cyan,

  // TODO: Change these colors so there's more contrast
  chalk.redBright,
  chalk.greenBright,
  chalk.yellowBright,
  chalk.blueBright,
  chalk.magentaBright,
  chalk.cyanBright,
];

/*
Flow for `chip logs`:
  1. Read in all timestamped log files.
  2. Count the lines in each file from (1).
  3. Start tailing each timestamped log file (from the beginning).
  4. When tailed file emits a line, queue it up in a common array.
    - Skip the line if it is less than the count from (2).
    - Maybe not necessary if this isn't done asynchronous.
  5. Sort and print logs from the timestamped files.
  6. Begin emitting lines from queue in (4) - live.
*/

interface Log {
  timestamp: number;
  log: string;
  serviceName: string;
}

// TODO: Should we periodically check for new services whose logs need to be
//       printed, incase services are started/stopped while `chip logs` is
//       running?
const printLog = (
  { serviceName, log }: Log,
  padLength: number,
  color: chalk.Chalk,
) => {
  const paddedName = `${serviceName}*`.padEnd(padLength + 1);
  const prefix = color(chalk.bold(`${paddedName} | `));
  console.log(prefix + log);
};

export const logServices = async (serviceWhitelist?: string[], serviceWhitelistTag?: string | undefined) => {
  const services = await readServices(serviceWhitelist, serviceWhitelistTag);
  const serviceNames = services.map(({ name }) => name);
  const longestServiceName = (maxBy(serviceNames, 'length') || '').length;

  const colorForService: { [name: string]: chalk.Chalk } = {};
  serviceNames.forEach((name, idx) => {
    colorForService[name] = prefixColors[idx % prefixColors.length];
  });

  const logs: Log[] = [];
  const initialCharsForService: { [name: string]: number } = {};

  for (const serviceName of serviceNames) {
    const fileName = `${CHIP_LOGS_DIR}/${PROJECT_NAME}/${serviceName}.log.timestamps`;
    if (await fs.exists(fileName)) {
      const contents = await fs.readFile(fileName, 'utf8');
      const lines = contents.split('\n').map((line) => {
        const firstSpace = line.indexOf(' ');
        const timestamp = Number(line.substring(0, firstSpace));
        const log = line.substring(firstSpace + 1);
        return { timestamp, log, serviceName };
      });
      initialCharsForService[serviceName] = contents.length + 1;
      logs.push(...lines);
    }
  }

  logs.sort((a, b) => a.timestamp - b.timestamp);
  for (const log of logs) {
    printLog(log, longestServiceName, colorForService[log.serviceName]);
  }

  for (const serviceName of serviceNames) {
    const fileName = `${CHIP_LOGS_DIR}/${PROJECT_NAME}/${serviceName}.log.timestamps`;
    if (await fs.exists(fileName)) {
      logService(
        PROJECT_NAME,
        serviceName,
        longestServiceName,
        colorForService[serviceName],
        initialCharsForService[serviceName],
      );
    }
  }
};
