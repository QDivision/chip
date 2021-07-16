import { last } from 'lodash';

import * as git from '../utils/git';
import { readServices } from '../utils/config';
import { fileExists, CWD } from '../utils/files';
import { log } from '../utils/log';
import { printError } from '../utils/errors';

export const syncService = async (name: string, repo: string) => {
  const repoDir = `${CWD}/${name}`;
  if (await fileExists(repoDir)) {
    const branch = await git.activeBranch(repoDir);
    log`Pulling {bold ${name}} on branch {bold ${branch}}`;
    await git.safePull(repoDir);
  } else {
    log`Cloning {bold ${name}}`;
    await git.clone(CWD, repo, name);
  }
};

export const syncServices = async (serviceWhitelist?: string[], serviceWhitelistTag?: string | undefined) => {
  const services = await readServices(serviceWhitelist, serviceWhitelistTag);

  for (const { name, repo } of services) {
    if (!repo) continue;
    try {
      await syncService(name, repo);
    } catch (e) {
      printError(e);
    }
    if (name !== last(services)?.name) console.log();
  }
};
