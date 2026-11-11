const pluginConfig = {
    name: 'imgtopdf',
    alias: [
        'topdf',
        'imagepdf',
        'jpgpdf',
        'pngpdf',
        'webppdf',
        'mediapdf'
    ],
    category: 'tools',
    description: 'Mengubah gambar jadi PDF. Kirim 1 foto = 1 PDF. Kirim 2+ foto sekaligus = otomatis dapat 3 versi hasil sekaligus.',
    usage: '.imgtopdf dengan reply/caption gambar (bisa kirim banyak foto sekaligus)',
    example: '.imgtopdf',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
};

// ======================================================
// DEPENDENCY
// ======================================================

const fs = require('fs');
const path = require('path');
const os = require('os');

let PDFDocument = null;
let sharp = null;

try {
    const pdfLib = require('pdf-lib');
    PDFDocument = pdfLib.PDFDocument;
} catch (error) {
    console.error('[IMGTOPDF] pdf-lib tidak ditemukan:', error.message);
}

try {
    sharp = require('sharp');
} catch (error) {
    console.error('[IMGTOPDF] sharp tidak ditemukan:', error.message);
}

// ======================================================
// TEMP DIR
// ======================================================

const TEMP_DIR = path.join(os.tmpdir(), 'kenzie-imgtopdf');

function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
}

// ======================================================
// BATCH DETEKSI ALBUM (BANYAK FOTO SEKALIGUS)
// ======================================================
// Gambar yang datang beruntun (dalam jeda singkat) dari
// orang yang sama di chat yang sama, ditampung dulu.
// Setelah tidak ada foto baru selama DEBOUNCE_MS,
// batch dianggap selesai lalu langsung diproses.

const pendingBatches = new Map();

const DEBOUNCE_MS = 1500;          // jeda tunggu antar foto dalam 1 batch
const MAX_IMAGES_PER_BATCH = 30;   // batas jumlah foto per batch

function getBatchKey(m) {
    const chat = m.chat;
    const sender = m.sender || m.key?.participant || m.key?.remoteJid;
    return `${chat}::${sender}`;
}

const COMMAND_REGEX =
    /^[.!/#]?\s*(imgtopdf|topdf|imagepdf|jpgpdf|pngpdf|webppdf|mediapdf)\b/i;

function captionInvokesCommand(text) {
    if (!text) return false;
    return COMMAND_REGEX.test(String(text).trim());
}

function getCaptionText(m) {
    return (
        m.text ||
        m.message?.imageMessage?.caption ||
        ''
    );
}

// ======================================================
// NAMA FILE
// ======================================================

function generateFileName(suffix = '') {
    const now = new Date();

    const tanggal =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');

    const waktu =
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

    const random = Math.random().toString(36).substring(2, 8);

    return `IMG_${tanggal}_${waktu}_${random}${suffix}`;
}

// ======================================================
// CEK MEDIA
// ======================================================

function getMediaFromMessage(m) {

    if (m.quoted && m.quoted.isMedia) {
        return {
            source: m.quoted,
            type: m.quoted.type,
            mimetype: m.quoted.message?.mimetype || ''
        };
    }

    if (m.isMedia) {
        return {
            source: m,
            type: m.type,
            mimetype: m.mimetype || ''
        };
    }

    return null;
}

function isSupportedImage(media) {

    if (!media) return false;

    const type = media.type || '';
    const mimetype = String(media.mimetype || '').toLowerCase();

    if (type === 'imageMessage') return true;

    const supportedMime = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'image/gif', 'image/bmp', 'image/tiff', 'image/x-tiff',
        'image/avif', 'image/heic', 'image/heif'
    ];

    return supportedMime.some(mime => mimetype.startsWith(mime));
}

// ======================================================
// DOWNLOAD MEDIA
// ======================================================

async function downloadMedia(media) {

    if (!media || !media.source) {
        throw new Error('Media tidak ditemukan.');
    }

    const source = media.source;

    if (typeof source.download === 'function') {

        const result = await source.download();

        if (!result) throw new Error('Gambar gagal didownload.');

        if (Buffer.isBuffer(result)) return result;
        if (result instanceof Uint8Array) return Buffer.from(result);
    }

    if (typeof source.downloadMedia === 'function') {

        const result = await source.downloadMedia();

        if (Buffer.isBuffer(result)) return result;
        if (result instanceof Uint8Array) return Buffer.from(result);
    }

    throw new Error('SC tidak menyediakan fungsi download media.');
}

// ======================================================
// KONVERSI & SUSUN PDF
// ======================================================

async function convertToPng(buffer) {

    if (!sharp) throw new Error('Module sharp tidak tersedia.');

    return sharp(buffer, { animated: false })
        .rotate()
        .png({ compressionLevel: 9 })
        .toBuffer();
}

