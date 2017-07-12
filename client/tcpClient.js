/**
 * TCP 网络穿透
 * author: NOBO.ZHOU
 */
'use strict';
const net = require('net');
const WebSocket = require('ws');
const program = require('commander');
const url = require('url');
const cfg = require('./options');

program
    .version('0.0.1')
    .option('-H, --host [type]', '转发接收地址')
    .option('-p, --port [type]', '代理端口')
    .option('-a, --auth [type]', '用户验证信息:user:password')
    .option('-w, --wss [type]', 'WebSocket服务器地址')
    .parse(process.argv);

if (program.host) {
    cfg.host = program.host;
}

if (program.port) {
    cfg.port = program.port;
}

if (program.auth) {
    cfg.auth = program.auth;
}

if (program.wss) {
    cfg.wss = program.wss;
}

const serverInfo = url.parse(cfg.wss);

const authInfo = cfg.auth.split(':');
const pathInfo = cfg.host.split(':');
pathInfo.port = pathInfo[1] || 80;

var REMOTE_PORT = pathInfo[1];
var REMOTE_ADDR = pathInfo[0];

function createClient(id, ws){
    var client = new net.Socket();

    client.connect(parseInt(REMOTE_PORT), REMOTE_ADDR, function() {
    });

    client.on('error', function(){
          delete clients[id];  
    });

    client.on('close', () => {
            ws.send(JSON.stringify({
                type: 'colse',
                id: id
            }));
        });

        client.on('data', function(chunk) {
            ws.send(JSON.stringify({
                type: 'data',
                id: id,
                data : chunk
            }));
        });

        client.on('end', function() {
            return;
        });

    return client;
}

let clients = {};

function clearClents(){
    for(var k in clients) {
        clients[k].end();
    }
    clients = {};
}

connect();

function connect(){

const ws = new WebSocket(`${cfg.wss}/?user=${authInfo[0]}&pwd=${authInfo[1]}`);

    ws.on('open', function() {
        ws.send(JSON.stringify({
            type: 'init',
            port: cfg.port
        }));
        console.log('连接服务成功...');
        console.log(`访问${serverInfo.hostname}:${cfg.port}会自动转发到${REMOTE_ADDR}:${REMOTE_PORT}`);
    });

     ws.on('message', function(msg){
        var data =JSON.parse(msg);
        if( data.type == 'connect' && !clients[data.id] ) {
            //服务端先发数据
            clients[data.id] = createClient(data.id, ws);
        } else if( data.type == 'data' ) {
            var client = clients[data.id];

            if(!client) {//客户端先发数据
                clients[data.id] = createClient(data.id, ws);
                client = clients[data.id];
            }

            client && client.write(new Buffer(data.data));
        } else if( data.type == 'close' ) {
            if( clients[data.id] ) {
                clients[data.id].close();
            }
        } else if( data.type == 'error' ){
            console.log( '服务端拒绝服务，15s后尝试重连' );
            console.log( data.msg );
            ws.close();
            setTimeout(function() {
                connect();
            }, 15000);
        }
    });

    ws.on('close', function(code, msg) {
        console.log(code, msg);
        clearClents();
        console.log('连接被关闭，5s后尝试重连');
            setTimeout(function() {
                connect();
            }, 5000);
    });

    ws.on('error', function(code, msg) {
        console.log(code, msg)
        console.log('连接发生错误，5s后尝试重连');
        clearClents();
            setTimeout(function() {
                connect();
            }, 5000);
    });
}