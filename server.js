const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

/*
  THE JUGGADI SHOW
  2–4 PLAYER REALTIME QUIZ

  Categories:
  - Indian Cinema
  - Famous Indian Places
  - Famous Indian Personalities
  - Indian pop culture

  Questions are clue-based / medium difficulty.
*/

const QUESTIONS = [

  {
    q: 'ఈ దర్శకుడి సినిమాల్లో "Eega", "Baahubali", "RRR" ఉన్నాయి. అతను ఎవరు?',
    options: ['Sukumar', 'S. S. Rajamouli', 'Trivikram Srinivas', 'Koratala Siva'],
    a: 1
  },

  {
    q: 'ఒక సినిమాలో హీరో పేరు "Pushpa Raj". ఆ పాత్రకు famous అయిన నటుడు ఎవరు?',
    options: ['Prabhas', 'Ram Charan', 'Allu Arjun', 'Nani'],
    a: 2
  },

  {
    q: '"Mahanati" సినిమాలో ప్రధానంగా portray చేసిన legendary actress ఎవరు?',
    options: ['Savitri', 'Jamuna', 'Bhanumathi', 'Anjali Devi'],
    a: 0
  },

  {
    q: '"RRR"లో ఇద్దరు main characters లో ఒకరు Komaram Bheem. మరొకరి పేరు?',
    options: ['Alluri Sitarama Raju', 'Rama Raju', 'Rudra', 'Bheem Raju'],
    a: 1
  },

  {
    q: 'ఒక Telugu actor "Arjun Reddy", "Geetha Govindam", "Dear Comrade" సినిమాలతో గుర్తింపు పొందాడు. ఎవరు?',
    options: ['Nani', 'Vijay Deverakonda', 'Sharwanand', 'Adivi Sesh'],
    a: 1
  },

  {
    q: '"Jersey" సినిమాలో cricket మీద తన dream ని మళ్లీ pursue చేసే character ని ఎవరు చేశారు?',
    options: ['Nani', 'Ram Charan', 'Dulquer Salmaan', 'Naga Chaitanya'],
    a: 0
  },

  {
    q: 'ఈ నటుడు "Baahubali"లో Amarendra Baahubali, "Salaar"లో Deva పాత్రల్లో కనిపించాడు. ఎవరు?',
    options: ['Prabhas', 'Rana Daggubati', 'Nani', 'Mahesh Babu'],
    a: 0
  },

  {
    q: 'ఒకే నటుడు "Rangasthalam"లో Chitti Babuగా, "RRR"లో Alluri Sitarama Rajuగా కనిపించాడు. ఎవరు?',
    options: ['Jr NTR', 'Ram Charan', 'Ravi Teja', 'Varun Tej'],
    a: 1
  },

  {
    q: '"Ala Vaikunthapurramuloo" సినిమాలో "Butta Bomma" పాటతో కూడా గుర్తింపు పొందిన హీరో ఎవరు?',
    options: ['Allu Arjun', 'Nani', 'Ram Charan', 'Vijay Deverakonda'],
    a: 0
  },

  {
    q: 'ఒక Telugu director "Arya", "Rangasthalam", "Pushpa" సినిమాలకు దర్శకత్వం వహించాడు. ఎవరు?',
    options: ['Sukumar', 'Vamshi Paidipally', 'Boyapati Srinu', 'Harish Shankar'],
    a: 0
  },

  {
    q: 'Indiaలో ఒక monument ప్రేమకు symbolగా ప్రపంచవ్యాప్తంగా famous. అది ఏది?',
    options: ['Charminar', 'Taj Mahal', 'Gateway of India', 'India Gate'],
    a: 1
  },

  {
    q: 'Mumbaiలో సముద్రం వైపు కనిపించే iconic arch monument ఏది?',
    options: ['India Gate', 'Gateway of India', 'Charminar', 'Victoria Memorial'],
    a: 1
  },

  {
    q: 'Hyderabadకి సంబంధించిన ఈ monumentకి నాలుగు minarets ఉన్నాయి. ఏది?',
    options: ['Golconda Fort', 'Charminar', 'Qutb Minar', 'India Gate'],
    a: 1
  },

  {
    q: 'Delhiలో Indian soldiers జ్ఞాపకార్థంగా famous అయిన monument ఏది?',
    options: ['India Gate', 'Gateway of India', 'Charminar', 'Sanchi Stupa'],
    a: 0
  },

  {
    q: 'Agraలో ఉన్న ఈ monument Mughal emperor Shah Jahanతో strongly associated. ఏది?',
    options: ['Red Fort', 'Taj Mahal', 'Hawa Mahal', 'Golconda Fort'],
    a: 1
  },

  {
    q: 'Kolkataలో ఉన్న ఈ white marble monument ఒక British-era memorialగా famous. ఏది?',
    options: ['Victoria Memorial', 'India Gate', 'Mysore Palace', 'Charminar'],
    a: 0
  },

  {
    q: 'Rajasthanలో pink colour వల్ల "Pink City"గా famous అయిన city ఏది?',
    options: ['Udaipur', 'Jaipur', 'Jodhpur', 'Bikaner'],
    a: 1
  },

  {
    q: 'Keralaలో backwaters, houseboatsకి particularly famous అయిన destination ఏది?',
    options: ['Alappuzha', 'Mysuru', 'Amritsar', 'Jaisalmer'],
    a: 0
  },

  {
    q: 'Karnatakaలో royal palace మరియు Dasara celebrationsకి famous అయిన city ఏది?',
    options: ['Mysuru', 'Pune', 'Surat', 'Lucknow'],
    a: 0
  },

  {
    q: 'Punjabలో Golden Temple ఉన్న famous city ఏది?',
    options: ['Ludhiana', 'Amritsar', 'Patiala', 'Chandigarh'],
    a: 1
  },

  {
    q: 'Indiaకి "Missile Man" of India అని popularly పిలిచే scientist ఎవరు?',
    options: ['C. V. Raman', 'A. P. J. Abdul Kalam', 'Homi Bhabha', 'Vikram Sarabhai'],
    a: 1
  },

  {
    q: 'Indiaకి first individual Olympic gold medal సాధించిన athleteగా famous అయిన shooter ఎవరు?',
    options: ['Abhinav Bindra', 'Neeraj Chopra', 'Milkha Singh', 'P. T. Usha'],
    a: 0
  },

  {
    q: 'Javelin throwలో Olympic gold గెలిచి Indiaకి historic achievement ఇచ్చిన athlete ఎవరు?',
    options: ['Abhinav Bindra', 'Neeraj Chopra', 'Dhanraj Pillay', 'Sushil Kumar'],
    a: 1
  },

  {
    q: 'Indian cinemaలో "Big B" అనే nicknameతో famous అయిన actor ఎవరు?',
    options: ['Aamir Khan', 'Amitabh Bachchan', 'Rajinikanth', 'Mammootty'],
    a: 1
  },

  {
    q: 'Indian playback singingలో "Nightingale of India"గా popularly known అయిన singer ఎవరు?',
    options: ['Lata Mangeshkar', 'Shreya Ghoshal', 'Asha Bhosle', 'Sunidhi Chauhan'],
    a: 0
  },

  {
    q: 'Cricketలో "Master Blaster" అనే nicknameతో famous అయిన Indian player ఎవరు?',
    options: ['Virat Kohli', 'MS Dhoni', 'Sachin Tendulkar', 'Rahul Dravid'],
    a: 2
  },

  {
    q: '"Captain Cool" అనే nicknameతో Indian cricketలో famous అయిన player ఎవరు?',
    options: ['MS Dhoni', 'Rohit Sharma', 'Virat Kohli', 'Kapil Dev'],
    a: 0
  },

  {
    q: 'Indiaలో "City of Lakes" అనే nicknameతో commonly associated అయిన city ఏది?',
    options: ['Udaipur', 'Chennai', 'Hyderabad', 'Kochi'],
    a: 0
  },

  {
    q: 'ఒక famous Indian fort Hyderabadకి దగ్గరగా ఉంది, మరియు Qutb Shahi dynastyతో associated. అది ఏది?',
    options: ['Golconda Fort', 'Red Fort', 'Agra Fort', 'Mehrangarh Fort'],
    a: 0
  },

  {
    q: 'Mumbaiలో Bollywood film industryకి సంబంధించిన areaగా worldwide famous అయిన పేరు ఏది?',
    options: ['Bandra', 'Andheri', 'Film City', 'Colaba'],
    a: 2
  },

  {
    q: '"Baahubali"లో Bhallaladeva పాత్రను చేసిన actor ఎవరు?',
    options: ['Prabhas', 'Rana Daggubati', 'Nassar', 'Sathyaraj'],
    a: 1
  }
];

