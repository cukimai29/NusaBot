const axios = require('axios');

const gameCommands = [
'zhongli','venti','raiden','nahida','furina','neuvillette','arlecchino','clorinde','lyney','lynette','freminet','navia','chiori','xianyun','gaming','chevreuse','ayaka','ayato','itto','kokomi','kazuha','yoimiya','thoma','yae','kamisato','sara','sayu','gorou','heizou','kuki','shinobu','kirara','mika','diluc','jean','keqing','mona','qiqi','tartaglia','hutao','xiao','ganyu','shenhe','yelan','baizhu','alhaitham','dehya','cyno','nilou','tighnari','collei','dori','kaveh','faruzan','layla','nahida','wanderer','scaramouche','albedo','eula','klee','venti','dainsleif','paimon','lumine','aether','bronya','seele','kiana','mei','fu_hua','teresa','senti','durandal','ritual','goku','vegeta','gohan','piccolo','frieza','cell','buu','beerus','whis','jiren','hit','naruto','sasuke','sakura','kakashi','itachi','madara','minato','hinata','neji','rocklee','guy','gaara','shikamaru','temari','kankuro','orochimaru','tsunade','jiraiya','pain','konan','obito','shisui','danzo','hashirama','tobirama','hiruzen','sarada','boruto','mitsuki','kawaki','himawari','nagato','kisame','deidara','sasori','hidan','kakuzu','zabuza','haku','kimimaro','kabuto','anko','luffy','zoro','nami','usopp','sanji','chopper','robin','franky','brook','jinbe','shanks','mihawk','crocodile','doflamingo','katakuri','ace','sabo','whitebeard','roger','oden','yamato','kaido','bigmom','blackbeard','akainu','aokiji','kizaru','fujitora','rayleigh','garp','sengoku','law','kid','killer','hancock','vivi','rebecca','shirahoshi','perona','boa','ivankov','kuma','noland','calgara','ichigo','rukia','renji','byakuya','kenpachi','toshiro','hitsugaya','yoruichi','soifon','urahara','gin','tosen','aizen','vizard','isshin','masaki','ryuken','ywhach','jugram','haschwalth','bazzb','gremmy','lille','pernida','askin','gerard','bambietta','candice','gintoki','shinpachi','kagura','okita','hijikata','kondo','otose','catherine','tama','takasugi','katsura','sakamoto','mutsu','kamui','abuto','umibozu','sarutobi','zenzo','jiraia','edward','alphonse','winry','roy','rizahawkeye','scar','ling','lanfan','may','vanhohenheim','dante','father','pride','wrath','gluttony','greed','sloth','lust','envy','denji','power','makima','aki','kishibe','reze','quanxi','katana','angel','beam','prinz','galgali','kobeni','asamiya','yoru','asa','famine','death','nayuta','bucky','anya','yor','loid','bond','franky','damian','becky','sherwood','henry','yelena','olka','fiona','nightfall','daybreak','aqua','ruby','kana','akai','melt','frill','yuki','kyun','gotanda','pieyon','miyako','ichigo','saitou','airi','saitama','garou','genos','tornado','fubuki','king','metalbat','watchdog','flash','atomic','silverfang','childemperor','zombieman','sweetmask','piggod','driveknight','blast','boros','homeless','jojo','dio','jonathan','joseph','jotaro','josuke','giorno','jolyne','johnny','gappy','will','speedwagon','straizo','caesar','kars','esidisi','wamuu','holhorse','kakyoin','polnareff','avdol','iggy','koichi','rohan','kira','yoshikage','diablo','carlos','eiji','ash','shorter','skip','beat','baki','hanayama','doppo','shibukawa','kaoru','katsumi','orochi','retsu','son','kiohzan','goki','shinogi','yujiro','jack','julius','kuzan','tatsumi','kyouka','mikako','seiryuu','byakko','genbu','suzaku','kaguya','miyuki','yukino','mai','natsuki','saki','mari','ayane','kasumi','momiji','nyotengu','kokoro','tamaki','honoka','marie','riko','mizuki','shizuku','koharu','shiori','minami','haruka','miku','hoshino','uchida','sakura','shinobu','maya','akira','kaito','shota','shun','haru','ren','yuki','haruki','naoto','reiji','shinji','kenshiro','ryu','ken','akuma','chunli','blanka','ehonda','guile','cammy','vega','balrog','sagat','m.bison','ryu','ken','chunli','yuri','mai','terry','andy','joe','geese','rocky','king','kim','chang','choi','athena','kensou','ralf','clark','leona','iori','shingo','kyo','benimaru','daimon','gato','ryuji','gai','kasumi','hinata','tifa','cloud','sephiroth','aerith','barret','redxiii','cid','yuffie','squall','rinoa','zidane','garnet','vivi','steiner','freya','amaranth','quanxi','sun','liu','lao','chen','hanzo','genji','mccree','soldier','reaper','tracer','widowmaker','hanzo','pharah','ana','brigitte','moira','zenyatta','lucio','dva','orisa','sigma','sombra','sakura','sasuke','naruto','one','kuma','kumakyu','gawr','mori','yagami','kurama','shirou','saber','rin','sakura','illya','archer','lancer','berserker','caster','gilgamesh','fujimaru','mash','edmond','dantes','jeanne','alter','artoria','mordred','frankenstein','robin','emiya','cu','chulainn','diarmuid','karna','arjuna','kagetora','ryoma','okita','hijikata','saito','nobunaga','shingen','takeda','mitsuhide','keiji','goemon','chacha','gracia','fuuma','yasuke','sanjou','musashi','kojiro','lancelot','tristan','gawain','percival','gareth','mordred','aga','fujiwara','kamijou','misaka','shokuhou','kuroko','accelerator','last_order','frenda','kenzaki','saten','kongo','mii','harumi','meiko','nagi','noel','kaguya','naomi','shinomiya','miyako','mio','asuna','natsuki','kanami','sayaka','miki','honoka','ayaka','rin','sora','shiro','jibril','izuna','azrael','laira','kaine','nier','yoko','emil','simone','kainé','nieR','yoko','emil','simone','kainé','nieR','yoko','emil','simone','kainé','nieR','yoko','emil','simone','kainé','nieR','yoko','emil','simone','kainé','nieR'
];

