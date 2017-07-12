/**
 * TCP 网络穿透
 * author: NOBO.ZHOU
 */
'use strict';
const net = require('net');
const WebSocket = require('ws');

var CONN_ID = 1;
//websockt端口
const PORT = 10003;

const clients = {};

function createServer(port, ws, cb){
    var UID = 1;
    var connCount = 0;

    var server = net.createServer(function(socket) {
        var SID = CONN_ID++;
        //注意 TCP一旦建立连接，有可能是客户端先发送数据，也可能是服务端先发
        ws.send(JSON.stringify({
                type: 'connect',
                id: SID
            }));

        var CID = UID++;
        connCount++;
        console.log(CID + '. 收到请求(连接数' + connCount + ')--'+ port);
        socket.on('close', () => {
            connCount--;
            console.log(CID + '. 请求关闭(连接数' + connCount + ')--'+port);
            delete clients[SID];
            if(ws._isClose) {
                return;
            }
            ws.send(JSON.stringify({
                type: 'colse',
                id: SID
            }));
        });
        socket.on('error', (e) => {
            delete clients[SID];
            console.log('socket', e);
        });

        clients[SID] = socket;

        socket.on('data', function(chunk) {
            if(ws._isClose) {
                return;
            }
            ws.send(JSON.stringify({
                type: 'data',
                id: SID,
                data : chunk
            }));
        });

        socket.on('end', function() {
            console.log('colse end...'+port);
        });
       
    });
    
    server.listen(port,function(){
        console.log("TCP server accepting connection on port: " + port);
        if(cb) {
            cb(server);
        }
    });

    server.on('error', function(err){
        console.log(err);
        ws.send(JSON.stringify({
                type: 'error',
                msg : err
            }));
    });

    server.on('close', function(){
        console.log('TCP Server Close:' + port);
    });

    return server;
}

const wss = new WebSocket.Server({
            port: PORT
        }, function(){
            console.log('服务启动成功端口：'+ PORT);
        });

        wss.on('connection', function connection(ws) {
            var server;

            ws.on('message', function(msg){
                var data =JSON.parse(msg);
                if( data.type == 'init' ) {
                    createServer(Math.min(parseInt(data.port), 65535), ws, function(ser){
                        server = ser;
                    });
                    console.log('收到代理请求端口：'+data.port);
                } else if( data.type == 'data' ) {
                    var client = clients[data.id];

                    client && client.write(new Buffer(data.data));
                } else if( data.type == 'close' ) {
                    if( clients[data.id] ) {
                        clients[data.id].end();
                    }
                }
            });

            ws.on('error', function(data){

            });

            ws.on('close', function(){
                if( !server ) return;

                var port = server.address().port;
                ws._isClose = true;

                server && server.close();
                /*
                 Object.keys(clients).forEach(function(k, i){
                        let client = clients[k];
                        if(client) {
                            let _port = client.address().port;
                            if( port == _port ) {
                                client.end();
                                delete clients[k];
                            }
                        }
                    });
                */
            });

        });

        wss.on('error', function(err) {
            console.log(err);
        });