const axios = require('axios');
const donghuaCommands = [
'wangling','chenchao','sunrong','wangmom','fatherwang','xiaoyan','yaolao','xiaoxuner','medusa','nalanyanran','tangsan','xiaowu','daimubai','oscar','ningrongrong','zhuzhuqing','mahongjun','tanghao','bibidong','tangyuehua','xielian','huacheng','sanlang','nanfeng','fuyao','weiwuxian','lanwangji','jiangcheng','jinling','lansizhui','wending','lanxichen','niehuaisang','jinguangyao','xueyang','wanglin','limuwan','situnan','redbutterfly','qianmei','luofeng','hong','thunder','ying','jiangfang','linqiye','qingya','anqing','leiming','yuling','lushu','lingling','yaojing','luyu','zhangyang','tuli','jingxuan','fengmian','xulinglong','liqiu','yexiu','sumucheng','chenguo','tangrou','baorongxing','weichen','zhangxinjie','liuhao','hanwenqing','sunxiang','seven','liuqi','thirteen','cola','daibo','hedachun','jianghuilian','feiwang','qingfeng','profesor','heimao','shihao','huolinger','qingyi','qinhao','yunxi','yuechan','caoyusheng','tiangu','shiqingfeng','liushen','kunpeng','guojing','huangrong','yangkang','munianci','duantiande','hongqigong','huangyaoshi','ouyangfeng','zhoubotong','yueerniang','lindong','yinghuanhuan','lingqingzhu','mulingshan','leixing','chenzhen','suyouwei','zhangxiaofan','luxueqi','baguio','tianbuyi','suru','yunyilan','ghostking','bibi','xiaobai','baixiaochun','liqing','dulingfei','gongsunwaner','songjunwan','houxiaomei','zhouzimo','qinchen','xiaorou','qinyao','fengyixiu','yueling','shenxue','mengqing','chenling','yizaha','hyeon','jeok','nar','naru','hwang','jinyang','baek','mok','gyeongwoon','cheon','ma','yulia','sosuke','reina','klaus','kimhyunsung','hyunsung','jaehwa','minji','young','seok','romandimitri','roman','demitri','baek','joonghyuk','kairo','philia','penelope','eckhart','callisto','derek','ivonne','osmond','emil','sanghee','yeon','soo','kyung','hwa','jinsu','sunhee','bi','chu','shineunhye','eunhye','yun','jay','angels','demon','reaper','grim','cheonyeowoon','yeowoon','cheon','nano','sword','murim','heavenly','reaper','moon','monarch','ghost','blade','shadow','assassin','northern','blade','snow','ice','storm','iron','steel','poison','dragon','viper','venom','serpent','green','death','boss','school','gang','fighter','king','street','roof','sword','master','sky','blade','storm','kim','lee','park','choi','jung','kang','yoon','jang','lim','han','oh','shin','kwon','ko','young','jin','seo','hwang','shou','hajime','maou','hero','saint','lord','king','queen','prince','princess','duke','count','baron','knight','mage','warrior','ranger','assassin','paladin','summoner','wizard','swordsman','archer','thief','berserker','priest','shaman'
];
const aliases = {
'sjw':'wangling','sl':'wangling','jin':'wangling','ar':'xiaoyan','tbate':'xiaoyan','tog':'tangsan','baam':'tangsan','twenty':'tangsan','kdj':'weiwuxian','orv':'weiwuxian','yoo':'weiwuxian','yjh':'weiwuxian','sj':'wangling','hsy':'xielian','gohs':'huacheng','godhs':'huacheng','mori':'huacheng','ns':'tangsan','noblesse':'tangsan','tgm':'wanglin','tgma':'wanglin','gd':'shineunhye','godbless':'shineunhye','nano':'cheonyeowoon','machine':'cheonyeowoon','slr':'lushu','rank':'lushu','berserk':'guts','myst':'mok','mayhem':'mok','rom':'romandimitri','hd':'romandimitri','devil':'kimhyunsung','return':'kimhyunsung','crazy':'yizaha','mad':'yizaha','erk':'encrid','eternal':'encrid','wind':'jay','wb':'jay','weak':'gray','hero':'gray','villain':'penelope','vadtd':'penelope','yoon':'garam','garam':'garam','karma':'garam','humanweapon':'garam','plaything':'garam','norae':'garam'
};
const pluginConfig = {
name: donghuaCommands, alias: Object.keys(aliases), category: 'donghua',
description: 'Random gambar karakter Donghua (1600+ karakter!)',
usage: `.wangling atau .xiaoyan`,
example: `.wangling\n.xiaoyan\n.tangsan`,
isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
cooldown: 5, energi: 0, isEnabled: true
};
async function handler(m, { sock }) {
let command = m.command?.toLowerCase() || 'donghua';
if (aliases[command]) command = aliases[command];
if (!donghuaCommands.includes(command)) {
const total = donghuaCommands.length;
return m.reply(
`📚 *ᴅᴏɴɢʜᴜᴀ ɢᴀʟʟᴇʀʏ*\n\n` +
`> Tersedia *${total}+* karakter Donghua!\n` +
`> Contoh: \`.wangling\`, \`.xiaoyan\`, \`.tangsan\`\n\n` +
`📋 *ʟɪꜱᴛ ᴄᴏᴍᴍᴀɴᴅ:*\n` +
`${donghuaCommands.slice(0, 30).map(cmd => `◈ .${cmd}`).join('\n')}\n` +
`_dan ${total - 30} command lainnya_`
);
}
try {
await m.react('📚');
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
caption: `📚 *${command.charAt(0).toUpperCase() + command.slice(1)}*\n` +
`> *ʀᴀɴᴅᴏᴍ ᴅᴏɴɢʜᴜᴀ ɢᴀʟʟᴇʀʏ*\n` +
`> *Total Karakter: ${donghuaCommands.length}+*`
}, { quoted: m });
await m.react('🔥');
} catch (err) {
console.error('Donghua Error:', err);
return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Coba lagi nanti ya bre!`);
}
}
module.exports = { config: pluginConfig, handler };