const aliases = {
'geo':'zhongli','wind':'venti','raiden':'raiden','dendro':'nahida','water':'furina','neuv':'neuvillette','arle':'arlecchino','clor':'clorinde','lyne':'lyney','lyne':'lynette','fremin':'freminet','navi':'navia','chiori':'chiori','cloud':'xianyun','gaming':'gaming','chev':'chevreuse','ayaka':'ayaka','ayato':'ayato','itto':'itto','kokomi':'kokomi','kazuha':'kazuha','yoimiya':'yoimiya','thoma':'thoma','yae':'yae','kamisato':'kamisato','sara':'sara','sayu':'sayu','gorou':'gorou','heizou':'heizou','kuki':'kuki','shinobu':'shinobu','kirara':'kirara','mika':'mika','diluc':'diluc','jean':'jean','keqing':'keqing','mona':'mona','qiqi':'qiqi','tartaglia':'tartaglia','hutao':'hutao','xiao':'xiao','ganyu':'ganyu','shenhe':'shenhe','yelan':'yelan','baizhu':'baizhu','alhaitham':'alhaitham','dehya':'dehya','cyno':'cyno','nilou':'nilou','tighnari':'tighnari','collei':'collei','dori':'dori','kaveh':'kaveh','faruzan':'faruzan','layla':'layla','nahida':'nahida','wanderer':'wanderer','scaramouche':'scaramouche','albedo':'albedo','eula':'eula','klee':'klee','venti':'venti','dainsleif':'dainsleif','paimon':'paimon','lumine':'lumine','aether':'aether','bronya':'bronya','seele':'seele','kiana':'kiana','mei':'mei','fu_hua':'fu_hua','teresa':'teresa','senti':'senti','durandal':'durandal','ritual':'ritual','goku':'goku','vegeta':'vegeta','gohan':'gohan','piccolo':'piccolo','frieza':'frieza','cell':'cell','buu':'buu','beerus':'beerus','whis':'whis','jiren':'jiren','hit':'hit','naruto':'naruto','sasuke':'sasuke','sakura':'sakura','kakashi':'kakashi','itachi':'itachi','madara':'madara','minato':'minato','hinata':'hinata','neji':'neji','rocklee':'rocklee','guy':'guy','gaara':'gaara','shikamaru':'shikamaru','temari':'temari','kankuro':'kankuro','orochimaru':'orochimaru','tsunade':'tsunade','jiraiya':'jiraiya','pain':'pain','konan':'konan','obito':'obito','shisui':'shisui','danzo':'danzo','hashirama':'hashirama','tobirama':'tobirama','hiruzen':'hiruzen','sarada':'sarada','boruto':'boruto','mitsuki':'mitsuki','kawaki':'kawaki','himawari':'himawari','nagato':'nagato','kisame':'kisame','deidara':'deidara','sasori':'sasori','hidan':'hidan','kakuzu':'kakuzu','zabuza':'zabuza','haku':'haku','kimimaro':'kimimaro','kabuto':'kabuto','anko':'anko','luffy':'luffy','zoro':'zoro','nami':'nami','usopp':'usopp','sanji':'sanji','chopper':'chopper','robin':'robin','franky':'franky','brook':'brook','jinbe':'jinbe','shanks':'shanks','mihawk':'mihawk','crocodile':'crocodile','doflamingo':'doflamingo','katakuri':'katakuri','ace':'ace','sabo':'sabo','whitebeard':'whitebeard','roger':'roger','oden':'oden','yamato':'yamato','kaido':'kaido','bigmom':'bigmom','blackbeard':'blackbeard','akainu':'akainu','aokiji':'aokiji','kizaru':'kizaru','fujitora':'fujitora','rayleigh':'rayleigh','garp':'garp','sengoku':'sengoku','law':'law','kid':'kid','killer':'killer','hancock':'hancock','vivi':'vivi','rebecca':'rebecca','shirahoshi':'shirahoshi','perona':'perona','boa':'boa','ivankov':'ivankov','kuma':'kuma','noland':'noland','calgara':'calgara','ichigo':'ichigo','rukia':'rukia','renji':'renji','byakuya':'byakuya','kenpachi':'kenpachi','toshiro':'toshiro','hitsugaya':'hitsugaya','yoruichi':'yoruichi','soifon':'soifon','urahara':'urahara','gin':'gin','tosen':'tosen','aizen':'aizen','vizard':'vizard','isshin':'isshin','masaki':'masaki','ryuken':'ryuken','ywhach':'ywhach','jugram':'jugram','haschwalth':'haschwalth','bazzb':'bazzb','gremmy':'gremmy','lille':'lille','pernida':'pernida','askin':'askin','gerard':'gerard','bambietta':'bambietta','candice':'candice','gintoki':'gintoki','shinpachi':'shinpachi','kagura':'kagura','okita':'okita','hijikata':'hijikata','kondo':'kondo','otose':'otose','catherine':'catherine','tama':'tama','takasugi':'takasugi','katsura':'katsura','sakamoto':'sakamoto','mutsu':'mutsu','kamui':'kamui','abuto':'abuto','umibozu':'umibozu','sarutobi':'sarutobi','zenzo':'zenzo','jiraia':'jiraia','edward':'edward','alphonse':'alphonse','winry':'winry','roy':'roy','rizahawkeye':'rizahawkeye','scar':'scar','ling':'ling','lanfan':'lanfan','may':'may','vanhohenheim':'vanhohenheim','dante':'dante','father':'father','pride':'pride','wrath':'wrath','gluttony':'gluttony','greed':'greed','sloth':'sloth','lust':'lust','envy':'envy','denji':'denji','power':'power','makima':'makima','aki':'aki','kishibe':'kishibe','reze':'reze','quanxi':'quanxi','katana':'katana','angel':'angel','beam':'beam','prinz':'prinz','galgali':'galgali','kobeni':'kobeni','asamiya':'asamiya','yoru':'yoru','asa':'asa','famine':'famine','death':'death','nayuta':'nayuta','bucky':'bucky','anya':'anya','yor':'yor','loid':'loid','bond':'bond','franky':'franky','damian':'damian','becky':'becky','sherwood':'sherwood','henry':'henry','yelena':'yelena','olka':'olka','fiona':'fiona','nightfall':'nightfall','daybreak':'daybreak','aqua':'aqua','ruby':'ruby','kana':'kana','akai':'akai','melt':'melt','frill':'frill','yuki':'yuki','kyun':'kyun','gotanda':'gotanda','pieyon':'pieyon','miyako':'miyako','ichigo':'ichigo','saitou':'saitou','airi':'airi','saitama':'saitama','garou':'garou','genos':'genos','tornado':'tornado','fubuki':'fubuki','king':'king','metalbat':'metalbat','watchdog':'watchdog','flash':'flash','atomic':'atomic','silverfang':'silverfang','childemperor':'childemperor','zombieman':'zombieman','sweetmask':'sweetmask','piggod':'piggod','driveknight':'driveknight','blast':'blast','boros':'boros','homeless':'homeless','jojo':'jojo','dio':'dio','jonathan':'jonathan','joseph':'joseph','jotaro':'jotaro','josuke':'josuke','giorno':'giorno','jolyne':'jolyne','johnny':'johnny','gappy':'gappy','will':'will','speedwagon':'speedwagon','straizo':'straizo','caesar':'caesar','kars':'kars','esidisi':'esidisi','wamuu':'wamuu','holhorse':'holhorse','kakyoin':'kakyoin','polnareff':'polnareff','avdol':'avdol','iggy':'iggy','koichi':'koichi','rohan':'rohan','kira':'kira','yoshikage':'yoshikage','diablo':'diablo'
};

