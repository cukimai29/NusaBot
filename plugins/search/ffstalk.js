const config = {
    name: 'ffstalk',
    alias: ['ff', 'freefire', 'stalkff'],
    category: 'search',
    description: 'Stalk akun Free Fire',
    usage: '.ffstalk <uid>',
    example: '.ffstalk 87980657',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function stalkFF(uid) {
    const axios = require('axios')
    
    try {
        const response = await axios.get(
            `https://www.00cc.eu.cc/freefire-stalk?uid=${uid}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
                    "Accept": "application/json",
                },
                timeout: 15000,
                validateStatus: () => true
            }
        )
        
        if (!response.data?.success) {
            return {
                success: false,
                statusCode: response.status,
                message: response.data?.message || "UID tidak ditemukan"
            }
        }
        
        const r = response.data.result
        
        return {
            success: true,
            statusCode: response.status,
            data: {
                basic: {
                    uid: r.account_basic_info?.uid,
                    name: r.account_basic_info?.name,
                    level: r.account_basic_info?.level,
                    exp: r.account_basic_info?.exp,
                    region: r.account_basic_info?.region,
                    likes: r.account_basic_info?.likes,
                    honor_score: r.account_basic_info?.honor_score,
                    title: r.account_basic_info?.title_name,
                    bio: r.account_basic_info?.bio,
                    has_elite_pass: r.account_basic_info?.has_elite_pass
                },
                activity: {
                    created_at: r.account_activity?.created_at,
                    last_login: r.account_activity?.last_login,
                    latest_ob: r.account_activity?.most_recent_ob,
                    season_id: r.account_activity?.season_id,
                    bp_badges: r.account_activity?.current_bp_badges,
                    br_rank: r.account_activity?.br_rank,
                    br_rank_id: r.account_activity?.br_rank_id,
                    br_max_rank: r.account_activity?.br_max_rank,
                    cs_rank: r.account_activity?.cs_rank,
                    cs_rank_id: r.account_activity?.cs_rank_id,
                    cs_max_rank: r.account_activity?.cs_max_rank
                },
                social: {
                    gender: r.social_info?.gender?.replace("Gender_", ""),
                    language: r.social_info?.language?.replace("Language_", ""),
                    rank_show: r.social_info?.rank_show?.replace("RankShow_", ""),
                    mode_prefer: r.social_info?.mode_prefer,
                    signature: r.social_info?.signature
                },
                pet: r.pet_details?.pet_name ? {
                    name: r.pet_details.pet_name,
                    item_name: r.pet_details.pet_item_name,
                    level: r.pet_details.pet_level,
                    exp: r.pet_details.pet_exp,
                    skin: r.pet_details.skin_name,
                    skill: r.pet_details.selected_skill_name
                } : null,
                guild: r.guild_info?.guild_name ? {
                    name: r.guild_info.guild_name,
                    id: r.guild_info.guild_id,
                    level: r.guild_info.guild_level,
                    members: r.guild_info.live_members,
                    capacity: r.guild_info.capacity,
                    leader: {
                        name: r.guild_info.leader?.leader_name,
                        uid: r.guild_info.leader?.leader_uid,
                        level: r.guild_info.leader?.leader_level
                    }
                } : null,
                misc: {
                    diamond_cost: r.diamond_cost?.diamond_cost,
                    profile_image: r.profile_image
                }
            }
        }
    } catch (error) {
        return {
            success: false,
            statusCode: error.response?.status || 500,
            message: error.message
        }
    }
}

async function handler(m) {
    const args = m.text?.trim().split(/\s+/)
    const uid = args[0]
    
    if (!uid) {
        return m.reply(`🎮 *ꜰʀᴇᴇ ꜰɪʀᴇ ꜱᴛᴀʟᴋᴇʀ*\n\n> Cari data akun Free Fire\n\n> Contoh: .ffstalk 87980657\n\n📝 *Info:*\n> • UID: ID akun Free Fire\n> • Menampilkan data lengkap akun (level, rank, guild, pet, dll)`)
    }
    
    if (!/^\d+$/.test(uid)) {
        return m.reply(`❌ *UID tidak valid!*\n\n> UID harus berupa angka.\n> Contoh: .ffstalk 87980657`)
    }
    
    await m.reply(`⏳ *Mencari akun Free Fire...*\n> 🆔 UID: ${uid}`)
    
    const result = await stalkFF(uid)
    
    if (!result.success) {
        let errorMsg = `❌ *AKUN TIDAK DITEMUKAN*\n\n`
        errorMsg += `╭──〔 📋 *ɪɴꜰᴏ ᴘᴇɴᴄᴀʀɪᴀɴ* 〕───⬣\n`
        errorMsg += `│  🆔 UID: ${uid}\n`
        errorMsg += `│  📊 Status Code: ${result.statusCode}\n`
        errorMsg += `╰────────────────⬣\n\n`
        errorMsg += `> 💡 Pastikan UID benar, Darling~\n> Atau coba cek akunnya di Free Fire dulu.`
        return m.reply(errorMsg)
    }
    
    const d = result.data
    const basic = d.basic
    const activity = d.activity
    const social = d.social
    
    let txt = `🎮 *ꜰʀᴇᴇ ꜰɪʀᴇ ꜱᴛᴀʟᴋᴇʀ*\n\n`
    txt += `╭──〔 📋 *ɪɴꜰᴏʀᴍᴀꜱɪ ᴅᴀꜱᴀʀ* 〕───⬣\n`
    txt += `│  👤 Nama: *${basic.name || '-'}*\n`
    txt += `│  🆔 UID: ${basic.uid || '-'}\n`
    txt += `│  📊 Level: ${basic.level || '-'}\n`
    txt += `│  🌏 Region: ${basic.region || '-'}\n`
    txt += `│  ❤️ Likes: ${basic.likes || 0}\n`
    if (basic.title) txt += `│  🏷️ Title: ${basic.title}\n`
    if (basic.bio) txt += `│  📝 Bio: ${basic.bio.slice(0, 50)}${basic.bio.length > 50 ? '...' : ''}\n`
    txt += `╰────────────────⬣\n\n`
    
    if (activity) {
        txt += `╭──〔 📊 *ᴀᴋᴛɪᴠɪᴛᴀꜱ* 〕───⬣\n`
        if (activity.created_at) txt += `│  📅 Bergabung: ${activity.created_at.split('T')[0]}\n`
        if (activity.last_login) txt += `│  🔑 Login terakhir: ${activity.last_login.split('T')[0]}\n`
        if (activity.br_rank) txt += `│  🏆 BR Rank: ${activity.br_rank}\n`
        if (activity.cs_rank) txt += `│  ⚔️ CS Rank: ${activity.cs_rank}\n`
        txt += `╰────────────────⬣\n\n`
    }
    
    if (social) {
        txt += `╭──〔 👤 *ꜱᴏꜱɪᴀʟ* 〕───⬣\n`
        if (social.gender && social.gender !== 'Unknown') txt += `│  🚻 Gender: ${social.gender}\n`
        if (social.language) txt += `│  🌐 Bahasa: ${social.language}\n`
        if (social.signature) txt += `│  💬 Signature: ${social.signature.slice(0, 50)}${social.signature.length > 50 ? '...' : ''}\n`
        txt += `╰────────────────⬣\n\n`
    }
    
    if (d.guild) {
        txt += `╭──〔 🏰 *ɢᴜɪʟᴅ* 〕───⬣\n`
        txt += `│  📛 Nama: *${d.guild.name}*\n`
        txt += `│  🆔 ID: ${d.guild.id}\n`
        txt += `│  📊 Level: ${d.guild.level}\n`
        txt += `│  👥 Member: ${d.guild.members}/${d.guild.capacity}\n`
        if (d.guild.leader?.name) txt += `│  👑 Leader: ${d.guild.leader.name}\n`
        txt += `╰────────────────⬣\n\n`
    }
    
    if (d.pet) {
        txt += `╭──〔 🐾 *ᴘᴇᴛ* 〕───⬣\n`
        txt += `│  📛 Nama: ${d.pet.name}\n`
        txt += `│  📊 Level: ${d.pet.level}\n`
        if (d.pet.skill) txt += `│  ⚡ Skill: ${d.pet.skill}\n`
        txt += `╰────────────────⬣\n\n`
    }
    
    if (d.misc?.profile_image) {
        txt += `🖼️ *Foto Profil:* ${d.misc.profile_image}\n`
    }
    
    txt += `\n> 💡 Data dari server eksternal, bisa jadi tidak 100% akurat.`
    
    await m.reply(txt)
}

module.exports = {
    config,
    handler
}