/**
 * @author smallfawn
 * @name bncr_lufly
 * @team smallfawn
 * @version 1.0.0
 * @description luflyV3
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

    const formattedTime = year + '-' + month + '-' + day + '  ' + hours + ":" + minutes + ":" + seconds;
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
                let startTime = Date.now()
                let { data: loginRes } = await axios.post(luflyApi + '/api/user/login/do', { username, password });
                let endTime = Date.now()



                if (loginRes.code == 0) {
                    await s.reply(`======JD登录通知======\n登录用户: ${loginRes.data['pin']}\n登录时间: ${getNow()}\n耗时: ${(endTime - startTime) / 1000}s`)
                    let TOKEN = loginRes.data['token']
                    let { data: infoRes } = await axios.post(luflyApi + '/api/user/info', { params: "" }, {
                        headers: {
                            'token': `${TOKEN}`
                        }
                    });
                    if (infoRes.code == 0) {
                        if (infoRes.data['notify']['type'] == 'wxpusher') {
                            if (infoRes.data['notify']['params'] == '') {
                                let { data: pusherRes } = await axios.post(luflyApi + '/api/user/wxpusher', { params: "" }, {
                                    headers: {
                                        'token': `${TOKEN}`
                                    }
                                });
                                if (pusherRes.code == 0) {
                                    await s.reply({
                                        type: 'image', // video
                                        msg: '请用微信扫码绑定通知方式',
                                        path: pusherRes.data,
                                    });
                                    await s.reply('请微信扫码绑定通知方式 后续刷新失败则通知');
                                    return
                                }
                            }

                        }
                    }


                }
                if (loginRes.code == 1) {
                    await s.reply('登录风控，请先去该链接验证,验证成功后白屏即可返回，输入ok后系统自动重新登录' + loginRes.data)
                    let risk_input = await s.waitInput(async (s) => {
                        input = s.getMsg();
                        if (input == 'ok') {
                            let startTime = Date.now()
                            let { data: loginRes2 } = await axios.post(luflyApi + '/api/user/login/do', { username, password });
                            let endTime = Date.now()
                            if (loginRes2.code == 0) {

                                await s.reply(`======JD登录通知======\n登录用户: ${loginRes.data['pin']}\n登录时间: ${getNow()}\n耗时: ${(endTime - startTime) / 1000}s`)
                                let TOKEN = loginRes.data['token']
                                let { data: infoRes } = await axios.post(luflyApi + '/api/user/info', { params: "" }, {
                                    headers: {
                                        'token': `${TOKEN}`
                                    }
                                });
                                if (infoRes.code == 0) {
                                    if (infoRes.data['notify']['type'] == 'wxpusher') {
                                        if (infoRes.data['notify']['params'] == '') {
                                            let { data: pusherRes } = await axios.post(luflyApi + '/api/user/wxpusher', { params: "" }, {
                                                headers: {
                                                    'token': `${TOKEN}`
                                                }
                                            });
                                            if (pusherRes.code == 0) {
                                                await s.reply({
                                                    type: 'image', // video
                                                    msg: '请用微信扫码绑定通知方式',
                                                    path: pusherRes.data,
                                                });
                                                await s.reply('请微信扫码绑定通知方式 后续刷新失败则通知');
                                                return
                                            }
                                        }

                                    }
                                }

                            }
                            else {
                                await s.reply('登录失败 请明天再次过验证')
                                return
                            }
                        }
                    }, 60);
                    if (risk_input === null) return s.reply('超时退出/已退出');
                }
                if (loginRes.code == 2) {
                    await s.reply('登录失败' + loginRes.msg)
                    return
                }









            }, 90);
            if (password_input === null) return s.reply('超时退出/已退出');



        }, 120);
        if (username_input === null) return await s.reply('已退出')
    }
};
/* HideEnd */
