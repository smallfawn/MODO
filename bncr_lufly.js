/**
 * @author smallfawn
 * @name bncr_lufly
 * @team smallfawn
 * @version 1.0.0
 * @description 鹿飞账密V2新版登录
 * @rule ^(京东登录)
 * @admin false
 * @public false
 * @priority 1
 * @disable false

 */
function getNow() {
    const now = new Date();

    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hours = ('0' + now.getHours()).slice(-2);
    const minutes = ('0' + now.getMinutes()).slice(-2);
    const seconds = ('0' + now.getSeconds()).slice(-2);

    const formattedTime = year + month + day + hours + minutes + seconds;
    return formattedTime;
}



const axios = require('axios')
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let luflyApi = 'http://smjd.back1.idcfengye.com'
/* HideStart */
module.exports = async s => {
    if (s.getMsg() == '京东登录') {
        await s.reply('请输入京东账号[手机号/用户名] 输入q随时退出');
        let input;
        let username_input = await s.waitInput(async (s) => {
            input = s.getMsg();
            if (input === 'q') return await s.reply('已退出')
            let username = s.getMsg();
            await s.reply('请输入京东密码 输入q随时退出');
            let password_input = await s.waitInput(async (s) => {
                input = s.getMsg();
                if (input === 'q') return await s.reply('已退出')
                let password = s.getMsg();
                await s.reply('正在登陆中ing');
                let { data: res } = await axios.post(luflyApi + '/api/user/login/do', { username, password });




                if (res.code == 0) {
                    await s.reply('登录成功')
                    return
                }
                if (res.code == 1) {
                    await s.reply('登录风控，请先去该链接验证,验证成功后白屏即可返回，输入ok后系统自动重新登录' + res.data)
                    let risk_input = await s.waitInput(async (s) => {
                        input = s.getMsg();
                        if (input == 'ok') {
                            let { data: res } = await axios.post(luflyApi + '/api/user/login/do', { username, password });
                            if (res.code == 0) {
                                await s.reply(`======JD登录通知======\n
                                    登录用户: ${res.data['pin_token']}\n
                                    登录时间: ${getNow()}`)
                                return
                            }
                            else {
                                await s.reply('登录失败 请明天再次过验证')
                                return
                            }
                        }
                    }, 30);
                    if (risk_input === null) return s.reply('超时退出/已退出');
                }
                if (res.code == 2) {
                    await s.reply('登录失败' + res.msg)
                    return
                }









            }, 30);
            if (password_input === null) return s.reply('超时退出/已退出');



        }, 30);
        if (username_input === null) return await s.reply('已退出')
    }
};
/* HideEnd */
