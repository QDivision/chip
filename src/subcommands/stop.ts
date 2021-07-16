import chalk from 'chalk';

import * as docker from '../utils/docker';
import { exec } from '../utils/processes';
import { processExists, getActiveProcesses } from '../utils/ps';
import { PROJECT_NAME } from '../utils/files';
import { printError } from '../utils/errors';
import {readServices} from "../utils/config";

export const stopProcess = async (name: string, pid: number) => {
  console.log(chalk`Stopping {bold ${name}} with pid {bold ${pid}}`);
  if (await processExists(pid)) {
    // https://stackoverflow.com/a/8406413
    await exec(`kill -SIGINT -${pid}`);

    // TODO: Add a `chip stop --force` flag that uses `-TERM` signal:
    // execSync(`kill -TERM -${pid}`);
  } else {
    console.log(chalk`Unknown process with pid {bold ${pid}}`);
  }
};

export const stopServices = async (
  serviceWhitelist: string[],
  removeDockerContainers = false,
  serviceWhitelistTag?: string | undefined,
) => {

  const services = await readServices(serviceWhitelist, serviceWhitelistTag);
  const activeProcesses = await getActiveProcesses(PROJECT_NAME);

  for (const { name, run } of services) {
    if (!run || !activeProcesses[name]) continue;
    try {
      await stopProcess(name, activeProcesses[name].pid);
    } catch (e) {
      printError(e);
    }
  }

  if (docker.isPresent()) {
    if (serviceWhitelist.length === 0 && !serviceWhitelistTag) {
      if (removeDockerContainers) await docker.rm();
      else await docker.stop();
    } else {
      const dockerServices = await docker.composeServiceNames(serviceWhitelist, serviceWhitelistTag);
      if (dockerServices.length > 0) {
        if (removeDockerContainers) await docker.rm(dockerServices);
        else await docker.stop(dockerServices);
      }
    }
  }
};
