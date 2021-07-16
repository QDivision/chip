import { last } from 'lodash';

import { readServices, readScripts } from '../utils/config';
import { exec } from '../utils/processes';
import { log } from '../utils/log';
import { printError } from '../utils/errors';

export const installService = async (
  name: string,
  install: string,
  secrets: { [name: string]: string },
) => {
  log`Installing dependencies for {bold ${name}}`;

  const { setup, setupService } = await readScripts();

  await exec(
    `
    ${setup}
    ${setupService}
    ${install}
    `,
    { cwd: name, live: true, env: { ...process.env, ...secrets } },
  );
};

export const installServices = async (serviceWhitelist?: string[], serviceWhitelistTag?: string | undefined) => {
  const services = await readServices(serviceWhitelist, serviceWhitelistTag);

  log`Executing {bold preinstall} script`;
  const scripts = await readScripts();

  await exec(
    `
    ${scripts.setup}
    ${scripts.install}
    `,
    { cwd: '.', live: true },
  );

  for (const { name, install, secrets } of services) {
    if (!install) continue;
    try {
      await installService(name, install, secrets);
    } catch (e) {
      printError(e);
    }
    if (name !== last(services)?.name) console.log();
  }
};
