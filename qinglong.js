/*
青龙账密自动更新工具
教程 https://thin-hill-428.notion.site/N0-6-13daae1a9ef880e29e77d9abc392a2db?pvs=4
环境变量：
LUFLY_API  你的内网或公网lufly地址
LUFLY_USERNAME lufly管理员用户名
LUFLY_PASSWORD lufly管理员密码
WXPUSHER_TOKEN 懂得都懂

cron:0 3 * * * jd_autock.js

*/

const $ = new Env('青龙路飞账密更新工具')

const axios = require('axios');
require('dotenv').config();

const luflyApi = process.env.LUFLY_API;
const username = process.env.LUFLY_USERNAME;
const password = process.env.LUFLY_PASSWORD;
const wxpusherToken = process.env.WXPUSHER_TOKEN;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取 Lufly 的 Token
async function getTokenByLufly() {
    try {
        console.log('正在尝试获取 Lufly Token...');
        const { data: res } = await axios.post(luflyApi + '/api/admin/login', { username, password });
        if (res.code == 0) {
            console.log('Lufly Token 获取成功');
            return res.data.token;
        } else {
            console.error('Lufly Token 获取失败:', res.message);
            return null;
        }
    } catch (error) {
        console.error('获取 Lufly Token 时发生错误:', error.message);
        return null;
    }
}

// 获取 Lufly 的 Cookies
async function getCookiesByLufly() {
    try {
        console.log('正在从 Lufly 获取 Cookies 列表...');
        const token = await getTokenByLufly();
        if (!token) return [];
        const { data: res } = await axios.post(
            luflyApi + '/api/admin/data',
            { params: "" },
            { headers: { token } }
        );
        if (res.code == 0) {
            console.log(`成功获取到 ${res.data.length} 个 Cookies`);
            return res.data;
        } else {
            console.error('获取 Cookies 列表失败:', res.message);
            return [];
        }
    } catch (error) {
        console.error('获取 Cookies 列表时发生错误:', error.message);
        return [];
    }
}

// 登录操作
async function LOGINAPI(username, password) {
    try {
        console.log(`尝试登录用户: ${username}`);
        const { data: res } = await axios.post(luflyApi + '/api/user/login/do', { username, password });
        if (res.code == 0) {
            console.log(`用户 ${username} 登录成功`);
            return true;
        } else {
            console.error(`用户 ${username} 登录失败: ${res.message}`);
            return false;
        }
    } catch (error) {
        console.error('登录时发生错误:', error.message);
        return false;
    }
}

// 检查登录状态
async function CHECKAPI(username, uid) {
    try {
        const { data: res } = await axios.post(luflyApi + '/api/user/login/check', { username });
        if (res.code == 0) {
            console.log(`用户 ${username} 刷新成功`);
            return true;
        } else if (res.code == 3) {
            console.warn(`用户 ${username} 登录风控，请验证链接: ${res.data}`);
            if (uid) await wxpusher('风控验证', uid);
            return false;
        } else {
            console.error(`用户 ${username} 登录失败: ${res.msg}`);
            return false;
        }
    } catch (error) {
        console.error('检查登录状态时发生错误:', error.message);
        return false;
    }
}

// 发送微信推送
async function wxpusher(content, uid) {
    try {
        const encodedContent = encodeURIComponent(content);
        const url = `https://wxpusher.zjiecode.com/api/send/message/?appToken=${wxpusherToken}&content=${encodedContent}&uid=${uid}&url=http%3a%2f%2fbaidu.com`;
        console.log(`发送微信推送: ${content}`);
        await axios.get(url);
    } catch (error) {
        console.error('发送微信推送时发生错误:', error.message);
    }
}

// QingLong 部分：获取、添加、更新环境变量
const got = require('got');
const { readFile } = require('fs/promises');
const fs = require('fs');

let authFile = fs.existsSync('/ql/data/config/auth.json') ? '/ql/data/config/auth.json' : '/ql/config/auth.json';

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
        searchParams: { searchValue: 'JD_COOKIE', t: Date.now() },
        headers: { Accept: 'application/json', authorization: `Bearer ${token}` },
    }).json();
    return body.data;
}

