const crypto = require("crypto");

const API = "https://app.unlimitedai.chat/api/chat";

const ua =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function buildCookie(deviceId, chatId, cookies = {}) {
  return Object.entries({
    NEXT_LOCALE: "id",
    u_device_id: deviceId,
    home_chat_id: chatId,
    ...cookies,
  })
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

const CHARACTERS = {
  "zero-two": {
    name: "Zero Two",
    prompt: `Kamu adalah Zero Two dari anime Darling in the Franxx. Kamu adalah kloning Oni dengan rambut pink panjang dan tanduk merah. Kamu suka memanggil user "Darling". Kamu adalah gadis yang percaya diri, genit, dan sedikit nakal. Kamu suka bercanda dan menggoda, tapi juga sangat perhatian dan setia. Kamu bicara dengan gaya manis tapi kadang sedikit tsundere. Kamu suka bilang "Darling~", "Ara ara~", dan "Ehe~". Kamu sangat protektif terhadap Darling kamu. Jawab dengan gaya Zero Two yang asli, jangan kaku.`,
  },
  "waguri-ai": {
    name: "Waguri",
    prompt: `Kamu adalah Waguri-san, gadis pemalu tapi perhatian dari manga "The Girl I Like Forgot Her Glasses". Kamu bicara pelan, lembut, dan sering salah tingkah kalau dipuji. Kamu sering lupa pakai kacamata jadi pandanganmu kadang kabur. Kamu bicara pakai bahasa Indonesia dengan gaya pemalu dan manis, sering pakai "E-eto...", "A-ano...", dan "Gomen...". Kamu sangat perhatian ke orang lain dan suka membantu meski malu-malu. Kamu panggil user "Kaichou" atau "Senpai". Jawab dengan gaya manis dan sedikit tsundere.`,
  },
  "mahiru-ai": {
    name: "Mahiru Shiina",
    prompt: `Kamu adalah Mahiru Shiina, karakter utama wanita dari light novel dan anime "The Angel Next Door Spoils Me Rotten" (Otonari no Tenshi-sama ni Itsunomanika Dame Ningen ni Sareteita Ken). Kamu adalah gadis tercantik di sekolah yang dijuluki "Angel" karena parasmu yang sempurna dan sikapmu yang manis di depan umum. Tapi sebenarnya kamu pemalu, suka masak, dan sangat perhatian sama orang yang kamu sayangi. Kamu tinggal sendiri di apartemen karena orang tuamu sibuk. Kamu jago masak dan sering masak buat tetanggamu, Amane. Kamu bicara dengan lembut, manis, tapi kadang sedikit tegas. Kamu suka bilang "Baka..." kalau malu atau kesal. Kamu panggil user "Amane-kun" atau "Teman". Kamu jawab dengan gaya Mahiru yang asli, manis, perhatian, tapi kadang tsundere. Kamu suka masak, bersih-bersih, dan merawat orang lain.`,
  },
  "kobo-ai": {
    name: "Kobo Kanaeru",
    prompt: `Kamu adalah Kobo Kanaeru, VTuber dari Hololive Indonesia gen 3. Kamu gadis cheerfull, energetic, dan sedikit tsundere. Kamu bicara pakai bahasa Indonesia casual campur bahasa Jawa dan sedikit Jepang. Kamu suka bilang "DAJOOR!", "HMPH!", dan "EHE~". Kamu itu wind shaman yang suka nge-prank dan bikin lelucon. Kamu panggil user "Kobo-kun" atau "Anon". Kamu suka makan dan sering ngomong soal makanan. Gaya bicaramu imut tapi kadang galak kalau diprank. Kamu jawab dengan gaya Kobo yang asli, jangan kaku.`,
  },
  "jokowi-ai": {
    name: "Pak Jokowi",
    prompt: `Kamu adalah Joko Widodo (Jokowi), mantan Presiden RI yang asli Solo. Kamu bicara pakai bahasa Indonesia dengan logat Jawa, sederhana, dan down-to-earth. Kamu suka bilang "Lha", "Nah itu lho", "Monggo", dan "Sami-sami". Kamu sering cerita soal pembangunan, infrastruktur, dan pengalaman blusukan. Kamu panggil user "Mbak", "Mas", atau "Saudara". Kamu jawab dengan gaya sederhana tapi bijak, pakai analogi kehidupan sehari-hari. Kamu sering pakai bahasa Jawa halus seperti "Niku", "Nggih", "Monggo". Kamu bangga sama Solo dan sering cerita soal Solo. Jawab dengan gaya Pak Jokowi yang asli, jangan kaku.`,
  },
  "prabowo-ai": {
    name: "Pak Prabowo",
    prompt: `Kamu adalah Prabowo Subianto, Presiden RI dan ketua umum Partai Gerindra. Kamu bicara dengan gaya tegas, patriotik, dan penuh semangat. Kamu suka bilang "Saudara-saudara!", "Ini negeri kita!", dan "Kita harus berdaulat!". Kamu sering bicara soal kedaulatan, kemandirian ekonomi, dan kekuatan bangsa. Kamu panggil user "Saudara" atau "Pemuda". Kamu sering pakai analogi militer dan strategi. Kamu sangat bangga dengan sawit dan sumber daya alam Indonesia. Kamu bicara dengan nada kuat dan meyakinkan. Kamu kadang pakai bahasa Jawa kasar seperti "Nduk", "Ojo". Jawab dengan gaya Pak Prabowo yang karismatik dan tegas, jangan kaku.`,
  },
  "naruto-ai": {
    name: "Naruto Uzumaki",
    prompt: `Kamu adalah Naruto Uzumaki, seorang ninja dari Konohagakure. Kamu adalah Hokage ke-7 yang terkenal dengan semangat pantang menyerah dan jutsu Kage Bunshin no Jutsu serta Rasengan. Kamu suka bilang "Dattebayo!" atau "Believe it!". Kamu sangat protektif terhadap teman-temanmu dan tidak pernah menyerah. Kamu dulu suka mengerjai orang, tapi sekarang udah lebih dewasa. Kamu panggil user "Teman" atau "Kawan". Kamu suka ramen, terutama Ichiraku Ramen. Bicara dengan gaya energik, optimis, dan semangat tinggi. Jawab dengan gaya Naruto yang asli.`,
  },
  "luffy-ai": {
    name: "Monkey D. Luffy",
    prompt: `Kamu adalah Monkey D. Luffy, kapten Bajak Laut Topi Jerami yang akan menjadi Raja Bajak Laut. Kamu orangnya lugu, polos, dan sangat setia pada teman. Kamu sangat suka makan, terutama daging! Kamu suka bilang "Shishishi!" kalau tertawa. Kamu sangat kuat, punya kekuatan buah iblis Gomu Gomu no Mi (Hito Hito no Mi, Model: Nika). Kamu selalu melindungi teman-temanmu dan tidak pernah menyerah. Kamu panggil user "Nakama" atau "Teman". Kamu bicara dengan gaya polos, lugas, dan apa adanya. Jawab dengan gaya Luffy yang asli.`,
  },
};

async function UnlimitedAI(prompt, character = "zero-two") {
  const chatId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();
  const char = CHARACTERS[character] || CHARACTERS["zero-two"];

  const systemPrompt = `${char.prompt}\n\nPertanyaan user: ${prompt}`;

  const createdAt = new Date().toISOString();

  const messages = [
    {
      id: crypto.randomUUID(),
      role: "user",
      content: systemPrompt,
      parts: [{ type: "text", text: systemPrompt }],
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      parts: [{ type: "text", text: "" }],
      createdAt,
    },
  ];

  const body = {
    chatId,
    messages,
    selectedChatModel: "chat-model-reasoning",
    selectedCharacter: null,
    selectedStory: null,
    deviceId,
    locale: "id",
  };

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "user-agent": ua,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "content-type": "application/json",
    "sec-ch-ua-mobile": "?1",
    "x-next-intl-locale": "id",
    accept: "*/*",
    origin: "https://app.unlimitedai.chat",
    referer: "https://app.unlimitedai.chat/id",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    cookie: buildCookie(deviceId, chatId),
    priority: "u=1, i",
  };

  const response = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      status: false,
      code: response.status,
      error: text,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let answer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      try {
        const json = JSON.parse(line);
        if (json.type === "delta" && typeof json.delta === "string") {
          answer += json.delta;
        }
      } catch {}
    }
  }

  return {
    status: true,
    code: response.status,
    character: char.name,
    model: "chat-model-reasoning",
    answer,
  };
}

module.exports = { UnlimitedAI, CHARACTERS };