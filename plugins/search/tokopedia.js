const config = require('../../config')
const axios = require('axios')
const crypto = require('crypto')

const pluginConfig = {
    name: 'tokopedia',
    alias: ['tokped', 'tped', 'caritokped', 'shop'],
    category: 'search',
    description: 'Cari produk di Tokopedia',
    usage: '.tokopedia <keyword>',
    example: '.tokopedia vivo x300',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 3,
    isEnabled: true
}

const ENDPOINT = 'https://gql.tokopedia.com/graphql/SearchProductV5Query'
const TIMEOUT = 30000
const ROWS = 30
const LIMIT = 5

const QUERY = `
query SearchProductV5Query($params: String!) {
  searchProductV5(params: $params) {
    header {
      totalData
      responseCode
      isQuerySafe
      additionalParams
    }
    data {
      totalDataText
      products {
        oldID: id
        id: id_str_auto_
        ttsProductID
        name
        url
        applink
        mediaURL {
          image
          image300
          videoCustom
        }
        shop {
          oldID: id
          id: id_str_auto_
          ttsSellerID
          name
          url
          city
          tier
        }
        stock {
          ttsSKUID
        }
        badge {
          oldID: id
          id: id_str_auto_
          title
          url
        }
        price {
          text
          number
          range
          original
          discountPercentage
        }
        labelGroups {
          position
          title
          type
          url
        }
        category {
          oldID: id
          id: id_str_auto_
          name
          breadcrumb
          gaKey
        }
        rating
        wishlist
        ads {
          id
          productClickURL
          productViewURL
          productWishlistURL
          tag
        }
      }
    }
  }
}
`

function buildParams(keyword, page, rows) {
    const deviceId = String(Math.floor(7000000000000000000 + Math.random() * 999999999999999999))
    const uniqueId = crypto.randomBytes(16).toString('hex')

    return new URLSearchParams({
        device: 'desktop',
        enter_method: 'normal_search',
        l_name: 'sre',
        navsource: 'home',
        ob: '23',
        page: String(page),
        q: keyword,
        related: 'true',
        rows: String(rows),
        safe_search: 'false',
        sc: '',
        scheme: 'https',
        shipping: '',
        show_adult: 'false',
        source: 'universe',
        st: 'product',
        start: String((page - 1) * rows),
        topads_bucket: 'true',
        unique_id: uniqueId,
        user_addressId: '',
        user_cityId: '176',
        user_districtId: '2274',
        user_id: '',
        user_lat: '',
        user_long: '',
        user_postCode: '',
        user_warehouseId: '',
        variants: '',
        warehouses: ''
    }).toString()
}

function formatPrice(price) {
    if (!price) return 'N/A'
    return `Rp${price.toLocaleString('id-ID')}`
}

function formatNumber(num) {
    if (!num) return '0'
    return num.toLocaleString('id-ID')
}

function formatSold(soldText) {
    if (!soldText) return 'N/A'
    return soldText
}

function getEmojiRating(rating) {
    if (!rating) return '⭐'
    if (rating >= 4.5) return '🌟'
    if (rating >= 4.0) return '⭐'
    if (rating >= 3.0) return '✨'
    return '💫'
}

