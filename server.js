const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const QUESTIONS = [
  { q:'‘Baahubali’ సినిమాకు దర్శకుడు ఎవరు?', options:['S. S. Rajamouli','Trivikram Srinivas','Sukumar','Koratala Siva'], a:0 },
  { q:'‘Pushpa’ సినిమాలో Pushpa Raj పాత్రను ఎవరు చేశారు?', options:['Ram Charan','Allu Arjun','Nani','Prabhas'], a:1 },
  { q:'‘RRR’లో Ram Charan పోషించిన పాత్ర పేరు ఏమిటి?', options:['Bheem','Rama Raju','Devaratha','Rudra'], a:1 },
  { q:'‘Mahanati’ సినిమా ఎవరి జీవిత కథ ఆధారంగా రూపొందింది?', options:['Savitribai Phule','Savitri','Bhanumathi','Jamuna'], a:1 },
  { q:'‘Jersey’ సినిమాలో ప్రధాన పాత్ర పోషించిన హీరో ఎవరు?', options:['Nani','Vijay Deverakonda','Sharwanand','Adivi Sesh'], a:0 },
  { q:'‘Devara’ సినిమాలో ప్రధాన హీరో ఎవరు?', options:['Jr NTR','Ram Charan','Nani','Ravi Teja'], a:0 },
  { q:'భారతదేశ జాతీయ పక్షి ఏది?', options:['చిలుక','నెమలి','కాకి','హంస'], a:1 },
  { q:'భూమికి సహజ ఉపగ్రహం ఏది?', options:['సూర్యుడు','చంద్రుడు','మార్స్','శుక్రుడు'], a:1 },
  { q:'నీటి రసాయన సూత్రం ఏది?', options:['CO2','H2O','O2','NaCl'], a:1 },
  { q:'మన శరీరంలో రక్తాన్ని పంప్ చేసే అవయవం ఏది?', options:['ఊపిరితిత్తులు','గుండె','కాలేయం','మెదడు'], a:1 }
];

const QUESTION_TIME = 90;
const rooms = new Map();

function makeRoomId() {
  let id;
  do id = Math.random().toString(36).slice(2, 6).toUpperCase();
  while (rooms.has(id));
  return id;
}

function publicState(roomId, room) {
  return {
    roomId,
    hostId: room.hostId,
    players: room.players.map(p => ({ id:p.id, name:p.name, score:p.score })),
    index: room.index,
    total: QUESTIONS.length,
    started: room.started,
    questionEndsAt: room.questionEndsAt
  };
}

function sendQuestion(roomId, room) {
  const q = QUESTIONS[room.index];
  room.questionEndsAt = Date.now() + QUESTION_TIME * 1000;
  room.answers = new Map();

  io.to(roomId).emit('question', {
    index: room.index,
    total: QUESTIONS.length,
    q: q.q,
    options: q.options,
    endsAt: room.questionEndsAt
  });
  io.to(roomId).emit('state', publicState(roomId, room));

  clearTimeout(room.timer);
  room.timer = setTimeout(() => finishQuestion(roomId), QUESTION_TIME * 1000 + 150);
}

function finishQuestion(roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.started) return;

  const q = QUESTIONS[room.index];
  for (const [playerId, choice] of room.answers.entries()) {
    if (choice === q.a) {
      const player = room.players.find(p => p.id === playerId);
      if (player) player.score += 1;
    }
  }

  io.to(roomId).emit('answerReveal', { correct: q.a, answers: Object.fromEntries(room.answers) });

  setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r || !r.started) return;
    if (r.index >= QUESTIONS.length - 1) {
      r.started = false;
      r.questionEndsAt = null;
      clearTimeout(r.timer);
      io.to(roomId).emit('gameOver', publicState(roomId, r));
      io.to(roomId).emit('state', publicState(roomId, r));
      return;
    }
    r.index += 1;
    sendQuestion(roomId, r);
  }, 900);
}

io.on('connection', socket => {
  socket.on('createRoom', ({ name }) => {
    const roomId = makeRoomId();
    const room = {
      hostId: socket.id,
      players: [{ id:socket.id, name:(name || 'Player 1').trim().slice(0,18), score:0 }],
      index: -1,
      answers: new Map(),
      started: false,
      questionEndsAt: null,
      timer: null
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'player';
    socket.emit('roomCreated', { roomId, playerId: socket.id });
    io.to(roomId).emit('state', publicState(roomId, room));
  });

  socket.on('joinRoom', ({ roomId, name }) => {
    roomId = String(roomId || '').trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return socket.emit('errorMsg', 'Room code correct ga enter cheyyi.');
    if (room.started) return socket.emit('errorMsg', 'Game already started. New room create cheyyandi.');
    if (room.players.length >= 2) return socket.emit('errorMsg', 'Ee game lo already 2 players unnaru.');

    room.players.push({ id:socket.id, name:(name || 'Player 2').trim().slice(0,18), score:0 });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'player';
    socket.emit('joinedRoom', { roomId, playerId:socket.id });
    io.to(roomId).emit('state', publicState(roomId, room));
  });

  socket.on('joinTV', ({ roomId }) => {
    roomId = String(roomId || '').trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return socket.emit('errorMsg', 'Room not found.');
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'tv';
    socket.emit('tvJoined', { roomId });
    socket.emit('state', publicState(roomId, room));
    if (room.index >= 0 && room.started) {
      const q = QUESTIONS[room.index];
      socket.emit('question', { index:room.index, total:QUESTIONS.length, q:q.q, options:q.options, endsAt:room.questionEndsAt });
    }
  });

  socket.on('startGame', () => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id || room.players.length !== 2 || room.started) return;
    room.started = true;
    room.index = 0;
    room.players.forEach(p => p.score = 0);
    sendQuestion(roomId, room);
  });

  socket.on('answer', ({ choice }) => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.started || socket.data.role !== 'player') return;
    if (!room.players.some(p => p.id === socket.id)) return;
    if (Date.now() > room.questionEndsAt) return;
    if (room.answers.has(socket.id)) return;

    const numericChoice = Number(choice);
    if (!Number.isInteger(numericChoice) || numericChoice < 0 || numericChoice > 3) return;
    room.answers.set(socket.id, numericChoice);
    io.to(roomId).emit('answerState', { answered:room.answers.size, total:2 });
    if (room.answers.size === 2) {
      clearTimeout(room.timer);
      finishQuestion(roomId);
    }
  });

  socket.on('restart', () => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    room.started = true;
    room.index = 0;
    room.players.forEach(p => p.score = 0);
    sendQuestion(roomId, room);
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room) return;
    if (socket.data.role === 'tv') return;

    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      clearTimeout(room.timer);
      rooms.delete(roomId);
      return;
    }
    room.started = false;
    room.index = -1;
    room.answers = new Map();
    room.questionEndsAt = null;
    clearTimeout(room.timer);
    if (room.hostId === socket.id) room.hostId = room.players[0].id;
    io.to(roomId).emit('errorMsg', 'Oka player disconnect ayyadu. Game ni malli start cheyyandi.');
    io.to(roomId).emit('state', publicState(roomId, room));
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`The Juggadi Show running on port ${PORT}`));
