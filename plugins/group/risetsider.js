const { resetSider } = require('../../src/lib/listsider')

const pluginConfig = {
name: 'risetsider',
alias: [],
category: 'group',
isGroup: true,
isAdmin: true,
cooldown: 10,
isEnabled: true
}

async function handler(m){

resetSider(m.chat)

m.reply(`✅ List sider di group ini sudah di riset.`)

}

module.exports = {
config: pluginConfig,
handler
}