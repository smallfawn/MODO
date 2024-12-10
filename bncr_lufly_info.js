/**
 * @author smallfawn
 * @name bncr_lufly_info
 * @team smallfawn
 * @version 1.0.1
 * @description luflyV3
 * @rule ^(京东查询)
 * @admin false
 * @public false
 * @priority 1
 * @disable false

 */
const axios = require('axios')
let QingLongUrl = ''
let QingLongAppid = ''
let QingLongSecret = ''



class QingLong {
    /**
     * 对接青龙API
     * @param {*} HOST http://127.0.0.1:5700
     * @param {*} Client_ID xxx
     * @param {*} Client_Secret xxx
     */
    constructor(HOST, Client_ID, Client_Secret) {
        this.host = HOST;
        this.clientId = Client_ID;
        this.clientSecret = Client_Secret;
        this.token = "";
        this.envs = [];
    }

    // 处理请求
    async request(t, m = "GET") {
        try {
            let { headers: h, params, body: b, url: u } = t;
            // 处理 GET 请求头部
            if (m.toUpperCase() === "GET" && params) {
                let queryString = new URLSearchParams(params).toString();
                u = `${u}?${queryString}`;
            }
            let opts = {
                method: m.toUpperCase(),
                headers: h,
                body: b
            };


            let response = await fetch(u, opts);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            let res = await response.json();
            return res;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // 获取用户密钥
    async getAuthToken() {
        const options = {
            url: `${this.host}/open/auth/token`,
            params: {
                client_id: this.clientId,
                client_secret: this.clientSecret,
            },
        };
        try {
            console.log(`传入参数: ${JSON.stringify(options)}`);
            const { code, data, message } = await this.request(options);
            if (code === 200) {
                const { token, token_type, expiration } = data;
                this.token = `${token_type} ${token}`;
            } else {
                throw message || "Failed to obtain user token.";
            }
        } catch (e) {
            throw e ? (typeof e === "object" ? JSON.stringify(e) : e) : "Network Error.";
        }
    }

    // 获取所有环境变量详情
    async getEnvs() {
        const options = {
            url: `${this.host}/open/envs`,
            headers: {
                'Authorization': this.token,
            },
        };
        try {
            const { code, data, message } = await this.request(options);
            if (code === 200) {
                this.envs = data;
                console.log(`✅Obtaining environment variables succeeded.`);
            } else {
                throw message || `Failed to obtain the environment variable.`;
            }
        } catch (e) {
            throw e ? (typeof e === "object" ? JSON.stringify(e) : e) : "Network Error.";
        }
    }

}

async function getCookieByPtpin(envs, ptpin) {

    for (let i = 0; i < envs.length; i++) {
        if (envs[i].name == 'JD_COOKIE' && envs[i].value.match(/pt_pin=([^;]+);/) && ptpin == envs[i].value.match(/pt_pin=([^;]+);/)[1]) {
            return envs[i].value
        }
    }
    return null
}

module.exports = async s => {
    const lufly_cache = new BncrDB('lufly_cache');
    const from = s.getFrom()
    const userId = s.getUserId()


    if (s.getMsg() == '京东查询') {
        let user = await lufly_cache.get(from + '_' + userId, "[]"); // 空值

        user = JSON.parse(user)

        let message = `当前共有${user.length}个账号\n`
        for (let i = 0; i < user.length; i++) {
            message += `${i + 1}.${user[i]['username']}${user[i]['pin']}\n`
        }
        message += '输入序号选择账号查询'
        await s.reply(message)

        let select_input = await s.waitInput(async (s) => {
            let num = s.getMsg();
            if (num === 'q') return await s.reply('已退出')
            num = Number(num)
            if (!testNumber(num)) {
                return await s.again('错误,重新输出');  //等价
            }
            if (num > user.length) {
                return await s.again('错误,重新输出');
            }
            let select_user = user[num - 1]
            let beanInfo = await getBeanInfo([select_user['pin']])
            return await s.reply(beanInfo)
        }, 60)
        if (select_input == null) {
            return await s.reply('超时/已退出')
        }
    } else {
        await s.reply(res.msg)

    }
}

function testNumber(num) {
    return !isNaN(num)
}
async function bean(cookie) {



    let allMessage = '';
    let myMap = new Map();
    let allBean = 0;
    let todayIncomeBean = 0
    let incomeBean = 0
    let errorMsg = ''
    let expenseBean = 0
    async function getJingBeanBalanceDetail(page) {

        const options = {
            "url": `https://api.m.jd.com/client.action?functionId=getJingBeanBalanceDetail`,
            "method": "POST",
            "data": `body=${escape(JSON.stringify({ "pageSize": "20", "page": page.toString() }))}&appid=ld`,
            "headers": {
                'User-Agent': '',
                'Host': 'api.m.jd.com',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': '' + cookie,
            }
        }
        //console.log(options);

        try {
            let { data: res } = await axios.request(options)
            return res

        } catch (e) {
            //console.log(e.response);

            //return e.response
        }


    }
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // console.log(`北京时间零点时间戳:${parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000}`);
    // console.log(`北京时间2020-10-28 06:16:05::${new Date("2020/10/28 06:16:05+08:00").getTime()}`)
    // 不管哪个时区。得到都是当前时刻北京时间的时间戳 new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000

    //前一天的0:0:0时间戳
    // 今天0:0:0时间戳
    const tm = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000 - (24 * 60 * 60 * 1000);
    const tm1 = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000;
    let page = 1, t = 0, yesterdayArr = [], todayArr = [];
    do {
        let response = await getJingBeanBalanceDetail(page);
        await wait(300);
        if (response && response.code === "0") {
            page++;
            let detailList = response.detailList;
            if (detailList && detailList.length > 0) {
                for (let item of detailList) {
                    const date = item.date.replace(/-/g, '/') + "+08:00";
                    if (new Date(date).getTime() >= tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes("物流") && !item['eventMassage'].includes('扣赠'))) {
                        todayArr.push(item);
                    } else if (tm <= new Date(date).getTime() && new Date(date).getTime() < tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes('扣赠'))) {
                        //昨日的
                        yesterdayArr.push(item);
                    } else if (tm > new Date(date).getTime()) {
                        //前天的
                        t = 1;
                        break;
                    }
                }
            } else {
                errorMsg = `数据异常`;
                t = 1;
            }
        } else if (response && response.code === "3") {
            // console.log(`cookie已过期，或者填写不规范，跳出`)
            t = 1;
        } else {
            console.log(`未知情况：${JSON.stringify(response)}`);
            console.log(`未知情况，跳出`)
            t = 1;
        }
    } while (t === 0);
    for (let item of yesterdayArr) {
        if (Number(item.amount) > 0) {
            incomeBean += Number(item.amount);
        } else if (Number(item.amount) < 0) {
            expenseBean += Number(item.amount);
        }
    }
    for (let item of todayArr) {
        if (Number(item.amount) > 0) {
            todayIncomeBean += Number(item.amount);
            myMap.set(item.eventMassage, 0)
        }
    }
    for (let item of todayArr) {
        if (Number(item.amount) > 0) {
            myMap.set(item.eventMassage, parseInt(myMap.get(item.eventMassage)) + parseInt(item.amount))
        }
    }

    for (let [key, value] of myMap) {
        allMessage += `${key}：${value}个京豆\n`
    }
    //console.log(allMessage);
    let pin = cookie.match(/pt_pin=([^;]+);/)[1]
    return ['' + pin, allMessage, `今日收入：${todayIncomeBean}个京豆 🐶`, `昨日支出：${expenseBean}个京豆 🐶`]

}
async function getBeanInfo(usersBind) {
    let ql = new QingLong(QingLongUrl, QingLongAppid, QingLongSecret);
    await ql.getAuthToken()
    await ql.getEnvs()
    if (usersBind.length != 0) {
        let cookiesArr = []
        for (let pin of usersBind) {
            let cookie = await getCookieByPtpin(ql.envs, pin)


            if (cookie) {
                cookiesArr.push(cookie)
            }
        }

        let message = []

        for (let cookie of cookiesArr) {
            let res = await bean(cookie)
            message.push(res)
        }
        return message
    } else {
        return []
    }



}
