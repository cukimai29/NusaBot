const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('zerotwo')

function levenshteinDistance(str1, str2) {
    const m = str1.length
    const n = str2.length
    
    if (m === 0) return n
    if (n === 0) return m
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )
        }
    }
    
    return dp[m][n]
}

function damerauLevenshteinDistance(str1, str2) {
    const m = str1.length
    const n = str2.length
    
    if (m === 0) return n
    if (n === 0) return m
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )
            
            if (i > 1 && j > 1 && str1[i - 1] === str2[j - 2] && str1[i - 2] === str2[j - 1]) {
                dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost)
            }
        }
    }
    
    return dp[m][n]
}

function jaroWinklerSimilarity(str1, str2) {
    if (str1 === str2) return 1.0
    
    const len1 = str1.length
    const len2 = str2.length
    
    if (len1 === 0 || len2 === 0) return 0.0
    
    const matchWindow = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0)
    
    const matches1 = new Array(len1).fill(false)
    const matches2 = new Array(len2).fill(false)
    
    let matches = 0
    let transpositions = 0
    
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchWindow)
        const end = Math.min(i + matchWindow + 1, len2)
        
        for (let j = start; j < end; j++) {
            if (matches2[j] || str1[i] !== str2[j]) continue
            matches1[i] = true
            matches2[j] = true
            matches++
            break
        }
    }
    
    if (matches === 0) return 0.0
    
    let k = 0
    for (let i = 0; i < len1; i++) {
        if (!matches1[i]) continue
        while (!matches2[k]) k++
        if (str1[i] !== str2[k]) transpositions++
        k++
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
    
    let prefix = 0
    for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
        if (str1[i] === str2[i]) prefix++
        else break
    }
    
    return jaro + prefix * 0.1 * (1 - jaro)
}

function nGramSimilarity(str1, str2, n = 2) {
    if (!str1 || !str2) return 0
    if (str1 === str2) return 1
    
    const getNGrams = (str, n) => {
        const grams = new Set()
        const padded = ' '.repeat(n - 1) + str + ' '.repeat(n - 1)
        for (let i = 0; i < padded.length - n + 1; i++) {
            grams.add(padded.substring(i, i + n))
        }
        return grams
    }
    
    const grams1 = getNGrams(str1, n)
    const grams2 = getNGrams(str2, n)
    
    let intersection = 0
    for (const gram of grams1) {
        if (grams2.has(gram)) intersection++
    }
    
    const union = grams1.size + grams2.size - intersection
    return union === 0 ? 0 : intersection / union
}

function tokenSortRatio(str1, str2) {
    const sorted1 = str1.toLowerCase().split(/\s+/).sort().join(' ')
    const sorted2 = str2.toLowerCase().split(/\s+/).sort().join(' ')
    return getSimilarity(sorted1, sorted2)
}

function getSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1
    return 1 - distance / maxLen
}

function getAdvancedSimilarity(str1, str2) {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    
    const levenshtein = getSimilarity(s1, s2)
    const jaroWinkler = jaroWinklerSimilarity(s1, s2)
    const ngram2 = nGramSimilarity(s1, s2, 2)
    const ngram3 = nGramSimilarity(s1, s2, 3)
    
    const combined = (levenshtein * 0.3) + (jaroWinkler * 0.35) + (ngram2 * 0.2) + (ngram3 * 0.15)
    
    return Math.min(1, combined)
}

function getMatchType(inputLower, cmdLower) {
    if (cmdLower === inputLower) return { type: 'exact', score: 1.0, emoji: '✅', label: 'Sama persis 💯' }
    const isShortCmd = cmdLower.length < 3
    const isLongInput = inputLower.length > 3
    if (cmdLower.startsWith(inputLower)) return { type: 'prefix', score: 0.95, emoji: '🎯', label: 'Awalan cocok 🎯' }
    if (inputLower.startsWith(cmdLower)) {
        if (isShortCmd && isLongInput) return null 
        return { type: 'contains', score: 0.9, emoji: '📌', label: 'Command lebih pendek 📏' }
    }
    if (cmdLower.includes(inputLower)) return { type: 'substring', score: 0.85, emoji: '🔗', label: 'Bagian dari command 🧩' }
    if (inputLower.includes(cmdLower)) {
        if (isShortCmd && isLongInput) return null
        return { type: 'reverse-substring', score: 0.8, emoji: '📎', label: 'Command ada di input 🔍' }
    }
    return null
}

