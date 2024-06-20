import { spawn, execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VENV_PATH = path.join(__dirname, "..", "venv");
const IS_WINDOWS = os.platform() === 'win32';
const SCRIPTS_PATH = IS_WINDOWS ? path.join(VENV_PATH, "Scripts") : path.join(VENV_PATH, "bin");
const PIP_PATH = IS_WINDOWS ? path.join(SCRIPTS_PATH, "pip.exe") : path.join(SCRIPTS_PATH, "pip");
const PYTHON_PATH = IS_WINDOWS ? path.join(SCRIPTS_PATH, "python.exe") : path.join(SCRIPTS_PATH, "python");
const ACTIVATE_PATH = IS_WINDOWS ? path.join(SCRIPTS_PATH, "activate.bat") : path.join(SCRIPTS_PATH, "activate");
const DEACTIVATE_PATH = IS_WINDOWS ? path.join(SCRIPTS_PATH, "deactivate.bat") : path.join(SCRIPTS_PATH, "deactivate");

/**
 * Executes a command using child_process.spawn and returns a promise that resolves with stdout and stderr.
 * @param {string} filePath - The path to the executable file.
 * @param {string[]} args - Array of arguments to pass to the executable.
 * @returns {Promise<{stdout: string, stderr: string}>} - A promise resolving to stdout and stderr.
 */
export function S(filePath, args) {
  return new Promise(function (resolve, reject) {
    let stdout = "";
    let stderr = "";

    const child = spawn(filePath, args);

    child.stdout.on("data", function (data) {
      stdout += data.toString();
    });

    child.stderr.on("data", function (data) {
      stderr += data.toString();
    });

    child.on("error", function (err) {
      reject(err);
    });

    child.on('exit', function (code, signal) {
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Executes a command using child_process.execFile and returns a promise that resolves with stdout and stderr.
 * @param {string} filePath - The path to the executable file.
 * @param {string[]} args - Array of arguments to pass to the executable.
 * @returns {Promise<{stdout: string, stderr: string}>} - A promise resolving to stdout and stderr.
 */
export function E(filePath, args) {
  return new Promise(function (resolve, reject) {
    execFile(filePath, args, function (err, stdout, stderr) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Sets up a Python virtual environment (venv) if it doesn't exist.
 * @param {boolean} force - If true, force recreation of the virtual environment.
 * @returns {Promise<void>}
 */
export async function venv(force) {
  // Clear venv directory if force is true and venv exists
  if (force && fs.existsSync(VENV_PATH)) {
    fs.rmSync(VENV_PATH, { force: true, recursive: true });
  }

  // Create venv directory if it doesn't exist
  if (!fs.existsSync(VENV_PATH)) {
    fs.mkdirSync(VENV_PATH);

    // Create venv
    await S("python", ["-m", "venv", VENV_PATH]);
  }
}

/**
 * Checks if a Python module is installed in the virtual environment.
 * @param {string} moduleName - The name of the Python module to check.
 * @returns {Promise<boolean>} - A promise resolving to true if the module is installed, false otherwise.
 */
export async function isInstalled(moduleName) {
  try {
    const { stdout } = await S(PIP_PATH, ["show", moduleName]);
    return stdout.includes("Name: " + moduleName);
  } catch (error) {
    return false;
  }
}

/**
 * Installs a Python module into the virtual environment.
 * @param {string} modulePath - The name or path of the Python module to install.
 * @param {string[]} args - Additional arguments to pass to pip.
 * @returns {Promise<void>}
 */
export async function install(modulePath, args) {
  // Check if venv, Scripts directory, and pip exist
  if (!fs.existsSync(VENV_PATH)) {
    throw new Error(`${VENV_PATH} does not exist.`);
  }
  if (!fs.existsSync(SCRIPTS_PATH)) {
    throw new Error(`${SCRIPTS_PATH} does not exist.`);
  }
  if (!fs.existsSync(PIP_PATH)) {
    throw new Error(`${PIP_PATH} does not exist.`);
  }

  // Check if module is installed
  if (await isInstalled(modulePath)) {
    // console.log(`${modulePath} is already installed.`);
    return;
  }

  // Install module into venv using pip
  const { stdout, stderr } = await S(PIP_PATH, ["install", modulePath].concat(args || []));
  if (stderr) {
    throw new Error(stderr);
  }
  console.log(stdout);
}

/**
 * Executes a Python script using the virtual environment's Python interpreter.
 * @param {string} scriptPath - The path to the Python script.
 * @param {string[]} args - Array of arguments to pass to the Python script.
 * @returns {Promise<{stdout: string, stderr: string}>} - A promise resolving to stdout and stderr.
 */
export async function execute(scriptPath, args) {
  // Use venv's Python interpreter if available, otherwise default Python
  if (fs.existsSync(PYTHON_PATH)) {
    return await S(PYTHON_PATH, [scriptPath].concat(args || []));
  } else {
    return await S("python", [scriptPath].concat(args || []));
  }
}