async function handler(m, { sock }) {
    const args = m.text?.trim().split(/\s+/)
    const keyword = args.slice(0).join(' ')

    if (!keyword) {
        return m.reply(
            `🛍️ *TOKOPEDIA SEARCH - ZERO TWO* 🛍️\n\n` +
            `💫 *"He~ mau cari produk apa darling?"* 💫\n\n` +
            `📌 *Cara pakai:*\n` +
            `> ${m.prefix}tokopedia <keyword>\n\n` +
            `📝 *Contoh:*\n` +
            `> ${m.prefix}tokopedia vivo x300\n` +
            `> ${m.prefix}tokopedia iphone 15\n` +
            `> ${m.prefix}tokopedia sepatu\n\n` +
            `🌸 *Yosh! Semangat!* 🌸`
        )
    }

    await m.reply(`⏳ *Mencari produk...*\n\n🛍️ *Keyword:* ${keyword}\n\n> "Tunggu sebentar darling~ 🦋"`)

    try {
        const page = 1
        const deviceId = String(Math.floor(7000000000000000000 + Math.random() * 999999999999999999))
        const uniqueId = crypto.randomBytes(16).toString('hex')

        const payload = [{
            operationName: 'SearchProductV5Query',
            variables: {
                params: buildParams(keyword, page, ROWS)
            },
            query: QUERY
        }]

        const res = await axios.post(ENDPOINT, payload, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                'origin': 'https://www.tokopedia.com',
                'referer': 'https://www.tokopedia.com/',
                'x-tkpd-lite-service': 'zeus',
                'x-price-center': 'true',
                'bd-device-id': deviceId,
                'bd-web-id': deviceId,
                'x-version': 'bab78f7',
                'x-device': 'desktop-0.0',
                'x-dark-mode': 'false',
                'x-source': 'tokopedia-lite',
                'tkpd-userid': '',
                'iris_session_id': ''
            },
            timeout: TIMEOUT,
            validateStatus: () => true
        })

        const root = Array.isArray(res.data) ? res.data[0] : res.data
        const search = root?.data?.searchProductV5
        const header = search?.header || {}
        const products = search?.data?.products || []

        if (!products || products.length === 0) {
            return m.reply(
                `🛍️ *TOKOPEDIA SEARCH* 🛍️\n\n` +
                `💫 *"Wah~ gak ketemu nih darling~"* 💫\n\n` +
                `🔍 *Keyword:* ${keyword}\n` +
                `📊 *Hasil:* 0\n\n` +
                `💬 Coba pake keyword lain ya~ 🌸`
            )
        }

        const limitedProducts = products.slice(0, LIMIT)
        const total = Number(header?.totalData || products.length || 0)

        let caption = `🛍️ *TOKOPEDIA SEARCH RESULTS* 🛍️\n\n`
        caption += `🔍 *Keyword:* ${keyword}\n`
        caption += `📊 *Total:* ${formatNumber(total)}\n\n`

        for (let i = 0; i < limitedProducts.length; i++) {
            const p = limitedProducts[i]
            const name = p?.name || 'Unknown'
            const price = p?.price?.number || p?.price?.text || 'N/A'
            const priceFormatted = typeof price === 'number' ? formatPrice(price) : price
            const originalPrice = p?.price?.original ? formatPrice(p.price.original) : null
            const discount = p?.price?.discountPercentage || 0
            const rating = p?.rating || 'N/A'
            const sold = p?.labelGroups?.find(v => v.position === 'ri_product_credibility')?.title || 'N/A'
            const shopName = p?.shop?.name || 'Unknown'
            const shopCity = p?.shop?.city || 'N/A'
            const url = p?.url || null
            const image = p?.mediaURL?.image300 || p?.mediaURL?.image || null
            const ratingEmoji = getEmojiRating(rating)

            caption += `┌─〔 ${i + 1} 〕─🛍️\n`
            caption += `│ 📛 *${name.length > 50 ? name.slice(0, 50) + '...' : name}*\n`
            caption += `│ 💰 *Harga:* ${priceFormatted}\n`

            if (originalPrice && discount > 0) {
                caption += `│ 🏷️ *Diskon:* ${discount}% (${originalPrice})\n`
            }

            caption += `│ ${ratingEmoji} *Rating:* ${rating}\n`
            caption += `│ 📦 *Terjual:* ${formatSold(sold)}\n`
            caption += `│ 🏪 *Toko:* ${shopName} (${shopCity})\n`
            caption += `│ 🔗 *Link:* ${url || 'N/A'}\n`
            caption += `└─────────────────────────\n\n`
        }

        if (products.length > LIMIT) {
            caption += `📌 *...dan ${products.length - LIMIT} produk lainnya*\n\n`
        }

        caption += `💬 *Zero Two:* "Ini dia darling~ 🗿"\n`
        caption += `🌸 *Happy shopping!* 🌸`

        // Kirim gambar produk pertama sebagai preview
        const firstProduct = limitedProducts[0]
        const firstImage = firstProduct?.mediaURL?.image300 || firstProduct?.mediaURL?.image

        if (firstImage) {
            try {
                const imgRes = await axios.get(firstImage, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                })
                await sock.sendMessage(m.chat, {
                    image: Buffer.from(imgRes.data),
                    caption: caption
                }, { quoted: m })
            } catch {
                await m.reply(caption)
            }
        } else {
            await m.reply(caption)
        }

    } catch (err) {
        console.error('[Tokopedia Error]', err)
        await m.reply(
            `❌ *Error!*\n\n` +
            `> "He~ ada yang salah nih darling~ 🗿"\n\n` +
            `📝 *Error:* ${err.message}\n\n` +
            `💬 Coba lagi nanti ya~ 🌸`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}