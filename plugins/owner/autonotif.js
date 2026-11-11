const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'autonotif',
    alias: ['notifplugin', 'infoplugin', 'autodelnotif'],
    category: 'owner',
    description: 'Atur notifikasi otomatis per event (add/ganti/del)',
    usage: '.autonotif <event> <on/off> atau .autonotif all <on/off>',
    example: '.autonotif add on\n.autonotif all off',
    isOwner: true,
    cooldown: 3,
    isEnabled: true
};

// Events yang tersedia
const EVENTS = {
    ADD: 'addplugin',
    UPDATE: 'gantiplugin', 
    DELETE: 'delplugin'
};

// Default settings
const DEFAULT_SETTINGS = {
    [EVENTS.ADD]: true,
    [EVENTS.UPDATE]: true,
    [EVENTS.DELETE]: true
};

function getNotifSettings(db) {
    const saved = db.setting('autoNotifPluginEvents');
    if (!saved || typeof saved !== 'object') {
        return { ...DEFAULT_SETTINGS };
    }
    return {
        [EVENTS.ADD]: saved[EVENTS.ADD] !== undefined ? saved[EVENTS.ADD] : DEFAULT_SETTINGS[EVENTS.ADD],
        [EVENTS.UPDATE]: saved[EVENTS.UPDATE] !== undefined ? saved[EVENTS.UPDATE] : DEFAULT_SETTINGS[EVENTS.UPDATE],
        [EVENTS.DELETE]: saved[EVENTS.DELETE] !== undefined ? saved[EVENTS.DELETE] : DEFAULT_SETTINGS[EVENTS.DELETE]
    };
}

function saveNotifSettings(db, settings) {
    db.setting('autoNotifPluginEvents', settings);
}

function getEventDisplayName(event) {
    const names = {
        [EVENTS.ADD]: '📥 *ADD PLUGIN*',
        [EVENTS.UPDATE]: '🔄 *GANTI PLUGIN*',
        [EVENTS.DELETE]: '🗑️ *DEL PLUGIN*'
    };
    return names[event] || event;
}

function getEventEmoji(event) {
    const emojis = {
        [EVENTS.ADD]: '📥',
        [EVENTS.UPDATE]: '🔄',
        [EVENTS.DELETE]: '🗑️'
    };
    return emojis[event] || '🔔';
}

