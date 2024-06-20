# translator-nllb

The "translator-nllb" project is an automated translation system utilizing NLLB (Natural Language Longtail Benchmark) models from Facebook for accurate and efficient language translation. The system leverages JavaScript for process management and environment setup, alongside Python for executing and loading complex educational models.

<div align="center">

<img align="center" src = "https://komarev.com/ghpvc/?username=rn0x-translator-nllb&label=REPOSITORY+VIEWS&style=for-the-badge" alt ="translator-nllb"> <br><br>

</div>

## Installation

Install the package from npm:

```bash
npm install translator-nllb
```

## Usage

```js
import Translator from 'translator-nllb';

(async function() {
  const translator = new Translator();
  await translator.setup(false);

  const text = 'ロックヒッド・マーティン社は,米海兵隊に初回5Gテストベッドを配達し,モバイルネットワーク実験を開始した.';
  const to = 'ara'; // Target language code "kor_Hang", "kor", "eng_Latn", "eng", "ara", "fra" .....
  const model = 0; // Model index
  // 0: 'facebook/nllb-200-distilled-600M' <= default
  // 1: 'facebook/nllb-200-distilled-1.3B'
  // 2: 'facebook/nllb-200-1.3B'
  // 3: 'facebook/nllb-200-3.3B'
  const result = await translator.exec(text, to, model);
  console.log(result);

  // Output example =>
  // ara: شركة "لوكهيد مارتين" ، بدأت أول تجربة لتقديم أسلحة تجريبية 5G للقوات البحرية الأمريكية ، وتجربة شبكة المحمول. 
  // eng: Lockheed Martin Corporation, the first 5G test beds to be delivered to the US Marine Corps, has started mobile network experimentation.
  // zho_Hans: 洛克希德·马丁公司向美海军陆战队发送了5G测试床,开始了移动网络实验.

})();
```

## Integration Examples

#### Integration with Express.js

You can integrate the translator into an Express.js server to handle translation requests via API endpoints.

```js
import express from 'express';
import Translator from 'translator-nllb';

const app = express();
const translator = new Translator();

// Middleware to setup translator
app.use(async (req, res, next) => {
  await translator.setup(false);
  next();
});

// Example route for translation
app.get('/translate', async (req, res) => {
  const { text, to, model } = req.query;

  try {
    const result = await translator.exec(text, to, model);
    res.json({ translatedText: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

#### Integration with Telegraf (Telegram Bot)

Use the translator within a Telegraf-powered Telegram bot to provide real-time translation of messages.

```js
import { Telegraf } from 'telegraf';
import Translator from 'translator-nllb';

const bot = new Telegraf('YOUR_TELEGRAM_BOT_TOKEN');
const translator = new Translator();

// Middleware to setup translator
bot.use(async (ctx, next) => {
  await translator.setup(false);
  ctx.translator = translator;
  next();
});

// Command to handle translation
bot.command('translate', async (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  const to = 'ara'; // Target language code
  const model = 0; // Model index

  try {
    const result = await ctx.translator.exec(text, to, model);
    ctx.reply(`Translated: ${result}`);
  } catch (err) {
    ctx.reply(`Translation failed: ${err.message}`);
  }
});

bot.launch();
```

#### Integration with WhatsApp using whatsapp-web.js

Integrate translator-nllb with whatsapp-web.js to automate translation tasks within WhatsApp.

```js
import { Client } from 'whatsapp-web.js';
import Translator from 'translator-nllb';

const client = new Client();
const translator = new Translator();

client.on('qr', (qr) => {
  console.log('QR Received:', qr);
});

client.on('ready', async () => {
  console.log('WhatsApp Client is ready!');

  // Example: send translated message
  const chatId = 'RECIPIENT_PHONE_NUMBER@c.us';
  const text = 'Hello';
  const to = 'fra'; // Target language code
  const model = 0; // Model index

  try {
    const result = await translator.exec(text, to, model);
    client.sendMessage(chatId, `Translated: ${result}`);
  } catch (err) {
    console.error('Translation error:', err);
  }
});

client.initialize();
```

### License

MIT License