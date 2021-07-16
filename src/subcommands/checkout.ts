import { last } from 'lodash';

import * as git from '../utils/git';
import { readServices } from '../utils/config';
import { CWD } from '../utils/files';
import { log } from '../utils/log';
import { printError } from '../utils/errors';

export const checkoutService = async (name: string, branch: string) => {
  const repoDir = `${CWD}/${name}`;
  log`Checking out branch {bold ${branch}} for {bold ${name}}`;
  await git.checkout(repoDir, branch);
};

export const checkoutServices = async (
  branch: string,
  serviceWhitelist?: string[],
  serviceWhitelistTag?: string | undefined,
) => {
  const services = await readServices(serviceWhitelist, serviceWhitelistTag);

  for (const { name, repo } of services) {
    if (!repo) continue;
    try {
      await checkoutService(name, branch);
    } catch (e) {
      printError(e);
    }
    if (name !== last(services)?.name) console.log();
  }
};
