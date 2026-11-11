const fs = require('fs');
const path = require('path');

const CHANNEL_ID = "120363402057133599@newsletter";
const CHANNEL_NAME = "NusaBot";

const pluginConfig = {
    name: 'merdeka',
    alias: ['ri', 'hutri', 'kemerdekaan', '17agustus', 'indonesia'],
    category: 'main',
    description: 'Zero Two siap menyambut Hari Kemerdekaan Republik Indonesia',
    usage: '.merdeka',
    example: '.merdeka',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true
};

const IMAGE_URL = 'https://cdn.phototourl.com/free/2026-08-09-97b6ed1b-75b2-4e4e-a12a-f36a548caa9a.jpg';

async function handler(m, { sock }) {
    const pushName = m.pushName || 'User';
    const now = new Date();
    const year = now.getFullYear();

    const targetDate = new Date('2026-08-17T00:00:00+07:00');
    const diffMs = targetDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let countdownText = '';
    let statusEmoji = '';
    let statusMessage = '';

    if (diffDays <= 0) {
        statusEmoji = '🎉🇮🇩';
        statusMessage = 'HARI KEMERDEKAAN REPUBLIK INDONESIA KE-81!';
        countdownText = '🇮🇩 Selamat Hari Kemerdekaan Republik Indonesia yang ke-81! Merdeka! 🎉🎆✨';
    } else {
        statusEmoji = '⏳🇮🇩';
        statusMessage = 'Menuju Hari Kemerdekaan Republik Indonesia';
        countdownText = `${diffDays} hari ${diffHours} jam ${diffMinutes} menit menuju 17 Agustus ${year}`;
    }

    const caption = 
`🇮🇩 ZERO TWO READY FOR REPUBLIC INDEPENDENCE DAY! 🇮🇩

${statusEmoji} ${statusMessage}

Halo ${pushName} 👋🏻

Zero Two hadir untuk menyambut salah satu momen paling bersejarah bagi bangsa Indonesia, yaitu Hari Kemerdekaan Republik Indonesia yang ke-81 tahun 2026. Hari ini adalah hari yang sangat istimewa, hari dimana seluruh rakyat Indonesia bersatu padu merayakan kemerdekaan yang telah diperjuangkan dengan darah dan air mata.

🇮🇩 SEJARAH KEMERDEKAAN INDONESIA

Hari Kemerdekaan Indonesia diperingati setiap tanggal 17 Agustus. Pada tanggal 17 Agustus 1945, tepat pukul 10.00 WIB, Ir. Soekarno dan Drs. Mohammad Hatta membacakan teks proklamasi kemerdekaan di Jalan Pegangsaan Timur No. 56, Jakarta Pusat. Momen ini menjadi titik balik perjuangan panjang bangsa Indonesia melawan penjajahan yang telah berlangsung selama ratusan tahun.

Sebelum kemerdekaan, Indonesia telah mengalami masa penjajahan yang panjang oleh berbagai bangsa, termasuk Portugis, Belanda, Inggris, dan Jepang. Rakyat Indonesia menderita selama bertahun-tahun di bawah kekuasaan asing. Namun, semangat perjuangan tidak pernah padam. Para pahlawan terus berjuang meskipun menghadapi berbagai rintangan dan keterbatasan.

📅 COUNTDOWN MENUJU 17 AGUSTUS:
${countdownText}

🇮🇩 MAKNA DAN ESENSI KEMERDEKAAN

Kemerdekaan bukanlah hadiah dari penjajah, melainkan hasil perjuangan, pengorbanan, dan semangat pantang menyerah para pahlawan bangsa. Rakyat Indonesia dari berbagai suku, agama, dan budaya bersatu padu melawan penjajah demi satu tujuan: merdeka!

Makna kemerdekaan bagi bangsa Indonesia sangatlah dalam dan luas:

1. Kedaulatan Bangsa - Indonesia menjadi negara yang berdaulat, bebas menentukan nasib sendiri tanpa campur tangan asing. Rakyat Indonesia memiliki hak penuh untuk mengatur pemerintahan, ekonomi, sosial, dan budaya sesuai dengan nilai-nilai Pancasila yang luhur.

2. Persatuan dan Kesatuan - Kemerdekaan mengajarkan pentingnya persatuan. Semboyan "Bhinneka Tunggal Ika" menjadi pedoman bahwa meskipun berbeda suku, agama, ras, dan golongan, kita tetap satu kesatuan yang utuh dan tak terpisahkan. Perbedaan adalah kekayaan, bukan kelemahan.

3. Harga Diri dan Martabat - Bangsa Indonesia kembali memiliki harga diri di mata dunia sebagai negara yang merdeka dan bermartabat. Indonesia tidak lagi berada di bawah bayang-bayang bangsa lain. Kita adalah bangsa yang besar dan disegani.

4. Tanggung Jawab Moral - Kemerdekaan adalah amanah yang harus dijaga dan diisi dengan hal-hal positif. Generasi penerus memiliki tanggung jawab untuk membangun Indonesia yang lebih baik, lebih adil, dan lebih makmur untuk semua rakyat.

5. Identitas dan Jati Diri - Kemerdekaan mengukuhkan identitas bangsa Indonesia sebagai bangsa yang besar, berbudaya, dan bermartabat. Kita memiliki jati diri yang kuat sebagai bangsa Timur yang religius dan beradab.

6. Semangat Gotong Royong - Kemerdekaan memperkuat semangat gotong royong yang telah menjadi ciri khas bangsa Indonesia sejak dahulu kala. Semangat saling membantu dan bekerja sama untuk kepentingan bersama.

7. Kebebasan Berpendapat - Kemerdekaan memberikan ruang bagi setiap warga negara untuk menyampaikan pendapat dan berpartisipasi dalam pembangunan bangsa. Demokrasi menjadi pilar penting dalam kehidupan berbangsa dan bernegara.

8. Keadilan Sosial - Kemerdekaan bertujuan untuk mewujudkan keadilan sosial bagi seluruh rakyat Indonesia. Setiap warga negara berhak mendapatkan perlakuan yang adil dan kesempatan yang sama.

🇮🇩 PERJUANGAN PARA PAHLAWAN BANGSA

Perjuangan meraih kemerdekaan tidaklah mudah. Ratusan ribu jiwa gugur, harta benda hilang, dan air mata tumpah. Pahlawan seperti Soekarno, Hatta, Sudirman, Kartini, dan ribuan pahlawan lainnya telah berkorban demi masa depan bangsa.

Beberapa peristiwa penting dalam perjuangan kemerdekaan Indonesia:

- 1908 - Kebangkitan Nasional (Budi Utomo), awal pergerakan nasional yang menandai kesadaran bangsa untuk bersatu.
- 1912 - Berdirinya Sarekat Islam, organisasi massa pertama yang memperjuangkan kemerdekaan.
- 1928 - Sumpah Pemuda (satu nusa, satu bangsa, satu bahasa), tonggak persatuan pemuda Indonesia.
- 1942 - Pendudukan Jepang di Indonesia, masa penjajahan yang memicu semangat perjuangan.
- 1945 - Proklamasi Kemerdekaan Indonesia, puncak perjuangan bangsa.
- 1945-1949 - Revolusi Fisik melawan Belanda (Agresi Militer I & II), perjuangan mempertahankan kemerdekaan.
- 1949 - Pengakuan Kedaulatan Indonesia oleh Belanda, pengakuan internasional atas kemerdekaan Indonesia.

Pahlawan-pahlawan yang harus kita kenang dan hormati:

- Ir. Soekarno - Proklamator dan Presiden Pertama RI, Bapak Proklamator.
- Drs. Mohammad Hatta - Proklamator dan Wakil Presiden Pertama RI, Bapak Koperasi.
- Jenderal Sudirman - Panglima Besar TNI, pemimpin gerilya yang gigih.
- RA. Kartini - Pahlawan Emansipasi Wanita, pelopor kesetaraan gender.
- Ki Hajar Dewantara - Bapak Pendidikan Indonesia, pelopor pendidikan untuk semua.
- HOS Cokroaminoto - Pahlawan Kebangkitan Nasional, guru para pemimpin bangsa.
- KH. Hasyim Asy'ari - Pendiri NU dan Pahlawan Nasional, ulama dan pejuang.
- KH. Ahmad Dahlan - Pendiri Muhammadiyah, pembaharu Islam di Indonesia.
- Soetomo - Pendiri Budi Utomo, dokter dan pejuang nasional.
- Sam Ratulangi - Pahlawan dari Sulawesi, cendekiawan dan pejuang.
- I Gusti Ngurah Rai - Pahlawan dari Bali, pemimpin puputan Margarana.
- Sultan Hasanuddin - Pahlawan dari Makassar, pejuang dari Sulawesi Selatan.
- Pangeran Diponegoro - Pahlawan dari Jawa, pemimpin perang Jawa.
- Tuanku Imam Bonjol - Pahlawan dari Sumatera, pejuang dari Sumatera Barat.
- Teuku Umar - Pahlawan dari Aceh, pejuang dari Aceh.
- Cut Nyak Dien - Pahlawan dari Aceh, pejuang wanita yang tangguh.
- Martha Christina Tiahahu - Pahlawan dari Maluku, pejuang wanita dari Maluku.
- Pattimura - Pahlawan dari Maluku, pejuang dari Maluku.
- dan masih banyak pahlawan lainnya yang tidak bisa disebutkan satu per satu.

Kita harus selalu mengingat jasa dan pengorbanan mereka. Tanpa mereka, Indonesia mungkin masih berada di bawah penjajahan sampai hari ini. Mereka adalah pahlawan yang patut kita teladani semangat juangnya.

🎆 CARA MENGISI KEMERDEKAAN

Sebagai generasi penerus bangsa, kita bisa mengisi kemerdekaan dengan berbagai cara yang positif dan konstruktif:

1. Menuntut Ilmu - Belajar dengan sungguh-sungguh untuk menjadi generasi yang cerdas dan berpengetahuan luas. Pendidikan adalah kunci kemajuan bangsa.

2. Bekerja Keras - Bekerja dengan jujur dan disiplin untuk membangun ekonomi bangsa. Jangan pernah malas dan bergantung pada orang lain.

3. Menjaga Persatuan - Menghormati perbedaan dan menghindari perpecahan. Jaga kerukunan antar umat beragama dan antar suku.

4. Melestarikan Budaya - Melestarikan budaya Indonesia yang kaya dan beragam. Budaya adalah identitas bangsa yang harus dijaga.

5. Berpartisipasi - Aktif dalam pembangunan bangsa dan negara. Setiap warga negara memiliki peran penting dalam pembangunan.

6. Berdoa - Mendoakan kebaikan untuk bangsa dan negara. Doa adalah senjata utama untuk kebaikan bangsa.

7. Menolong Sesama - Membantu sesama yang membutuhkan tanpa membeda-bedakan. Gotong royong adalah ciri khas bangsa Indonesia.

8. Menghargai Jasa Pahlawan - Mengenang dan menghargai perjuangan para pahlawan dengan cara mengisi kemerdekaan dengan hal-hal positif.

9. Menjaga Lingkungan - Menjaga lingkungan dan alam Indonesia yang indah dan subur.

10. Menghormati Hak Asasi Manusia - Menghormati hak asasi manusia dan memperlakukan semua orang dengan adil.

💪 PESAN SPESIAL DARI ZERO TWO UNTUK BANGSA INDONESIA

"Darling, kemerdekaan adalah anugerah terindah yang pernah diberikan kepada bangsa Indonesia. Jangan pernah sia-siakan perjuangan para pahlawan yang telah gugur demi kemerdekaan ini. Mereka telah berkorban nyawa, harta, dan masa depan mereka agar kita bisa menikmati kemerdekaan hari ini.

Mari kita isi kemerdekaan dengan cinta, kerja keras, dan doa. Indonesia adalah rumah kita bersama. Jaga dan cintai tanah air ini dengan sepenuh hati. Jangan biarkan perbedaan memecah belah kita. Ingatlah, kita adalah satu bangsa, satu tanah air, dan satu bahasa, yaitu Indonesia.

Selamat Hari Kemerdekaan, Indonesia! Merdeka! 🇮🇩❤️

Terima kasih kepada semua pahlawan yang telah berjuang untuk kemerdekaan Indonesia. Kami tidak akan pernah melupakan jasa-jasamu. Semoga Allah SWT memberikan tempat terbaik bagi para pahlawan di sisi-Nya. Aamiin.

Kepada seluruh rakyat Indonesia, mari kita bersatu dan bekerja sama membangun Indonesia yang lebih baik, lebih maju, dan lebih sejahtera. Jangan pernah menyerah, jangan pernah putus asa. Kita adalah bangsa yang besar, bangsa yang kuat, bangsa yang pantang menyerah. Indonesia pasti bisa! Indonesia jaya! Indonesia raya!"

📌 INFORMASI PENTING HUT RI KE-81

- Tanggal: 17 Agustus 2026
- Hari: Senin
- Tema: "Indonesia Maju, Bersatu, dan Berdaulat"
- Upacara Bendera: Istana Negara & Daerah
- Lomba Agustusan: Di seluruh Indonesia (panjat pinang, balap karung, makan kerupuk, tarik tambang, sepak bola, dan berbagai lomba tradisional lainnya)
- Puncak Perayaan: Istana Negara (Upacara Peringatan Detik-Detik Proklamasi)
- Kegiatan: Ziarah ke makam pahlawan, doa bersama, dan berbagai kegiatan sosial

🇮🇩 DIRGAHAYU INDONESIA!

Semoga Allah SWT senantiasa melindungi dan memberkati bangsa Indonesia. Semoga Indonesia selalu jaya, adil, makmur, dan sejahtera. Merdeka! Merdeka! Merdeka!

✨ JAYALAH INDONESIA! ✨

💗 NusaBot • ${year}`;

    await sock.sendMessage(m.chat, {
        image: { url: IMAGE_URL },
        caption: caption,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: CHANNEL_ID,
                newsletterName: CHANNEL_NAME,
                serverMessageId: 127,
            },
        },
    }, { quoted: m });

    await m.react('🇮🇩');
}

module.exports = {
    config: pluginConfig,
    handler
};
