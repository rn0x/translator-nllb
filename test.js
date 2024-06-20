import Translator from './src/Translator.js';

const translator = new Translator();
await translator.setup(false);


try {
  /**
   * ITEM MODELS NLLB
    0: 'facebook/nllb-200-distilled-600M',
    1: 'facebook/nllb-200-distilled-1.3B',
    2: 'facebook/nllb-200-1.3B',
    3: 'facebook/nllb-200-3.3B',
   */
  const text = 'ロックヒッド・マーティン社は,米海兵隊に初回5Gテストベッドを配達し,モバイルネットワーク実験を開始した.';
  const to = 'ara'; // "kor_Hang", "kor", "eng_Latn", "eng", "ara", "fra"
  const model = 0;
  const result = await translator.exec(text, to, model);
  console.log(result);
} catch (error) {
  console.error(error);
}