const axios = require('axios');
const FormData = require('form-data');
const fetch = require('node-fetch');

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitamkan', 'hitam', 'tohitam'],
    category: 'ai',
    description: 'Ubah gambar ke skin tone lebih gelap',
    usage: '.toblack (reply gambar)',
    example: '.toblack',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
};

async function uploadToCatbox(buf) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('userhash', '');
    form.append('fileToUpload', buf, 'img.jpg');

    const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        timeout: 30000
    });

    if (!data || data.includes(' ')) throw new Error('Gagal upload');
    return data.trim();
}

async function uploadToLitterbox(buffer, filename) {
    try {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('time', '72h')
        form.append('fileToUpload', buffer, { filename })

        const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { 
            method: 'POST', 
            body: form,
            timeout: 30000
        })
        const url = await res.text()
        if (!url || !url.startsWith('http')) throw new Error('Invalid response')
        return { host: 'Litterbox', url: url.trim() }
    } catch (e) {
        throw e
    }
}

async function uploadToTmpFiles(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch('https://tmpfiles.org/api/v1/upload', { 
            method: 'POST', 
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        if (!url) throw new Error('No URL')
        return { host: 'TmpFiles', url }
    } catch (e) {
        throw e
    }
}

async function uploadToGofile(buffer, filename) {
    try {
        const serverRes = await fetch('https://api.gofile.io/servers', { timeout: 10000 })
        const serverData = await serverRes.json()
        const server = serverData?.data?.servers?.[0]?.name
        if (!server) throw new Error('No server')

        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch(`https://${server}.gofile.io/uploadFile`, { 
            method: 'POST', 
            body: form,
            timeout: 60000
        })
        const data = await res.json()
        const url = data?.data?.downloadPage
        if (!url) throw new Error('No URL')
        return { host: 'Gofile', url }
    } catch (e) {
        throw e
    }
}

async function uploadToTermai(buffer, filename) {
    try {
        const form = new FormData()
        form.append("file", buffer, { filename })

        const res = await axios.post(
            "https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: 30000
            }
        )

        const url = res?.data?.data?.url
        if (!res.data?.status || !url) throw new Error('No URL')
        return { host: 'Termai', url }
    } catch (e) {
        throw e
    }
}

async function uploadToTop4top(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, filename)

        const res = await axios.post(
            'https://www.top4top.io/index.php',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0'
                },
                timeout: 30000
            }
        )

        const html = res.data
        const match = html.match(/https?:\/\/[a-z]\.top4top\.io\/[^\s"']+/)
        if (!match) throw new Error('Parse failed')
        return { host: 'Top4Top', url: match[0] }
    } catch (e) {
        throw e
    }
}

async function uploadToImgBB(buffer, filename) {
    try {
        const form = new FormData()
        form.append('image', buffer.toString('base64'))

        const res = await fetch('https://api.imgbb.com/1/upload?key=2e2bcb7d6e18dc7c69e35fd50b6dfd84', {
            method: 'POST',
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.data?.url
        if (!url) throw new Error('No URL')
        return { host: 'ImgBB', url }
    } catch (e) {
        throw e
    }
}

async function uploadToTelegraph(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch('https://telegra.ph/upload', {
            method: 'POST',
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.[0]?.src
        if (!url) throw new Error('No URL')
        return { host: 'Telegraph', url: `https://telegra.ph${url}` }
    } catch (e) {
        throw e
    }
}

// 🔥 PAKE FILE.IO (ALTERNATIF)
async function uploadToFileIo(buffer, filename) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename })

        const res = await fetch('https://file.io/', {
            method: 'POST',
            body: form,
            timeout: 30000
        })
        const data = await res.json()
        const url = data?.link
        if (!url) throw new Error('No URL')
        return { host: 'File.io', url }
    } catch (e) {
        throw e
    }
}

const uploaders = [
    async (buffer) => await uploadToCatbox(buffer),
    async (buffer) => (await uploadToLitterbox(buffer, 'img.jpg')).url,
    async (buffer) => (await uploadToTmpFiles(buffer, 'img.jpg')).url,
    async (buffer) => (await uploadToImgBB(buffer, 'img.jpg')).url,
    async (buffer) => (await uploadToTelegraph(buffer, 'img.jpg')).url,
    async (buffer) => (await uploadToTermai(buffer, 'img.jpg')).url,
    async (buffer) => (await uploadToTop4top(buffer, 'img.jpg')).url,
    async (buffer) => (await uploadToGofile(buffer, 'img.jpg')).url,
    async (buffer) => (await uploadToFileIo(buffer, 'img.jpg')).url
];

async function handler(m, { sock }) {
    const type = m.quoted ? m.quoted.type : m.type;

    if (type !== 'imageMessage') {
        return m.reply(
            `🖤 *ʙʟᴀᴄᴋ ꜱᴛʏʟᴇ*\n\n` +
            `> Reply gambar dengan ${m.prefix}toblack\n` +
            `> Atau kirim gambar dengan caption ${m.prefix}toblack`
        );
    }

    m.react('⏳');

    try {
        const buffer = m.quoted ? await m.quoted.download() : await m.download();

            if (!buffer) {
                m.react('❌');
                return m.reply('❌ Gagal mendownload gambar');
            }

            const prompt = 'Make this person the skin is very black, but skin tone still natural';

    let res = null;
    let lastError = null;

    for (const uploader of uploaders) {
        try {
            const imgUrl = await uploader(buffer);
            console.log('toirreng uploader url:', imgUrl);

            res = await axios.get(
                `https://api-faa.my.id/faa/nano-banana?url=${encodeURIComponent(imgUrl)}&prompt=${encodeURIComponent(prompt)}`,
                {
                    responseType: 'arraybuffer',
                    timeout: 120000
                }
            );

            break;
} catch (err) {
    lastError = err;

    const msg = Buffer.isBuffer(err.response?.data)
        ? err.response.data.toString()
        : String(err.response?.data || '');

    // Error dari uploader, lanjut ke uploader berikutnya
    if (
        err.message === 'Invalid response' ||
        err.message === 'No URL' ||
        err.message === 'Parse failed' ||
        err.message === 'No server'
    ) {
        continue;
    }

    // API menolak uploader, lanjut ke uploader berikutnya
    if (
        err.response?.status === 412 &&
        msg.toLowerCase().includes('invalid uploader')
    ) {
        continue;
    }

    // Error lain baru dihentikan
    throw err;
}
}

if (!res) throw lastError;

        m.react('✅');

        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `🖤 *Black Style*\n\n> © RzkyADS`,
            footer: '© RzkyADS'
        }, { quoted: m });

    } catch (err) {
    m.react('❌')

    let detail = err.message

    if (err.response) {
        detail += `

Status: ${err.response.status}`

        try {
            if (Buffer.isBuffer(err.response.data)) {
                detail += `

Response:
${err.response.data.toString()}`
            } else {
                detail += `

Response:
${JSON.stringify(err.response.data, null, 2)}`
            }
        } catch {
            detail += `

Response:
(Tidak dapat dibaca)`
        }
    }

    return m.reply(`❌ *Terjadi Error!*\n\n${detail}`)
}
}

module.exports = {
    config: pluginConfig,
    handler
};