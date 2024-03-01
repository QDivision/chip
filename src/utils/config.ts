import fs from 'mz/fs';
import yaml from 'js-yaml';
import { readJsonFile, CHIP_PROCESSES_FILE } from './files';

export interface ChipConfig {
  setup?: string;
  install?: string;
  'setup-service'?: string;
  services?: {
    [name: string]:
      | {
          repo?: string;
          install?: string;
          run?: string;
          env?: { [envVar: string]: string };
          tags?: string[];
        }
      | undefined;
  };
}

export interface ChipSecrets {
  services?: {
    [envVar: string]: string;
  };
}

export const readConfig = async (): Promise<ChipConfig> => {
  const chipYml = await fs.readFile('./chip.yml', 'utf8');
  const chipConfig = (await yaml.safeLoad(chipYml)) as any;
  return chipConfig;
};

export const readSecrets = async (): Promise<ChipSecrets> => {
  try {
    const secretYml = await fs.readFile('./secretchip.yml', 'utf8');
    const secretConfig = (await yaml.safeLoad(secretYml)) as any;
    return secretConfig;
  } catch (e: NodeJS.ErrnoException) {
    if (e.code === 'ENOENT') return {};
    else throw e;
  }
};

export const readScripts = async () => {
  const config = await readConfig();
  return {
    setup: config.setup || '',
    install: config.install || '',
    setupService: config['setup-service'] || '',
  };
};

export const readServices = async (
  whitelist: string[] = [],
): Promise<
  {
    name: string;
    repo?: string;
    install?: string;
    run?: string;
    env: { [envVar: string]: string };
    secrets: { [name: string]: string };
    tags?: string[];
  }[]
> => {
  const config = await readConfig();
  const secrets = await readSecrets();

  const allServices = Object.entries(config.services ?? {}).map(
    ([name, values]) => ({
      ...values,
      name,
      env: values?.env ?? {},
      secrets: secrets.services?.[name] ?? {},
    }),
  );

  return whitelist.length > 0
    ? [
        ...new Set([
          ...allServices.filter((service) => whitelist.includes(service.name)),
          ...allServices.filter((service) =>
            service.tags?.some((tag) => whitelist.includes(tag)),
          ),
        ]),
      ]
    : allServices;
};

/**
 * All versions of chip since v1.2.1 should include `startTime` in these
 * records. However, older versions of chip did not. Hence why `startTime` is
 * optional.
 */
export interface ProcessRecord {
  pid: number;

  /** When the process was started (as a unix timestamp in milliseconds) */
  startTime?: number;

  /** Listening TCP ports **/
  ports?: string[];
}

export interface Processes {
  [projectName: string]:
    | { [serviceName: string]: ProcessRecord | undefined }
    | undefined;
}

export const readProcesses = async (): Promise<Processes> =>
  readJsonFile(CHIP_PROCESSES_FILE);