async function handler(m, { db }) {
    const args = m.args || [];
    const event = args[0]?.toLowerCase();
    const state = args[1]?.toLowerCase();
    
    // Help / list command
    if (!event || event === 'help' || event === 'list') {
        const settings = getNotifSettings(db);
        
        let statusText = '';
        for (const [ev, isActive] of Object.entries(settings)) {
            const status = isActive ? '✅ AKTIF' : '❌ NONAKTIF';
            const emoji = getEventEmoji(ev);
            statusText += `┃ ${emoji} \`${ev}\`: ${status}\n`;
        }
        
        return m.reply(
            `🔔 *ɴᴏᴛɪꜰɪᴋᴀꜱɪ ᴘʟᴜɢɪɴ - ᴘᴇʀ ᴇᴠᴇɴᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ꜱᴛᴀᴛᴜꜱ* 」\n` +
            statusText +
            `╰┈┈⬡\n\n` +
            `📌 *Cara Penggunaan:*\n` +
            `│\n` +
            `├─ 🔹 *Atur satu event:*\n` +
            `│  \`${m.prefix}autonotif add on\`\n` +
            `│  \`${m.prefix}autonotif add off\`\n` +
            `│\n` +
            `├─ 🔸 *Atur semua event:*\n` +
            `│  \`${m.prefix}autonotif all on\`\n` +
            `│  \`${m.prefix}autonotif all off\`\n` +
            `│\n` +
            `└─ 📋 *Lihat status:*\n` +
            `   \`${m.prefix}autonotif\` atau \`${m.prefix}autonotif list\`\n\n` +
            `💡 *Event yang tersedia:* addplugin, gantiplugin, delplugin`
        );
    }
    
    // ALL events
    if (event === 'all') {
        if (!state || !['on', 'off'].includes(state)) {
            return m.reply(
                `❌ *Penggunaan salah!*\n\n` +
                `> \`${m.prefix}autonotif all on\` - Aktifkan SEMUA notif\n` +
                `> \`${m.prefix}autonotif all off\` - Matikan SEMUA notif`
            );
        }
        
        const isActive = state === 'on';
        const settings = getNotifSettings(db);
        
        settings[EVENTS.ADD] = isActive;
        settings[EVENTS.UPDATE] = isActive;
        settings[EVENTS.DELETE] = isActive;
        
        saveNotifSettings(db, settings);
        m.react(isActive ? '✅' : '❌');
        
        const statusText = isActive ? 'DI AKTIFKAN' : 'DI MATIKAN';
        return m.reply(
            `${isActive ? '✅' : '❌'} *SEMUA NOTIFIKASI ${statusText}*\n\n` +
            `> 📥 Add Plugin: ${isActive ? '✅ AKTIF' : '❌ NONAKTIF'}\n` +
            `> 🔄 Ganti Plugin: ${isActive ? '✅ AKTIF' : '❌ NONAKTIF'}\n` +
            `> 🗑️ Del Plugin: ${isActive ? '✅ AKTIF' : '❌ NONAKTIF'}`
        );
    }
    
    // Single event
    let targetEvent = null;
    if (event === 'add' || event === 'addplugin') targetEvent = EVENTS.ADD;
    else if (event === 'ganti' || event === 'gantiplugin' || event === 'update') targetEvent = EVENTS.UPDATE;
    else if (event === 'del' || event === 'delplugin' || event === 'delete') targetEvent = EVENTS.DELETE;
    
    if (!targetEvent) {
        return m.reply(
            `❌ *Event tidak dikenal!*\n\n` +
            `> Event yang tersedia:\n` +
            `> • \`add\` / \`addplugin\`\n` +
            `> • \`ganti\` / \`gantiplugin\` / \`update\`\n` +
            `> • \`del\` / \`delplugin\` / \`delete\`\n` +
            `> • \`all\` (untuk semua event)\n\n` +
            `📌 Contoh: \`${m.prefix}autonotif add on\``
        );
    }
    
    if (!state || !['on', 'off'].includes(state)) {
        const currentSettings = getNotifSettings(db);
        const currentStatus = currentSettings[targetEvent] ? '✅ AKTIF' : '❌ NONAKTIF';
        return m.reply(
            `❌ *Penggunaan salah!*\n\n` +
            `> Event: \`${targetEvent}\`\n` +
            `> Status saat ini: ${currentStatus}\n\n` +
            `📌 Cara pakai:\n` +
            `> \`${m.prefix}autonotif ${event} on\` - Aktifkan\n` +
            `> \`${m.prefix}autonotif ${event} off\` - Matikan`
        );
    }
    
    const isActive = state === 'on';
    const settings = getNotifSettings(db);
    settings[targetEvent] = isActive;
    saveNotifSettings(db, settings);
    
    m.react(isActive ? '✅' : '❌');
    
    const eventDisplay = getEventDisplayName(targetEvent);
    const statusText = isActive ? '✅ *AKTIF*' : '❌ *NONAKTIF*';
    
    // Tampilkan status semua event setelah perubahan
    return m.reply(
        `🔔 *ɴᴏᴛɪꜰɪᴋᴀꜱɪ ᴘʟᴜɢɪɴ*\n\n` +
        `┌─〔 ✨ *ᴇᴠᴇɴᴛ ᴅɪᴜʙᴀʜ* 〕\n` +
        `│  ${eventDisplay}\n` +
        `│  └─ ${statusText}\n` +
        `└────────────────⬣\n\n` +
        `📋 *ꜱᴛᴀᴛᴜꜱ ᴛᴇʀᴋɪɴɪ:*\n` +
        `│\n` +
        `├─ 📥 Add Plugin    : ${settings[EVENTS.ADD] ? '✅' : '❌'}\n` +
        `├─ 🔄 Ganti Plugin  : ${settings[EVENTS.UPDATE] ? '✅' : '❌'}\n` +
        `└─ 🗑️ Del Plugin    : ${settings[EVENTS.DELETE] ? '✅' : '❌'}`
    );
}

// Fungsi helper untuk cek apakah notifikasi untuk event tertentu aktif
function isNotifActive(db, eventType) {
    const settings = getNotifSettings(db);
    return settings[eventType] === true;
}

module.exports = {
    config: pluginConfig,
    handler,
    // Export helper functions untuk digunakan di plugin lain
    isNotifActive,
    EVENTS,
    getNotifSettings
};