'use strict';

import { venv, install, execute } from "./venv.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __root = path.resolve(process.cwd()); // project root directory (./)
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
 * كلاس المترجم لإعداد وتنفيذ الترجمة باستخدام نماذج NLLB.
 */
class Translator {

  constructor() {
    this.models = MODELS;
    this.langs = LANGS;
    this.langList = LANG_LIST;
    this.setupCompleted = false;
  }

  /**
   * إعداد البيئة الافتراضية وتثبيت الحزم المطلوبة.
   * @param {boolean} force - إعادة الإعداد بالقوة إذا كانت البيئة مثبتة بالفعل.
   * @returns {Promise<void>}
   */
  async setup(force = false) {
    if (this.setupCompleted && !force) {
      console.log("Setup already completed.");
      return;
    }

    try {
      // تأكد من إعداد البيئة الافتراضية
      await venv(force);

      // تثبيت الحزم إذا لم تكن مثبتة بالفعل
      const packages = ["transformers", "numpy", "torch", "torchvision", "torchaudio"];
      for (const pkg of packages) {
        await install(pkg);
      }

      // console.log("Setup completed successfully.");
      this.setupCompleted = true;
    } catch (error) {
      console.error("Error during setup:", error);
    }
  }

  /**
   * التحقق من صحة اللغة.
   * @param {string} str - كود اللغة للتحقق.
   * @returns {boolean} - إرجاع صحيح إذا كانت اللغة صالحة.
   */
  isValidLanguage(str) {
    return this.langList.indexOf(str) > -1;
  }

  /**
   * تحويل كود اللغة إلى التنسيق المطلوب.
   * @param {string} str - كود اللغة للتحويل.
   * @returns {string} - الكود المحول للغة.
   */
  convertLanguage(str) {
    return this.langs[str];
  }

  /**
   * التحقق من صحة مؤشر النموذج.
   * @param {number} i - مؤشر النموذج للتحقق.
   * @returns {boolean} - إرجاع صحيح إذا كان مؤشر النموذج صالح.
   */
  isValidModelIndex(i) {
    return !!this.models[i || 0];
  }

  /**
   * تنفيذ الترجمة باستخدام النموذج واللغة المحددين.
   * @param {string} text - النص للترجمة.
   * @param {string} to - كود اللغة المستهدفة.
   * @param {number} modelIndex - مؤشر النموذج للاستخدام.
   * @returns {Promise<string>} - النص المترجم.
   */
  async exec(text, to, modelIndex) {
    if (!this.isValidLanguage(to)) {
      throw new Error(`${to} is an invalid language.`);
    }
    if (!this.isValidModelIndex(modelIndex)) {
      throw new Error(`${(modelIndex || 0)} is an invalid modelIndex.`);
    }

    to = this.convertLanguage(to);

    const model = this.models[modelIndex || 0];
    const { stdout, stderr } = await execute(MAIN_PATH, [model, text, to]);

    if (stdout.includes("Downloading model") || stdout.includes("downloaded successfully.")) {
      console.log(stdout);
    }
    if (stdout === "" && stderr.length > 0) {
      throw new Error(stderr);
    }
    return stdout;
  }
}

export default Translator;