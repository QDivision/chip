import yargs from 'yargs';

import { initChip, assertSubdirs } from './utils/init';
import { handleErrors } from './utils/errors';

import { syncServices } from './subcommands/sync';
import { installServices } from './subcommands/install';
import { startServices } from './subcommands/start';
import { stopServices } from './subcommands/stop';
import { restartServices } from './subcommands/restart';
import { listServices } from './subcommands/list';
import { logServices } from './subcommands/logs';
import { checkoutServices } from './subcommands/checkout';
import { statusServices } from './subcommands/status';
import { cleanNames } from './utils/strings';

yargs
  .command<{ services: string[]; tag: string }>(
    'sync [services..]',
    'Clone or pull repos for services in project',
    (yargs) => yargs.positional('services', { describe: 'service names' }),
    handleErrors(async ({ services, tag }) => {
      await initChip();
      await syncServices(cleanNames(services), tag);
    }),
  )
  .command<{ branch: string; services: string[]; tag: string }>(
    'checkout <branch> [services..]',
    'Checkout a git branch for services in project',
    (yargs) =>
      yargs
        .positional('branch', { describe: 'git branch name' })
        .positional('services', { describe: 'service names' }),
    handleErrors(async ({ branch, services, tag }) => {
      await initChip();
      await assertSubdirs();
      await checkoutServices(branch, cleanNames(services), tag);
    }),
  )
  .command<{ services: string[]; tag: string }>(
    'status [services..]',
    'Show git status for services in project',
    (yargs) => yargs.positional('services', { describe: 'service names' }),
    handleErrors(async ({ services, tag }) => {
      await initChip();
      await assertSubdirs();
      await statusServices(cleanNames(services), tag);
    }),
  )
  .command<{ services: string[]; tag: string }>(
    'install [services..]',
    'Install dependencies for services in project',
    (yargs) => yargs.positional('services', { describe: 'service names' }),
    handleErrors(async ({ services, tag }) => {
      await initChip();
      await assertSubdirs();
      await installServices(cleanNames(services), tag);
    }),
  )
  .command<{ services: string[]; tag: string }>(
    'start [services..]',
    'Start services in project',
    (yargs) => yargs.positional('services', { describe: 'service names' }),
    handleErrors(async ({ services, tag }) => {
      await initChip();
      await assertSubdirs();
      await startServices(cleanNames(services), tag);
    }),
  )
  .command<{ services: string[]; remove: boolean, tag: string }>(
    'stop [services..]',
    'Stop services in project',
    (yargs) =>
      yargs.positional('services', { describe: 'service names' }).option('r', {
        alias: ['remove', 'rm'],
        type: 'boolean',
        describe:
          'Remove containers after stopping them. Only applies to docker-compose services. If you have a database service and want to clear/reset it, you could use this option.',
      }),
    handleErrors(async ({ services, remove = false, tag }) => {
      await initChip();
      await assertSubdirs();
      await stopServices(cleanNames(services), remove, tag);
    }),
  )
  .command<{ services: string[]; remove: boolean, tag: string }>(
    'restart [services..]',
    'Stop and restart services in project',
    (yargs) =>
      yargs.positional('services', { describe: 'service names' }).option('r', {
        alias: ['remove', 'rm'],
        type: 'boolean',
        describe:
          'Remove containers after stopping them. Only applies to docker-compose services. If you have a database service and want to clear/reset it, you could use this option.',
      }),
    handleErrors(async ({ services, remove = false, tag }) => {
      await initChip();
      await assertSubdirs();
      await restartServices(cleanNames(services), remove, tag);
    }),
  )
  .command<{ services: string[]; tag: string }>(
    'logs [services..]',
    'View logs for services in project',
    (yargs) => yargs.positional('services', { describe: 'service names' }),
    handleErrors(async ({ services, tag }) => {
      await initChip();
      await assertSubdirs();
      await logServices(cleanNames(services), tag);
    }),
  )
  .command(
    'list',
    'List all services in project',
    {},
    handleErrors(async () => {
      await initChip();
      await assertSubdirs();
      await listServices();
    }),
  )
  .option('t', {describe: 'Filter by tag instead of services list', alias: 'tag', type: 'string'})
  .help()
  .strict()
  .demandCommand().argv;
