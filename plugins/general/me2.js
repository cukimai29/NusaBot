const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo');
const { getDatabase } = require('../../src/lib/database');
const { createCanvas, loadImage } = require('canvas');

const pluginConfig = {
    name: 'me2',
    primaryName: 'me2',
    command: 'me2',
    alias: ['profile2', 'myprofile2'],
    category: 'general',
    description: 'Menampilkan kartu profil RPG modern dengan posisi teks presisi di dalam kotak template',
    usage: '.me2',
    example: '.me2',
    cooldown: 5,
    isEnabled: true
};

function formatNumber(num) {
    if (num === -1) return '∞ Unlimited';
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fungsi generator gambar dengan koordinat presisi sesuai garis panah template
async function createProfileCard(user, pushName, avatarUrl) {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Muat template latar belakang
    const templateBgUrl = "https://cdn.phototourl.com/member/2026-07-29-d6cb42c4-591d-4df5-9ee3-cfc88dd98d36.png";
    try {
        const bgImage = await loadImage(templateBgUrl);
        ctx.drawImage(bgImage, 0, 0, width, height);
    } catch (err) {
        ctx.fillStyle = '#0b000f';
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Potong Foto Profil melingkar tepat di lubang bulat template sebelah kiri
    const avatarX = 160;
    const avatarY = 170;
    const avatarSize = 280;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    try {
        const avatarImage = await loadImage(avatarUrl);
        ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    } catch (err) {
        ctx.fillStyle = '#222222';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // 3. Render Teks agar masuk rapi di dalam kotak panah hijau template
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffb3d1'; // Warna pink lembut agar kontras dan sangat jelas di dalam kotak

    const displayName = pushName.length > 15 ? pushName.substring(0, 13) + '..' : pushName;
    
    // Posisi X dan Y diatur persis di dalam kotak garis kanan
    ctx.fillText(displayName, 395, 335);       // Kotak Name
    ctx.fillText(`Level ${user.level || 1}`, 395, 475); // Kotak Level
    ctx.fillText(user.role || 'Warrior', 395, 615);       // Kotak Role
    ctx.fillText(user.status || 'Active & Ready', 395, 755); // Kotak Status

    return canvas.toBuffer();
}

async function handler(m, { sock }) {
    const db = getDatabase();
    const chatId = m.chat;
    const targetJid = m.sender;

    // Ambil data user real-time asli dari database
    const user = db.getUser(targetJid) || db.setUser(targetJid);
    const pushName = m.pushName || 'Darling';

    // Ambil foto profil WhatsApp asli user
    let avatarUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
    try {
        avatarUrl = await sock.profilePictureUrl(targetJid, 'image');
    } catch (e) {}

    m.react('🖼️');
    await sock.sendPresenceUpdate('composing', chatId);

    let imageBuffer;
    try {
        imageBuffer = await createProfileCard(user, pushName, avatarUrl);
    } catch (err) {
        imageBuffer = null;
    }

    let mediaAttachment = null;
    if (imageBuffer) {
        try {
            mediaAttachment = await prepareWAMessageMedia(
                { image: imageBuffer },
                { upload: sock.waUploadToServer }
            );
        } catch (e) {}
    }

    const roleVal = user.role || 'Warrior';
    const levelVal = user.level || 1;
    const expVal = formatNumber(user.exp || 28000);
    const koinVal = formatNumber(user.coin || user.money || 0);
    const bankVal = formatNumber(user.bank || 0);
    const energiVal = formatNumber(user.energi ?? 100);
    const statusVal = user.status || 'Active & Ready';

    // Format Teks Sesuai Permintaan
    const pesanTeks = 
`╭━━━━━━━━━━━━╮
┃ 👤 *ᴜsᴇʀ ᴘʀᴏꜰɪʟᴇ*  ┃
╰━━━━━━━━━━━━╯

🏷️ Name: ${pushName}
🆔 Tag: @${targetJid.split('@')[0]}
👑 Status: ${statusVal}

╭┈┈⬡「 USER PROFILE 」
┃ 🛡️ Role: **${roleVal}**
┃ 📊 Level: **${levelVal}**
┃ 🚄 Exp: **${expVal}**
┃ ▱▱▱▱▱▱▱▱▱▱
┃
┃ ❤️ Health: *100 / 100*
┃ 💧 Mana: *100 / 100*
┃ ⚡ Stamina: *100 / 100*
╰┈┈┈┈┈┈┈┈⬡

╭┈┈⬡「 💰 *ᴀssᴇᴛs* 」
┃ 🪙 Koin: **Rp ${koinVal}**
┃ 🏦 Bank: **Rp ${bankVal}**
┃ ⚡ Energi: **${energiVal}**
╰┈┈┈┈┈┈┈┈⬡`;

    const interactiveMsg = generateWAMessageFromContent(chatId, {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: '',
                hasMediaAttachment: !!mediaAttachment,
                ...(mediaAttachment || {})
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: pesanTeks
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: ''
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📋 Menu',
                            id: '.menu'
                        })
                    }
                ]
            }),
            contextInfo: {
                mentionedJid: [targetJid]
            }
        })
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(chatId, interactiveMsg.message, { messageId: interactiveMsg.key.id });
}

async function answerHandler(m, sock) {
    return false;
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};