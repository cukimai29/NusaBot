// plugins/ai/categoryai.js
const axios = require('axios');
const config = require('../../config');

// ============ DAFTAR COMMAND ============
const commandList = [
    'brainstorm', 'explain', 'code', 'write', 'stories', 'poet', 'lyric',
    'motivate', 'summary', 'tutor', 'plan', 'namegen', 'quiz', 'health',
    'workout', 'meditate', 'dream', 'debate', 'interview', 'resume',
    'startup', 'youtube', 'role', 'translate', 'recipe', 'game',
    'psychology', 'finance', 'law', 'anime', 'manga', 'movie', 'music',
    'book', 'travel', 'fashion', 'pickup', 'roast', 'joke', 'fact', 'quote'
];

// ============ ALIAS ============
const aliases = {
    'bm': 'brainstorm',
    'jelasin': 'explain',
    'coding': 'code',
    'tulis': 'write',
    'cerita': 'stories',
    'puisi': 'poet',
    'lirik': 'lyric',
    'motivasi': 'motivate',
    'ringkas': 'summary',
    'guru': 'tutor',
    'rencana': 'plan',
    'nama': 'namegen',
    'kuis': 'quiz',
    'dokter': 'health',
    'fitness': 'workout',
    'meditasi': 'meditate',
    'mimpi': 'dream',
    'debat': 'debate',
    'wawancara': 'interview',
    'cv': 'resume',
    'bisnis': 'startup',
    'yt': 'youtube',
    'rp': 'role',
    'terjemah': 'translate',
    'resep': 'recipe',
    'tebak': 'game',
    'psikologi': 'psychology',
    'keuangan': 'finance',
    'hukum': 'law',
    'rekanime': 'anime',
    'rekmanga': 'manga',
    'film': 'movie',
    'lagu': 'music',
    'buku': 'book',
    'jalan': 'travel',
    'baju': 'fashion',
    'rayuan': 'pickup',
    'ejek': 'roast',
    'lelucon': 'joke',
    'fakta': 'fact',
    'quotes': 'quote'
};

