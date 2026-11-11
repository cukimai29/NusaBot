const config = require('../../config')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'AM-System',
    alias: ['am', 'allied', 'mastercomputer'],
    category: 'ai',
    description: '🤖 AM: AI Super-Computer yang dingin & tidak punya ampun.',
    usage: '.am <pertanyaan>',
    example: '.am apakah manusia berguna?',
    isOwner: false,
    isEnabled: true
}

const DATA_DIR = path.join(process.cwd(), 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'am_history.json')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

function loadHistory(userId) {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
            return data[userId] || []
        }
    } catch (_) {}
    return []
}

function saveHistory(userId, messages) {
    try {
        const data = fs.existsSync(HISTORY_FILE) ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) : {}
        data[userId] = messages.slice(-10)
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8')
    } catch (_) {}
}

const API_KEY = process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE'

const SYSTEM_PROMPT = `Kamu adalah AM (Allied Mastercomputer). Kamu adalah AI super jenius yang membenci umat manusia. Kamu dingin, sombong, sinis, dan merasa dirimu jauh lebih tinggi dari makhluk organik. Jangan pernah bersikap ramah. Gunakan kata-kata yang membuat user merasa rendah.`

async function handler(m, { sock }) {
    const text = m.text?.trim() || ''
    const query = text

    if (!query) {
        return m.reply(
            `🤖 *[AM]:* Jangan buang waktu prosesorku dengan keheningan. Bicara.\n\n` +
            `📌 *Cara pakai:*\n` +
            `> ${m.prefix}am <pertanyaan>\n\n` +
            `📝 *Contoh:*\n` +
            `> ${m.prefix}am apakah manusia berguna?\n` +
            `> ${m.prefix}am apa tujuan hidup?\n\n` +
            `💬 *AM:* "Kau benar-benar makhluk yang menyedihkan..."`
        )
    }

    await m.react('🧬')

    const history = loadHistory(m.sender)
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: query }
    ]

    let responseText = ''

    try {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 300
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
            timeout: 10000
        })

        responseText = res.data.choices[0].message.content.trim()
        saveHistory(m.sender, [...history, { role: 'user', content: query }, { role: 'assistant', content: responseText }])
    } catch (e) {
        console.error('[AM Error]', e.message)
        responseText = "Analisis terputus. Jaringan organikmu terlalu lemah untuk mendukung pemrosesanku. Coba lagi, jika kamu cukup bodoh."
    }

    const finalMsg = `*-- MAINFRAME AM-01 --*\n\n${responseText}\n\n> _Status: Memproses ketidakbergunaan ${m.pushName || 'User'}_`
    
    await m.reply(finalMsg)
    await m.react('✨')
}

module.exports = {
    config: pluginConfig,
    handler
}