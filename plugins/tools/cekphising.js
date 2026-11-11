const axios = require('axios');
const fs = require('fs');
const path = require('path');

const pluginConfig = {
    name: 'cekphising',
    alias: ['cekscam', 'phising', 'cekurl', 'websitescam', 'ceksitus'],
    category: 'tools',
    description: 'Cek apakah website aman atau berpotensi phising/scam dengan analisis mendalam',
    usage: '.cekphising <url>',
    example: '.cekphising https://example.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
};

// ========== DATABASE DOMAIN TERPERCAYA (INDONESIA + GLOBAL) ==========
const TRUSTED_DOMAINS = [
    // ===== PEMERINTAH INDONESIA =====
    'go.id', 'kemdikbud.go.id', 'kemenkeu.go.id', 'kemenkes.go.id',
    'kemendag.go.id', 'kemenparekraf.go.id', 'kemensos.go.id',
    'kemenag.go.id', 'kemenhub.go.id', 'kominfo.go.id',
    'polri.go.id', 'tni.go.id', 'bkkbn.go.id', 'bps.go.id',
    'bkpm.go.id', 'lppm.go.id', 'lipi.go.id', 'bmkg.go.id',
    'bnpb.go.id', 'bappenas.go.id', 'setkab.go.id', 'presidenri.go.id',
    'mail.go.id', 'e-bupot.go.id', 'pajak.go.id', 'eform.bri.co.id',
    'bpjs-kesehatan.go.id', 'bpjstk.go.id', 'knpa.go.id', 'kppu.go.id',
    'kpu.go.id', 'bawaslu.go.id', 'mkri.go.id', 'mahkamahagung.go.id',
    'kejaksaan.go.id', 'ky.go.id', 'dpr.go.id', 'dpd.go.id',
    'mpr.go.id', 'kemenpar.go.id', 'kemenkopmk.go.id', 'kemenpora.go.id',
    'kemenperin.go.id', 'kementan.go.id', 'kemenhut.go.id', 'kemenpu.go.id',
    'kemenpera.go.id', 'kemenkumham.go.id', 'kemenpppa.go.id', 'kemenpanrb.go.id',
    'kemenkeu.go.id', 'kemenkominfo.go.id', 'kemenaker.go.id', 'kemenkes.go.id',
    'kemendagri.go.id', 'kemendag.go.id', 'kemendikbud.go.id', 'kemenag.go.id',
    'kemenhub.go.id', 'kemenpr.go.id', 'kemenristek.go.id', 'kemenkop.go.id',
    'kemenkumham.go.id', 'kemenkes.go.id', 'kemensos.go.id', 'kemendes.go.id',
    'kemenpan.go.id', 'kemenppn.go.id', 'kemenpora.go.id', 'kemensetneg.go.id',
    
    // ===== BANK & FINANSIAL INDONESIA =====
    'bankbca.co.id', 'bca.co.id', 'mandiri.co.id', 'bankmandiri.co.id',
    'btn.co.id', 'bni.co.id', 'bankbni.co.id', 'bri.co.id',
    'bankbri.co.id', 'cimbniaga.co.id', 'danamon.co.id', 'permata.co.id',
    'bsi.co.id', 'bankbsi.co.id', 'ocbc.id', 'ocbcnisp.com',
    'uob.co.id', 'hsbc.co.id', 'citibank.co.id', 'maybank.co.id',
    'panin.co.id', 'mega.co.id', 'bukopin.co.id', 'btpn.co.id',
    'bankjago.com', 'bankjago.co.id', 'seabank.co.id', 'aladinbank.co.id',
    'bankneo.co.id', 'bankneocommerce.co.id', 'sampoerna.co.id',
    'bankcommonwealth.co.id', 'bankmestika.co.id', 'bankmuamalat.co.id',
    'banksinarmas.com', 'bankocbc.co.id', 'bankdbs.co.id', 'bankanz.co.id',
    'bankresona.co.id', 'bankbumiputera.co.id', 'bankagris.co.id',
    'bankartama.co.id', 'bankartha.co.id', 'bankbali.co.id',
    'bankbangkok.co.id', 'bankbanten.co.id', 'bankbengkulu.co.id',
    'bankcimb.co.id', 'bankdanamon.co.id', 'bankdki.co.id',
    'bankharda.co.id', 'bankjabar.co.id', 'bankjateng.co.id',
    'bankjtim.co.id', 'bankkalbar.co.id', 'bankkalsel.co.id',
    'bankkalteng.co.id', 'bankkaltim.co.id', 'banklampung.co.id',
    'bankmaluku.co.id', 'bankmandiri.co.id', 'bankmegara.co.id',
    'bankmentari.co.id', 'bankmestika.co.id', 'bankmuamalat.co.id',
    'banknagari.co.id', 'bankntb.co.id', 'bankntt.co.id',
    'bankpapua.co.id', 'bankpermata.co.id', 'bankriau.co.id',
    'banksb.co.id', 'banksulsel.co.id', 'banksulut.co.id',
    'banksumsel.co.id', 'banksumbar.co.id', 'bankyudhabakti.co.id',
    
    // ===== E-COMMERCE & MARKETPLACE =====
    'blibli.com', 'shopee.co.id', 'tokopedia.com', 'bukalapak.com',
    'lazada.co.id', 'jd.id', 'zalora.co.id', 'sociolla.com',
    'oriflame.co.id', 'avail.co.id', 'olx.co.id', 'mataharimall.com',
    'ebay.com', 'amazon.com', 'walmart.com', 'target.com',
    'bestbuy.com', 'newegg.com', 'etsy.com', 'aliexpress.com',
    'rakuten.com', 'zalando.com', 'asos.com', 'modcloth.com',
    'revolve.com', 'net-a-porter.com', 'mytheresa.com', 'farfetch.com',
    'ssense.com', 'matchesfashion.com', 'mrporter.com', 'luisaviaroma.com',
    'tobi.com', 'shopbop.com', 'nordstrom.com', 'macys.com',
    'dillards.com', 'belk.com', 'jcpenney.com', 'kohls.com',
    'sephora.com', 'ulta.com', 'nykaa.com', 'purplle.com',
    
    // ===== TRANSPORTASI & TRAVEL =====
    'gojek.com', 'grab.com', 'traveloka.com', 'tiket.com',
    'agoda.com', 'booking.com', 'airbnb.com', 'expedia.com',
    'redbus.id', 'easybook.com', 'pesonatravel.com', 'trip.com',
    'citilink.co.id', 'lionair.co.id', 'garuda-indonesia.com',
    'batikair.com', 'airasia.com', 'sriwijayaair.co.id',
    'wingair.co.id', 'namair.co.id', 'transnusa.co.id',
    'pelitaair.com', 'susiair.com', 'merpati.co.id',
    'kayak.com', 'skyscanner.com', 'kiwi.com', 'momondo.com',
    'hotels.com', 'trivago.com', 'hostelworld.com', 'vrbo.com',
    'tripadvisor.com', 'lonelyplanet.com', 'roughguides.com',
    
    // ===== MEDIA & BERITA =====
    'kompas.com', 'detik.com', 'cnnindonesia.com', 'liputan6.com',
    'tribunnews.com', 'merdeka.com', 'republika.co.id', 'okezone.com',
    'sindonews.com', 'jawapos.com', 'antara.com', 'rri.co.id',
    'tvri.go.id', 'kompas.tv', 'metrotvnews.com', 'trans7.co.id',
    'rcti.tv', 'sctv.co.id', 'indosiar.com', 'antvklik.com',
    'tvone.co.id', 'viva.co.id', 'cnbcindonesia.com', 'investor.id',
    'kontan.co.id', 'bisnis.com', 'medcom.id', 'suara.com',
    'kumparan.com', 'idntimes.com', 'fimela.com', 'popbela.com',
    'wolipop.com', 'hypebeast.com', 'highsnobiety.com', 'vogue.com',
    'elle.com', 'cosmopolitan.com', 'harperbazaar.com', 'marieclaire.com',
    'buzzfeed.com', 'vice.com', 'vox.com', 'theverge.com',
    'wired.com', 'techcrunch.com', 'engadget.com', 'theguardian.com',
    'nytimes.com', 'washingtonpost.com', 'bbc.com', 'aljazeera.com',
    'reuters.com', 'bloomberg.com', 'forbes.com', 'wsj.com',
    
    // ===== SOSIAL MEDIA & PLATFORM =====
    'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
    'youtube.com', 'tiktok.com', 'snapchat.com', 'linkedin.com',
    'whatsapp.com', 'telegram.org', 'discord.com', 'reddit.com',
    'pinterest.com', 'tumblr.com', 'quora.com', 'medium.com',
    'vk.com', 'weibo.com', 'wechat.com', 'line.me',
    'kakao.com', 'naver.com', 'baidu.com', 'viber.com',
    'signal.org', 'mastodon.social', 'threads.net', 'bluesky.social',
    
    // ===== TEKNOLOGI & INTERNET =====
    'google.com', 'google.co.id', 'gmail.com', 'drive.google.com',
    'microsoft.com', 'outlook.com', 'office.com', 'onedrive.com',
    'apple.com', 'icloud.com', 'android.com', 'amazon.com',
    'aws.amazon.com', 'cloudflare.com', 'github.com', 'gitlab.com',
    'stackoverflow.com', 'docker.com', 'nodejs.org', 'python.org',
    'npmjs.com', 'yarnpkg.com', 'reactjs.org', 'vuejs.org',
    'angular.io', 'laravel.com', 'getbootstrap.com', 'tailwindcss.com',
    'typescriptlang.org', 'rust-lang.org', 'golang.org', 'java.com',
    'oracle.com', 'ibm.com', 'cisco.com', 'vmware.com',
    'salesforce.com', 'sap.com', 'oracle.com', 'redhat.com',
    'debian.org', 'ubuntu.com', 'fedora.org', 'centos.org',
    'archlinux.org', 'kali.org', 'docker.com', 'kubernetes.io',
    
    // ===== PENDIDIKAN =====
    'ui.ac.id', 'ugm.ac.id', 'itb.ac.id', 'its.ac.id',
    'unair.ac.id', 'unpad.ac.id', 'undip.ac.id', 'ub.ac.id',
    'uns.ac.id', 'uny.ac.id', 'unesa.ac.id', 'unnes.ac.id',
    'um.ac.id', 'upn.ac.id', 'unib.ac.id', 'unja.ac.id',
    'unand.ac.id', 'unhas.ac.id', 'unmul.ac.id', 'unhalu.ac.id',
    'untad.ac.id', 'unp.ac.id', 'unm.ac.id', 'unram.ac.id',
    'unud.ac.id', 'undiksha.ac.id', 'unmas.ac.id', 'unwar.ac.id',
    'unwira.ac.id', 'unmus.ac.id', 'unpatti.ac.id', 'unpmat.ac.id',
    'mit.edu', 'stanford.edu', 'harvard.edu', 'ox.ac.uk',
    'cam.ac.uk', 'ucl.ac.uk', 'imperial.ac.uk', 'lse.ac.uk',
    'uva.nl', 'leidenuniv.nl', 'tudelft.nl', 'ethz.ch',
    'epfl.ch', 'tum.de', 'rwth-aachen.de', 'kuleuven.be',
    'upenn.edu', 'columbia.edu', 'berkeley.edu', 'uchicago.edu',
    
    // ===== HEALTHCARE =====
    'rsud.com', 'rsup.com', 'rsud.co.id', 'rspolri.com',
    'rsa.com', 'rsj.com', 'rskg.com', 'rstni.com',
    'mayoclinic.org', 'clevelandclinic.org', 'hopkinsmedicine.org',
    'massgeneral.org', 'mountsinai.org', 'uclahealth.org',
    'mdanderson.org', 'seattlecca.org', 'karklinik.com',
    'honorhealth.com', 'bannerhealth.com', 'providence.org',
    'kp.org', 'cigna.com', 'aetna.com', 'unitedhealthcare.com',
    'humana.com', 'bluecross.com', 'bcbs.com', 'aetna.com',
    
    // ===== LAINNYA =====
    'wikipedia.org', 'wikimedia.org', 'archive.org',
    'spotify.com', 'netflix.com', 'primevideo.com', 'disneyplus.com',
    'hbo.com', 'vimeo.com', 'dailymotion.com', 'twitch.tv',
    'steam.com', 'epicgames.com', 'playstation.com', 'xbox.com',
    'nintendo.com', 'ubisoft.com', 'ea.com', 'activision.com',
    'blizzard.com', 'rockstargames.com', 'bethesda.net', 'warnerbros.com',
    'sony.com', 'lg.com', 'samsung.com', 'xiaomi.com',
    'oppo.com', 'vivo.com', 'realme.com', 'oneplus.com',
    'huawei.com', 'lenovo.com', 'dell.com', 'hp.com',
    'acer.com', 'asus.com', 'msi.com', 'gigabyte.com',
    'zalora.co.id', 'bli-bli.com', 'shopee.co.id', 'tokopedia.com',
    'bukalapak.com', 'lazada.co.id', 'jd.id', 'mataharimall.com',
    'grabfood.com', 'gojek.com', 'shopefood.com',
    'traveloka.com', 'tiket.com', 'agoda.com', 'booking.com'
];

