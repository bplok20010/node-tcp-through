# node-tcp-through

作用同 node-http-through

## 启动服务端

```
node server
```

## 启动客户端

```
node client

```

```
//默认配置信息
module.exports = {
    host: '127.0.0.1:80',// 转发地址
    port: 5000 + ~~(Math.random() * 100000 % 5000),//代理端口  随机生成5000~10000之间的端口
    auth: 'test:123456', //默认验证信息
    wss: 'ws://127.0.0.1:10003' //TCP代理服务器地址
};
```