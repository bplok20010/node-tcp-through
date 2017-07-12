module.exports = {
    host: '127.0.0.1:80',
    port: 5000 + ~~(Math.random() * 100000 % 5000),//随机生成5000~10000之间的端口
    auth: 'test:123456',
    wss: 'ws://127.0.0.1:10003'
};