const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected');
  
  socket.on('command', (cmd) => {
    const result = executeCommand(cmd);
    socket.emit('output', result);
  });
  
  socket.on('specialKey', (key) => {
    handleSpecialKey(key, socket);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

function executeCommand(cmd) {
  if (!cmd.trim()) return '';
  
  try {
    const result = eval(cmd);
    return result !== undefined ? String(result) : '';
  } catch (error) {
    return error.message;
  }
}

function handleSpecialKey(key, socket) {
  switch(key) {
    case 'ctrl+c':
      socket.emit('output', '^C');
      break;
    case 'ctrl+d':
      socket.emit('output', 'exit');
      break;
    case 'esc':
      socket.emit('output', '\x1b');
      break;
    case 'tab':
      socket.emit('output', '\t');
      break;
    case 'alt':
      socket.emit('output', '\x1b');
      break;
    case 'up':
      socket.emit('output', '\x1b[A');
      break;
    case 'down':
      socket.emit('output', '\x1b[B');
      break;
    case 'left':
      socket.emit('output', '\x1b[D');
      break;
    case 'right':
      socket.emit('output', '\x1b[C');
      break;
  }
}

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});