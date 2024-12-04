/**
 * @author smallfawn
 * @name bncr_lufly
 * @team smallfawn
 * @version 1.0.0
 * @description lufly
 * @rule ^(京东登录)
 * @admin false
 * @public false
 * @priority 1
 * @disable false

 */
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
                    await s.reply('登录风控，请先去该链接验证' + res.data)
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
