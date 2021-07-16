import { last } from 'lodash';

import * as git from '../utils/git';
import { readServices } from '../utils/config';
import { CWD } from '../utils/files';
import { log } from '../utils/log';
import { printError } from '../utils/errors';

export const statusService = async (name: string) => {
  const repoDir = `${CWD}/${name}`;
  log`Git status for {bold ${name}}`;
  await git.status(repoDir);
};

export const statusServices = async (serviceWhitelist?: string[], serviceWhitelistTag?: string | undefined) => {
  const services = await readServices(serviceWhitelist, serviceWhitelistTag);

  for (const { name, repo } of services) {
    if (!repo) continue;
    try {
      await statusService(name);
    } catch (e) {
      printError(e);
    }
    if (name !== last(services)?.name) console.log();
  }
};
