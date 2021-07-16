import * as docker from '../utils/docker';
import { readServices } from '../utils/config';
import { PROJECT_NAME } from '../utils/files';
import { log } from '../utils/log';
import { getActiveProcesses } from '../utils/ps';
import { printError } from '../utils/errors';
import { stopProcess } from './stop';
import { startService } from './start';

export const restartServices = async (
  serviceWhitelist: string[],
  removeDockerContainers = false,
  serviceWhitelistTag?: string | undefined
) => {
  if (docker.isPresent()) {
    if (serviceWhitelist.length === 0) {
      if (removeDockerContainers) await docker.rm();
      else await docker.stop();
      await docker.up();
    } else {
      const dockerServices = await docker.composeServiceNames(serviceWhitelist);
      if (dockerServices.length > 0) {
        if (removeDockerContainers) await docker.rm(dockerServices);
        else await docker.stop(dockerServices);
        await docker.up(dockerServices);
      }
    }
  }

  const services = await readServices(serviceWhitelist, serviceWhitelistTag);
  const activeProcesses = await getActiveProcesses(PROJECT_NAME);

  for (const { name, run, env, secrets } of services) {
    if (!run) continue;
    try {
      if (activeProcesses[name]) {
        await stopProcess(name, activeProcesses[name].pid);
        await new Promise((r) => setTimeout(r, 2000));
        await startService(name, run, env, secrets);
      } else {
        log`Service {bold ${name}} not running`;
        await startService(name, run, env, secrets);
      }
    } catch (e) {
      printError(e);
    }
  }
};