async function addImagePage(pdf, imageBuffer) {

    const pngBuffer = await convertToPng(imageBuffer);
    const metadata = await sharp(pngBuffer).metadata();

    const imageWidth = metadata.width || 1;
    const imageHeight = metadata.height || 1;

    const image = await pdf.embedPng(pngBuffer);

    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;
    const MARGIN = 20;

    const maxWidth = A4_WIDTH - (MARGIN * 2);
    const maxHeight = A4_HEIGHT - (MARGIN * 2);

    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);

    const width = imageWidth * scale;
    const height = imageHeight * scale;

    const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);

    const x = (A4_WIDTH - width) / 2;
    const y = (A4_HEIGHT - height) / 2;

    page.drawImage(image, { x, y, width, height });
}

async function createPdf(imageBuffers, outputPath) {

    if (!PDFDocument) throw new Error('pdf-lib belum terinstall.');
    if (!sharp) throw new Error('sharp belum tersedia.');

    const buffers = Array.isArray(imageBuffers) ? imageBuffers : [imageBuffers];

    if (!buffers.length) throw new Error('Tidak ada gambar untuk dijadikan PDF.');

    const pdf = await PDFDocument.create();

    for (const buffer of buffers) {
        await addImagePage(pdf, buffer);
    }

    const pdfBytes = await pdf.save();
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
}

// ======================================================
// KIRIM SATU FILE PDF
// ======================================================

async function sendOnePdf(m, sock, imageBuffers, fileName, captionExtra) {

    ensureTempDir();

    const pdfPath = path.join(TEMP_DIR, `${fileName}.pdf`);

    try {

        await createPdf(imageBuffers, pdfPath);

        const pdfBuffer = fs.readFileSync(pdfPath);

        if (!pdfBuffer.length) throw new Error('File PDF kosong.');

        await sock.sendMessage(
            m.chat,
            {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `${fileName}.pdf`,
                caption:
`📄 *${fileName}.pdf*
${captionExtra || ''}
📦 ${(pdfBuffer.length / 1024).toFixed(2)} KB`
            },
            { quoted: m }
        );

    } finally {

        try {
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        } catch (error) {
            console.error('[IMGTOPDF CLEANUP]', error.message);
        }
    }
}

// ======================================================
// PROSES SATU FOTO (LANGSUNG 1 PDF, TANPA VERSI)
// ======================================================

