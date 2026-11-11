✅ *ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴄᴏᴍᴍᴏɴᴊs*

```const axios = require('axios');
const config = require('../../config.js');
const { uploadTo0x0 } = require('../../src/lib/ourin-tmpfiles.js');
const te = require('../../src/lib/ourin-error.js');
const pluginConfig = {
  name: "fakeff",
  alias: ["fakefreefire"],
  category: "canvas",
  description: "Membuat gambar ff",
  usage: ".fakeff <text>",
  example: ".fakeff Hai cantik",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const nama = m.text;
  if (!nama) {
    return m.reply(`*FAKE FF*\n\n> Contoh: ${m.prefix}fakeff nama1`);
  }
  m.react("🕕");

  try {
    await sock.sendMedia(
      m.chat,
      `https://api.nexray.web.id/maker/fakelobyff?nickname=${encodeURIComponent(nama)}`,
      null,
      m,
      {
        type: "image",
      },
    );

    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}
module.exports = { config: pluginConfig, handler };
```