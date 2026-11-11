const config = {
    name: 'wikipedia',
    alias: ['wiki', 'wikipediasearch', 'wikiid'],
    category: 'search',
    description: 'Cari informasi dari Wikipedia Indonesia',
    usage: '.wiki <query>',
    example: '.wiki Rendang',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const axios = require("axios");
const cheerio = require("cheerio");

const LANG = "id";
const LIMIT = 1;

const BASE = `https://${LANG}.wikipedia.org`;
const API = `${BASE}/w/api.php`;

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function decodeHtml(text) {
  return String(text || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(text) {
  return decodeHtml(text)
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\[[a-z]\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanBlock(text) {
  return decodeHtml(text)
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\[[a-z]\]/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fixUrl(url) {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

function uniqueBy(array, key) {
  return array.filter((item, index, self) => self.findIndex(x => x[key] === item[key]) === index);
}

async function searchWikipedia(query) {
  const { data, status } = await axios.get(API, {
    params: {
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: LIMIT,
      format: "json",
      origin: "*"
    },
    headers: {
      "user-agent": UA,
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  });

  return {
    code: status,
    results: data?.query?.search || []
  };
}

async function getFullArticle(title) {
  const pagePath = `/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
  const pageUrl = `${BASE}${pagePath}`;

  const { data, status } = await axios.get(pageUrl, {
    headers: {
      "user-agent": UA,
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "referer": "https://www.wikipedia.org/"
    }
  });

  const $ = cheerio.load(data);

  $("script, style, noscript, sup.reference, .mw-editsection, .navbox, .metadata, .ambox, .hatnote, .toc, #toc, table.vertical-navbox").remove();

  const pageTitle = cleanText($("#firstHeading").text()) || title;

  const introParagraphs = [];

  $(".mw-parser-output > section").first().find("p").each((_, el) => {
    const text = cleanBlock($(el).text());
    if (text.length > 40) introParagraphs.push(text);
  });

  if (!introParagraphs.length) {
    $(".mw-parser-output > p").each((_, el) => {
      const text = cleanBlock($(el).text());
      if (text.length > 40) introParagraphs.push(text);
    });
  }

  const sections = [];

  $(".mw-parser-output > section").each((_, section) => {
    const heading = cleanText($(section).find("h2, h3").first().text());

    if (!heading || heading.toLowerCase() === "daftar isi") return;

    const texts = [];

    $(section).find("p, ul, ol").each((_, el) => {
      const text = cleanBlock($(el).text());
      if (text.length > 40) texts.push(text);
    });

    if (texts.length) {
      sections.push({
        title: heading,
        text: texts.join("\n\n").slice(0, 1500)
      });
    }
  });

  const infobox = {};

  $(".infobox tr").each((_, tr) => {
    const key = cleanText($(tr).find("th").first().text());
    const value = cleanText($(tr).find("td").first().text());

    if (key && value && key.length < 100) {
      infobox[key] = value;
    }
  });

  const images = [];

  $(".mw-parser-output img").each((_, img) => {
    const src = fixUrl($(img).attr("src"));
    const alt = cleanText($(img).attr("alt"));

    if (!src) return;
    if (src.includes("static/images")) return;
    if (src.includes("Semi-protection")) return;
    if (src.includes("OOjs_UI")) return;

    images.push({
      alt: alt || null,
      url: src
    });
  });

  return {
    code: status,
    article: {
      title: pageTitle,
      url: pageUrl,
      extract: introParagraphs.join("\n\n") || null,
      sections: sections,
      infobox: infobox,
      image: images[0]?.url || null
    }
  };
}

async function handler(m) {
  try {
    const query = m.text?.trim();
    
    if (!query) {
      return m.reply(`📖 *WIKIPEDIA SEARCH*\n\n> Cari informasi dari Wikipedia\n\n> Contoh: .wiki Rendang\n> Contoh: .wiki Jakarta`);
    }

    await m.reply(`⏳ *Mencari informasi tentang "${query}"...*`);

    const search = await searchWikipedia(query);

    if (!search.results.length) {
      return m.reply(`❌ *TIDAK DITEMUKAN*\n\n> Artikel dengan judul *"${query}"* tidak ditemukan di Wikipedia.\n\n> Coba dengan kata kunci lain!`);
    }

    const first = search.results[0];
    const detail = await getFullArticle(first.title);

    if (!detail.article.extract) {
      return m.reply(`❌ *GAGAL MENGAMBIL ARTIKEL*\n\n> Tidak bisa mengambil konten artikel. Coba lagi nanti.`);
    }

    let replyText = `📖 *${detail.article.title}*\n`;
    replyText += `🔗 ${detail.article.url}\n\n`;
    replyText += `📝 *${detail.article.extract.slice(0, 1000)}*\n`;

    if (Object.keys(detail.article.infobox).length > 0) {
      replyText += `\n📊 *INFORMASI SINGKAT:*\n`;
      const infoEntries = Object.entries(detail.article.infobox).slice(0, 5);
      for (const [key, value] of infoEntries) {
        replyText += `• *${key}:* ${value.slice(0, 100)}\n`;
      }
    }

    if (detail.article.sections.length > 0) {
      replyText += `\n📑 *BAB LAINNYA:*\n`;
      const sectionTitles = detail.article.sections.slice(0, 3).map(s => `• ${s.title}`);
      replyText += sectionTitles.join('\n');
    }

    if (replyText.length > 3000) {
      replyText = replyText.slice(0, 2950) + "\n\n> *[Konten dipotong karena terlalu panjang]*";
    }

    replyText += `\n\n> 📖 Sumber: Wikipedia ${LANG.toUpperCase()}`;

    await m.reply(replyText);

    if (detail.article.image) {
      await m.reply(`🖼️ *GAMBAR TERKAIT:*\n${detail.article.image}`);
    }

  } catch (error) {
    console.error('Wikipedia Error:', error);
    await m.reply(`❌ *ERROR*\n\n${error.message}`);
  }
}

module.exports = {
  config,
  handler
}