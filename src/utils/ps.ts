import fs from 'mz/fs';
import { exec } from './processes';
import { CHIP_PROCESSES_FILE, writeJsonFile, CHIP_LOGS_DIR } from './files';
import { readProcesses, ProcessRecord } from './config';

export const processExists = async (pid: number) => {
  try {
    await exec(`ps ${pid}`);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Returns the process start time as unix timestamp. Throws an error if no
 * process with the given `pid` exists
 */
export const lookupStartTime = async (pid: number) => {
  try {
    // Sample output: `Wed Sep  2 11:17:24 2020`
    const startDate = await exec(`ps -p ${pid} -o lstart=`);
    return new Date(startDate).getTime();
  } catch (e: Error) {
    if (e.message) {
      e.message = `Failed to get start start time for pid ${pid}: ${e.message}`;
    }
    throw e;
  }
};

export const persistPid = async (
  projectName: string,
  serviceName: string,
  pid: number,
) => {
  const startTime = await lookupStartTime(pid);
  const processes = await readProcesses();
  if (!processes[projectName]) processes[projectName] = {};
  processes[projectName]![serviceName] = { pid, startTime };
  await writeJsonFile(CHIP_PROCESSES_FILE, processes);
};

export const getAllProcesses = async (projectName: string) => {
  const processes = await readProcesses();
  if (!processes[projectName]) processes[projectName] = {};
  return processes[projectName];
};

export const getActiveProcesses = async (projectName: string) => {
  const activeProcesses: { [name: string]: ProcessRecord } = {};
  const processes = (await getAllProcesses(projectName)) || {};
  for (const [name, config] of Object.entries(processes)) {
    const { pid, startTime } = config!;
    if (
      (await processExists(pid)) &&
      ((startTime && (await lookupStartTime(pid)) === startTime) || !startTime)
    ) {
      activeProcesses[name] = config!;
    }
  }

  await Promise.all(
    Object.keys(activeProcesses).map(
      async (name) => (activeProcesses[name].ports = await getPorts(name)),
    ),
  );

  return activeProcesses;
};

export const createLogStream = async (
  projectName: string,
  serviceName: string,
) => {
  const dir = `${CHIP_LOGS_DIR}/${projectName}`;
  if (!(await fs.exists(dir))) await fs.mkdir(dir);
  return fs.open(`${dir}/${serviceName}.log`, 'w');
};

export const getPorts = async (serviceName: string) => {
  const ports = await exec(
    `lsof -nP -p $(pgrep -f ${serviceName} | tr '\n' ,) | grep LISTEN | awk '{split($9, a, ":"); print a[length(a)]}'`,
    { cwd: '.', live: false },
  );
  return ports.trim().split('\n');
};
