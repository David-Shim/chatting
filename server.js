const path =  require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./public/utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./public/utils/users');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

/*Bug report*/
//입력한 이름이 같은 경우에 전부 내가 쓴 글로 나옴->인풋 입력시 기존에 이름으로 저장하던거 유저 아이디 값으로 바꾸고 main.js에 message.username===username 이거 유저 아이디로 바꿔야 함

//Connect to db
const mysql = require('mysql');
const { exit } = require('process');
const connection = mysql.createConnection({
    host:   'localhost',
    user:   'root',
    password:   '',
    database:   'my_db',
    dateStrings:    'date'
});
connection.connect();
/*
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    console.log("Why!!");
    if (error) throw error;
    console.log('The solution is: ', results[0].solution);
  
});
*/
//Set static folder
app.use(express.static(path.join(__dirname,'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket=>{

    //Load previous messages
    socket.on('previousMessage',({room})=>{
        connection.query(`SELECT * FROM (SELECT * FROM chatting_log WHERE room = '${room}' ORDER BY reg_date DESC LIMIT 10) TT ORDER BY TT.reg_date ASC`, function (error, results, fields) {
            if (error) throw error;
            var i;
            var lastMessages="";
            for(i=0;i<results.length;i++){
                lastMessages+=socket.emit('message', {chatting_id: results[i]['chatting_id'],username: results[i]['username'],text: results[i]['chat_content'],time: results[i]['reg_date']})
            }
            return lastMessages;
        });
    });
    //Runs when client connected
    socket.on('joinRoom', ({username, room})=>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Broadcast when a user connects
        socket.broadcast
        .to(user.room)
        .emit(
            'message',
            formatMessage(botName, `${user.username} 님이 들어오셨습니다.`)
        );
        
        //Send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        });

        //Welcome current user
        //socket.emit('message',
        //formatMessage(botName, 'Welcome to ChatCord!'));
    });

    //Runs when client disconnected
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        
        if(user){
            io.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} 님이 나가셨습니다.`)
            );

            //Send users and room info
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

    //Load more chat log from the server
    socket.on('loadMoreChat', ({room, lastnumber})=>{
        connection.query(`SELECT * FROM chatting_log WHERE room = '${room}' AND chatting_id < ${lastnumber} ORDER BY reg_date DESC LIMIT 10`, function (error, results, fields) {
            if (error) throw error;
            var i;
            var lastMessages="";
            for(i=0;i<results.length;i++){
                lastMessages+=socket.emit('old_message', {chatting_id: results[i]['chatting_id'],username: results[i]['username'],text: results[i]['chat_content'],time: results[i]['reg_date']})
            }
            return lastMessages;
        });
    });

    //Listen for chatMessage
    socket.on('chatMessage', msg=>{
        const user = getCurrentUser(socket.id);
        //여기서 user.username, msg랑 현재시간 db로 전송해야 함        
        connection.query(`INSERT INTO chatting_log (room, username, chat_content, reg_date) VALUE ('${user.room}', '${user.username}', '${msg}',now())`, function (error, results, fields) {
            if (error) throw error;
        });
        //chatting_id 값 가지고 와서 보내줘야 함
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
});
const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));