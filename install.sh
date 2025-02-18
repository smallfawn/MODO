#!/bin/bash

# 获取当前目录的路径
currentDir=$(pwd)

#https://docker.m.daocloud.io 
# 函数：选择延迟最小的镜像源

# 选择最佳镜像源
best_mirror="yanyu.icu"

# 默认的API和OCR地址
default_api="http://8.141.174.247:3001"
default_ocr="http://112.74.59.1:7777"
default_port=6789

# 提示用户选择操作
echo "请选择操作："
echo "1. 安装"
echo "2. 更新容器"
read -p "请输入选项 (1 或 2): " option

case $option in
    1)
        # 安装操作
       
        echo "开始安装..."
        echo "将自动创建smallfawnJD目录，并创建config.json和user.json文件"
        # 在当前目录下创建smallfawnJD目录并切换到该目录
        mkdir -p "$currentDir/smallfawnJD"
        cd "$currentDir/smallfawnJD"

        # 提示用户输入token
        read -p "请输入token: " token

        # 提示用户输入是否开启用户名中文解析，默认为false
        read -p "是否开启用户名中文解析? (true/false, 默认false): " isDecodeUsername
        isDecodeUsername=${isDecodeUsername:-false}

        # 提示用户输入API地址，默认为http://8.141.174.247:3001
        read -p "请输入API地址 (默认${default_api}): " api
        api=${api:-$default_api}

        # 提示用户输入OCR地址，默认为http://112.74.59.1:7777
        read -p "请输入OCR地址 (默认${default_ocr}): " ocr
        ocr=${ocr:-$default_ocr}

        # 提示用户输入端口，默认为6789
        read -p "请输入端口 (默认${default_port}): " port
        port=${port:-$default_port}

        # 提示用户输入管理员账号密码
        read -p "请输入管理员账号: " username
        read -p "请输入管理员密码: " password
        echo

        # 提示用户输入wxpusher的token
        read -p "请输入wxpusher的token: " wxpusherToken

        # 提示用户输入青龙的url、appid和secret
        read -p "请输入青龙的url: " qlUrl
        read -p "请输入青龙的appid: " qlAppid
        read -p "请输入青龙的secret: " qlSecret

        # 创建config.json文件并写入内容
        cat > config.json <<EOF
{
    "token": "$token",
    "api": "$api",  
    "ocr": "$ocr",  
    "isMultiThreading": true,
    "jsfp": "0cadf4295018c07dbcf74bf1d65ded64",
    "jseid": "OXCPCVVQ5KGBPDRJDVLYATHJOOYHKMIMO7SNSVQQXXNIQBMUK44JW54RN3FPYKSMNHMD5RZTH3UWHDSM722V6PXYEU",
    "username": "$username",
    "password": "$password",
    "maxRetry": 10,
    "isDecodeUsername": $isDecodeUsername,
    "proxy": {},
    "ql": {
        "url": "$qlUrl",
        "appid": "$qlAppid",
        "secret": "$qlSecret"
    },
    "siteName": "Faker路飞账密登录",
    "notice": "请关闭免密支付！",
    "wxpusher": {
        "token": "$wxpusherToken",
        "uid": "A"
    }
}
EOF

        # 创建user.json文件并写入空内容
        echo "{}" > user.json

        # 运行Docker容器
        docker run -d \
          --name lufly \
          -p "${port}:6789" \
          -v "$currentDir/smallfawnJD/config.json":/lufly/config.json \
          -v "$currentDir/smallfawnJD/user.json":/lufly/user.json \
          "${best_mirror}/smallfawn/lufly"

        echo "Docker容器已启动！请在浏览器输入 http://IP:${port} 访问容器。"
        ;;
    2)
        # 更新容器操作
        echo "请确认当前目录含有smllfawnJD目录"
        echo "开始更新容器..."

        # 获取当前目录下的 smallfawnJD 目录
        cd "$currentDir/smallfawnJD"

        # 停止并删除现有的容器
        docker stop lufly
        docker rm lufly

        # 拉取最新的镜像
        docker pull "${best_mirror}/smallfawn/lufly"

        # 提示用户输入端口，默认为6789
        read -p "请输入端口 (默认${default_port}): " port
        port=${port:-$default_port}

        # 重新运行容器
        docker run -d \
          --name lufly \
          -p "${port}:6789" \
          -v "$currentDir/smallfawnJD/config.json":/lufly/config.json \
          -v "$currentDir/smallfawnJD/user.json":/lufly/user.json \
          "${best_mirror}/smallfawn/lufly"

        echo "Docker容器已更新！请在浏览器输入 http://IP:${port} 访问容器。"
        ;;
    *)
        echo "无效的选项，请输入 1 或 2。"
        exit 1
        ;;
esac  