function findSimilarCommands(input, commands, options = {}) {
    const {
        maxResults = 5,
        minSimilarity = 0.2,
        maxDistance = 6,
        useAdvanced = true
    } = options
    
    const inputLower = (input && typeof input === 'string') ? input.toLowerCase() : ''
    const results = []
    
    for (const cmd of commands) {
        if (!cmd || typeof cmd !== 'string') continue
        const cmdLower = cmd.toLowerCase()
        
        const directMatch = getMatchType(inputLower, cmdLower)
        if (directMatch) {
            results.push({
                command: cmd,
                similarity: directMatch.score,
                distance: Math.abs(cmd.length - input.length),
                type: directMatch.type,
                emoji: directMatch.emoji,
                reason: directMatch.label
            })
            continue
        }
        
        const distance = damerauLevenshteinDistance(inputLower, cmdLower)
        const similarity = useAdvanced ? getAdvancedSimilarity(inputLower, cmdLower) : getSimilarity(inputLower, cmdLower)
        
        let bonus = 0
        if (cmdLower[0] === inputLower[0]) bonus += 0.12
        if (cmdLower.slice(0, 2) === inputLower.slice(0, 2)) bonus += 0.08
        if (cmdLower.slice(0, 3) === inputLower.slice(0, 3)) bonus += 0.05
        
        if (cmdLower.includes(inputLower.slice(0, Math.ceil(inputLower.length / 2)))) {
            bonus += 0.1
        }
        
        const consonants1 = cmdLower.replace(/[aeiou]/g, '')
        const consonants2 = inputLower.replace(/[aeiou]/g, '')
        if (consonants1 === consonants2) bonus += 0.15
        
        const finalSimilarity = Math.min(1, similarity + bonus)
        
        if (distance <= maxDistance || finalSimilarity >= minSimilarity) {
            let reason = 'Mirip 🔍'
            let emoji = '🔍'
            
            if (distance === 1) {
                const transposed = inputLower.length === cmdLower.length && 
                    levenshteinDistance(inputLower, cmdLower) === 2 &&
                    damerauLevenshteinDistance(inputLower, cmdLower) === 1
                if (transposed) {
                    reason = 'Huruf tertukar 🔄'
                    emoji = '🔄'
                } else {
                    reason = 'Salah ketik 1 huruf ✏️'
                    emoji = '✏️'
                }
            } else if (distance === 2) {
                reason = 'Salah ketik 2 huruf 📝'
                emoji = '📝'
            } else if (finalSimilarity >= 0.85) {
                reason = 'Sangat mirip ⭐'
                emoji = '⭐'
            } else if (finalSimilarity >= 0.7) {
                reason = 'Cukup mirip 💫'
                emoji = '💫'
            } else if (finalSimilarity >= 0.5) {
                reason = 'Agak mirip 🌟'
                emoji = '🌟'
            } else if (finalSimilarity >= 0.3) {
                reason = 'Sedikit mirip ✨'
                emoji = '✨'
            }
            
            results.push({
                command: cmd,
                similarity: finalSimilarity,
                distance,
                type: 'similar',
                emoji,
                reason
            })
        }
    }
    
    results.sort((a, b) => {
        if (Math.abs(b.similarity - a.similarity) > 0.05) return b.similarity - a.similarity
        if (b.type !== a.type) {
            const typePriority = { exact: 0, prefix: 1, contains: 2, substring: 3, 'reverse-substring': 4, similar: 5 }
            return typePriority[a.type] - typePriority[b.type]
        }
        return a.distance - b.distance
    })
    
    return results.slice(0, maxResults)
}

