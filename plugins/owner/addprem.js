const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addprem',
    alias: ['addpremium','setprem','delprem','delpremium','listprem','premlist'],
    category: 'owner',
    description: 'Kelola premium users',
    usage: '.addprem <nomor> <durasi>',
    example: '.addprem 6281234567890 30d',
    isOwner: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function parseDuration(time){
    if(!time) return 30*24*60*60*1000

    const match = time.match(/^(\d+)(s|m|h|d)$/i)
    if(!match) return 30*24*60*60*1000

    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()

    const map = {
        s:1000,
        m:60*1000,
        h:60*60*1000,
        d:24*60*60*1000
    }

    return value * map[unit]
}

async function handler(m){

    const db = getDatabase()
    const cmd = m.command.toLowerCase()

    const isAdd = ['addprem','addpremium','setprem'].includes(cmd)
    const isDel = ['delprem','delpremium'].includes(cmd)
    const isList = ['listprem','premlist'].includes(cmd)

    if(!db.data.premium) db.data.premium = []

    if(isList){

        if(db.data.premium.length === 0){
            return m.reply(`
╭━━━〔 💗 ZERO TWO PREMIUM 〕━━⬣
┃ Darling... belum ada user premium
╰━━━━━━━━━━━━━━━━━━⬣
`)
        }

        let txt = `
╭━━━〔 💗 DAFTAR PREMIUM 〕━━⬣
┃ Pengguna premium bot ini ♡
╰━━━━━━━━━━━━━━━━━━⬣
`

        const now = Date.now()

        db.data.premium.forEach((p,i)=>{

            const num = typeof p === 'string' ? p : p.id
            const exp = typeof p === 'object' && p.expired
                ? new Date(p.expired).toLocaleString('id-ID')
                : 'Permanent'

            txt += `┃ ${i+1}. 💎 ${num}\n`
            txt += `┃ ⏳ Exp : ${exp}\n`
            txt += `┃ ───────────────\n`

        })

        txt += `
╰━━━〔 NusaBot 〕━━⬣
Total premium : ${db.data.premium.length} darling ♡
`

        return m.reply(txt)
    }

    let targetNumber = ''

    if(m.quoted){
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g,'') || ''
    }
    else if(m.mentionedJid?.length){
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g,'') || ''
    }
    else if(m.args[0]){
        targetNumber = m.args[0].replace(/[^0-9]/g,'')
    }

    if(!targetNumber){
        return m.reply(`
╭━━━〔 💗 ZERO TWO PREMIUM 〕━━⬣
┃ Darling... masukkan nomor dulu
╰━━━━━━━━━━━━━━━━━━⬣

Contoh:
.addprem 628xxxx 1d
`)
    }

    const durationArg = m.args.find(a=>/\d+(s|m|h|d)/i.test(a))
    const duration = parseDuration(durationArg)

    const now = Date.now()

    if(isAdd){

        const index = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        let newExpired
        let message = ''

        if(index !== -1){

            const current = db.data.premium[index]
            const currentExpired = typeof current === 'string' ? now : (current.expired || now)

            const baseTime = currentExpired > now ? currentExpired : now

            newExpired = baseTime + duration

            db.data.premium[index] = {
                id: targetNumber,
                expired: newExpired
            }

            message = 'Premium diperpanjang'

        }
        else{

            newExpired = now + duration

            db.data.premium.push({
                id: targetNumber,
                expired: newExpired
            })

            message = 'Premium ditambahkan'

        }

        db.save()

        const expDate = new Date(newExpired).toLocaleString('id-ID')

        return m.reply(`
╭━━━〔 💗 ZERO TWO PREMIUM 〕━━⬣
┃ Hai darling~ premium berhasil diatur ♡
╰━━━━━━━━━━━━━━━━━━⬣

┃ 💎 Nomor   : ${targetNumber}
┃ ⏳ Durasi  : ${durationArg || '30d'}
┃ 📅 Expired : ${expDate}

┃ ✨ Status  : ${message}

╰━━━〔 NusaBot 〕━━⬣
Nikmati fitur premium ya ♡
`)
    }

    if(isDel){

        const index = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        if(index === -1){
            return m.reply(`
╭━━━〔 💗 ZERO TWO PREMIUM 〕━━⬣
┃ User bukan premium darling
╰━━━━━━━━━━━━━━━━━━⬣
`)
        }

        db.data.premium.splice(index,1)
        db.save()

        return m.reply(`
╭━━━〔 💗 PREMIUM DIHAPUS 〕━━⬣
┃ Status premium dicabut
╰━━━━━━━━━━━━━━━━━━⬣

┃ ❌ Nomor : ${targetNumber}

╰━━━〔 NusaBot 〕━━⬣
Premium berhasil dihapus ♡
`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}