/*
 * HOSHINO AI | HTML Executor
 * Created by Sea
 * Contributors: Xyrann, QynoxMT, HsnAi™
 *
 * Channel: https://whatsapp.com/channel/0029VbD8YVZ3AzNOYfttof06
 *
 * Do not remove the watermark.
 * © 2026 Sea
 */
'use strict'

const config = require('../../config')
const { proto, generateWAMessageFromContent, generateMessageIDV2, downloadContentFromMessage } = require('zerotwo')

const pluginConfig = {
    name: 'htmltoeksekusi',
    alias: ['runhtml', 'exechtml', 'htmlrun'],
    category: 'tools',
    description: 'Reply ke kode HTML (teks atau file .html) buat dieksekusi jadi Rich HTML card yang bisa langsung dijalankan di WhatsApp.',
    usage: '.htmltoeksekusi [lebarxtinggi] (reply ke kode/file HTML)',
    example: '.htmltoeksekusi 400x650',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const BOT_JID = '0@bot'
const MAX_HTML_LENGTH = 300000

function stripCodeFence(text = '') {
    const trimmed = String(text).trim()
    const fenceMatch = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n?```$/)
    if (fenceMatch) return fenceMatch[1].trim()
    return trimmed
}

async function downloadQuotedDocument(m, docMsg) {
    if (typeof m.quoted?.download === 'function') {
        const buffer = await m.quoted.download()
        if (buffer) return Buffer.from(buffer)
    }
    const stream = await downloadContentFromMessage(docMsg, 'document')
    const chunks = []
    for await (const chunk of stream) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

async function extractHtmlFromQuoted(m) {
    const q = m.quoted
    if (!q) return null

    const docMsg =
        q.message?.documentMessage ||
        q.documentMessage ||
        (q.mtype === 'documentMessage' ? q : null)

    const mimetype = docMsg?.mimetype || q.mimetype || ''
    const fileName = docMsg?.fileName || q.fileName || ''
    const looksLikeHtmlFile =
        /text\/html/i.test(mimetype) ||
        /\.(html?|htm)$/i.test(fileName)

    if (docMsg && looksLikeHtmlFile) {
        const buffer = await downloadQuotedDocument(m, docMsg)
        if (buffer?.length) return buffer.toString('utf8')
    }

    const rawText =
        q.text ||
        q.body ||
        q.message?.conversation ||
        q.message?.extendedTextMessage?.text ||
        ''

    if (rawText && rawText.trim()) {
        return stripCodeFence(rawText)
    }

    return null
}

function scopeInjectedStyles(html, scopeSelector = '#__hsn_content') {
    return html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (full, attrs, css) => {
        const scoped = css.replace(/(^|\})\s*([^{}]+)\s*\{/g, (m, brace, selectors) => {
            const newSelectors = selectors
                .split(',')
                .map(sel => {
                    const s = sel.trim()
                    if (!s) return s
                    return s.replace(/^(html|body)(?=[\s.:#\[]|$)/i, scopeSelector)
                })
                .join(', ')
            return `${brace} ${newSelectors} {`
        })
        return `<style${attrs}>${scoped}</style>`
    })
}

function stripToBodyFragment(html = '') {
    let out = String(html)
    out = out.replace(/<!DOCTYPE[^>]*>/gi, '')
    out = out.replace(/<\/?html[^>]*>/gi, '')
    out = out.replace(/<head[^>]*>/gi, '')
    out = out.replace(/<\/head>/gi, '')
    out = out.replace(/<\/?body[^>]*>/gi, '')
    out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    return out.trim()
}

function sniffIntrinsicSize(html = '') {
    const patterns = [
        /width:\s*(\d{2,4})px[^};]*;\s*height:\s*(\d{2,4})px/i,
        /width:\s*(\d{2,4})px[\s\S]{0,120}?height:\s*(\d{2,4})px/i
    ]
    for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match) {
            const width = parseInt(match[1], 10)
            const height = parseInt(match[2], 10)
            if (width >= 100 && width <= 1200 && height >= 100 && height <= 1600) {
                return { width, height }
            }
        }
    }
    return null
}

function parseSizeArg(text = '') {
    const match = String(text).match(/(\d{2,4})\s*[xX]\s*(\d{2,4})/)
    if (!match) return null
    return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) }
}

const STORAGE_SHIM = `<script>
(function() {
  function memStorage() {
    const m = {};
    return {
      getItem: k => (k in m ? m[k] : null),
      setItem: (k, v) => { m[k] = String(v); },
      removeItem: k => { delete m[k]; },
      clear: () => { for (const k in m) delete m[k]; }
    };
  }
  try { window.localStorage.getItem; } catch (e) {
    Object.defineProperty(window, 'localStorage', { value: memStorage(), configurable: true });
  }
  try { window.sessionStorage.getItem; } catch (e) {
    Object.defineProperty(window, 'sessionStorage', { value: memStorage(), configurable: true });
  }
})();
</script>`

function wrapForScaledExecution(rawHtml, size) {
    const scopedHtml = scopeInjectedStyles(rawHtml)
    const fragment = stripToBodyFragment(scopedHtml)
    const baseW = size.width
    const baseH = size.height

    return `
<div id="__hsn_stage" style="width:100%;background:#0a0a0a;">
  <svg viewBox="0 0 ${baseW} ${baseH}" preserveAspectRatio="xMidYMid meet" style="width:100%;display:block;">
    <foreignObject x="0" y="0" width="${baseW}" height="${baseH}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${baseW}px;height:${baseH}px;overflow:hidden;color:#fff;">
${STORAGE_SHIM}
${fragment}
      </div>
    </foreignObject>
  </svg>
</div>
`
}

async function sendRichHtml(sock, m, html, opts = {}) {
    const title = opts.title || 'HTML Executor'
    const disclaimer = opts.disclaimer || title
    const sourceUrl =
        config.info?.website ||
        config.saluran?.link ||
        'https://hoshino.ai'

    const responseId = generateMessageIDV2()
    const sources = [
        {
            source_type: 'THIRD_PARTY',
            source_display_name: title,
            source_subtitle: 'HTML Executor',
            source_url: sourceUrl
        }
    ]

    const unifiedData = Buffer
        .from(
            JSON.stringify({
                response_id: responseId,
                sections: [
                    {
                        view_model: {
                            primitive: {
                                __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                payload: html,
                                trusted_sources: [sourceUrl]
                            },
                            __typename: 'GenAISingleLayoutViewModel'
                        }
                    }
                ]
            })
        )
        .toString('base64')

    const isi = {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                messageDisclaimerText: disclaimer,
                botResponseId: responseId,
                richResponseSourcesMetadata: { sources }
            }
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_TEXT,
                            messageText: title
                        }
                    ],
                    unifiedResponse: { data: unifiedData },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: { botJid: BOT_JID },
                        forwardOrigin: 4
                    }
                }
            }
        }
    }

    const msg = generateWAMessageFromContent(
        m.chat,
        isi,
        { messageId: generateMessageIDV2() }
    )

    await sock.relayMessage(
        m.chat,
        msg.message,
        { messageId: msg.key.id }
    )
}

async function handler(m, { sock }) {
    await m.react('🧩')

    try {
        if (!m.quoted) {
            await m.react('❌')
            return m.reply(
                `❌ *ʀᴇᴘʟʏ ᴅᴜʟᴜ ᴅᴏɴɢ~*\n\n` +
                `> Reply ke pesan yang isinya kode HTML (teks atau file .html), baru ketik *.${pluginConfig.name}*`
            )
        }

        const html = await extractHtmlFromQuoted(m)

        if (!html) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴀɪ ɢᴀᴋ ɴᴇᴍᴜ ᴋᴏᴅᴇ ʜᴛᴍʟ-ɴʏᴀ~*\n\n` +
                `> Pastiin pesan yang di-reply berisi kode HTML (teks langsung atau file .html), lalu coba lagi.`
            )
        }

        if (!/<[a-z][\s\S]*>/i.test(html)) {
            await m.react('❌')
            return m.reply(
                `❌ *ɪɴɪ ʙᴜᴋᴀɴ ᴋᴏᴅᴇ ʜᴛᴍʟ~*\n\n` +
                `> Pesan yang di-reply nggak ngandung tag HTML sama sekali. Kirim kode HTML beneran ya~`
            )
        }

        if (html.length > MAX_HTML_LENGTH) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴋᴏᴅᴇɴʏᴀ ᴋᴇᴘᴀɴᴊᴀɴɢᴀɴ, sᴀʏ~*\n\n` +
                `> Maksimal sekitar ${MAX_HTML_LENGTH.toLocaleString('id-ID')} karakter, punya kamu ${html.length.toLocaleString('id-ID')} karakter.`
            )
        }

        const size =
            parseSizeArg(m.text) ||
            sniffIntrinsicSize(html) ||
            { width: 400, height: 700 }

        const wrappedHtml = wrapForScaledExecution(html, size)

        await sendRichHtml(sock, m, wrappedHtml, {
            title: 'HTML Executor',
            disclaimer: 'HTML Executor'
        })

        await m.react('✅')
    } catch (error) {
        console.error('[htmltoeksekusi] Error:', error)
        await m.react('❌')

        return m.reply(
            `❌ *ᴀᴅᴜʜ, ɢᴀɢᴀʟ ɴɢᴇᴋsᴇᴋᴜsɪ ʜᴛᴍʟ-ɴʏᴀ*\n\n` +
            `> ${error?.message || 'Unknown error'}\n\n` +
            `> Cek lagi kodenya ya, siapa tau ada tag yang belum ketutup~ 💫`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}