const QUESTION_TIME = 90;
const REVEAL_TIME = 5;
const QUESTIONS_PER_GAME = 10;

const rooms = new Map();

function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function makeRoomId() {
  let id;

  do {
    id = Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase();
  } while (rooms.has(id));

  return id;
}

function publicState(roomId, room) {
  return {
    roomId,
    hostId: room.hostId,

    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score
    })),

    index: room.index,
    total: QUESTIONS_PER_GAME,
    started: room.started,
    questionEndsAt: room.questionEndsAt,
    phase: room.phase
  };
}

function sendQuestion(roomId, room) {

  const q = room.questions[room.index];

  room.phase = 'question';

  room.questionEndsAt =
    Date.now() + QUESTION_TIME * 1000;

  room.answers = new Map();

  io.to(roomId).emit('question', {
    index: room.index,
    total: QUESTIONS_PER_GAME,
    q: q.q,
    options: q.options,
    endsAt: room.questionEndsAt
  });

  io.to(roomId).emit(
    'state',
    publicState(roomId, room)
  );

  clearTimeout(room.timer);

  room.timer = setTimeout(() => {

    finishQuestion(roomId);

  }, QUESTION_TIME * 1000 + 150);
}

function finishQuestion(roomId) {

  const room = rooms.get(roomId);

  if (!room || !room.started) return;

  if (room.phase !== 'question') return;

  room.phase = 'reveal';

  clearTimeout(room.timer);

  const q = room.questions[room.index];

  const correctPlayers = [];

  for (const [playerId, choice] of room.answers.entries()) {

    if (choice === q.a) {

      const player =
        room.players.find(p => p.id === playerId);

      if (player) {

        player.score += 1;

        correctPlayers.push({
          id: player.id,
          name: player.name
        });

      }
    }
  }

  /*
    IMPORTANT:
    Answer is NOT revealed immediately.

    First 5-second suspense countdown.
  */

  let seconds = REVEAL_TIME;

  io.to(roomId).emit('revealCountdown', {
    seconds,
    correct: q.a
  });

  clearInterval(room.revealInterval);

  room.revealInterval = setInterval(() => {

    seconds -= 1;

    if (seconds > 0) {

      io.to(roomId).emit('revealCountdown', {
        seconds,
        correct: q.a
      });

      return;
    }

    clearInterval(room.revealInterval);
    room.revealInterval = null;

    io.to(roomId).emit('answerReveal', {
      correct: q.a,

      answers:
        Object.fromEntries(room.answers),

      correctPlayers,

      players:
        room.players.map(p => ({
          id: p.id,
          name: p.name,
          score: p.score
        }))
    });

    /*
      Give players time to see the result
      before moving to next question.
    */

    room.revealTimer = setTimeout(() => {

      const r = rooms.get(roomId);

      if (!r || !r.started) return;

      if (r.index >= QUESTIONS_PER_GAME - 1) {

        r.started = false;
        r.phase = 'finished';
        r.questionEndsAt = null;

        io.to(roomId).emit(
          'gameOver',
          publicState(roomId, r)
        );

        io.to(roomId).emit(
          'state',
          publicState(roomId, r)
        );

        return;
      }

      r.index += 1;

      sendQuestion(roomId, r);

    }, 2500);

  }, 1000);
}