async function getEnvByPtPin(ptpin) {
    const envs = await getEnvs();
    for (let env of envs) {
        const tempptpin = decodeURIComponent(env.value.match(/pt_pin=([^; ]+)(?=;?)/)?.[1] || '');
        if (tempptpin === ptpin) return env;
    }
    return null;
}

// 处理更新操作，仅对失效 CK
async function handleCookieUpdate(cookie) {
    const qinglongCookie = await getEnvByPtPin(cookie.ptpin);
    if (qinglongCookie) {
        if (qinglongCookie.status == 1) { // 仅对失效的 CK 进行更新
            console.log(`检测到失效的 Cookie，正在更新: ${cookie.ptpin}`);
            const loginRes = await LOGINAPI(cookie.username, cookie.password);
            if (loginRes) {
                let isUpdated = false;
                for (let attempt = 0; attempt < 30; attempt++) {
                    await wait(1000);
                    const uid = cookie.notify?.type === 'wxpusher' ? cookie.notify.params : '';
                    const checkRes = await CHECKAPI(cookie.username, uid);
                    if (checkRes) {
                        isUpdated = true;
                        console.log(`Cookie 更新成功: ${cookie.ptpin}`);
                        break;
                    }
                }
                if (!isUpdated) {
                    console.error(`Cookie 更新超时: ${cookie.ptpin}`);
                }
            } else {
                console.error(`Cookie 更新失败，登录失败: ${cookie.ptpin}`);
            }
        } else {
            console.log(`Cookie 已启用且有效，无需更新: ${cookie.ptpin}`);
        }
    } else {
        console.error(`未找到对应的 QingLong Cookie: ${cookie.ptpin}`);
    }
}

// 主函数
async function main() {
    const luflyCookies = await getCookiesByLufly();
    if (luflyCookies.length === 0) {
        console.log('未从 Lufly 获取到任何 Cookies 列表');
        return;
    }

    await Promise.all(luflyCookies.map(async cookie => {
        const qinglongCookie = await getEnvByPtPin(cookie.ptpin);
        if (qinglongCookie) {
            console.log(`检测到已存在的 Cookie: ${cookie.ptpin}`);
            await handleCookieUpdate(cookie);
        } else {
            console.log(`未找到对应的 QingLong Cookie，将进行添加: ${cookie.ptpin}`);
            // 添加新 CK 的逻辑
        }
    }));

    console.log('所有任务已完成');
}

main().catch(err => console.error('主任务发生错误:', err));