function createProgressBar(percent, length = 10) {
    const filled = Math.round(percent / (100 / length))
    const empty = length - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

// ========== AMBIL GAMBAR ZERO TWO ==========
const ZERO_TWO_IMAGE_URL = 'https://e.top4top.io/p_3845erxan0.png'

async function getZeroTwoImage() {
    try {
        const response = await axios.get(ZERO_TWO_IMAGE_URL, {
            responseType: 'arraybuffer',
            timeout: 10000
        })
        
        if (response.status === 200 && response.data) {
            console.log('[SIMILARITY] Gambar Zero Two berhasil diambil dari URL')
            return { buffer: Buffer.from(response.data), exists: true }
        } else {
            console.log('[SIMILARITY] Gagal ambil gambar dari URL, status:', response.status)
            return { exists: false }
        }
    } catch (err) {
        console.log('[SIMILARITY] Error ambil gambar dari URL:', err.message)
        return { exists: false }
    }
}

// ========== FUNGSI UTAMA - INTERACTIVE MESSAGE VERSION ==========
async function sendSuggestionWithImage(inputCommand, suggestions, prefix, sock, chatId, senderName, botConfig = {}) {
    if (suggestions.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ Command *${inputCommand}* tidak ditemukan darling~ 🦋`
        })
        return false
    }
    
    const topMatch = suggestions[0]
    const topPercent = Math.round(topMatch.similarity * 100)
    const progressBar = createProgressBar(topPercent, 10)
    
    // Siapkan konten
    const saluranId = botConfig.saluran?.id || '120363402057133599@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'NusaBot'
    const botName = botConfig.bot?.name || 'NusaBot'
    
    // Ambil gambar
    const zeroTwoImage = await getZeroTwoImage()
    let mediaAttachment = null
    
    if (zeroTwoImage.exists && zeroTwoImage.buffer) {
        try {
            mediaAttachment = await prepareWAMessageMedia(
                { image: zeroTwoImage.buffer },
                { upload: sock.waUploadToServer }
            )
        } catch (e) {
            console.log('[SIMILARITY] Gagal upload gambar:', e.message)
        }
    }
    
    // Buat caption
    let caption = `🦋 *ZERO TWO - COMMAND NOT FOUND* 🦋\n\n`
    caption += `💫 *"He~ ada yang salah nih darling~"* 💫\n\n`
    caption += `┌─〔 📝 *DETAIL* 〕─🦋\n`
    caption += `│ ✨ Kamu mengetik: \`${inputCommand}\`\n`
    caption += `│ 🎯 Mungkin maksudmu: \`${prefix}${topMatch.command}\`\n`
    caption += `│ 📊 Kecocokan: *${topPercent}%*\n`
    caption += `│ 📈 Progress: \`${progressBar}\`\n`
    caption += `└─────────────────────────🦋\n\n`
    
    caption += `📋 *Rekomendasi command:*\n`
    for (let i = 0; i < Math.min(suggestions.length, 5); i++) {
        const s = suggestions[i]
        const percent = Math.round(s.similarity * 100)
        caption += `   ${s.emoji} ${i+1}. \`${prefix}${s.command}\` (${percent}%)\n`
    }
    
    caption += `\n💬 *Zero Two:* "Darling, coba pake command di atas ya~ 🗿"\n`
    caption += `🌸 *Yosh! Semangat!* 🌸`
    
    // Buat buttons dari suggestions
    const buttons = suggestions.slice(0, 3).map((s) => {
        return {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: `${s.emoji} ${prefix}${s.command}`,
                id: `${prefix}${s.command}`
            })
        }
    })
    
    // Tambah button menu
    buttons.push({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: '📋 Menu',
            id: '.menu'
        })
    })
    
    // ========== BUAT INTERACTIVE MESSAGE ==========
    const interactiveMsg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: `🦋 ${botName}`,
                        hasMediaAttachment: !!mediaAttachment,
                        ...(mediaAttachment || {})
                    }),
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: caption
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `✨ ${botName} ✨\n© ${new Date().getFullYear()}`
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        messageParamsJson: JSON.stringify({
                            limited_time_offer: {
                                text: `🦋 Command Suggestion`,
                                url: `https://wa.me/${botConfig.owner?.number?.[0] || ''}`,
                                copy_code: '💕 Darling 💕',
                                expiration_time: Date.now() * 999
                            },
                            bottom_sheet: {
                                in_thread_buttons_energi: 2,
                                divider_indices: [1, 2, 999],
                                list_title: `🦋 Saran Command`,
                                button_title: '💕 Pilih Command'
                            }
                        }),
                        buttons: buttons
                    }),
                    contextInfo: {
                        mentionedJid: [chatId],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: saluranId,
                            newsletterName: saluranName,
                            serverMessageId: 127
                        }
                    }
                })
            }
        }
    }, { userJid: chatId })

    try {
        await sock.relayMessage(chatId, interactiveMsg.message, { messageId: interactiveMsg.key.id })
        return true
    } catch (err) {
        console.error('[SIMILARITY] Gagal kirim interactive message:', err.message)
        // Fallback ke text biasa
        await sock.sendMessage(chatId, { text: caption })
        return false
    }
}

