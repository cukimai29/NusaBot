// =======================
// 🔥 IMPORT
// =======================
const { createCanvas, loadImage } = require('canvas')

// =======================
// 🧠 CONFIG
// =======================
const CONFIG = {
    bg: 'https://i.imgur.com/your-pink-bg.jpg', // ganti bg lu
    defaultAvatar: 'https://i.imgur.com/blank-avatar.png'
}

// =======================
// 🎨 FUNCTION: DRAW ARROW (>>>>)
// =======================
function drawArrows(ctx) {

    ctx.fillStyle = "rgba(255,255,255,0.08)"

    const startX = 420

    for (let i = 0; i < 5; i++) {

        const x = startX + (i * 60)

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + 40, 0)
        ctx.lineTo(x + 80, 200)
        ctx.lineTo(x + 40, 400)
        ctx.lineTo(x, 400)
        ctx.lineTo(x + 40, 200)
        ctx.closePath()
        ctx.fill()
    }
}

// =======================
// 🟢 WELCOME CARD
// =======================
async function createWelcomeCard({ username, memberCount, avatar }) {

    const canvas = createCanvas(800, 400)
    const ctx = canvas.getContext('2d')

    // background
    const bg = await loadImage(CONFIG.bg)
    ctx.drawImage(bg, 0, 0, 800, 400)

    // gradient kiri
    const grad = ctx.createLinearGradient(0, 0, 800, 0)
    grad.addColorStop(0, "rgba(0,0,0,0.7)")
    grad.addColorStop(1, "rgba(0,0,0,0.1)")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 800, 400)

    // panah >>>>
    drawArrows(ctx)

    // avatar
    let userAvatar
    try {
        userAvatar = await loadImage(avatar)
    } catch {
        userAvatar = await loadImage(CONFIG.defaultAvatar)
    }

    ctx.save()
    ctx.beginPath()
    ctx.arc(120, 200, 60, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(userAvatar, 60, 140, 120, 120)
    ctx.restore()

    // text
    ctx.fillStyle = "#ffffff"

    ctx.font = "bold 34px Sans"
    ctx.fillText(username, 220, 150)

    ctx.font = "20px Sans"
    ctx.fillText(`Member ke-${memberCount}`, 220, 190)

    ctx.fillStyle = "#ffccd5"
    ctx.font = "italic 18px Sans"
    ctx.fillText(`Darling... akhirnya datang 😏`, 220, 230)

    // title
    ctx.fillStyle = "#ffffffaa"
    ctx.font = "bold 14px Sans"
    ctx.fillText("NUSABOT SYSTEM", 600, 30)

    return canvas.toBuffer()
}

// =======================
// 🔴 GOODBYE CARD
// =======================
async function createGoodbyeCard({ username, avatar }) {

    const canvas = createCanvas(800, 400)
    const ctx = canvas.getContext('2d')

    const bg = await loadImage(CONFIG.bg)
    ctx.drawImage(bg, 0, 0, 800, 400)

    // overlay gelap
    ctx.fillStyle = "rgba(0,0,0,0.75)"
    ctx.fillRect(0, 0, 800, 400)

    // panah (merah vibe)
    ctx.fillStyle = "rgba(255,0,80,0.15)"
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(420 + i*60, 0, 25, 400)
    }

    // avatar
    let userAvatar
    try {
        userAvatar = await loadImage(avatar)
    } catch {
        userAvatar = await loadImage(CONFIG.defaultAvatar)
    }

    ctx.save()
    ctx.beginPath()
    ctx.arc(120, 200, 60, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(userAvatar, 60, 140, 120, 120)
    ctx.restore()

    // text
    ctx.fillStyle = "#ff4d6d"
    ctx.font = "bold 34px Sans"
    ctx.fillText(username, 220, 150)

    ctx.fillStyle = "#ffffff"
    ctx.font = "20px Sans"
    ctx.fillText(`Pergi ya... atau memang tidak layak?`, 220, 200)

    ctx.font = "bold 14px Sans"
    ctx.fillText("GOODBYE SYSTEM", 600, 30)

    return canvas.toBuffer()
}

// =======================
// 🤖 WHATSAPP HANDLER
// =======================
async function handler(sock) {

    sock.ev.on('group-participants.update', async (anu) => {

        const metadata = await sock.groupMetadata(anu.id)

        for (let user of anu.participants) {

            let pp = CONFIG.defaultAvatar

            try {
                pp = await sock.profilePictureUrl(user, 'image')
            } catch {}

            // welcome
            if (anu.action === 'add') {

                const img = await createWelcomeCard({
                    username: user.split('@')[0],
                    memberCount: metadata.participants.length,
                    avatar: pp
                })

                await sock.sendMessage(anu.id, {
                    image: img,
                    caption: `👋 Welcome @${user.split('@')[0]}`,
                    mentions: [user]
                })
            }

            // goodbye
            if (anu.action === 'remove') {

                const img = await createGoodbyeCard({
                    username: user.split('@')[0],
                    avatar: pp
                })

                await sock.sendMessage(anu.id, {
                    image: img,
                    caption: `💔 Goodbye @${user.split('@')[0]}`,
                    mentions: [user]
                })
            }
        }
    })
}

// =======================
// 🌐 DISCORD SUPPORT
// =======================
function discordHandler(client) {

    const { AttachmentBuilder } = require('discord.js')

    client.on('guildMemberAdd', async (member) => {

        const img = await createWelcomeCard({
            username: member.user.username,
            memberCount: member.guild.memberCount,
            avatar: member.user.displayAvatarURL({ extension: 'png' })
        })

        const file = new AttachmentBuilder(img, { name: 'welcome.png' })

        member.guild.systemChannel?.send({
            content: `👋 Welcome ${member}`,
            files: [file]
        })
    })

    client.on('guildMemberRemove', async (member) => {

        const img = await createGoodbyeCard({
            username: member.user.username,
            avatar: member.user.displayAvatarURL({ extension: 'png' })
        })

        const file = new AttachmentBuilder(img, { name: 'goodbye.png' })

        member.guild.systemChannel?.send({
            content: `💔 Goodbye ${member.user.username}`,
            files: [file]
        })
    })
}

// =======================
// 📦 EXPORT
// =======================
module.exports = {
    handler,
    discordHandler,
    createWelcomeCard,
    createGoodbyeCard
}