function Env(o,t){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((r,i)=>{s.call(this,t,(t,e,s)=>{t?i(t):r(e)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.logLevels={debug:0,info:1,warn:2,error:3},this.logLevelPrefixs={debug:"[DEBUG] ",info:"[INFO] ",warn:"[WARN] ",error:"[ERROR] "},this.logLevel="info",this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null,...s){try{return JSON.stringify(t,...s)}catch{return e}}getjson(t,e){let s=e;if(this.getdata(t))try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(r=>{this.get({url:t},(t,e,s)=>r(s))})}runScript(a,o){return new Promise(r=>{let t=this.getdata("@chavy_boxjs_userCfgs.httpapi");t=t&&t.replace(/\n/g,"").trim();var e=(e=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"))?+e:20,[s,i]=(e=o&&o.timeout?o.timeout:e,t.split("@"));this.post({url:`http://${i}/v1/scripting/evaluate`,body:{script_text:a,mock_type:"cron",timeout:e},headers:{"X-Key":s,Accept:"*/*"},timeout:e},(t,e,s)=>r(s))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};this.fs=this.fs||require("fs"),this.path=this.path||require("path");var t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),r=!s&&this.fs.existsSync(e);if(!s&&!r)return{};r=s?t:e;try{return JSON.parse(this.fs.readFileSync(r))}catch(t){return{}}}writedata(){var t,e,s,r,i;this.isNode()&&(this.fs=this.fs||require("fs"),this.path=this.path||require("path"),t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),r=!(s=this.fs.existsSync(t))&&this.fs.existsSync(e),i=JSON.stringify(this.data),!s&&r?this.fs.writeFileSync(e,i):this.fs.writeFileSync(t,i))}lodash_get(t,e,s){let r=t;for(const t of e.replace(/\[(\d+)\]/g,".$1").split("."))if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,r,e){return Object(t)===t&&((r=Array.isArray(r)?r:r.toString().match(/[^.[\]]+/g)||[]).slice(0,-1).reduce((t,e,s)=>Object(t[e])===t[e]?t[e]:t[e]=Math.abs(r[s+1])>>0==+r[s+1]?[]:{},t)[r[r.length-1]]=e),t}getdata(t){let e=this.getval(t);if(/^@/.test(t)){var[,s,r]=/^@(.*?)\.(.*?)$/.exec(t);if(s=s?this.getval(s):"")try{const t=JSON.parse(s);e=t?this.lodash_get(t,r,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){var[,r,i]=/^@(.*?)\.(.*?)$/.exec(e),a=this.getval(r),a=r?"null"===a?null:a||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,i,t),s=this.setval(JSON.stringify(e),r)}catch(e){this.lodash_set(a={},i,t),s=this.setval(JSON.stringify(a),r)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got||require("got"),this.cktough=this.cktough||require("tough-cookie"),this.ckjar=this.ckjar||new this.cktough.CookieJar,t&&(t.headers=t.headers||{},t)&&(t.headers=t.headers||{},void 0===t.headers.cookie)&&void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar)}tmout(){return new Promise((t,e)=>{this.tmoutId=setTimeout(()=>{this.prms.cancel(),e({message:"timemout",response:""})},5e4)})}get(t,a=()=>{}){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),void 0===t.followRedirect||t.followRedirect||((this.isSurge()||this.isLoon())&&(t["auto-redirect"]=!1),this.isQuanX()&&(t.opts?t.opts.redirection=!1:t.opts={redirection:!1})),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,e,s)=>{!t&&e&&(e.body=s,e.statusCode=e.status||e.statusCode,e.status=e.statusCode),a(t,e,s)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{var{statusCode:t,statusCode:e,headers:s,body:r,bodyBytes:i}=t;a(null,{status:t,statusCode:e,headers:s,body:r,bodyBytes:i},r,i)},t=>a(t&&t.error||"UndefinedError"));break;case"Node.js":this.initGotEnv(t),this.prms=this.got(t).on("redirect",(t,e)=>{try{var s;t.headers["set-cookie"]&&((s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString())&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar)}catch(t){this.logErr(t)}}),Promise.race([this.prms,this.tmout()]).then(t=>{var{statusCode:t,statusCode:e,headers:s,rawBody:r,body:i}=t;a(null,{status:t,statusCode:e,headers:s,rawBody:r,body:i},i),clearTimeout(this.tmoutId)},t=>{var{message:t,response:e}=t;clearTimeout(this.tmoutId),a(t,e,e&&e.body)})}}post(t,a=()=>{}){var e=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),void 0===t.followRedirect||t.followRedirect||((this.isSurge()||this.isLoon())&&(t["auto-redirect"]=!1),this.isQuanX()&&(t.opts?t.opts.redirection=!1:t.opts={redirection:!1})),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[e](t,(t,e,s)=>{!t&&e&&(e.body=s,e.statusCode=e.status||e.statusCode,e.status=e.statusCode),a(t,e,s)});break;case"Quantumult X":t.method=e,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{var{statusCode:t,statusCode:e,headers:s,body:r,bodyBytes:i}=t;a(null,{status:t,statusCode:e,headers:s,body:r,bodyBytes:i},r,i)},t=>a(t&&t.error||"UndefinedError"));break;case"Node.js":this.initGotEnv(t);var{url:s,...r}=t;this.prms=this.got[e](s,r),Promise.race([this.prms,this.tmout()]).then(t=>{var{statusCode:t,statusCode:e,headers:s,rawBody:r,body:i}=t;a(null,{status:t,statusCode:e,headers:s,rawBody:r,body:i},i),clearTimeout(this.tmoutId)},t=>{var{message:t,response:e}=t;clearTimeout(this.tmoutId),a(t,e,e&&e.body)})}}time(t,e=null){var s,r={"M+":(e=e?new Date(e):new Date).getMonth()+1,"d+":e.getDate(),"H+":e.getHours(),"m+":e.getMinutes(),"s+":e.getSeconds(),"q+":Math.floor((e.getMonth()+3)/3),S:e.getMilliseconds()};for(s in/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(e.getFullYear()+"").substr(4-RegExp.$1.length))),r)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?r[s]:("00"+r[s]).substr((""+r[s]).length)));return t}queryStr(e){let s="";for(const r in e){let t=e[r];null!=t&&""!==t&&("object"==typeof t&&(t=JSON.stringify(t)),s+=`${r}=${t}&`)}return s=s.substring(0,s.length-1)}msg(t=o,e="",s="",r={}){var i,a=r=>{const{$open:t,$copy:e,$media:i,$mediaMime:a}=r;switch(typeof r){case void 0:return r;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:r};case"Loon":case"Shadowrocket":return r;case"Quantumult X":return{"open-url":r};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:var o={},s=r.openUrl||r.url||r["open-url"]||t;if(s&&Object.assign(o,{action:"open-url",url:s}),(s=r["update-pasteboard"]||r.updatePasteboard||e)&&Object.assign(o,{action:"clipboard",text:s}),i){let t,e,s;if(i.startsWith("http"))t=i;else if(i.startsWith("data:")){const[r]=i.split(";"),[,a]=i.split(",");e=a,s=r.replace("data:","")}else e=i,s=(t=>{var e,s={JVBERi0:"application/pdf",R0lGODdh:"image/gif",R0lGODlh:"image/gif",iVBORw0KGgo:"image/png","/9j/":"image/jpg"};for(e in s)if(0===t.indexOf(e))return s[e];return null})(i);Object.assign(o,{"media-url":t,"media-base64":e,"media-base64-mime":a??s})}return Object.assign(o,{"auto-dismiss":r["auto-dismiss"],sound:r.sound}),o;case"Loon":{const e={};(s=r.openUrl||r.url||r["open-url"]||t)&&Object.assign(e,{openUrl:s});var n=r.mediaUrl||r["media-url"];return(n=i?.startsWith("http")?i:n)&&Object.assign(e,{mediaUrl:n}),console.log(JSON.stringify(e)),e}case"Quantumult X":{const a={};(o=r["open-url"]||r.url||r.openUrl||t)&&Object.assign(a,{"open-url":o});n=r["media-url"]||r.mediaUrl;return(n=i?.startsWith("http")?i:n)&&Object.assign(a,{"media-url":n}),(s=r["update-pasteboard"]||r.updatePasteboard||e)&&Object.assign(a,{"update-pasteboard":s}),console.log(JSON.stringify(a)),a}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(t,e,s,a(r));break;case"Quantumult X":$notify(t,e,s,a(r));break;case"Node.js":}this.isMuteLog||((i=["","==============📣系统通知📣=============="]).push(t),e&&i.push(e),s&&i.push(s),console.log(i.join("\n")),this.logs=this.logs.concat(i))}debug(...t){this.logLevels[this.logLevel]<=this.logLevels.debug&&(0<t.length&&(this.logs=[...this.logs,...t]),console.log(""+this.logLevelPrefixs.debug+t.map(t=>t??String(t)).join(this.logSeparator)))}info(...t){this.logLevels[this.logLevel]<=this.logLevels.info&&(0<t.length&&(this.logs=[...this.logs,...t]),console.log(""+this.logLevelPrefixs.info+t.map(t=>t??String(t)).join(this.logSeparator)))}warn(...t){this.logLevels[this.logLevel]<=this.logLevels.warn&&(0<t.length&&(this.logs=[...this.logs,...t]),console.log(""+this.logLevelPrefixs.warn+t.map(t=>t??String(t)).join(this.logSeparator)))}error(...t){this.logLevels[this.logLevel]<=this.logLevels.error&&(0<t.length&&(this.logs=[...this.logs,...t]),console.log(""+this.logLevelPrefixs.error+t.map(t=>t??String(t)).join(this.logSeparator)))}log(...t){0<t.length&&(this.logs=[...this.logs,...t]),console.log(t.map(t=>t??String(t)).join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,void 0!==t.message?t.message:t)}}wait(e){return new Promise(t=>setTimeout(t,e))}done(t={}){var e=((new Date).getTime()-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${e} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(o,t)}
