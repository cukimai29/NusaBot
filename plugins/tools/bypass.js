let puppeteerRealBrowser;
try {
    puppeteerRealBrowser = require('puppeteer-real-browser');
} catch {
    puppeteerRealBrowser = null;
}

const config = require('../../config');

const pluginConfig = {
    name: 'bypass',
    alias: ['bypasscf', 'waf', 'cloudflare', 'bypasscloudflare'],
    category: 'tools',
    description: 'Bypass Cloudflare WAF untuk dapat cookies & headers',
    usage: '.bypass <url>',
    example: '.bypass https://example.com',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 60,
    energi: 5,
    isEnabled: true
};

async function detectAcceptLanguage(page) {
    return page.evaluate(async () => {
        try {
            const data = await fetch('https://httpbin.org/get').then(r => r.json());
            return data?.headers?.['Accept-Language'] ?? data?.headers?.['accept-language'] ?? null;
        } catch (_) { return null; }
    });
}

async function wafSession(url, proxy) {
    const { browser } = await puppeteerRealBrowser.connect({
        headless: true,
        turnstile: true,
        disableXvfb: true,
        connectOption: { defaultViewport: null },
    });

    try {
        const opts = {};
        if (proxy?.host && proxy?.port) opts.proxyServer = `http://${proxy.host}:${proxy.port}`;
        const context = await browser.createBrowserContext(opts);
        try {
            const page = await context.newPage();
            if (proxy?.username && proxy?.password) await page.authenticate({ username: proxy.username, password: proxy.password });
            const acceptLanguage = await detectAcceptLanguage(page);
            await page.setRequestInterception(true);
            page.on('request', req => req.continue());

            const result = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('Timeout setelah 50 detik')), 50000);
                page.on('response', async res => {
                    try {
                        if (!([200, 302].includes(res.status()) && [url, url + '/'].includes(res.url()))) return;
                        await page.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => {});
                        const cookies = await page.cookies();
                        const rawHeaders = res.request().headers();
                        const headers = { ...rawHeaders };
                        const strip = ['content-type', 'accept-encoding', 'accept', 'content-length'];
                        for (const key of strip) delete headers[key];
                        if (acceptLanguage) headers['accept-language'] = acceptLanguage;
                        clearTimeout(timer);
                        resolve({ cookies, headers });
                    } catch (_) {}
                });
                page.goto(url, { waitUntil: 'domcontentloaded' }).catch(reject);
            });
            return result;
        } finally {
            await context.close().catch(() => {});
        }
    } finally {
        await browser.close().catch(() => {});
    }
}

function parseProxy(raw) {
    if (!raw) return null;
    const match = raw.match(/^(?:(.+):(.+)@)?([^:@]+):(\d+)$/);
    if (!match) return null;
    const [, username, password, host, port] = match;
    return { host, port, username: username || undefined, password: password || undefined };
}

async function handler(m, { sock }) {
    if (!puppeteerRealBrowser) {
        return m.reply(
            `❌ *Module belum terinstall!*\n\n` +
            `> Install dulu:\n` +
            `> \`npm install puppeteer-real-browser@1.3.0\`\n\n` +
            `> Lalu restart bot`
        );
    }

    const text = m.args.join(' ');

    if (!text) {
        return m.reply(
            `🛡️ *ʙʏᴘᴀꜱꜱ ᴄʟᴏᴜᴅꜰʟᴀʀᴇ ᴡᴀꜰ*\n\n` +
            `📌 Format: ${m.prefix}bypass <url>\n` +
            `📝 Contoh: ${m.prefix}bypass https://example.com\n\n` +
            `💡 Bisa tambah proxy:\n` +
            `> ${m.prefix}bypass https://example.com|host:port\n` +
            `> ${m.prefix}bypass https://example.com|user:pass@host:port`
        );
    }

    let url = text;
    let proxy = null;

    if (text.includes('|')) {
        const parts = text.split('|');
        url = parts[0].trim();
        proxy = parseProxy(parts[1]?.trim());
    }

    if (!url.startsWith('http')) {
        return m.reply('❌ URL harus pakai http/https');
    }

    m.react('⏳');

    try {
        const result = await wafSession(url, proxy);

        const cookiesStr = result.cookies.map(c => `${c.name}=${c.value}`).join('\n');
        const headersStr = Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join('\n');

        m.react('✅');

        await sock.sendMessage(m.chat, {
            text: `🛡️ *ʙʏᴘᴀꜱꜱ ʙᴇʀʜᴀꜱɪʟ*\n\n` +
                  `🔗 *URL:* ${url}\n\n` +
                  `🍪 *Cookies:*\n\`\`\`\n${cookiesStr || 'Tidak ada'}\n\`\`\`\n\n` +
                  `📋 *Headers:*\n\`\`\`\n${headersStr || 'Tidak ada'}\n\`\`\`\n\n` +
                  `> © RzkyADS`
        }, { quoted: m });

    } catch (err) {
        console.error('[Bypass] Error:', err.message);
        m.react('❌');
        return m.reply(`❌ *Gagal bypass!*\n\n> ${err.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};