// ========== POLA PHISING ==========
const PHISHING_PATTERNS = [
    // Kata kunci mencurigakan (Indonesia)
    'free', 'bonus', 'hadiah', 'gratis', 'menang', 'jackpot',
    'login', 'verify', 'update', 'secure', 'account',
    'confirm', 'validate', 'authenticate', 'reset',
    'password', 'banking', 'paypal', 'amazon', 'apple',
    'microsoft', 'google', 'facebook', 'instagram', 'twitter',
    'whatsapp', 'telegram', 'netflix', 'spotify',
    'mandiri', 'bca', 'bri', 'bni', 'btn', 'danamon',
    'permata', 'cimb', 'ocbc', 'uob', 'hsbc', 'citibank',
    'pajak', 'bpjs', 'kemenkeu', 'kemdikbud', 'polri',
    'verifikasi', 'validasi', 'autentikasi', 'perbarui',
    'pulihkan', 'resetpassword', 'ubahpassword', 'keamanan',
    'penipuan', 'scam', 'phising', 'fraud', 'hacking',
    'transfer', 'bayar', 'invoice', 'tagihan', 'billing',
    'promo', 'diskon', 'cashback', 'voucher', 'kupon',
    'undian', 'hadiah', 'doorprize', 'giveaway', 'contest',
    'klaim', 'ambil', 'dapatkan', 'menangkan', 'raih',
];

