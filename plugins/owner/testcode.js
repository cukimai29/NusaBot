const pluginConfig = {
    name: 'testcode',
    alias: ['testcc'],
    category: 'owner',
    isOwner: true,
    isEnabled: true
}

async function handler(m, { sock }) {
    const codeSample = `function hello(name){
  console.log("Halo "+name);
  return "SUPPORT";
}
hello("${m.pushName}");`

    try {
        // PAYLOAD MENTAH TANPA BUILDER
        const payload = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: {
                        header: {
                            title: "TEST CODE CARD",
                            hasMediaAttachment: false
                        },
                        body: {
                            text: `Halo ${m.pushName} 👋`
                        },
                        footer: {
                            text: "Test code card kek Meta AI"
                        },
                        nativeFlowMessage: {
                            messageParamsJson: "",
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: ""
                                },
                                {
                                    name: "mpm",
                                    buttonParamsJson: JSON.stringify({
                                        body: `{"gen_ai_params":{"gen_ai_assets":[{"asset_key":"code","type":"CODE","code_block":{"code":"${codeSample.replace(/"/g, '\\"').replace(/\n/g, '\\n')}","language":"javascript"}}]}}`
                                    })
                                }
                            ]
                        },
                        contextInfo: {
                            bot: true
                        }
                    }
                }
            }
        }

        // Coba cara FOA yang bener
        const msg = {
            text: `Halo ${m.pushName}`,
            footer: "test",
            nativeFlowMessage: {},
            genAiParams: {
                gen_ai_assets: [
                    {
                        type: "TEXT",
                        text: `Halo ${m.pushName} test`
                    },
                    {
                        type: "CODE",
                        code_block: {
                            code: codeSample,
                            language: "javascript"
                        }
                    }
                ]
            }
        }

        // CARA PALING SIMPEL YANG PASTI WORK (pake interactiveMessage FOA)
        await sock.relayMessage(m.chat, {
            extendedTextMessage: {
                text: `Halo ${m.pushName} 👋\n\nTest Code Card:\n\n\`\`\`javascript\n${codeSample}\n\`\`\`\n\n> Kalo ini muncul = fallback biasa (Business)`,
                contextInfo: { forwardingScore: 0, isForwarded: false }
            }
        }, {})

        // Sekarang coba FOA asli
        await sock.sendMessage(m.chat, {
            text: "Coba FOA asli:",
            footer: "test",
            interactiveButtons: []
        })

        // FOA V2 - ini yang dipake Meta AI
        const foaPayload = {
            message: {
                interactiveMessage: {
                    body: { text: `Halo ${m.pushName}` },
                    footer: { text: "footer" },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Copy Code",
                                copy_code: codeSample
                            })
                        }]
                    }
                }
            }
        }

        // KIRIM LANGSUNG PAKE GENERATE
        const { generateWAMessageFromContent } = require('@whiskeysockets/baileys')
        const content = {
            extendedTextMessage: {
                text: `*TEST CODE CARD*\nHalo ${m.pushName}\n\n\`\`\`js\n${codeSample}\n\`\`\``,
                contextInfo: {
                    bot: true,
                    genAi: {
                        genAiAssets: [
                            { type: "CODE", codeBlock: { code: codeSample, language: "JAVASCRIPT" } }
                        ]
                    }
                }
            }
        }
        
        const waMessage = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.id })
        await sock.relayMessage(m.chat, waMessage.message, { messageId: waMessage.key.id })

        await m.reply('✅ Coba cek di atas, kalo yang terakhir ada tombol copy = WORK')

    } catch (e) {
        console.log(e)
        await sock.sendMessage(m.chat, { text: `❌ Error: ${e.message}\n${e.stack}` }, { quoted: m })
    }
}

module.exports = { config: pluginConfig, handler }