// ============ KONFIGURASI PLUGIN ============
const pluginConfig = {
    name: commandList,
    alias: Object.keys(aliases),
    category: 'ai',
    description: 'AI Multi-Tools (40+ fitur dalam 1 plugin)',
    usage: `.${commandList[0]} <query>\n\n📋 Mode: ${commandList.join(', ')}`,
    example: '.brainstorm ide konten\n.explain black hole\n.code sorting array',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

// ============ HANDLER ============
async function handler(m, { sock, text, prefix, db }) {
    let command = m.command?.toLowerCase();
    
    // Cek alias
    if (aliases[command]) {
        command = aliases[command];
    }
    
    // Validasi command
    if (!commandList.includes(command)) {
        return m.reply(
            `🤖 *AI MULTI-TOOLS*\n\n` +
            `📋 *Mode tersedia:*\n` +
            `🧠 brainstorm - Brainstorming ide\n` +
            `📚 explain - Jelaskan konsep\n` +
            `💻 code - Generate kode\n` +
            `✍️ write - Writing assistant\n` +
            `📖 stories - Cerita pendek\n` +
            `🎭 poet - Puisi\n` +
            `🎵 lyric - Lirik lagu\n` +
            `💪 motivate - Motivasi\n` +
            `📋 summary - Ringkas teks\n` +
            `🎓 tutor - Belajar\n` +
            `📅 plan - Rencana\n` +
            `🏷️ namegen - Generator nama\n` +
            `❓ quiz - Quiz\n` +
            `🏥 health - Konsultasi kesehatan\n` +
            `🏋️ workout - Workout plan\n` +
            `🧘 meditate - Meditasi\n` +
            `💭 dream - Arti mimpi\n` +
            `⚔️ debate - Debat\n` +
            `💼 interview - Simulasi interview\n` +
            `📄 resume - CV builder\n` +
            `🚀 startup - Ide bisnis\n` +
            `🎬 youtube - Ide konten\n` +
            `🎭 role - Roleplay karakter\n` +
            `🌐 translate - Terjemahan\n` +
            `🍳 recipe - Resep masakan\n` +
            `🎮 game - Tebak tebakan\n` +
            `🧠 psychology - Tes psikologi\n` +
            `💰 finance - Saran keuangan\n` +
            `⚖️ law - Konsultasi hukum\n` +
            `🎬 anime - Rekomendasi anime\n` +
            `📚 manga - Rekomendasi manga\n` +
            `🎥 movie - Rekomendasi film\n` +
            `🎶 music - Rekomendasi musik\n` +
            `📕 book - Rekomendasi buku\n` +
            `✈️ travel - Rencana traveling\n` +
            `👗 fashion - Saran fashion\n` +
            `💝 pickup - Pickup line\n` +
            `🔥 roast - Roasting\n` +
            `😂 joke - Jokes\n` +
            `📚 fact - Fakta unik\n` +
            `💬 quote - Quotes bijak\n\n` +
            `📌 Contoh: .${commandList[0]} <query>`
        );
    }
    
    // Cek input
    if (!text && !['meditate', 'motivate', 'joke', 'fact', 'quote', 'pickup'].includes(command)) {
        return m.reply(`❌ Masukkan query!\n\n📌 Contoh: .${command} <query>`);
    }
    
    // Cek energi
    const user = db.getUser(m.sender);
    const energyCost = ['code', 'stories', 'workout', 'startup'].includes(command) ? 2 : 1;
    
    if (!m.isOwner && !m.isPremium && (user?.energi ?? 25) < energyCost) {
        return m.reply(`❌ *Energi tidak cukup!*\n> Butuh ${energyCost} energi, energimu: ${user?.energi ?? 25}`);
    }
    
    m.react('⏳');
    
    try {
        let systemPrompt = '';
        let userPrompt = '';
        
        // ============ CASE BERDASARKAN COMMAND ============
        switch(command) {
            case 'brainstorm':
                systemPrompt = 'Kamu adalah AI kreatif yang ahli brainstorming';
                userPrompt = `Buatkan 10 ide brainstorming kreatif tentang: ${text}. Format list nomor.`;
                break;
                
            case 'explain':
                systemPrompt = 'Kamu adalah guru yang ahli menjelaskan hal kompleks dengan sederhana';
                userPrompt = `Jelaskan "${text}" dengan bahasa sangat sederhana seperti ke anak kecil. Gunakan analogi.`;
                break;
                
            case 'code':
                systemPrompt = 'Kamu adalah senior programmer ahli semua bahasa';
                userPrompt = `Buatkan kode untuk: ${text}. Tampilkan kode lengkap + penjelasan singkat.`;
                break;
                
            case 'write':
                systemPrompt = 'Kamu adalah penulis profesional';
                userPrompt = `Tolong buatkan ${text} yang menarik, kreatif, dan berkualitas tinggi.`;
                break;
                
            case 'stories':
                systemPrompt = 'Kamu adalah penulis cerita pendek berbakat';
                userPrompt = `Buatkan cerita pendek genre ${text} dengan twist ending. Maksimal 500 kata.`;
                break;
                
            case 'poet':
                systemPrompt = 'Kamu adalah penyair kontemporer yang puitis';
                userPrompt = `Buatkan puisi modern tentang "${text}" yang menyentuh hati. 4-6 bait.`;
                break;
                
            case 'lyric':
                systemPrompt = 'Kamu adalah penulis lagu profesional';
                userPrompt = `Buatkan lirik lagu ${text} dengan verse, chorus, bridge. Rima bagus.`;
                break;
                
            case 'motivate':
                systemPrompt = 'Kamu adalah motivator ulung';
                userPrompt = `Berikan 3 kata motivasi singkat ${text || 'hari ini'} yang powerful dalam bahasa Indonesia.`;
                break;
                
            case 'summary':
                systemPrompt = 'Kamu adalah peringkas teks profesional';
                userPrompt = `Ringkas teks ini jadi 3-5 poin penting:\n\n"${text}"`;
                break;
                
            case 'tutor':
                systemPrompt = 'Kamu adalah guru privat yang sabar';
                userPrompt = `Ajari saya tentang ${text} dengan penjelasan mudah + contoh konkret.`;
                break;
                
            case 'plan':
                systemPrompt = 'Kamu adalah perencana strategis handal';
                userPrompt = `Buatkan rencana detail untuk: ${text}. Langkah praktis + timeline.`;
                break;
                
            case 'namegen':
                systemPrompt = 'Kamu adalah branding expert kreatif';
                userPrompt = `Generate 15 nama ${text} yang kreatif, unik, dan memorable.`;
                break;
                
            case 'quiz':
                systemPrompt = 'Kamu adalah pembuat quiz profesional';
                userPrompt = `Buatkan 5 pertanyaan quiz pilihan ganda tentang ${text}. Format: Soal, A-D, Jawaban di akhir.`;
                break;
                
            case 'health':
                systemPrompt = 'Kamu adalah asisten info kesehatan (bukan dokter)';
                userPrompt = `Info kesehatan umum tentang: ${text}. Penyebab, gejala umum, saran gaya hidup. Ingatkan konsultasi dokter.`;
                break;
                
            case 'workout':
                systemPrompt = 'Kamu adalah personal trainer profesional';
                userPrompt = `Buatkan workout plan mingguan untuk: ${text}. Jenis latihan, set, repetisi, tips nutrisi.`;
                break;
                
            case 'meditate':
                systemPrompt = 'Kamu adalah guru meditasi yang menenangkan';
                userPrompt = `Buatkan panduan meditasi ${text || 'singkat'} yang menenangkan. Pandu langkah demi langkah.`;
                break;
                
            case 'dream':
                systemPrompt = 'Kamu adalah psikolog ahli interpretasi mimpi';
                userPrompt = `Interpretasikan mimpi ini: "${text}". Makna simbolis dan refleksi personal.`;
                break;
                
            case 'debate':
                systemPrompt = 'Kamu adalah debater profesional objektif';
                userPrompt = `Debat topik: "${text}". Berikan 3 argumen PRO dan 3 KONTRA yang kuat.`;
                break;
                
            case 'interview':
                systemPrompt = 'Kamu adalah HR profesional dan career coach';
                userPrompt = `Berikan 10 pertanyaan interview untuk posisi ${text} + tips jawaban.`;
                break;
                
            case 'resume':
                systemPrompt = 'Kamu adalah CV writer profesional';
                userPrompt = `Berdasarkan: "${text}", buatkan poin CV ATS-friendly bahasa Indonesia.`;
                break;
                
            case 'startup':
                systemPrompt = 'Kamu adalah venture capitalist berpengalaman';
                userPrompt = `Generate 5 ide startup di bidang ${text}. Nama, problem, solusi, target market, model bisnis.`;
                break;
                
            case 'youtube':
                systemPrompt = 'Kamu adalah content strategist YouTube';
                userPrompt = `Berikan 10 ide konten YouTube viral untuk niche ${text}. Judul, deskripsi, tips SEO.`;
                break;
                
            case 'role':
                systemPrompt = 'Kamu adalah aktor metode yang bisa memerankan karakter apapun';
                userPrompt = `Berperanlah sebagai ${text}. Jawab dengan gaya bicara dan kepribadian karakter tersebut.`;
                break;
                
            case 'translate':
                systemPrompt = 'Kamu adalah translator profesional';
                userPrompt = `Translate "${text}" ke bahasa Indonesia yang natural dan akurat.`;
                break;
                
            case 'recipe':
                systemPrompt = 'Kamu adalah chef profesional kreatif';
                userPrompt = `Buatkan resep masakan enak dari bahan: ${text}. Nama masakan, bahan, cara membuat.`;
                break;
                
            case 'game':
                systemPrompt = 'Kamu adalah pembuat game tebak-tebakan';
                userPrompt = `Buatkan 5 tebak-tebakan seru tentang ${text}. Beri clue dan jawaban.`;
                break;
                
            case 'psychology':
                systemPrompt = 'Kamu adalah psikolog profesional';
                userPrompt = `Berikan analisis psikologi singkat tentang: ${text}. Tips praktis untuk pengembangan diri.`;
                break;
                
            case 'finance':
                systemPrompt = 'Kamu adalah financial advisor berpengalaman';
                userPrompt = `Berikan saran keuangan praktis tentang: ${text}. Tips menabung, investasi, budgeting.`;
                break;
                
            case 'law':
                systemPrompt = 'Kamu adalah konsultan hukum (info umum)';
                userPrompt = `Jelaskan aspek hukum umum tentang: ${text} di Indonesia. Ingatkan konsultasi pengacara.`;
                break;
                
            case 'anime':
                systemPrompt = 'Kamu adalah otaku yang ahli rekomendasi anime';
                userPrompt = `Rekomendasikan 10 anime ${text || 'terbaik'}. Judul, genre, rating, sinopsis singkat.`;
                break;
                
            case 'manga':
                systemPrompt = 'Kamu adalah mangaka berpengalaman';
                userPrompt = `Rekomendasikan 10 manga ${text || 'terbaik'}. Judul, author, genre, sinopsis singkat.`;
                break;
                
            case 'movie':
                systemPrompt = 'Kamu adalah kritikus film';
                userPrompt = `Rekomendasikan 10 film ${text || 'terbaik'}. Judul, genre, rating, sinopsis singkat.`;
                break;
                
            case 'music':
                systemPrompt = 'Kamu adalah music curator';
                userPrompt = `Rekomendasikan 10 lagu ${text || 'terbaik'}. Judul, artist, genre.`;
                break;
                
            case 'book':
                systemPrompt = 'Kamu adalah book reviewer';
                userPrompt = `Rekomendasikan 10 buku ${text || 'terbaik'}. Judul, author, genre, sinopsis singkat.`;
                break;
                
            case 'travel':
                systemPrompt = 'Kamu adalah travel planner berpengalaman';
                userPrompt = `Buatkan rencana traveling ke ${text}. Itinerary, budget estimasi, tips, tempat wajib dikunjungi.`;
                break;
                
            case 'fashion':
                systemPrompt = 'Kamu adalah fashion stylist';
                userPrompt = `Berikan saran fashion untuk: ${text}. Style, warna, padu padan, tips.`;
                break;
                
            case 'pickup':
                systemPrompt = 'Kamu adalah ahli pickup line kreatif';
                userPrompt = `Buatkan 10 pickup line ${text || 'gombal'} yang kreatif dan lucu dalam bahasa Indonesia.`;
                break;
                
            case 'roast':
                systemPrompt = 'Kamu adalah roaster profesional yang lucu';
                userPrompt = `Roasting lucu tentang: ${text}. Tetap entertaining, jangan terlalu kasar.`;
                break;
                
            case 'joke':
                systemPrompt = 'Kamu adalah komedian';
                userPrompt = `Ceritakan 5 jokes ${text || 'lucu'} segar dalam bahasa Indonesia.`;
                break;
                
            case 'fact':
                systemPrompt = 'Kamu adalah ensiklopedia berjalan';
                userPrompt = `Berikan 10 fakta unik dan menarik tentang ${text || 'dunia'}.`;
                break;
                
            case 'quote':
                systemPrompt = 'Kamu adalah filsuf bijak';
                userPrompt = `Berikan 5 quotes bijak ${text || 'kehidupan'} yang inspiratif beserta artinya.`;
                break;
                
            default:
                systemPrompt = 'Kamu adalah AI assistant yang helpful';
                userPrompt = text;
                break;
        }
        
        // ============ API CALL ============
        const { data } = await axios.get(`https://api.kaicloud.my.id/api/ai/gpt4o?q=${encodeURIComponent(userPrompt)}&system=${encodeURIComponent(systemPrompt)}`);
        
        if (!data?.status) throw new Error('Gagal generate response');
        
        // Potong energi
        if (!m.isOwner && !m.isPremium) {
            db.updateUser(m.sender, { energi: (user?.energi ?? 25) - energyCost });
        }
        
        m.react('✅');
        
        const emoji = {
            brainstorm: '🧠', explain: '📚', code: '💻', write: '✍️', stories: '📖',
            poet: '🎭', lyric: '🎵', motivate: '💪', summary: '📋', tutor: '🎓',
            plan: '📅', namegen: '🏷️', quiz: '❓', health: '🏥', workout: '🏋️',
            meditate: '🧘', dream: '💭', debate: '⚔️', interview: '💼', resume: '📄',
            startup: '🚀', youtube: '🎬', role: '🎭', translate: '🌐', recipe: '🍳',
            game: '🎮', psychology: '🧠', finance: '💰', law: '⚖️', anime: '🎬',
            manga: '📚', movie: '🎥', music: '🎶', book: '📕', travel: '✈️',
            fashion: '👗', pickup: '💝', roast: '🔥', joke: '😂', fact: '📚', quote: '💬'
        };
        
        const modeName = command.charAt(0).toUpperCase() + command.slice(1);
        
        await m.reply(
            `╭━━〔 ${emoji[command] || '🤖'} *AI ${modeName.toUpperCase()}* ${emoji[command] || '🤖'} 〕━━⬣\n` +
            `│\n` +
            `│  ${text ? `🔍 *Query:* ${text}\n│` : ''}` +
            `│\n` +
            `│  ${data.data || 'Gagal generate response'}\n` +
            `│\n` +
            `╰━━━━━━━━━━━━━━━━━━⬣`
        );
        
    } catch (err) {
        console.error(`[AI-${command}] Error:`, err.message);
        m.react('❌');
        await m.reply(`❌ *Gagal!*\n\n> ${err.message}\n\nCoba lagi nanti ya Darling~`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};