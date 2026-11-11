const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Ambil video assets dari CDN
const videoAssets = require('../../assets/video/assets-vd');

const pluginConfig = {
    name: 'testing',
    alias: ['test'],
    category: 'main',
    description: 'Test plugin - Send PTV to newsletter',
    usage: '.test',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.react('⏳')
    try {
        // Ambil video dari CDN
        const videoUrl = videoAssets['zerotwo.mp4'] || videoAssets['zerotwo-v16.mp4'];
        
        if (!videoUrl) {
            throw new Error('Video URL tidak ditemukan di assets-vd.js');
        }
        
        // Download video dari CDN
        const response = await axios.get(videoUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000
        });
        const videoBuffer = Buffer.from(response.data);
        
        await sock.sendMessage(
            "120363402057133599@newsletter",
            {
                video: videoBuffer,
                mimetype: "video/mp4",
                ptv: true
            }
        );
        
        await m.react('✅')
        await m.reply('✅ Berhasil kirim PTV ke newsletter!')
        
    } catch (error) {
        console.error('[Test Plugin] Error:', error)
        await m.react('❌')
        await m.reply(`❌ Gagal: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}