const pluginConfig = {
    name: 'cband',
    alias: ['cekno'],
    category: 'tools',
    description: 'Cek apakah nomor WhatsApp terdaftar.',
    usage: '.cband 628123456789',
    example: '.cband 628123456789',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, text, args }) {
    const input =
        text ||
        (Array.isArray(args) ? args.join(' ') : '') ||
        m.text ||
        '';

    if (!input.trim()) {
        return m.reply('📌 Masukkan nomor target.\n\nContoh:\n.cband 628123456789');
    }

    const number = input.replace(/\D/g, '');

    if (number.length < 8) {
        return m.reply('❌ Nomor tidak valid.');
    }

    const jid = `${number}@s.whatsapp.net`;

    try {
        const result = await sock.onWhatsApp(jid);

        if (result && result.length > 0) {
            return m.reply(
                `${number}\n\n 𝐧𝐨 𝐧𝐲𝐚 𝐥𝐮𝐦 𝐤𝐞𝐧𝐨𝐧 🤭 𝗻𝗶 𝗸𝗶𝗻𝗴`
            );
        } else {
            return m.reply(
                `${number}\n😈 𝐧𝐨 𝐧𝐲𝐚 𝐤𝐞𝐧𝐨𝐧 𝐤𝐢𝐧𝐠 😈 \n\n #𝐧𝐨𝐦𝐨𝐫 𝐬𝐚𝐦𝐩𝐚𝐡 \n #𝐦𝐞𝐫𝐞𝐧𝐝𝐚𝐡 𝐮𝐧𝐭𝐮𝐤 𝐦𝐞𝐫𝐨𝐤𝐞𝐭\n #𝐧𝐨 𝐧𝐲𝐚 𝐚𝐦𝐩𝐚𝐬 \n\n𝖈𝖊𝖐 𝖇𝖆𝖓 𝖇𝖞 𝖟𝖊𝖗𝖔 𝖙𝖜𝖔 𝖆𝖎 🤭`
            );
        }
    } catch (err) {
        return m.reply(`❌ Error:\n${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};