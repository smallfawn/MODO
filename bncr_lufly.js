/**
 * @author smallfawn
 * @name bncr_lufly
 * @team smallfawn
 * @version 1.0.6
 * @description luflyV3
 * @rule ^(京东登录)
 * @admin false
 * @public false
 * @priority 1
 * @disable false

 */


const axios = require('axios')

let luflyApi = 'http://192.168.31.197:6789'

/* HideStart */
module.exports = async s => {
    const lufly_cache = new BncrDB('lufly_cache');

    if (s.getMsg() == '京东登录') {
        const from = s.getFrom()
        const userId = s.getUserId()
        let input;
        await s.reply(userId + '请输入登录方式\n1.账号密码登录\n2.短信登录\n输入数字即可 输入q退出');
        let type_input = await s.waitInput(async (s) => {
            input = s.getMsg();
            if (input === 'q') return await s.reply('已退出')
            let type = s.getMsg();
            if (type == '1' || type == 1) {
                await s.reply('请输入京东账号[手机号/用户名] 输入q随时退出');

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
                            let user = await lufly_cache.get(from + '_' + userId, "[]"); // 空值

                            user = JSON.parse(user)
                            let isHave = false
                            for (let i = 0; i < user.length; i++) {
                                if (user[i]['username'] == username) {
                                    user[i]['pin'] = loginRes.data['pin'];
                                    isHave = true
                                }
                            }
                            if (!isHave) {
                                user.push({ username: username, pin: loginRes.data['pin'] })
                            }



                            await lufly_cache.set(from + '_' + userId, JSON.stringify(user)); // 成功 true 失败false
                            await s.reply(`======JD登录通知======\n登录用户: ${loginRes.data['pin']}\n登录时间: ${getNow()}\n耗时: ${(endTime - startTime) / 1000}s\n输入:京东查询 查询收益`)
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
                                            await s.reply('请微信扫码绑定通知方式 后续刷新失败则通知 扫码成功即可 无需等待回复');
                                            return
                                        }
                                    }

                                }
                            }


                        }
                        if (loginRes.code == 1) {
                            await s.reply('登录风控，请先去该链接验证,验证成功后白屏即可返回，验证完成后60s后 系统自动重新登录\n\n如果两次风控则代表该账号处于风控状态，明日再试\n或使用短信登录' + loginRes.data)

                            await wait(60 * 1000)

                            let startTime = Date.now()
                            let { data: loginRes2 } = await axios.post(luflyApi + '/api/user/login/do', { username, password });
                            let endTime = Date.now()
                            if (loginRes2.code == 0) {
                                //console.log(loginRes2);
                                let user = await lufly_cache.get(from + '_' + userId, "[]"); // 空值

                                user = JSON.parse(user)
                                let isHave = false
                                for (let i = 0; i < user.length; i++) {
                                    if (user[i]['username'] == username) {
                                        user[i]['pin'] = loginRes.data['pin'];
                                        isHave = true
                                    }
                                }
                                if (!isHave) {
                                    user.push({ username: username, pin: loginRes.data['pin'] })
                                }
                                await lufly_cache.set(from + '_' + userId, JSON.stringify(user)); // 成功 true 失败false
                                await s.reply(`======JD登录通知======\n登录用户: ${loginRes2.data['pin']}\n登录时间: ${getNow()}\n耗时: ${(endTime - startTime) / 1000}s\n输入:京东查询 查询收益`)
                                let TOKEN = loginRes2.data['token']
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
                                                await s.reply('请微信扫码绑定通知方式 后续刷新失败则通知 扫码成功即可 无需等待回复');
                                                return
                                            }
                                        }

                                    }
                                }

                            }
                            else {
                                await s.reply('登录失败 请明天再次过验证登录\n或使用短信登录')
                                return
                            }


                        }
                        if (loginRes.code == 2) {
                            await s.reply('登录失败' + loginRes.msg)
                            return
                        }









                    }, 180);
                    if (password_input === null) return s.reply('超时退出/已退出');



                }, 240);
                if (username_input === null) return await s.reply('已退出')
            }
            if (type == '2' || type == 2) {
                await s.reply('请输入京东账号[手机号] 输入q随时退出');

                let phone_input = await s.waitInput(async (s) => {
                    input = s.getMsg();
                    if (input === 'q') return await s.reply('已退出')
                    let username = s.getMsg();
                    if (!testPhone(username)) {


                        await s.reply('格式不对手机号,重新输入京东登录')
                        return
                    }
                    await s.reply('正在发送短信...')
                    let startTime = Date.now()
                    let { data: sendRes } = await axios.post(luflyApi + '/api/user/login/send', { username });
                    let endTime = Date.now()

                    if (sendRes.code == 0) {

                        await s.reply(`======发送短信成功======\n用户: ${username}\n发送时间: ${getNow()}\n耗时: ${(endTime - startTime) / 1000}s\n输入:京东查询 查询收益`)
                        await s.reply('请输入短信验证码 输入q随时退出')
                        let code_input = await s.waitInput(async (s) => {
                            input = s.getMsg();
                            if (input === 'q') return await s.reply('已退出')
                            let code = s.getMsg();
                            if (!isSixDigit(code)) {
                                await s.reply('验证码格式不对 重新输入')
                            }
                            code = s.getMsg();
                            let startTime = Date.now()
                            let { data: loginRes } = await axios.post(luflyApi + '/api/user/login/code', { username, code });
                            let endTime = Date.now()
                            if (loginRes.code == 0) {
                                let TOKEN = loginRes.data.token;
                                let user = await lufly_cache.get(from + '_' + userId, "[]"); // 空值

                                user = JSON.parse(user)
                                let isHave = false
                                for (let i = 0; i < user.length; i++) {
                                    if (user[i]['username'] == username) {
                                        user[i]['pin'] = loginRes.data['pin'];
                                        isHave = true
                                    }
                                }
                                if (!isHave) {
                                    user.push({ username: username, pin: loginRes.data['pin'] })
                                }
                                await lufly_cache.set(from + '_' + userId, JSON.stringify(user)); // 成功 true 失败false
                                await s.reply(`======JD登录通知======\n登录用户: ${loginRes.data['pin']}\n登录时间: ${getNow()}\n耗时: ${(endTime - startTime) / 1000}s\n输入:京东查询 查询收益`)
                            } else {
                                await s.reply('登录失败' + loginRes.msg)
                            }




                        }, 180)
                        if (code_input === null) return await s.reply('超时/已退出')






                    } else {
                        await s.reply(sendRes.msg)
                    }
                }, 240);
                if (phone_input === null) return await s.reply('超时/已退出')

            }


        }, 300);
        if (type_input === null) return await s.reply('超时/已退出')

    }
};

function testPhone(str) {
    // ^1  以1开头
    // [3456789] 第2位，使用原子表里的任意一个原子都可以
    // \d{9}$  第三位  朝后可以是任意数字  并且最后结尾必须是数字

    if (!/^1[3456789]\d{9}$/.test(str)) {
        // 前面添加 ！ 的意义是给这个函数  取反
        // if(!/^1[3456789]\d{9}$/.test(str)){
        return false;
    } else {
        return true;
    }
}

function isSixDigit(numOrStr) {
    const str = numOrStr.toString(); // 先统一转换为字符串类型
    const reg = /^\d{6}$/;
    return reg.test(str);
}
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

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* HideEnd */
