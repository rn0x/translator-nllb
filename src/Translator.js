'use strict';

import { venv, install, execute } from "./venv.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_PATH = path.join(__dirname, "..", "src", "main.py");

const MODELS = [
  'facebook/nllb-200-distilled-600M',
  'facebook/nllb-200-distilled-1.3B',
  'facebook/nllb-200-1.3B',
  'facebook/nllb-200-3.3B',
];
const LANGS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "langs", "flores.json")));
const LANG_LIST = Object.keys(LANGS);

/**
 * Translator class for setting up and executing translations using NLLB models.
 */
class Translator {

  /**
   * Constructs a new Translator instance.
   */
  constructor() {
    /** @type {string[]} List of available models. */
    this.models = MODELS;

    /** @type {Object} Language mappings. */
    this.langs = LANGS;

    /** @type {string[]} List of supported languages. */
    this.langList = LANG_LIST;

    /** @type {boolean} Indicates if setup has been completed. */
    this.setupCompleted = false;
  }

  /**
   * Sets up the virtual environment and installs required packages.
   * @param {boolean} [force=false] - Force setup even if environment is already set up.
   * @returns {Promise<void>}
   */
  async setup(force = false) {
    if (this.setupCompleted && !force) {
      console.log("Setup already completed.");
      return;
    }

    try {
      await venv(force);
      const packages = ["transformers", "numpy<2", "torch", "torchvision", "torchaudio"];
      await Promise.all(packages.map(pkg => install(pkg)));
      this.setupCompleted = true;
    } catch (error) {
      console.error("Error during setup:", error);
      throw error;
    }
  }

  /**
   * Checks if a language code is valid.
   * @param {string} str - Language code to validate.
   * @returns {boolean} True if the language is valid, otherwise false.
   */
  isValidLanguage(str) {
    return this.langList.includes(str);
  }

  /**
   * Converts a language code to the required format.
   * @param {string} str - Language code to convert.
   * @returns {string} Converted language code.
   */
  convertLanguage(str) {
    return this.langs[str];
  }

  /**
   * Checks if a model index is valid.
   * @param {number} i - Model index to validate.
   * @returns {boolean} True if the model index is valid, otherwise false.
   */
  isValidModelIndex(i) {
    return !!this.models[i || 0];
  }

  /**
   * Executes translation using the specified model and language.
   * @param {string} text - Text to translate.
   * @param {string} to - Target language code.
   * @param {number} modelIndex - Model index to use.
   * @returns {Promise<string>} Translated text.
   */
  async exec(text, to, modelIndex) {
    try {
      if (!this.isValidLanguage(to)) {
        throw new Error(`${to} is an invalid language.`);
      }
      if (!this.isValidModelIndex(modelIndex)) {
        throw new Error(`${(modelIndex || 0)} is an invalid modelIndex.`);
      }

      const targetLanguage = this.convertLanguage(to);
      const model = this.models[modelIndex || 0];
      const { stdout, stderr } = await execute(MAIN_PATH, [model, text, targetLanguage]);

      if (stdout.includes("Downloading model") || stdout.includes("downloaded successfully.")) {
        console.log(stdout);
      }

      if (stdout === "" && stderr.length > 0) {
        throw new Error(stderr);
      }

      return stdout.trim();

    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }

  /**
  * Translates an array of texts concurrently with a callback function for each translation.
  * @param {string[]} texts - Array of texts to translate.
  * @param {string} to - Target language code.
  * @param {number} modelIndex - Model index to use.
  * @param {function} callback - Callback function to invoke with each translated text.
  */
  async translateArray(texts, to, modelIndex, callback) {
    try {
      await this.setup(false);

      // Concurrently execute translations
      for (const text of texts) {
        try {
          const result = await this.exec(text, to, modelIndex);
          callback(null, result); // Invoke callback with each translated text
        } catch (error) {
          console.error(`Error translating "${text}":`, error);
          callback(error); // Invoke callback with error if translation fails
        }
      }

    } catch (error) {
      console.error("Error during translation setup:", error);
      callback(error); // Invoke callback with error if setup fails
    }
  }
}

export default Translator;