function startNewGame(room) {

  room.started = true;

  room.index = 0;

  room.phase = 'question';

  room.questions =
    shuffle(QUESTIONS).slice(
      0,
      QUESTIONS_PER_GAME
    );

  room.players.forEach(player => {
    player.score = 0;
  });

  room.answers = new Map();

  sendQuestion(
    [...rooms.entries()]
      .find(([id, r]) => r === room)?.[0],
    room
  );
}

io.on('connection', socket => {

  /*
    CREATE ROOM
  */

  socket.on('createRoom', ({ name }) => {

    const roomId = makeRoomId();

    const room = {

      hostId: socket.id,

      players: [
        {
          id: socket.id,
          name:
            (name || 'Player 1')
              .trim()
              .slice(0, 18),

          score: 0
        }
      ],

      questions: [],

      index: -1,

      answers: new Map(),

      started: false,

      phase: 'lobby',

      questionEndsAt: null,

      timer: null,

      revealInterval: null,

      revealTimer: null
    };

    rooms.set(roomId, room);

    socket.join(roomId);

    socket.data.roomId = roomId;

    socket.data.role = 'player';

    socket.emit('roomCreated', {
      roomId,
      playerId: socket.id
    });

    io.to(roomId).emit(
      'state',
      publicState(roomId, room)
    );
  });


  /*
    JOIN ROOM

    Minimum 2
    Maximum 4
  */

  socket.on('joinRoom', ({ roomId, name }) => {

    roomId =
      String(roomId || '')
        .trim()
        .toUpperCase();

    const room = rooms.get(roomId);

    if (!room) {

      return socket.emit(
        'errorMsg',
        'Room code correct ga enter cheyyi.'
      );
    }

    if (room.started) {

      return socket.emit(
        'errorMsg',
        'Game already started. New room create cheyyandi.'
      );
    }

    if (room.players.length >= 4) {

      return socket.emit(
        'errorMsg',
        'Ee room lo already 4 players unnaru.'
      );
    }

    room.players.push({

      id: socket.id,

      name:
        (name || `Player ${room.players.length + 1}`)
          .trim()
          .slice(0, 18),

      score: 0
    });

    socket.join(roomId);

    socket.data.roomId = roomId;

    socket.data.role = 'player';

    socket.emit('joinedRoom', {
      roomId,
      playerId: socket.id
    });

    io.to(roomId).emit(
      'state',
      publicState(roomId, room)
    );
  });


  /*
    TV SCREEN
  */

  socket.on('joinTV', ({ roomId }) => {

    roomId =
      String(roomId || '')
        .trim()
        .toUpperCase();

    const room = rooms.get(roomId);

    if (!room) {

      return socket.emit(
        'errorMsg',
        'Room not found.'
      );
    }

    socket.join(roomId);

    socket.data.roomId = roomId;

    socket.data.role = 'tv';

    socket.emit('tvJoined', {
      roomId
    });

    socket.emit(
      'state',
      publicState(roomId, room)
    );

    /*
      If TV joins after game has already started,
      send current question.
    */

    if (
      room.index >= 0 &&
      room.started &&
      room.phase === 'question'
    ) {

      const q =
        room.questions[room.index];

      socket.emit('question', {

        index: room.index,

        total: QUESTIONS_PER_GAME,

        q: q.q,

        options: q.options,

        endsAt:
          room.questionEndsAt
      });
    }
  });


  /*
    START GAME

    2 players minimum
    4 players maximum
  */

  socket.on('startGame', () => {

    const roomId =
      socket.data.roomId;

    const room =
      rooms.get(roomId);

    if (!room) return;

    if (room.hostId !== socket.id) return;

    if (room.players.length < 2) {

      return socket.emit(
        'errorMsg',
        'Game start avvalante minimum 2 players kavali.'
      );
    }

    if (room.players.length > 4) return;

    if (room.started) return;

    startNewGame(room);

  });


  /*
    PLAYER ANSWER
  */

  socket.on('answer', ({ choice }) => {

    const roomId =
      socket.data.roomId;

    const room =
      rooms.get(roomId);

    if (!room) return;

    if (!room.started) return;

    if (room.phase !== 'question') return;

    if (socket.data.role !== 'player') return;

    if (
      !room.players.some(
        p => p.id === socket.id
      )
    ) return;

    if (
      Date.now() >
      room.questionEndsAt
    ) return;

    /*
      Player can answer only once.
    */

    if (
      room.answers.has(socket.id)
    ) return;

    const numericChoice =
      Number(choice);

    if (
      !Number.isInteger(numericChoice) ||
      numericChoice < 0 ||
      numericChoice > 3
    ) return;

    room.answers.set(
      socket.id,
      numericChoice
    );

    io.to(roomId).emit(
      'answerState',
      {
        answered:
          room.answers.size,

        total:
          room.players.length
      }
    );

    /*
      If EVERY player answered,
      stop 90 sec timer and start
      5-second reveal countdown.
    */

    if (
      room.answers.size ===
      room.players.length
    ) {

      clearTimeout(room.timer);

      finishQuestion(roomId);
    }

  });


  /*
    PLAY AGAIN

    Host can restart after game ends.
    New 10-question set is shuffled.
  */

  socket.on('restart', () => {

    const roomId =
      socket.data.roomId;

    const room =
      rooms.get(roomId);

    if (!room) return;

    if (room.hostId !== socket.id)
      return;

    if (room.players.length < 2) {

      return socket.emit(
        'errorMsg',
        'Again play cheyyalante minimum 2 players kavali.'
      );
    }

    clearTimeout(room.timer);

    clearTimeout(room.revealTimer);

    clearInterval(room.revealInterval);

    startNewGame(room);

  });


  /*
    DISCONNECT
  */

  socket.on('disconnect', () => {

    const roomId =
      socket.data.roomId;

    const room =
      rooms.get(roomId);

    if (!room) return;

    /*
      TV disconnect అయితే
      players game disturb cheyyakudadhu.
    */

    if (socket.data.role === 'tv')
      return;

    room.players =
      room.players.filter(
        p => p.id !== socket.id
      );

    /*
      No players left
    */

    if (room.players.length === 0) {

      clearTimeout(room.timer);

      clearTimeout(room.revealTimer);

      clearInterval(room.revealInterval);

      rooms.delete(roomId);

      return;
    }

    /*
      If a player leaves during game,
      pause/reset the game.
    */

    if (room.started) {

      room.started = false;

      room.phase = 'lobby';

      room.index = -1;

      room.answers = new Map();

      room.questionEndsAt = null;

      clearTimeout(room.timer);

      clearTimeout(room.revealTimer);

      clearInterval(room.revealInterval);

    }

    /*
      If host leaves,
      next player becomes host.
    */

    if (
      room.hostId === socket.id
    ) {

      room.hostId =
        room.players[0].id;
    }

    io.to(roomId).emit(
      'errorMsg',
      'Oka player disconnect ayyadu. Game ni malli start cheyyandi.'
    );

    io.to(roomId).emit(
      'state',
      publicState(roomId, room)
    );
  });

});


server.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `The Juggadi Show running on port ${PORT}`
    );

  }
);
