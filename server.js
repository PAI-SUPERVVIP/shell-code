const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let shellProcess = null;

io.on('connection', (socket) => {
  console.log('User connected');
  
  socket.emit('output', `\x1b[1;36m━`.repeat(40) + '\r\n');
  socket.emit('output', `\x1b[1;32m  ██████╗ ███████╗████████╗██████╗  ██████╗ \x1b[0m\r\n`);
  socket.emit('output', `\x1b[1;32m  ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗\x1b[0m\r\n`);
  socket.emit('output', `\x1b[1;32m  ██████╔╝█████╗     ██║   ██████╔╝██║   ██║\x1b[0m\r\n`);
  socket.emit('output', `\x1b[1;32m  ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║\x1b[0m\r\n`);
  socket.emit('output', `\x1b[1;32m  ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝\x1b[0m\r\n`);
  socket.emit('output', `\x1b[1;32m  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ \x1b[0m\r\n`);
  socket.emit('output', `\x1b[1;36m━`.repeat(40) + '\r\n\r\n');
  socket.emit('output', `\x1b[1;33mWelcome to iSH Web Terminal!\x1b[0m\r\n`);
  socket.emit('output', `OS: ${os.type()} ${os.release()}\r\n`);
  socket.emit('output', `Hostname: ${os.hostname()}\r\n`);
  socket.emit('output', `User: ${os.userInfo().username}\r\n\r\n`);
  socket.emit('output', `Type 'help' for available commands\r\n\r\n`);
  
  if (!shellProcess) {
    shellProcess = spawn('/bin/sh', ['-i'], {
      shell: '/bin/bash',
      env: { ...process.env, TERM: 'xterm-256color' }
    });
    
    shellProcess.stdout.on('data', (data) => {
      socket.emit('output', data.toString());
    });
    
    shellProcess.stderr.on('data', (data) => {
      socket.emit('output', `\x1b[31m${data.toString()}\x1b[0m`);
    });
    
    shellProcess.on('close', (code) => {
      socket.emit('output', `\r\n\x1b[33mShell closed with code ${code}\x1b[0m\r\n`);
      shellProcess = null;
    });
    
    shellProcess.on('error', (err) => {
      socket.emit('output', `\x1b[31mShell error: ${err.message}\x1b[0m\r\n`);
    });
  }
  
  socket.on('command', (cmd) => {
    if (shellProcess) {
      shellProcess.stdin.write(cmd);
    } else {
      socket.emit('output', '\x1b[31mShell not available. Please refresh the page.\x1b[0m\r\n');
    }
  });
  
  socket.on('specialKey', (key) => {
    handleSpecialKey(key, socket);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

function handleSpecialKey(key, socket) {
  if (!shellProcess) return;
  
  switch(key) {
    case 'ctrl+c':
      shellProcess.stdin.write('\x03');
      break;
    case 'ctrl+d':
      shellProcess.stdin.write('\x04');
      break;
    case 'ctrl+z':
      shellProcess.stdin.write('\x1a');
      break;
    case 'ctrl+l':
      shellProcess.stdin.write('\x0c');
      break;
    case 'ctrl+a':
      shellProcess.stdin.write('\x01');
      break;
    case 'ctrl+e':
      shellProcess.stdin.write('\x05');
      break;
    case 'ctrl+u':
      shellProcess.stdin.write('\x15');
      break;
    case 'ctrl+k':
      shellProcess.stdin.write('\x0b');
      break;
    case 'esc':
      shellProcess.stdin.write('\x1b');
      break;
    case 'tab':
      shellProcess.stdin.write('\t');
      break;
    case 'up':
      shellProcess.stdin.write('\x1b[A');
      break;
    case 'down':
      shellProcess.stdin.write('\x1b[B');
      break;
    case 'left':
      shellProcess.stdin.write('\x1b[D');
      break;
    case 'right':
      shellProcess.stdin.write('\x1b[C');
      break;
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`For mobile: http://<your-ip>:${PORT}`);
});
