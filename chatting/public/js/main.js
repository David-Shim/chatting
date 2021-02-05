const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

//Get username and room from URL
const params = window.location.search.split('?')[1];
const distingush_url = params.split('&');
const param_username = distingush_url[0];
const param_room = distingush_url[1];
const originusername = param_username.split('=')[1];
const username = originusername.trim();
const room = param_room.split('=')[1];

const socket = io();


//어떻게 해야 할 지 모르겠다
//Show previousMessage
socket.emit('previousMessage', {username, room});

//Join chatroom
socket.emit('joinRoom', {username, room});

//Get room and users
socket.on('roomUsers', ({room, users})=>{
    outputRoomName(room);
    outputUsers(users);
})

//Message from server
socket.on('message', message => {
    outputMessage(message);
    chatMessages.scrollTop=chatMessages.scrollHeight;
});

//More messages from server
socket.on('old_message', message => {
    outputOldMessage(message);
    chatMessages.scrollTop=860;
});

$('#msg').on('keydown', function(event) {
    if (event.keyCode == 13)
    if (!event.shiftKey){
    event.preventDefault();
        const msg = document.querySelector('#msg').value;
        if(msg==""||msg==null){
            document.querySelector('#msg').focus();
        }else{
            //Emit message to server
            socket.emit('chatMessage', msg);
            document.querySelector('#msg').value = '';
            document.querySelector('#msg').focus();
        }
    }
});

//Load past chat by scrolling. There was an worry about the server side issue that the server will be stunned when lots of request accrued to use this function
function loadMoreChat(){
    if(chatMessages.scrollTop == 0){
        const allElement = chatMessages.firstElementChild.innerHTML;
        const sliceById = allElement.split('id="')[1];
        const lastnumber = sliceById.split('">')[0];
        socket.emit('loadMoreChat', ({room, lastnumber}));
    }
}

//output message to Dom
function outputMessage(message){
    //메세지 이름이랑 접속자랑 같은 경우랑 그렇지 않은 경우 나누어야 함
    if(message.username===username){
        const div = document.createElement('div');
        div.classList.add('clearfix');
        div.innerHTML = `<div class="from-me float-right" id="${message.chatting_id}"><p class="meta"><span>${message.time}</span></p>
                        <p class="text" style="white-space: pre-line;">${message.text}</p></div>`;
        document.querySelector('.chat-messages').appendChild(div);
    }else if(message.username=='ChatCord Bot'){
        console.log("Go Go 87");
    }else{
        const div = document.createElement('div');
        div.classList.add('clearfix');
        div.innerHTML = `<div class="message float-left" id="${message.chatting_id}"><p class="meta">${message.username} <span>${message.time}</span></p>
        <p class="text" style="white-space: pre-line;">${message.text}</p></div>`;
        document.querySelector('.chat-messages').appendChild(div);
    }
}

//output old message to Dom
function outputOldMessage(message){
    //메세지 이름이랑 접속자랑 같은 경우랑 그렇지 않은 경우 나누어야 함
    if(message.username===username){
        const div = document.createElement('div');
        div.classList.add('clearfix');
        div.innerHTML = `<div class="from-me float-right" id="${message.chatting_id}"><p class="meta"><span>${message.time}</span></p>
                        <p class="text" style="white-space: pre-line;">${message.text}</p></div>`;
        $(chatMessages).prepend(div);
        
    }else{
        const div = document.createElement('div');
        div.classList.add('clearfix');
        div.innerHTML = `<div class="message float-left" id="${message.chatting_id}"><p class="meta">${message.username} <span>${message.time}</span></p>
        <p class="text" style="white-space: pre-line;">${message.text}</p></div>`;
        $(chatMessages).prepend(div);
    }
}

//Add room name to Dom
function outputRoomName(room){
    roomName.innerText = room;
}

//Add users to DOM
function outputUsers(users){
    userList.innerHTML = `
        ${users.map(user => `<span class="dropdown-item-text">${user.username}</span>`).join("")}
    `;
}