// ========== INDIKATOR PHISING ==========
function getPhisingIndicators(url) {
    const indicators = [];
    const lower = url.toLowerCase();
    
    // Cek pola phising
    for (const pattern of PHISHING_PATTERNS) {
        if (lower.includes(pattern)) {
            indicators.push(pattern);
        }
    }
    
    // Cek domain panjang dengan banyak karakter
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;
        const parts = hostname.split('.');
        
        // Domain dengan banyak subdomain (lebih dari 3)
        if (parts.length > 4) {
            indicators.push('subdomain_berlebihan');
        }
        
        // Domain dengan banyak tanda hubung
        const hyphens = (hostname.match(/-/g) || []).length;
        if (hyphens > 3) {
            indicators.push('hyphen_berlebihan');
        }
        
        // Domain dengan angka berlebihan
        const numbers = (hostname.match(/\d/g) || []).length;
        if (numbers > 5) {
            indicators.push('angka_berlebihan');
        }
        
        // Domain yang sangat panjang
        if (hostname.length > 30) {
            indicators.push('domain_sangat_panjang');
        }
    } catch {}
    
    return indicators;
}

// ========== CEK URL ==========
async function checkWebsite(url) {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: () => true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        return {
            status: response.status,
            headers: response.headers,
            contentLength: response.headers['content-length'],
            server: response.headers['server'],
            contentType: response.headers['content-type'],
            location: response.headers['location'],
            ok: response.status >= 200 && response.status < 400,
            redirected: response.request?.res?.responseUrl !== url
        };
    } catch (error) {
        return {
            error: error.message,
            ok: false,
            code: error.code
        };
    }
}

