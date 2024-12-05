const luflyApi = ''  //你的内网或公网lufly地址
const username = '' //lufly管理员用户名
const password = '' //lufly管理员密码
const wxpusherToken = ''   //懂得都懂
//登录拿到TOKEN
//TOKEN获取COOKIE列表
//获取JD失效的COOKIE
//匹配COOKIE列表和失效的列表ptpin
//进行更新
const axios = require('axios');
async function getTokenByLufly() {
    const { data: res } = await axios.post(luflyApi + '/api/admin/login', { username, password });
    console.log(res)
    if (res.code == 0) {
        return res.data.token;
    } else {
        return null
    }
}
async function getCookiesByLufly() {
    let token = await getTokenByLufly()
    const { data: res } = await axios.post(luflyApi + '/api/admin/data', { params: "" }, {
        headers: {
            token: `${token}`,
        },
    });
    if (res.code == 0) {
        return res.data
    } else {
        return null
    }
}

async function LOGINAPI(username, password, uid = '') {
    let { data: res } = await axios.post(luflyApi + '/api/user/login/do', { username, password });
    if (res.code == 0) {
        console.log('登录成功')
        return true;
    }
    if (res.code == 1) {
        if (uid) {
            await wxpusher('账号刷新失败,请重新在网站登录', uid)
        }

        console.log('登录失败' + res.msg)
        return false
    }
    if (res.code == 2) {
        console.log('登录失败' + res.msg)
        return false
    }
}
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function wxpusher(content, uid) {
    let encoded_content = encodeURIComponent(content);
    const url = "https://wxpusher.zjiecode.com/api/send/message/?appToken=" + wxpusherToken + "&content=" + encoded_content + "&uid=" + uid + "&url=http%3a%2f%2fbaidu.com"
    const { data: res } = axios.get(url)
}
async function main() {
    let luflyCookies = await getCookiesByLufly()
    for (let i of luflyCookies) {
        let qinglongCookie = await getEnvByPtPin(i.ptpin)
        console.log(`默认延迟每10s`)
        await wait(1000)
        if (qinglongCookie) {
            if (qinglongCookie.status == 1) {
                console.log('账号' + i.ptpin + '已失效')
                //更新拿到COOKIE后update
                let loginRes = await LOGINAPI(i.username, i.password, i['notify']['params'])
                let isFlag = false


            }
        } else {
            //更新拿到COOKIE后add
            let loginRes = await LOGINAPI(i.username, i.password)
            let isFlag = false

        }
    }
}



main()

'use strict';

const got = require('got');
require('dotenv').config();
const { readFile } = require('fs/promises');
const fs = require('fs');
let Fileexists = fs.existsSync('/ql/data/config/auth.json');
let authFile = "";
if (Fileexists) { authFile = "/ql/data/config/auth.json" }
else { authFile = "/ql/config/auth.json" }


const api = got.extend({
    prefixUrl: 'http://127.0.0.1:5600',
    retry: { limit: 0 },
});

async function getToken() {
    const authConfig = JSON.parse(await readFile(authFile));
    return authConfig.token;
}

async function getEnvs() {
    const token = await getToken();
    const body = await api({
        url: 'api/envs',
        searchParams: {
            searchValue: 'JD_COOKIE',
            t: Date.now(),
        },
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
        },
    }).json();
    return body.data;
};



async function addEnv(cookie, remarks) {
    const token = await getToken();
    const body = await api({
        method: 'post',
        url: 'api/envs',
        params: { t: Date.now() },
        json: [{
            name: 'JD_COOKIE',
            value: cookie,
            remarks,
        }],
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json();
    return body;
};

async function getCookiesByQinglong() {
    let qinglongCookies = await getEnvs()
    return qinglongCookies;
}

async function updateEnv(cookie, eid, remarks) {
    const token = await getToken();
    const body = await api({
        method: 'put',
        url: 'api/envs',
        params: { t: Date.now() },
        json: {
            name: 'JD_COOKIE',
            value: cookie,
            id: eid,
            remarks,
        },
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json();
    return body;
};



async function EnableCk(eid) {
    const token = await getToken();
    const body = await api({
        method: 'put',
        url: 'api/envs/enable',
        params: { t: Date.now() },
        body: JSON.stringify([eid]),
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json();
    return body;
};





async function getEnvByPtPin(Ptpin) {
    const envs = await getEnvs();
    for (let i = 0; i < envs.length; i++) {
        var tempptpin = decodeURIComponent(envs[i].value.match(/pt_pin=([^; ]+)(?=;?)/) && envs[i].value.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        if (tempptpin == Ptpin) {
            return envs[i];
        }
    }
    return "";
};