// ========== VERSION TEXT BIASA (TANPA GAMBAR) ==========
function getSuggestionText(inputCommand, suggestions, prefix) {
    if (suggestions.length === 0) {
        return `❌ Command *${inputCommand}* tidak ditemukan darling~ 🦋`
    }
    
    const topMatch = suggestions[0]
    const topPercent = Math.round(topMatch.similarity * 100)
    const progressBar = createProgressBar(topPercent, 10)
    
    let msg = `🦋 *ZERO TWO - COMMAND NOT FOUND* 🦋\n\n`
    msg += `💫 *"He~ ada yang salah nih darling~"* 💫\n\n`
    msg += `┌─〔 📝 *DETAIL* 〕─🦋\n`
    msg += `│ ✨ Kamu mengetik: \`${inputCommand}\`\n`
    msg += `│ 🎯 Mungkin maksudmu: \`${prefix}${topMatch.command}\`\n`
    msg += `│ 📊 Kecocokan: *${topPercent}%*\n`
    msg += `│ 📈 Progress: \`${progressBar}\`\n`
    msg += `└─────────────────────────🦋\n\n`
    
    msg += `📋 *Rekomendasi command:*\n`
    for (let i = 0; i < Math.min(suggestions.length, 5); i++) {
        const s = suggestions[i]
        const percent = Math.round(s.similarity * 100)
        msg += `   ${s.emoji} ${i+1}. \`${prefix}${s.command}\` (${percent}%)\n`
    }
    
    msg += `\n💬 *Zero Two:* "Darling, coba pake command di atas ya~ 🗿"\n`
    msg += `🌸 *Yosh! Semangat!* 🌸`
    
    return msg
}

function formatSuggestionMessage(inputCommand, suggestions, prefix = '.', m) {
    if (suggestions.length === 0) return null
    
    const topMatch = suggestions[0]
    const topPercent = Math.round(topMatch.similarity * 100)
    const progressBar = createProgressBar(topPercent, 10)
    
    let msg = `🦋 *ZERO TWO - COMMAND NOT FOUND* 🦋\n\n`
    msg += `💫 *"He~ ada yang salah nih darling~"* 💫\n\n`
    msg += `┌─〔 📝 *DETAIL* 〕─🦋\n`
    msg += `│ ✨ Kamu mengetik: \`${inputCommand}\`\n`
    msg += `│ 🎯 Mungkin maksudmu: \`${prefix}${topMatch.command}\`\n`
    msg += `│ 📊 Kecocokan: *${topPercent}%*\n`
    msg += `│ 📈 Progress: \`${progressBar}\`\n`
    msg += `└─────────────────────────🦋\n\n`
    
    msg += `📋 *Rekomendasi command:*\n`
    for (let i = 0; i < Math.min(suggestions.length, 5); i++) {
        const s = suggestions[i]
        const percent = Math.round(s.similarity * 100)
        msg += `   ${s.emoji} ${i+1}. \`${prefix}${s.command}\` (${percent}%)\n`
    }
    
    msg += `\n💬 *Zero Two:* "Darling, coba pake command di atas ya~ 🗿"\n`
    msg += `🌸 *Yosh! Semangat!* 🌸`
    
    return {
        message: msg,
        interactiveButtons: suggestions.slice(0, 2).map((s) => {
            return {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: `${s.emoji} ${prefix}${s.command}`,
                    id: `${prefix}${s.command}`
                })
            }
        })
    }
}

function createSuggestionResponse(inputCommand, suggestions, prefix = '.') {
    const result = formatSuggestionMessage(inputCommand, suggestions, prefix)
    
    return {
        message: result.message,
        interactiveButtons: result.interactiveButtons,
        hasSuggestions: suggestions.length > 0,
        topSuggestion: suggestions[0] || null,
        confidence: suggestions[0] ? Math.round(suggestions[0].similarity * 100) : 0
    }
}

function fuzzyMatch(input, commands, threshold = 0.3) {
    return findSimilarCommands(input, commands, { minSimilarity: threshold, useAdvanced: true })
        .filter(r => r.similarity >= threshold)
}

module.exports = {
    levenshteinDistance,
    damerauLevenshteinDistance,
    jaroWinklerSimilarity,
    nGramSimilarity,
    tokenSortRatio,
    getSimilarity,
    getAdvancedSimilarity,
    findSimilarCommands,
    formatSuggestionMessage,
    createSuggestionResponse,
    createProgressBar,
    fuzzyMatch,
    sendSuggestionWithImage,
    getSuggestionText,
    getZeroTwoImage
}