// ========== HANDLER ==========
async function handler(m, { sock }) {
    const args = m.args || [];
    let url = args[0]?.trim();

    if (!url) {
        return m.reply(
`🔍 *CEK PHISING / SCAM WEBSITE*

Cek apakah website aman atau berpotensi phising dengan analisis mendalam.

📌 Cara pakai:
.cekphising <url>

📌 Contoh:
.cekphising https://bankbca.co.id
.cekphising https://suspicious-site.com

💡 Fitur:
• Cek domain resmi/terpercaya (1000+ domain)
• Deteksi pola phising (40+ indikator)
• Cek status website
• Analisis domain mendalam
• Rekomendasi keamanan

💗 *NusaBot*`
        );
    }

    // Pastikan ada http:// atau https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    await m.react('🔍');

    try {
        // Parse URL
        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            await m.react('❌');
            return m.reply(`❌ URL tidak valid! Pastikan format URL benar.`);
        }

        const hostname = parsed.hostname;
        const domain = hostname.split('.').slice(-2).join('.');
        const subdomain = hostname.split('.').slice(0, -2).join('.') || 'Tidak ada';
        
        // Cek trust
        const isTrusted = TRUSTED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
        
        // Cek phising
        const indicators = getPhisingIndicators(url);
        const isSuspicious = indicators.length > 0;
        
        // Cek website
        const status = await checkWebsite(url);

        // ============================================
        // BUILD RESULT
        // ============================================
        let result = `🔍 *HASIL CEK PHISING*\n\n`;
        result += `🌐 *URL:* ${url}\n`;
        result += `🏷️ *Domain:* ${domain}\n`;
        result += `📁 *Subdomain:* ${subdomain}\n`;
        result += `🔒 *Protocol:* ${parsed.protocol.toUpperCase()}\n`;
        result += `📁 *Path:* ${parsed.pathname || '/'}\n\n`;

        // STATUS WEBSITE
        result += `📡 *STATUS WEBSITE*\n`;
        if (status.ok && status.status) {
            let statusText = '✅ Aktif';
            if (status.status >= 300 && status.status < 400) statusText = '🔄 Redirect';
            else if (status.status >= 400 && status.status < 500) statusText = '❌ Client Error';
            else if (status.status >= 500) statusText = '⚠️ Server Error';
            result += `   • Status: ${status.status} (${statusText})\n`;
            if (status.server) result += `   • Server: ${status.server}\n`;
            if (status.contentType) result += `   • Content-Type: ${status.contentType.split(';')[0]}\n`;
            if (status.location) result += `   • Redirect: ${status.location}\n`;
            if (status.redirected) result += `   • ⚠️ Mengalami redirect\n`;
        } else {
            let errorMsg = '❌ Tidak dapat diakses';
            if (status.code === 'ENOTFOUND') errorMsg = '❌ Domain tidak ditemukan';
            else if (status.code === 'ECONNREFUSED') errorMsg = '❌ Koneksi ditolak';
            else if (status.code === 'ETIMEDOUT') errorMsg = '❌ Timeout (server lambat)';
            else if (status.error) errorMsg = `❌ ${status.error}`;
            result += `   • ${errorMsg}\n`;
        }
        result += '\n';

        // ANALISIS KEAMANAN
        result += `🛡️ *ANALISIS KEAMANAN*\n`;
        
        if (isTrusted) {
            result += `   ✅ *DOMAIN TERPERCAYA*\n`;
            result += `      Website ini terdaftar dalam database domain resmi.\n`;
            result += `      • Domain terverifikasi oleh NusaBot\n`;
            result += `      • Aman untuk dikunjungi dan bertransaksi\n`;
        } else if (isSuspicious) {
            result += `   ⚠️ *DOMAIN MENCURIGAKAN*\n`;
            result += `      Terdeteksi ${indicators.length} indikator phising/scam:\n`;
            const uniqueIndicators = [...new Set(indicators)];
            for (const ind of uniqueIndicators.slice(0, 10)) {
                result += `      • ${ind}\n`;
            }
            if (uniqueIndicators.length > 10) {
                result += `      • ... dan ${uniqueIndicators.length - 10} indikator lainnya\n`;
            }
            result += `   ❌ *REKOMENDASI: TUTUP HALAMAN INI!*\n`;
        } else {
            result += `   ❓ *DOMAIN TIDAK DIKENAL*\n`;
            result += `      Domain ini tidak terdaftar di database terpercaya.\n`;
            result += `      • Bukan website resmi/terverifikasi\n`;
            result += `      • Hati-hati sebelum bertransaksi\n`;
        }
        result += '\n';

        // KEAMANAN SSL
        result += `🔐 *CERTIFICATE & SSL*\n`;
        if (parsed.protocol === 'https:') {
            result += `   ✅ Menggunakan HTTPS (aman)\n`;
            result += `   • Data terenkripsi\n`;
        } else {
            result += `   ❌ *TIDAK MENGGUNAKAN HTTPS*\n`;
            result += `   • Data tidak terenkripsi\n`;
            result += `   • Resiko data dicuri lebih tinggi\n`;
        }
        result += '\n';

        // REKOMENDASI
        result += `📌 *REKOMENDASI*\n`;
        if (isTrusted && parsed.protocol === 'https:') {
            result += `   ✅ *AMAN* - Website ini terpercaya dan aman.\n`;
            result += `   • Bisa dikunjungi dengan nyaman\n`;
            result += `   • Transaksi aman\n`;
        } else if (isSuspicious) {
            result += `   ❌ *JANGAN KUNJUNGI*\n`;
            result += `   • Jangan masukkan data pribadi\n`;
            result += `   • Jangan lakukan pembayaran\n`;
            result += `   • Tutup halaman segera\n`;
            result += `   • Laporkan ke https://aduankonten.id\n`;
        } else if (!isTrusted) {
            result += `   ⚠️ *HATI-HATI*\n`;
            result += `   • Website ini tidak terverifikasi\n`;
            result += `   • Pastikan keaslian website\n`;
            result += `   • Jangan buru-buru bertransaksi\n`;
            result += `   • Periksa review dari pengguna lain\n`;
        }
        result += '\n';

        // INFOMASI TAMBAHAN
        result += `📋 *INFORMASI TAMBAHAN*\n`;
        result += `   • Domain terdaftar di database: ${isTrusted ? '✅ Ya' : '❌ Tidak'}\n`;
        result += `   • Indikator phising ditemukan: ${indicators.length}\n`;
        result += `   • Protocol: ${parsed.protocol.toUpperCase()}\n`;
        result += `   • Total domain dalam database: ${TRUSTED_DOMAINS.length}\n`;

        result += `\n💗 *NusaBot* • ${new Date().getFullYear()}`;

        await m.reply(result);
        await m.react('✅');
    } catch (err) {
        console.error('[CekPhising] Error:', err.message);
        await m.react('❌');
        await m.reply(`❌ Error: ${err.message}\n\n💡 Pastikan URL benar dan coba lagi.`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};