const pluginConfig = {
name: gameCommands, alias: Object.keys(aliases), category: 'games',
description: 'Random gambar karakter game (300+ karakter!)',
usage: `.zhongli atau .goku`,
example: `.zhongli\n.goku\n.luffy\n.naruto`,
isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
cooldown: 5, energi: 0, isEnabled: true
};

async function handler(m, { sock }) {
let command = m.command?.toLowerCase() || 'game';
if (aliases[command]) command = aliases[command];
if (!gameCommands.includes(command)) {
const total = gameCommands.length;
return m.reply(
`🎮 *ɢᴀᴍᴇ ɢᴀʟʟᴇʀʏ*\n\n` +
`> Tersedia *${total}+* karakter game!\n` +
`> Contoh: \`.zhongli\`, \`.goku\`, \`.luffy\`, \`.naruto\`\n\n` +
`📋 *ʟɪꜱᴛ ᴄᴏᴍᴍᴀɴᴅ:*\n` +
`${gameCommands.slice(0, 30).map(cmd => `◈ .${cmd}`).join('\n')}\n` +
`_dan ${total - 30} command lainnya_`
);
}
try {
await m.react('🎮');
let imageUrl = null;
const apis = [
'https://api.waifu.pics/sfw/waifu',
'https://nekos.life/api/v2/img/waifu',
'https://api.waifu.im/images?isNsfw=false&orderBy=Random&page=1&pageSize=10'
];
for (let api of apis) {
try {
const { data } = await axios.get(api, { timeout: 5000 });
if (data.url) { imageUrl = data.url; break; }
else if (data.images && data.images.length > 0) {
const randomIdx = Math.floor(Math.random() * data.images.length);
imageUrl = data.images[randomIdx]?.url;
break;
}
else if (data.items && data.items.length > 0) {
const randomIdx = Math.floor(Math.random() * data.items.length);
imageUrl = data.items[randomIdx]?.url;
break;
}
} catch(e) {}
}
if (!imageUrl) {
const randomId = Math.floor(Math.random() * 1000);
imageUrl = `https://picsum.photos/seed/${command}${randomId}/800/800`;
}
await sock.sendMessage(m.chat, {
image: { url: imageUrl },
caption: `🎮 *${command.charAt(0).toUpperCase() + command.slice(1)}*\n` +
`> *ʀᴀɴᴅᴏᴍ ɢᴀᴍᴇ ɢᴀʟʟᴇʀʏ*\n` +
`> *Total Karakter: ${gameCommands.length}+*`
}, { quoted: m });
await m.react('🔥');
} catch (err) {
console.error('Game Error:', err);
return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Coba lagi nanti ya bre!`);
}
}
module.exports = { config: pluginConfig, handler };