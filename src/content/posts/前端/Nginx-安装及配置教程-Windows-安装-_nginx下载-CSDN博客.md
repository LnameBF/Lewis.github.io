---
title: 'Nginx 安装及配置教程（Windows）【安装】_nginx下载-CSDN博客'
published: 2026-05-14
description: ''
image: ''
tags: ['工程实践']
category: '前端'
draft: false
lang: 'zh-CN'
---

> 原文链接：https://blog.csdn.net/qq_41918107/article/details/140815306
> 抓取时间：2026-05-14 11:06:49

- 
 
 
 
 
 
 
 

 
 文章目录 
 [一、 Nginx 下载](#_Nginx__4)
- [1. 官网下载](#1__5)
- [2. 其它渠道](#2__10)
 
 - [二、 Nginx 安装](#_Nginx__15)
- [三、 配置](#__19)
- [四、 验证](#__147)
- [五、 其它问题](#__155)
- [1. 常用命令](#1__156)
- [2. 跨域问题](#2__168)
 
 
 

 

[软件 / 环境安装及配置目录](https://luvian.blog.csdn.net/article/details/137903632)

 

## 一、 Nginx 下载

 

### 1. 官网下载

 

  安装地址&#xff1a;[https://nginx.org/en/download.html](https://nginx.org/en/download.html)

 
 - 打开浏览器输入网址 https://nginx.org/en/download.html&#xff0c;进入 Nginx 官网
- 选择对应的版本下载&#xff0c;推荐稳定版
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d01b0ec1aa28490897940ce88690d112.png)
 

### 2. 其它渠道

 

&#xff08;1&#xff09;百度网盘&#xff08;1.24.0 版本&#xff09;

 

> 链接&#xff1a;https://pan.baidu.com/s/16LfEdOTHwkCLQUD8Z488QQ?pwd&#61;eizj 提取码&#xff1a;eizj

 

## 二、 Nginx 安装

 
 - 下载完成后&#xff0c;将压缩包解压到本地即可
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/91c6fe2021a7417ea7125ebcab0c5b5a.png)
 

## 三、 配置

 
 - 进入 Nginx 目录下&#xff0c; conf 文件夹下编辑 nginx.conf 文件&#xff0c;根据自己需求进行配置
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8af063bd8bb542958c14868e8d0798b3.png)
- 配置文件默认内容参数解析
 

```
 #默认为1&#xff0c;表示开启一个业务进程。根据服务器核数来配置&#xff0c;一般1个核对应1个进程 
worker_processes 1 ; 
 
 #error_log logs/error.log; 
 #error_log logs/error.log notice; 
 #error_log logs/error.log info; 
 
events { 
 #单个业务进程可接受连接数 
 worker_connections 1024 ; 
 } 
 
 
http { 
 #引入http mime类型&#xff0c;引入在conf文件下的mime.types文件,让浏览器知道识别文件后缀名后该如何展示 
 include mime.types ; 
 #如果mime类型没匹配上&#xff0c;默认使用二进制流的方式传输。 
 default_type application/octet-stream ; 
 
 #使用高效网络传输&#xff0c;也就是数据0拷贝&#xff0c;直接传输数据。未开启sendfile 
 sendfile on ; 
 #保持链接时间 
 keepalive_timeout 65 ; 
 #vhost虚拟主机 
 server { 
 #监听端口号 
 listen 80 ; 
 #主机名\域名 
 server_name localhost ; 
 #匹配路径url,样例:http://nginx.org/en/download.html 
 location / { 
 #文件根目录&#xff0c;相对于nginx安装根目录路径 
 root html ; 
 #默认页名称&#xff0c;访问先到访页面 
 index index.html index.htm ; 
 } 
 #服务端报错后报错编码对应页面。样例:http://nginx.org/50x.html 
 error_page 500 502 503 504 /50x.html ; 
 #报错后识别到域名后面跟了/50x.html&#xff0c;则匹配到根目录root下的html文件夹 
 location &#61; /50x.html { 
 root html ; 
 } 
 } 
 } 
```
 
 - 搭建站点
 

```
 # 虚拟主机 
server { 
 listen 80 ; # 浏览器访问端口号 
 server_name font_server ; # 浏览器访问域名 

 charset utf-8 ; 
 access_log logs/xx_domian.access.log access ; 

 # 路由 
 location / { 
 root ./html ; # 访问根目录 
 index index.html index.htm ; # 入口文件 
 } 
 } 
```
 
 - 根据文件类型设置过期时间
 

```
location ~.* \ .css$ { 
 expires 1d ; 
 break ; 
 } 

location ~.* \ .js$ { 
 expires 1d ; 
 break ; 
 } 

location ~ .* \ . ( gif | jpg | jpeg | png | bmp | swf ) $ { 
 access_log off ; 
 expires 15d ; #保存15天 
 break ; 
 } 

 # curl -x127.0.0.1:80 http://www.test.com/static/image/common/logo.png -I #测试图片的max-age 
```
 
 - 禁止文件缓存
 

```
location ~* \ . ( js | css | png | jpg | gif ) $ { 
 add_header Cache-Control no-store ; 
 } 
```
 
 - 防盗链
 

```
location ~* \ . ( gif | jpg | png ) $ { 
 # 只允许 192.168.0.1 请求资源 
 valid_referers none blocked 192.168 .0.1 ; 
 if ( $invalid_referer ) { 
 rewrite ^/ http:// $host /logo.png ; 
 } 
 } 
```
 
 - 静态文件压缩
 

```
server { 
 # 开启gzip 压缩 
 gzip on ; 
 # 设置gzip所需的http协议最低版本 &#xff08;HTTP/1.1, HTTP/1.0&#xff09; 
 gzip_http_version 1.1 ; 
 # 设置压缩级别&#xff0c;压缩级别越高压缩时间越长 &#xff08;1-9&#xff09; 
 gzip_comp_level 4 ; 
 # 设置压缩的最小字节数&#xff0c; 页面Content-Length获取 
 gzip_min_length 1000 ; 
 # 设置压缩文件的类型 &#xff08;text/html) 
 gzip_types text/plain application/javascript text/css ; 
 } 
```
 
 - 指定定错误页面
 

```
 # 根据状态码&#xff0c;返回对于的错误页面 
error_page 500 502 503 504 /50x.html ; 
location &#61; /50x.html { 
 root /source/error_page ; 
 } 
```
 

## 四、 验证

 
 - 切换到 Nginx 安装目录下&#xff0c;双击 Nginx.exe 启动 Nginx
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f1eac02565d2424c847715d5828ad59d.png)
- 打开浏览器&#xff0c;输入 http://127.0.0.1/ &#xff08;具体端口看个人配置&#xff0c;默认配置文件端口&#xff1a;80&#xff09;出现以下界面说明配置成功
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3e8eed36271e44439226132a4d0a56b3.png)
- 如果需要修改配置文件&#xff0c;则需要重新启动 Nginx&#xff0c;首先 Ctrl &#43; Shift &#43; Esc &#xff0c;打开任务管理器&#xff0c;找个 Nginx 服务&#xff0c;结束任务&#xff0c;然后切换到 Nginx 安装目录下&#xff0c;双击 Nginx.exe 启动 Nginx
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/a941336258d34841aff3331a775fbb0b.png)
 

## 五、 其它问题

 

### 1. 常用命令

 

```
nginx -s stop # 快速关闭Nginx&#xff0c;可能不保存相关信息&#xff0c;并迅速终止Web服务。 
nginx -s quit # 平稳关闭Nginx&#xff0c;保存相关信息&#xff0c;有安排的结束Web服务。 
nginx -s reload # 因改变了Nginx相关配置&#xff0c;需要重新加载配置而重载。 
nginx -s reopen # 重新打开日志文件。 
nginx -c filename # 为 Nginx 指定一个配置文件&#xff0c;来代替缺省的。 
nginx -t # 不运行&#xff0c;而仅仅测试配置文件。Nginx将检查配置文件的语法的正确性&#xff0c;并尝试打开配置文件中所引用到的文件。 
nginx -V # 显示 nginx 的版本&#xff0c;编译器版本和配置参数。 
taskkill /f /t /im nginx.exe # 彻底关闭nginx&#xff08;关闭Nginx其他服务&#xff0c;这样才能彻底关闭&#xff09; 
nginx -s reload # 重新加载配置 
```
 

### 2. 跨域问题

 

> 跨域的定义   同源策略限制了从同一个源加载的文档或脚本如何与来自另一个源的资源进行交互。这是一个用于隔离潜在恶意文件的重要安全机制。通常不允许不同源间的读操作。

 

> 同源的定义   如果两个页面的协议&#xff0c;端口&#xff08;如果有指定&#xff09;和域名都相同&#xff0c;则两个页面具有相同的源。

 

> Nginx 解决跨域的原理   例如&#xff1a;   前端 server 域名为&#xff1a;http://font_server   后端 server 域名为&#xff1a;https://github.com   现在 http://domain 对 http://font_server发起请求一定会出现跨域。   只需要启动一个 Nginx 服务器&#xff0c;将 server_name 设置为 font_server&#xff0c;然后设置相应的 location 以拦截前端需要跨域的请求&#xff0c;最后将请求代理回 github.com。配置如下&#xff1a;

 

```
 ## 配置反向代理的参数 
server { 
 listen 8080 ; 
 server_name font_server

 ## 1. 用户访问 http://font_server&#xff0c;则反向代理到 https://github.com 
 location / { 
 proxy_pass https://github.com ; 
 proxy_redirect off ; 
 proxy_set_header Host $host ; # 传递域名 
 proxy_set_header X-Real-IP $remote_addr ; # 传递IP 
 proxy_set_header X-Scheme $scheme ; # 传递协议 
 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for ; 
 } 
 } 
```
