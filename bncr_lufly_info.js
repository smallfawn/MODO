/**
 * @author smallfawn
 * @name bncr_lufly_info
 * @team smallfawn
 * @version 1.0.0
 * @description luflyV3
 * @rule ^(京东查询)
 * @admin false
 * @public false
 * @priority 1
 * @disable false

 */
const axios = require('axios')
let luflyApi = 'http://192.168.31.197:6789'
module.exports = async s => {
    const from = s.getFrom()
    const userId = s.getUserId()
    if (s.getMsg() == '京东查询') {
        let { data: getRes } = await axios.post(luflyApi + '/api/user/bind/get', { bindType: from, bindParams: userId })
        if (getRes.code == 0) {
            if (getRes.data.length == 0) {
                await s.reply('暂无绑定')
            } else {
                let message = '当前绑定账号:\n'
                for (let i = 0; i < getRes.data.length; i++) {
                    message += `${i + 1}.${getRes.data[i]}\n`
                }
                message += '\n请输入序号进行查询,输入0查询全部'
                await s.reply(message)
                let pin = ''
                let input = await s.waitInput(async (s) => {
                    let m = s.getMsg()
                    if (m == 0 || m == '0') {
                        await s.reply('查询全部')
                    } else {

                        let pin = getRes.data[Number(m) - 1]


                        await s.reply(`查询${pin}`)
                    }
                    let { data: infoRes } = await axios.post(luflyApi + '/api/user/bind/info', { bindType: from, bindParams: userId, pin: pin })
                    if (infoRes.code == 0) {
                        let userInfo = infoRes.data


                        let message = `======账号信息======\n`
                        for (let i of userInfo) {

                            message += i.join('\n') + `\n`
                        }
                        await s.reply(message)
                    }


                }, 60)
                if (input == null) return s.reply("超时/取消")

            }

        } else {
            await s.reply(res.msg)

        }
    }

}
