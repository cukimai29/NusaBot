const { spawn } = require('child_process')
const path = require('path')

const pluginConfig = {
    name: 'restart',
    alias: ['reset', 'reboot', 'restartbot'],
    category: 'owner',
    description: 'Restart bot process (real restart)',
    usage: '.restart',
    example: '.restart',
    isOwner: true,
    cooldown: 30,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await m.react('🔄')

        const startTime = Date.now()
        const time = new Date().toLocaleTimeString('id-ID')

        // UI ala Zero Two
        const uiMsg =
`╭━━〔 💖 ZERO TWO RESTART 💖 〕━━⬣
┃ Darling, aku akan restart dulu 😋
┃
┃ ⏰ Waktu : ${time}
┃ 🔧 Method : Process Spawn
┃ 📦 PID : ${process.pid}
│
│ Ara ara~ jangan khawatir, aku akan kembali 💖
│ Proses restart mungkin 10-30 detik
╰━━━━━━━━━━━━━━━━⬣`

        await sock.sendMessage(m.chat, { text: uiMsg }, { quoted: m })

        console.log('[Restart] Command triggered by:', m.sender)
        console.log('[Restart] Initiating graceful restart...')

        setTimeout(() => {
            const cwd = process.cwd()
            const isWindows = process.platform === 'win32'
            
            let command, args
            
            if (isWindows) {
                command = 'cmd.exe'
                args = ['/c', 'start', '/b', 'node', 'index.js']
            } else {
                command = 'node'
                args = ['index.js']
            }

            const child = spawn(command, args, {
                cwd: cwd,
                detached: true,
                stdio: 'ignore',
                shell: isWindows,
                env: { ...process.env, RESTARTED: 'true', RESTART_TIME: startTime.toString() }
            })

            child.unref()

            console.log('[Restart] New process spawned, exiting current process...')

            setTimeout(() => process.exit(0), 500)

        }, 2000)

    } catch (error) {
        await m.react('❌')
        await m.reply(
`╭━━〔 ❌ NUSABOT SYSTEM ❌ 〕━━⬣
┃ Restart gagal cuy 😭
┃
┃ ${error.message}
╰━━━━━━━━━━━━━━━━⬣`
        )
    }
}

module.exports = { config: pluginConfig, handler }