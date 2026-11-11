// plugins/npm.js
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'npm',
    alias: ['npminstall', 'installpk'],
    category: 'owner',
    description: 'Install NPM package langsung dari bot (owner only)',
    usage: '.npm install <package>',
    example: '.npm install ffmpeg-static\n.npm install axios',
    isOwner: true,      // 🔒 HANYA OWNER!
    isPremium: false,
    isGroup: false,
    isPrivate: true,    // Cuma bisa di private chat
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

// Daftar package yang diizinkan (whitelist)
// Biar gak sembarangan install package berbahaya
const allowedPackages = [
    // Utility
    'axios', 'fs-extra', 'chalk', 'moment', 'moment-timezone',
    
    // Canvas/Image
    'canvas', '@napi-rs/canvas', 'sharp', 'jimp',
    
    // YouTube/Music
    'yt-search', 'ytdl-core', '@distube/ytdl-core', 'ytsr',
    
    // Scraper
    'cheerio', 'puppeteer', 'puppeteer-core',
    
    // Database
    'mongoose', 'mongodb', 'sqlite3', 'better-sqlite3', 'mysql2',
    
    // Other
    'qrcode', 'qrcode-terminal', 'socket.io-client', 'ws',
    'ffmpeg-static', 'fluent-ffmpeg',  // ← yang kamu minta
    'crypto-js', 'jsonwebtoken', 'express'
]

// Package yang DILARANG (berbahaya)
const dangerousPackages = [
    'child_process', 'exec', 'spawn', 'system', 'fs', 'path',
    'sudo', 'root', 'rm', 'delete', 'remove', 'unlink',
    '.git', '.env', 'config'
]

function isAllowed(packageName) {
    // Cek apakah package di whitelist atau bukan berbahaya
    const cleanName = packageName.toLowerCase().trim()
    
    // Cek berbahaya
    for (const danger of dangerousPackages) {
        if (cleanName.includes(danger)) {
            return { allowed: false, reason: `Package "${packageName}" dilarang karena berbahaya! 🗿` }
        }
    }
    
    // Cek whitelist
    if (allowedPackages.includes(cleanName)) {
        return { allowed: true }
    }
    
    // Package lain: tanya ijin dulu atau tolak
    return { allowed: false, reason: `Package "${packageName}" tidak ada di whitelist.\n\n📋 List package yang diizinkan:\n${allowedPackages.join(', ')}` }
}

async function handler(m, { sock }) {
    const text = m.text?.trim() || ''
    const args = text.split(/\s+/)
    
    // Format: .npm install <package> atau .npm i <package>
    if (args.length < 2 || (args[0] !== 'install' && args[0] !== 'i')) {
        return m.reply(`📦 *NPM INSTALLER*\n\n` +
            `> Cara penggunaan:\n` +
            `\`${m.prefix}npm install <package>\`\n\n` +
            `📌 *Contoh:*\n` +
            `• ${m.prefix}npm install axios\n` +
            `• ${m.prefix}npm i ffmpeg-static\n` +
            `• ${m.prefix}npm install cheerio\n\n` +
            `⚠️ *Catatan:*\n` +
            `• Hanya owner yang bisa pakai\n` +
            `• Hanya package yang terdaftar di whitelist\n` +
            `• Install di folder bot berjalan\n\n` +
            `🦋 *Zero Two:* Mau install apa darling? 🗿`)
    }
    
    const packageName = args[1]
    
    // Validasi package
    const validation = isAllowed(packageName)
    if (!validation.allowed) {
        return m.reply(`❌ *GAGAL INSTALL*\n\n${validation.reason}\n\n🦋 *Zero Two:* Gak boleh sembarangan ya darling~ 🔥`)
    }
    
    await m.react('⏳')
    
    // Cek apakah package sudah terinstall
    try {
        const packagePath = path.join(process.cwd(), 'node_modules', packageName)
        if (fs.existsSync(packagePath)) {
            await m.reply(`📦 *Package "${packageName}"* sudah terinstall.\n\n✅ Gak perlu install ulang darling~`)
            await m.react('✅')
            return
        }
    } catch (e) {}
    
    await m.reply(`📦 *Zero Two:* Sedang menginstall \`${packageName}\`...\n\nTunggu sebentar ya darling~ 🦋`)
    
    try {
        const startTime = Date.now()
        
        // Jalankan npm install
        const { stdout, stderr } = await execAsync(`npm install ${packageName}`, {
            cwd: process.cwd(),
            timeout: 120000 // 2 menit timeout
        })
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        
        // Cek apakah berhasil
        const checkPath = path.join(process.cwd(), 'node_modules', packageName)
        if (fs.existsSync(checkPath)) {
            let version = 'unknown'
            try {
                const packageJson = require(path.join(checkPath, 'package.json'))
                version = packageJson.version
            } catch (e) {}
            
            await m.reply(`✅ *INSTALL BERHASIL!*\n\n` +
                `📦 *Package:* ${packageName}\n` +
                `🏷️ *Version:* ${version}\n` +
                `⏱️ *Waktu:* ${duration} detik\n\n` +
                `📂 *Lokasi:* node_modules/${packageName}\n\n` +
                `💝 *Zero Two:* Selesai darling~ package nya udah siap dipake! 🎉`)
            await m.react('✅')
        } else {
            throw new Error('Package tidak ditemukan setelah install')
        }
        
    } catch (err) {
        console.error('[NPM] Error:', err)
        await m.react('❌')
        
        let errorMsg = err.message || String(err)
        
        if (errorMsg.includes('timeout')) {
            await m.reply(`❌ *INSTALL GAGAL*\n\n⏱️ Waktu install terlalu lama (timeout).\nCoba install manual di terminal ya darling~ 🗿`)
        } else if (errorMsg.includes('enoent') || errorMsg.includes('not found')) {
            await m.reply(`❌ *INSTALL GAGAL*\n\n📦 Package \`${packageName}\` tidak ditemukan di NPM.\nCek nama package nya ya darling~ 🔍`)
        } else {
            await m.reply(`❌ *INSTALL GAGAL*\n\n📦 Package: ${packageName}\n❌ Error: ${errorMsg.substring(0, 200)}\n\n> Coba install manual di terminal darling~ 🗿`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}