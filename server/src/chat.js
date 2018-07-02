const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = [];
let userCheck = [];
let userCheckTimeout;

io.on('connection', (socket) => {
  console.log('User connected');
  socket.emit('load users', JSON.stringify(users));

  socket.on('user entered', (username) => {
    users.push(username);
    const userData = {
      newUser: username,
      users: users
    };
    io.emit('user entered', JSON.stringify(userData));
  });

  socket.on('send message', (message) => {
    io.emit('send message', message);
  });

  socket.on('disconnect', () => {
    if (users.length === 1) users = [];
    else io.emit('check users');
    console.log('User disconnected', users);
  });

  socket.on('check users', (username) => {
    if (!userCheck.includes(username))
      userCheck.push(username)

    clearTimeout(userCheckTimeout);
    userCheckTimeout = setTimeout(() => {
      users.forEach((user) => {
        if (!userCheck.includes(user)) {
          users.splice(users.indexOf(user), 1);
          const userData = {user: user, users: users};
          io.emit('user left', JSON.stringify(userData));
          console.log('User removed', users);
        }
      });
      userCheck = [];
    }, 500);
  });
});

http.listen(3001, () => {
  console.log('Listening on port 3001');
});

function sendMessages(message) {
  io.emit(
    'get messages',
    JSON.stringify(messages)
  );
}
