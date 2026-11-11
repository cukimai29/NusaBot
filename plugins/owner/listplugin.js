const fs = require('fs');
const path = require('path');

const pluginConfig = {
    name: 'listplugin',
    alias: ['plugins', 'daftarplugin', 'lp'],
    category: 'owner',
    description: 'Melihat daftar semua plugin yang terinstall',
    usage: '.listplugin [--detail]',
    example: '.listplugin\n.listplugin --detail',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

// Folder kategori yang dikenal
const CATEGORY_FOLDERS = {
    'ai': '🤖', 'anime': '🎀', 'convert': '🔄', 'download': '📥',
    'fun': '🎮', 'game': '🎯', 'group': '👥', 'information': 'ℹ️',
    'internet': '🌐', 'isi ulang': '🔄', 'jadibot': '🤖', 'main': '🏠',
    'maker': '🛠️', 'menu': '📋', 'nsfw': '🔞', 'owner': '👑',
    'premium': '💎', 'random': '🎲', 'search': '🔍', 'sound': '🎵',
    'sticker': '🖼️', 'store': '🏪', 'tools': '⚙️', 'vote': '🗳️'
};

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function scanPlugins(dir = './plugins') {
    const results = {};
    const errors = [];

    function readDir(dirPath, category = 'root') {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Folder kategori
                const folderName = item;
                readDir(fullPath, folderName);
            } else if (item.endsWith('.js') || item.endsWith('.mjs') || item.endsWith('.cjs')) {
                // File plugin
                try {
                    const pluginPath = fullPath;
                    const relativePath = path.relative(dir, fullPath);
                    const fileStat = fs.statSync(pluginPath);
                    
                    // Clear cache biar dapet fresh
                    delete require.cache[require.resolve(pluginPath)];
                    const plugin = require(pluginPath);
                    
                    // Cek valid plugin
                    const isValid = plugin.config && typeof plugin.handler === 'function';
                    const pluginName = plugin.config?.name || path.basename(item, '.js');
                    const category = plugin.config?.category || category;
                    const isEnabled = plugin.config?.isEnabled !== false;
                    const aliases = plugin.config?.alias || [];
                    
                    if (!results[category]) {
                        results[category] = [];
                    }
                    
                    results[category].push({
                        name: pluginName,
                        file: item,
                        path: relativePath,
                        isValid,
                        isEnabled,
                        aliases,
                        size: fileStat.size,
                        sizeFormatted: formatFileSize(fileStat.size),
                        description: plugin.config?.description || '-'
                    });
                    
                } catch (err) {
                    errors.push({
                        file: item,
                        path: relativePath,
                        error: err.message
                    });
                }
            }
        }
    }

    readDir(dir);
    return { results, errors };
}

async function handler(m, { args }) {
    const isDetail = args.includes('--detail') || args.includes('-d');
    
    m.react('🔍');
    await m.reply('📂 *Scanning plugins...*');

    const { results, errors } = scanPlugins();

    // Hitung total plugin valid
    let totalValid = 0;
    let totalInvalid = 0;
    for (const category in results) {
        for (const plugin of results[category]) {
            if (plugin.isValid) totalValid++;
            else totalInvalid++;
        }
    }

    let text = `╭━━〔 📦 *LIST PLUGIN* 〕━━⬣\n`;
    text += `┃\n`;
    text += `┃ 📊 *Statistik*\n`;
    text += `┃ ├ ✅ Valid: ${totalValid}\n`;
    text += `┃ ├ ❌ Invalid: ${totalInvalid}\n`;
    text += `┃ ├ 📁 Kategori: ${Object.keys(results).length}\n`;
    text += `┃ └ 💀 Error: ${errors.length}\n`;
    text += `┃\n`;

    // Urutkan kategori
    const sortedCategories = Object.keys(results).sort();
    
    for (const category of sortedCategories) {
        const plugins = results[category];
        const validPlugins = plugins.filter(p => p.isValid);
        const invalidPlugins = plugins.filter(p => !p.isValid);
        
        if (validPlugins.length === 0 && invalidPlugins.length === 0) continue;
        
        const emoji = CATEGORY_FOLDERS[category] || '📁';
        text += `╭──〔 ${emoji} *${category.toUpperCase()}* 〕──⬣\n`;
        text += `┃ 📌 Total: ${plugins.length} plugin\n`;
        
        if (isDetail) {
            // Mode detail: tampilkan semua plugin dengan info lengkap
            for (const plugin of plugins) {
                const status = plugin.isEnabled ? '✅' : '❌';
                const valid = plugin.isValid ? '✅' : '❌';
                text += `┃\n`;
                text += `┃ ├─ ${status} *${plugin.name}*\n`;
                text += `┃ │  ├ 📄 File: ${plugin.file}\n`;
                text += `┃ │  ├ 📏 Size: ${plugin.sizeFormatted}\n`;
                text += `┃ │  ├ ✅ Valid: ${valid}\n`;
                if (plugin.aliases.length > 0) {
                    text += `┃ │  ├ 🔗 Alias: ${plugin.aliases.slice(0, 5).join(', ')}${plugin.aliases.length > 5 ? '...' : ''}\n`;
                }
                text += `┃ │  └ 📝 Desc: ${plugin.description.substring(0, 50)}${plugin.description.length > 50 ? '...' : ''}\n`;
            }
        } else {
            // Mode simple: hanya nama plugin
            const pluginNames = validPlugins.map(p => `${p.isEnabled ? '✅' : '❌'} ${p.name}`).join('\n┃    ');
            text += `┃ 📋 Daftar:\n`;
            text += `┃    ${pluginNames}\n`;
            
            if (invalidPlugins.length > 0) {
                text += `┃\n┃ ⚠️ *Invalid:* ${invalidPlugins.map(p => p.name).join(', ')}\n`;
            }
        }
        
        text += `╰────────────────⬣\n\n`;
    }

    // Tampilkan error jika ada
    if (errors.length > 0) {
        text += `╭━━〔 💀 *ERROR PLUGIN* 〕━━⬣\n`;
        for (const err of errors.slice(0, 5)) {
            text += `┃ 📄 ${err.file}\n`;
            text += `┃ └ ❌ ${err.error.substring(0, 60)}${err.error.length > 60 ? '...' : ''}\n`;
            text += `┃\n`;
        }
        if (errors.length > 5) {
            text += `┃ ... dan ${errors.length - 5} error lainnya\n`;
        }
        text += `╰────────────────⬣\n\n`;
    }

    text += `💡 *Tips:*\n`;
    text += `> \`${m.prefix}listplugin --detail\` untuk lihat detail\n`;
    text += `> \`${m.prefix}enableplugin <nama>\` untuk enable\n`;
    text += `> \`${m.prefix}disableplugin <nama>\` untuk disable`;
    
    m.react('✅');
    return m.reply(text);
}

module.exports = {
    config: pluginConfig,
    handler
};