async function processSingleImage(m, sock, imageBuffer) {

    try {
        await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    } catch (e) {}

    const fileName = generateFileName();

    await sendOnePdf(m, sock, [imageBuffer], fileName, '');

    try {
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {}
}

// ======================================================
// PROSES BANYAK FOTO SEKALIGUS
// LANGSUNG KIRIM 3 VERSI HASIL, TANPA KONFIRMASI
// ======================================================
// VERSI 1: Album foto asli (dikirim ulang apa adanya, berurutan)
// VERSI 2: PDF gabungan (1 file, multi-halaman)
// VERSI 3: PDF terpisah (1 file PDF per foto)

async function processBatchImages(m, sock, images) {

    const total = images.length;

    try {
        await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    } catch (e) {}

    await sock.sendMessage(
        m.chat,
        {
            text:
`📸 Terdeteksi *${total} foto* dikirim sekaligus.
Sedang membuat 3 versi hasil, tunggu sebentar...`
        },
        { quoted: m }
    );

    // ==================================================
    // VERSI 1: ALBUM FOTO ASLI
    // ==================================================

    try {

        await sock.sendMessage(
            m.chat,
            { text: `🖼️ *VERSI 1 - Album Foto Asli* (${total} foto)` }
        );

        for (const buffer of images) {
            await sock.sendMessage(m.chat, { image: buffer });
        }

    } catch (error) {
        console.error('[IMGTOPDF ALBUM ERROR]', error);
        await m.reply('⚠️ Gagal mengirim versi album foto asli.');
    }

    // ==================================================
    // VERSI 2: PDF GABUNGAN
    // ==================================================

    try {

        const gabungName = generateFileName('_GABUNG');

        await sendOnePdf(
            m,
            sock,
            images,
            gabungName,
            `\n📚 *VERSI 2 - PDF Gabungan* (${total} halaman dalam 1 file)`
        );

    } catch (error) {
        console.error('[IMGTOPDF GABUNG ERROR]', error);
        await m.reply('⚠️ Gagal membuat versi PDF gabungan.');
    }

    // ==================================================
    // VERSI 3: PDF TERPISAH (1 FILE PER FOTO)
    // ==================================================

    try {

        await sock.sendMessage(
            m.chat,
            { text: `📑 *VERSI 3 - PDF Terpisah* (${total} file)` }
        );

        let index = 1;

        for (const buffer of images) {

            const pisahName = generateFileName(`_${index}dari${total}`);

            await sendOnePdf(
                m,
                sock,
                [buffer],
                pisahName,
                `\n📑 Foto ke-${index}/${total}`
            );

            index++;
        }

    } catch (error) {
        console.error('[IMGTOPDF PISAH ERROR]', error);
        await m.reply('⚠️ Gagal membuat versi PDF terpisah.');
    }

    try {
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {}

    await m.reply(
`✅ *SELESAI*

3 versi sudah dikirim:
1️⃣ Album foto asli
2️⃣ PDF gabungan (1 file)
3️⃣ PDF terpisah (${total} file)`
    );
}

// ======================================================
// BATCH HANDLING
// ======================================================

function scheduleFinalize(key, m, sock) {

    const batch = pendingBatches.get(key);
    if (!batch) return;

    if (batch.timer) clearTimeout(batch.timer);

    batch.timer = setTimeout(async () => {

        const finished = pendingBatches.get(key);
        if (!finished) return;

        pendingBatches.delete(key);

        try {

            if (finished.images.length <= 1) {
                if (finished.images.length === 1) {
                    await processSingleImage(finished.refMessage, sock, finished.images[0]);
                }
                return;
            }

            await processBatchImages(finished.refMessage, sock, finished.images);

        } catch (error) {
            console.error('[IMGTOPDF FINALIZE ERROR]', error);
            try {
                await finished.refMessage.reply(
                    `❌ Gagal memproses foto: ${error.message || 'Terjadi kesalahan.'}`
                );
            } catch (e) {}
        }

    }, DEBOUNCE_MS);
}

async function addImageToBatch(m, sock, buffer) {

    const key = getBatchKey(m);
    let batch = pendingBatches.get(key);

    if (!batch) {
        batch = { images: [], refMessage: m, timer: null };
        pendingBatches.set(key, batch);
    }

    if (batch.images.length >= MAX_IMAGES_PER_BATCH) {
        return;
    }

    batch.images.push(buffer);
    batch.refMessage = m; // reply memakai pesan foto terakhir

    scheduleFinalize(key, m, sock);
}

// ======================================================
// HOOK: DIPANGGIL UNTUK SETIAP PESAN MASUK
// ======================================================
// PENTING: fungsi `before` ini harus dipanggil oleh loop
// utama SC/bot untuk SETIAP pesan gambar masuk (sebelum
// atau selain pengecekan command biasa), supaya foto-foto
// yang datang beruntun bisa ditampung dan dideteksi sebagai
// satu batch/album. Kalau framework kamu tidak punya hook
// seperti ini, panggil manual:
//   require('./imgtopdf').before(m, sock)
// di file penerima pesan utama, untuk setiap pesan bertipe gambar.

async function before(m, sock) {

    try {

        const media = getMediaFromMessage(m);

        // Bukan gambar sama sekali -> abaikan
        if (!m.isMedia || !isSupportedImage(media)) return false;

        const key = getBatchKey(m);
        const alreadyBatching = pendingBatches.has(key);
        const caption = getCaptionText(m);
        const triggered = captionInvokesCommand(caption);

        // Baru mulai batch hanya kalau ada trigger command,
        // atau memang sedang di tengah batch yang sudah berjalan.
        if (!alreadyBatching && !triggered) {
            return false;
        }

        const buffer = await downloadMedia({ source: m });

        if (!buffer || !Buffer.isBuffer(buffer) || !buffer.length) {
            return false;
        }

        await addImageToBatch(m, sock, buffer);

        return true;

    } catch (error) {
        console.error('[IMGTOPDF BEFORE ERROR]', error);
        return false;
    }
}

// ======================================================
// HANDLER (dipanggil saat command .imgtopdf ditulis langsung,
// misal reply 1 gambar tanpa lewat mekanisme batch/before)
// ======================================================

async function handler(m, { sock }) {

    try {

        if (!PDFDocument) {
            return m.reply(
`❌ *PDF-LIB BELUM TERSEDIA*

Install: npm install pdf-lib
Lalu restart bot.`
            );
        }

        if (!sharp) {
            return m.reply(
`❌ *SHARP BELUM TERSEDIA*

Module sharp diperlukan untuk membaca gambar.`
            );
        }

        // Kalau lagi ada batch berjalan untuk sender ini,
        // biarkan mekanisme before()+debounce yang menuntaskan.
        const key = getBatchKey(m);
        if (pendingBatches.has(key)) {
            return m.reply('⏳ Masih menunggu foto lainnya, tunggu sebentar ya...');
        }

        const media = getMediaFromMessage(m);

        if (!media) {
            return m.reply(
`🖼️ *IMAGE → PDF*

Reply gambar lalu ketik *.imgtopdf*,
atau kirim beberapa foto sekaligus dengan
caption *.imgtopdf* di salah satu foto —
nanti otomatis dapat 3 versi hasil.`
            );
        }

        if (!isSupportedImage(media)) {
            return m.reply('❌ Media yang direply bukan gambar yang didukung.');
        }

        const imageBuffer = await downloadMedia(media);

        if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || !imageBuffer.length) {
            throw new Error('Buffer gambar kosong.');
        }

        const MAX_SIZE = 50 * 1024 * 1024;
        if (imageBuffer.length > MAX_SIZE) {
            throw new Error('Ukuran gambar terlalu besar. Maksimal 50 MB.');
        }

        await processSingleImage(m, sock, imageBuffer);

    } catch (error) {

        console.error('[IMGTOPDF ERROR]', error);

        return m.reply(
`❌ *GAGAL MEMBUAT PDF*

⚠️ ${error.message || 'Terjadi kesalahan.'}`
        );
    }
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    config: pluginConfig,
    handler,
    before // wajib dipanggil main handler untuk tiap pesan gambar masuk
};