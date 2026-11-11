// ==============================================================
// ☠️ PLUGIN .getpptt - GET TIKTOK PROFILE PICTURE
// AMBIL FOTO PROFIL TIKTOK ASLI DARI USERNAME
// ==============================================================

const axios = require('axios');
const cheerio = require('cheerio');

// ==============================================================
// 📦 PLUGIN CONFIG
// ==============================================================
const config = {
    name: 'getpptt',
    alias: ['pptt', 'tiktokpp', 'getpp', 'profilepicture'],
    category: 'tools',
    description: '📸 Ambil foto profil TikTok asli dari username',
    usage: '.getpptt [username]',
    example: '.getpptt rndzx.sfs',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
};

// ==============================================================
// 🔧 FUNGSI UTAMA
// ==============================================================

/**
 * Ambil foto profil TikTok dari username
 * @param {string} username - Username TikTok tanpa @
 * @returns {Promise<{success: boolean, avatar: string, name: string, bio: string, stats: object}>}
 */
async function getTikTokProfile(username) {
    try {
        // Bersihkan username
        const cleanUsername = username.replace('@', '').trim();
        
        // Gunakan API TikTok untuk ambil data profil
        const apiUrl = `https://www.tikwm.com/api/user?unique_id=${cleanUsername}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
            },
            timeout: 10000
        });

        if (!response.data || !response.data.data) {
            throw new Error('User tidak ditemukan');
        }

        const data = response.data.data;
        const user = data.user || {};

        // Ambil foto profil (HD jika ada)
        let avatar = user.avatar || user.avatar_thumb || user.avatar_medium || '';
        // Ubah ke resolusi tinggi
        if (avatar && avatar.includes('webp')) {
            avatar = avatar.replace('webp', 'jpeg');
        }
        // Gunakan avatar HD
        const avatarHd = avatar.replace(/\/\d+x\d+\//, '/1080x1080/');

        return {
            success: true,
            avatar: avatarHd || avatar,
            avatar_thumb: user.avatar_thumb || avatar,
            name: user.nickname || user.unique_id || 'Unknown',
            username: user.unique_id || cleanUsername,
            bio: user.signature || user.bio || '',
            stats: {
                following: user.following_count || 0,
                followers: user.follower_count || 0,
                likes: user.heart_count || 0,
                videos: user.video_count || 0
            },
            verified: user.verified || false,
            private: user.private_account || false
        };

    } catch (error) {
        console.error('[GETPPTT] Error:', error.message);
        return {
            success: false,
            error: error.message || 'Gagal mengambil data'
        };
    }
}

// ==============================================================
// 🧠 HANDLER
// ==============================================================
async function handler(m, { sock, args }) {
    try {
        // Ambil username dari argumen
        const username = args.join(' ').trim().replace('@', '');
        
        if (!username) {
            await sock.sendMessage(m.key.remoteJid, {
                text: `📸 *GET TIKTOK PROFILE PICTURE*\n\n📌 *Usage:* .getpptt [username]\n📌 *Example:* .getpptt rndzx.sfs\n\n⚠️ *Tanpa @* — langsung username`
            }, { quoted: m });
            return;
        }

        // Kirim loading
        await sock.sendMessage(m.key.remoteJid, {
            text: `⏳ Mengambil foto profil @${username}...`
        }, { quoted: m });

        // Ambil data
        const result = await getTikTokProfile(username);

        if (!result.success) {
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *GAGAL MENGAMBIL FOTO PROFIL*\n\n⚠️ Username *@${username}* tidak ditemukan atau akun private.\n\n📌 Pastikan username benar.`
            }, { quoted: m });
            return;
        }

        // Siapkan caption
        const caption = `
📸 *TIKTOK PROFILE PICTURE*

━━━━━━━━━━━━━━━━━━━━
👤 *Nama:* ${result.name}
🔗 *Username:* @${result.username}
📝 *Bio:* ${result.bio || '-'}
━━━━━━━━━━━━━━━━━━━━
📊 *STATS:*
👥 Followers: ${result.stats.followers.toLocaleString()}
👣 Following: ${result.stats.following.toLocaleString()}
❤️ Likes: ${result.stats.likes.toLocaleString()}
🎬 Videos: ${result.stats.videos.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
${result.verified ? '✅ *Akun Terverifikasi*' : ''}
${result.private ? '🔒 *Akun Privat*' : ''}
━━━━━━━━━━━━━━━━━━━━
💀 *RHENDZ PROJECT*
        `;

        // Kirim foto profil
        await sock.sendMessage(m.key.remoteJid, {
            image: { url: result.avatar },
            caption: caption
        }, { quoted: m });

        // Kirim log sukses
        console.log(`[GETPPTT] ✅ Berhasil mengambil PP @${result.username}`);

    } catch (error) {
        console.error('[GETPPTT] Handler error:', error);
        await sock.sendMessage(m.key.remoteJid, {
            text: `❌ *Terjadi error:* ${error.message || 'Unknown'}`
        }, { quoted: m });
    }
}

// ==============================================================
// 📦 EXPORT
// ==============================================================
module.exports = {
    config,
    handler
};