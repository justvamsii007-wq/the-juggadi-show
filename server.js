const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Host passcode:
// Render Environment Variable lo HOST_PASSCODE_HASH set cheyyachu.
// Temporary ga default passcode "JUGGADI2026" use chestundi.
// Later Render lo secure hash set cheddam.
const HOST_PASSCODE_HASH =
  process.env.HOST_PASSCODE_HASH || '';

app.use(express.static(path.join(__dirname, 'public')));

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
    q: '"Mahanati" సినిమాలో legendary actress పాత్రను ఎవరు పోషించారు?',
    options: ['Keerthy Suresh', 'Samantha', 'Anushka Shetty', 'Sai Pallavi'],
    a: 0
  },
  {
    q: '"RRR"లో Ram Charan పోషించిన పాత్ర పేరు ఏమిటి?',
    options: ['Komaram Bheem', 'Rama Raju', 'Devaratha', 'Rudra'],
    a: 1
  },
  {
    q: '"Jersey" సినిమాలో cricket dream కోసం మళ్లీ bat పట్టుకునే character ని ఎవరు చేశారు?',
    options: ['Nani', 'Vijay Deverakonda', 'Sharwanand', 'Adivi Sesh'],
    a: 0
  },
  {
    q: 'ఒక Telugu actor "Arjun Reddy", "Geetha Govindam", "Dear Comrade" సినిమాలతో గుర్తింపు పొందాడు. ఎవరు?',
    options: ['Nani', 'Vijay Deverakonda', 'Sharwanand', 'Adivi Sesh'],
    a: 1
  },
  {
    q: '"Baahubali"లో Bhallaladeva పాత్రను చేసిన actor ఎవరు?',
    options: ['Prabhas', 'Rana Daggubati', 'Sathyaraj', 'Nassar'],
    a: 1
  },
  {
    q: '"Pushpa", "Rangasthalam", "Arya" సినిమాలకు దర్శకత్వం వహించిన director ఎవరు?',
    options: ['Sukumar', 'Trivikram', 'Koratala Siva', 'Vamshi Paidipally'],
    a: 0
  },
  {
    q: 'ఒకే actor "Rangasthalam"లో Chitti Babuగా, "RRR"లో Alluri Sitarama Rajuగా కనిపించాడు. ఎవరు?',
    options: ['Jr NTR', 'Ram Charan', 'Ravi Teja', 'Varun Tej'],
    a: 1
  },
  {
    q: '"Ala Vaikunthapurramuloo"లో "Butta Bomma" పాటతో కూడా famous అయిన hero ఎవరు?',
    options: ['Allu Arjun', 'Nani', 'Ram Charan', 'Vijay Deverakonda'],
    a: 0
  },
  {
    q: 'ప్రపంచవ్యాప్తంగా ప్రేమకు symbolగా famous అయిన Agra monument ఏది?',
    options: ['Charminar', 'Taj Mahal', 'Gateway of India', 'India Gate'],
    a: 1
  },
  {
    q: 'Mumbaiలో sea-facing iconic arch monument ఏది?',
    options: ['India Gate', 'Gateway of India', 'Charminar', 'Victoria Memorial'],
    a: 1
  },
  {
    q: 'Four minarets వల్ల Hyderabad identityగా మారిన monument ఏది?',
    options: ['Golconda Fort', 'Charminar', 'Qutub Minar', 'India Gate'],
    a: 1
  },
  {
    q: 'Rajasthanలో pink colour వల్ల "Pink City"గా famous అయిన city ఏది?',
    options: ['Udaipur', 'Jaipur', 'Jodhpur', 'Bikaner'],
    a: 1
  },
  {
    q: 'Rajasthanలో blue-coloured old city buildings వల్ల "Blue City"గా famous అయిన city ఏది?',
    options: ['Jaipur', 'Jaisalmer', 'Jodhpur', 'Udaipur'],
    a: 2
  },
  {
    q: 'Keralaలో backwaters, houseboats కోసం famous destination ఏది?',
    options: ['Alappuzha', 'Mysuru', 'Amritsar', 'Jaisalmer'],
    a: 0
  },
  {
    q: 'Golden Temple ఉన్న famous Indian city ఏది?',
    options: ['Ludhiana', 'Amritsar', 'Patiala', 'Chandigarh'],
    a: 1
  },
  {
    q: 'Tea plantations మరియు cool climate కోసం Keralaలో famous hill station ఏది?',
    options: ['Munnar', 'Varkala', 'Kochi', 'Kollam'],
    a: 0
  },
  {
    q: 'Karnatakaలో royal palace మరియు Dasara celebrationsకి famous city ఏది?',
    options: ['Mysuru', 'Pune', 'Surat', 'Lucknow'],
    a: 0
  },
  {
    q: 'Delhiలో tall towerలా కనిపించే famous historical monument ఏది?',
    options: ['Qutub Minar', 'Charminar', 'India Gate', 'Lotus Temple'],
    a: 0
  },
  {
    q: 'Indiaకి "Missile Man" of India అని popularly పిలిచే scientist ఎవరు?',
    options: ['C. V. Raman', 'A. P. J. Abdul Kalam', 'Homi Bhabha', 'Vikram Sarabhai'],
    a: 1
  },
  {
    q: 'Indiaకి first individual Olympic gold medal సాధించిన shooter ఎవరు?',
    options: ['Abhinav Bindra', 'Neeraj Chopra', 'Milkha Singh', 'P. T. Usha'],
    a: 0
  },
  {
    q: 'Javelin throwలో Olympic gold గెలిచి Indiaకి historic achievement ఇచ్చిన athlete ఎవరు?',
    options: ['Abhinav Bindra', 'Neeraj Chopra', 'Sushil Kumar', 'Dhanraj Pillay'],
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
    q: 'Chessలో world championగా Indiaకి historic achievement ఇచ్చిన legendary player ఎవరు?',
    options: ['Gukesh', 'Viswanathan Anand', 'Praggnanandhaa', 'Pentala Harikrishna'],
    a: 1
  },
  {
    q: 'Indian cinemaకి "Father of Indian Cinema"గా commonly called అయ్యే వ్యక్తి ఎవరు?',
    options: ['Satyajit Ray', 'Dadasaheb Phalke', 'Raj Kapoor', 'Guru Dutt'],
    a: 1
  },
  {
    q: '"Iron Man of India" అనే titleతో famous అయిన leader ఎవరు?',
    options: ['Bhagat Singh', 'Sardar Vallabhbhai Patel', 'Subhas Chandra Bose', 'Jawaharlal Nehru'],
    a: 1
  },
  {
    q: 'Indiaలో colourful powders ఒకరిపై ఒకరు వేసుకునే festival ఏది?',
    options: ['Diwali', 'Holi', 'Dussehra', 'Pongal'],
    a: 1
  },
  {
    q: 'Lights festivalగా famous అయిన Indian festival ఏది?',
    options: ['Holi', 'Diwali', 'Onam', 'Baisakhi'],
    a: 1
  },
  {
    q: 'Keralaలో boat races మరియు traditional celebrationsతో famous అయిన festival ఏది?',
    options: ['Pongal', 'Onam', 'Bihu', 'Lohri'],
    a: 1
  },
  {
    q: '"Palace of Winds" అని కూడా పిలిచే Rajasthan monument ఏది?',
    options: ['Hawa Mahal', 'Amer Fort', 'Jal Mahal', 'City Palace'],
    a: 0
  },
  {
    q: 'Hyderabadకి royal historyతో strongly associated అయిన palace ఏది?',
    options: ['Falaknuma Palace', 'Mysore Palace', 'Lake Palace', 'Umaid Bhawan'],
    a: 0
  },
  {
    q: 'Mumbaiని Indian cinemaతో connect చేస్తే commonly ఉపయోగించే industry name ఏది?',
    options: ['Tollywood', 'Bollywood', 'Kollywood', 'Sandalwood'],
    a: 1
  },
  {
    q: 'Hyderabadలో Telugu film industryకి commonly ఉపయోగించే పేరు ఏది?',
    options: ['Bollywood', 'Kollywood', 'Tollywood', 'Sandalwood'],
    a: 2
  },
  {
    q: '"Flying Sikh" అని famous అయిన Indian athlete ఎవరు?',
    options: ['Milkha Singh', 'Kapil Dev', 'Dhyan Chand', 'Anil Kumble'],
    a: 0
  },
  {
    q: '"The Wall" అనే nicknameతో famous అయిన Indian cricketer ఎవరు?',
    options: ['Rahul Dravid', 'Sunil Gavaskar', 'VVS Laxman', 'Anil Kumble'],
    a: 0
  },
  {
    q: '"King Kohli" అని fans popularly పిలిచే cricketer ఎవరు?',
    options: ['Rohit Sharma', 'Virat Kohli', 'Yuvraj Singh', 'Shikhar Dhawan'],
    a: 1
  },
  {
    q: 'ఒక movieలో hero మనిషి కాదు. తన deathకి revenge తీసుకోవడానికి తిరిగి వస్తాడు. ఆ movie ఏది?',
    options: ['Eega', 'Anji', 'Yamadonga', 'Robo'],
    a: 0
  },
  {
    q: 'ఒక failed cricketer తన కొడుకు కోసం తన old dreamని మళ్లీ pursue చేస్తాడు. Movie ఏది?',
    options: ['Majili', 'Jersey', 'Sye', 'Dear Comrade'],
    a: 1
  },
  {
    q: 'ఒక familyలో three generations ఒకే storyలో connect అవుతాయి. Telugu movie ఏది?',
    options: ['Manam', 'Bommarillu', 'Athadu', 'Jalsa'],
    a: 0
  },
  {
    q: 'ఒక father తన sonని చాలా control చేస్తాడు; son తన own life decisions తీసుకోవాలని ప్రయత్నిస్తాడు. Movie ఏది?',
    options: ['Bommarillu', 'Orange', 'Kushi', 'Happy Days'],
    a: 0
  },
  {
    q: 'ఒక taxi driverకి అతని taxi సాధారణ taxi కాదు. ఈ movie ఏది?',
    options: ['Taxiwala', 'Agent', 'Karthikeya', 'Goodachari'],
    a: 0
  },
  {
    q: 'ఒక archaeology student ancient mysteryని solve చేయడానికి ప్రయత్నిస్తాడు. Movie ఏది?',
    options: ['Karthikeya', 'Evaru', 'Goodachari', 'HIT'],
    a: 0
  },
  {
    q: 'ఒక villageలో mysterious deaths జరుగుతాయి; వాటి వెనుక supernatural reason ఉందా అనే mystery. Movie ఏది?',
    options: ['Virupaksha', 'Karthikeya', 'Masooda', 'Anukokunda Oka Roju'],
    a: 0
  },
  {
    q: 'ఒక murder caseలో ఎవరు నిజం చెబుతున్నారు, ఎవరు అబద్ధం చెబుతున్నారు అనేదే main puzzle. Movie ఏది?',
    options: ['Evaru', 'Kshanam', 'HIT', 'Goodachari'],
    a: 0
  },
  {
    q: 'ఒక undercover police officer తన identity దాచుకుని criminal networkలోకి వెళ్తాడు. Movie ఏది?',
    options: ['Pokiri', 'Julayi', 'Temper', 'Race Gurram'],
    a: 0
  },
  {
    q: 'ఒక young man unexpectedగా Chief Minister అవుతాడు. Movie ఏది?',
    options: ['Leader', 'Bharat Ane Nenu', 'Janatha Garage', 'Maharshi'],
    a: 1
  }
];

const QUESTION_TIME = 90;
const REVEAL_TIME = 5;
const QUESTIONS_PER_GAME = 10;

const rooms = new Map();

function hashPasscode(passcode) {
  return crypto
    .createHash('sha256')
    .update(String(passcode))
    .digest('hex');
}

function verifyHostPasscode(passcode) {
  if (!passcode) return false;

  // Temporary fallback for today's testing.
  // Later we'll remove this and use only Render env variable.
  if (!HOST_PASSCODE_HASH) {
    return String(passcode) === 'JUGGADI2026';
  }

  return hashPasscode(passcode) === HOST_PASSCODE_HASH;
}

function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] =
      [arr[j], arr[i]];
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

    questionEndsAt:
      room.questionEndsAt,

    phase: room.phase,

    revealCountdown:
      room.revealCountdown
  };
}

function sendQuestion(roomId, room) {

  const q =
    room.questions[room.index];

  room.phase = 'question';

  room.questionEndsAt =
    Date.now() +
    QUESTION_TIME * 1000;

  room.answers =
    new Map();

  room.revealCountdown = null;

  io.to(roomId).emit(
    'question',
    {
      index: room.index,

      total:
        QUESTIONS_PER_GAME,

      q: q.q,

      options: q.options,

      endsAt:
        room.questionEndsAt
    }
  );

  io.to(roomId).emit(
    'state',
    publicState(roomId, room)
  );

  clearTimeout(room.timer);

  room.timer =
    setTimeout(() => {

      /*
        Time is over.

        IMPORTANT:
        We do NOT reveal answer automatically.

        Host must click Reveal Answer.
      */

      room.questionEndsAt = null;

      io.to(roomId).emit(
        'timeUp'
      );

      io.to(roomId).emit(
        'state',
        publicState(roomId, room)
      );

    }, QUESTION_TIME * 1000 + 100);
}

function revealAnswer(roomId) {

  const room =
    rooms.get(roomId);

  if (!room || !room.started)
    return;

  if (room.phase !== 'question')
    return;

  room.phase = 'revealing';

  clearTimeout(room.timer);

  room.questionEndsAt = null;

  const q =
    room.questions[room.index];

  const correctPlayers = [];

  for (
    const [playerId, choice]
    of room.answers.entries()
  ) {

    if (choice === q.a) {

      const player =
        room.players.find(
          p => p.id === playerId
        );

      if (player) {

        player.score += 1;

        correctPlayers.push({
          id: player.id,
          name: player.name,
          pointsAdded: 1,
          totalScore: player.score
        });

      }
    }
  }

  /*
    Host clicked Reveal Answer.

    Start 5-second countdown.
  */

  room.revealCountdown =
    REVEAL_TIME;

  io.to(roomId).emit(
    'revealCountdown',
    {
      seconds: REVEAL_TIME
    }
  );

  clearInterval(
    room.revealInterval
  );

  room.revealInterval =
    setInterval(() => {

      room.revealCountdown -= 1;

      if (
        room.revealCountdown > 0
      ) {

        io.to(roomId).emit(
          'revealCountdown',
          {
            seconds:
              room.revealCountdown
          }
        );

        return;
      }

      clearInterval(
        room.revealInterval
      );

      room.revealInterval = null;

      room.phase = 'revealed';

      room.revealCountdown = null;

      io.to(roomId).emit(
        'answerReveal',
        {
          correct: q.a,

          correctAnswer:
            q.options[q.a],

          correctPlayers,

          answers:
            Object.fromEntries(
              room.answers
            ),

          players:
            room.players.map(p => ({
              id: p.id,
              name: p.name,
              score: p.score
            }))
        }
      );

      io.to(roomId).emit(
        'state',
        publicState(roomId, room)
      );

    }, 1000);
}

function startNewGame(roomId, room) {

  room.started = true;

  room.index = 0;

  room.phase = 'question';

  room.questions =
    shuffle(QUESTIONS)
      .slice(
        0,
        QUESTIONS_PER_GAME
      );

  room.players.forEach(
    player => {
      player.score = 0;
    }
  );

  room.answers =
    new Map();

  room.revealCountdown =
    null;

  clearTimeout(room.timer);

  clearTimeout(room.revealTimer);

  clearInterval(room.revealInterval);

  sendQuestion(
    roomId,
    room
  );
}

io.on('connection', socket => {

  /*
    CREATE ROOM

    Player creates the room.
    Host controller will authenticate
    separately using host passcode.
  */

  socket.on(
    'createRoom',
    ({ name }) => {

      const roomId =
        makeRoomId();

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

        answers:
          new Map(),

        started: false,

        phase: 'lobby',

        questionEndsAt:
          null,

        revealCountdown:
          null,

        timer: null,

        revealInterval:
          null,

        revealTimer:
          null,

        hostControllerId:
          null
      };

      rooms.set(
        roomId,
        room
      );

      socket.join(roomId);

      socket.data.roomId =
        roomId;

      socket.data.role =
        'player';

      socket.emit(
        'roomCreated',
        {
          roomId,
          playerId:
            socket.id
        }
      );

      io.to(roomId).emit(
        'state',
        publicState(
          roomId,
          room
        )
      );
    }
  );


  /*
    JOIN PLAYER

    2–4 players.
  */

  socket.on(
    'joinRoom',
    ({ roomId, name }) => {

      roomId =
        String(roomId || '')
          .trim()
          .toUpperCase();

      const room =
        rooms.get(roomId);

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

      if (
        room.players.length >= 4
      ) {

        return socket.emit(
          'errorMsg',
          'Ee room lo already 4 players unnaru.'
        );
      }

      room.players.push({

        id: socket.id,

        name:
          (
            name ||
            `Player ${room.players.length + 1}`
          )
            .trim()
            .slice(0, 18),

        score: 0
      });

      socket.join(roomId);

      socket.data.roomId =
        roomId;

      socket.data.role =
        'player';

      socket.emit(
        'joinedRoom',
        {
          roomId,
          playerId:
            socket.id
        }
      );

      io.to(roomId).emit(
        'state',
        publicState(
          roomId,
          room
        )
      );
    }
  );


  /*
    HOST AUTHENTICATION

    Host is NOT a player.

    Host connects separately and enters
    the secret passcode.
  */

  socket.on(
    'hostJoin',
    ({ roomId, passcode }) => {

      roomId =
        String(roomId || '')
          .trim()
          .toUpperCase();

      const room =
        rooms.get(roomId);

      if (!room) {

        return socket.emit(
          'hostAuthFailed',
          'Room not found.'
        );
      }

      if (
        !verifyHostPasscode(
          passcode
        )
      ) {

        return socket.emit(
          'hostAuthFailed',
          'Wrong host passcode.'
        );
      }

      /*
        Only one host controller.
      */

      if (
        room.hostControllerId &&
        room.hostControllerId !== socket.id
      ) {

        return socket.emit(
          'hostAuthFailed',
          'Host controller already connected.'
        );
      }

      room.hostControllerId =
        socket.id;

      socket.join(roomId);

      socket.data.roomId =
        roomId;

      socket.data.role =
        'host';

      socket.emit(
        'hostAuthenticated',
        {
          roomId
        }
      );

      socket.emit(
        'state',
        publicState(
          roomId,
          room
        )
      );
    }
  );


  /*
    TV DISPLAY

    TV is display only.
    No host controls here.
  */

  socket.on(
    'joinTV',
    ({ roomId }) => {

      roomId =
        String(roomId || '')
          .trim()
          .toUpperCase();

      const room =
        rooms.get(roomId);

      if (!room) {

        return socket.emit(
          'errorMsg',
          'Room not found.'
        );
      }

      socket.join(roomId);

      socket.data.roomId =
        roomId;

      socket.data.role =
        'tv';

      socket.emit(
        'tvJoined',
        {
          roomId
        }
      );

      socket.emit(
        'state',
        publicState(
          roomId,
          room
        )
      );

      if (
        room.index >= 0 &&
        room.started &&
        room.questions.length
      ) {

        const q =
          room.questions[
            room.index
          ];

        socket.emit(
          'question',
          {
            index:
              room.index,

            total:
              QUESTIONS_PER_GAME,

            q: q.q,

            options:
              q.options,

            endsAt:
              room.questionEndsAt
          }
        );
      }
    }
  );


  /*
    HOST START GAME

    Only authenticated host.
  */

  socket.on(
    'startGame',
    () => {

      const roomId =
        socket.data.roomId;

      const room =
        rooms.get(roomId);

      if (!room) return;

      if (
        socket.data.role !== 'host'
      ) return;

      if (
        room.hostControllerId !==
        socket.id
      ) return;

      if (
        room.players.length < 2
      ) {

        return socket.emit(
          'errorMsg',
          'Game start avvalante minimum 2 players kavali.'
        );
      }

      if (
        room.players.length > 4
      ) return;

      if (room.started)
        return;

      startNewGame(
        roomId,
        room
      );
    }
  );


  /*
    PLAYER ANSWER
  */

  socket.on(
    'answer',
    ({ choice }) => {

      const roomId =
        socket.data.roomId;

      const room =
        rooms.get(roomId);

      if (!room) return;

      if (!room.started)
        return;

      if (
        room.phase !== 'question'
      ) return;

      if (
        socket.data.role !== 'player'
      ) return;

      if (
        !room.players.some(
          p =>
            p.id === socket.id
        )
      ) return;

      if (
        room.questionEndsAt &&
        Date.now() >
          room.questionEndsAt
      ) return;

      if (
        room.answers.has(
          socket.id
        )
      ) return;

      const numericChoice =
        Number(choice);

      if (
        !Number.isInteger(
          numericChoice
        ) ||
        numericChoice < 0 ||
        numericChoice > 3
      ) return;

      room.answers.set(
        socket.id,
        numericChoice
      );

      /*
        Tell everyone only how many
        players have answered.

        Never reveal choices.
      */

      io.to(roomId).emit(
        'answerState',
        {
          answered:
            room.answers.size,

          total:
            room.players.length
        }
      );
    }
  );


  /*
    HOST REVEAL ANSWER

    This is the ONLY place where
    reveal can begin.
  */

  socket.on(
    'revealAnswer',
    () => {

      const roomId =
        socket.data.roomId;

      const room =
        rooms.get(roomId);

      if (!room) return;

      if (
        socket.data.role !== 'host'
      ) return;

      if (
        room.hostControllerId !==
        socket.id
      ) return;

      if (
        !room.started
      ) return;

      if (
        room.phase !== 'question'
      ) return;

      revealAnswer(
        roomId
      );
    }
  );


  /*
    HOST NEXT QUESTION

    Nothing moves automatically
    after reveal.
  */

  socket.on(
    'nextQuestion',
    () => {

      const roomId =
        socket.data.roomId;

      const room =
        rooms.get(roomId);

      if (!room) return;

      if (
        socket.data.role !== 'host'
      ) return;

      if (
        room.hostControllerId !==
        socket.id
      ) return;

      if (
        !room.started
      ) return;

      if (
        room.phase !== 'revealed'
      ) return;

      if (
        room.index >=
        QUESTIONS_PER_GAME - 1
      ) {

        room.started = false;

        room.phase =
          'finished';

        room.questionEndsAt =
          null;

        io.to(roomId).emit(
          'gameOver',
          publicState(
            roomId,
            room
          )
        );

        io.to(roomId).emit(
          'state',
          publicState(
            roomId,
            room
          )
        );

        return;
      }

      room.index += 1;

      sendQuestion(
        roomId,
        room
      );
    }
  );


  /*
    HOST RESTART GAME
  */

  socket.on(
    'restart',
    () => {

      const roomId =
        socket.data.roomId;

      const room =
        rooms.get(roomId);

      if (!room) return;

      if (
        socket.data.role !== 'host'
      ) return;

      if (
        room.hostControllerId !==
        socket.id
      ) return;

      if (
        room.players.length < 2
      ) {

        return socket.emit(
          'errorMsg',
          'Again play cheyyalante minimum 2 players kavali.'
        );
      }

      clearTimeout(room.timer);

      clearInterval(
        room.revealInterval
      );

      clearTimeout(
        room.revealTimer
      );

      startNewGame(
        roomId,
        room
      );
    }
  );


  /*
    HOST DISCONNECT
  */

  socket.on(
    'disconnect',
    () => {

      const roomId =
        socket.data.roomId;

      const room =
        rooms.get(roomId);

      if (!room)
        return;

      /*
        TV disconnect:
        don't disturb game.
      */

      if (
        socket.data.role === 'tv'
      ) {
        return;
      }

      /*
        Host disconnect:
        players remain,
        but game controls stop.
      */

      if (
        socket.data.role === 'host'
      ) {

        if (
          room.hostControllerId ===
          socket.id
        ) {

          room.hostControllerId =
            null;

          io.to(roomId).emit(
            'hostDisconnected'
          );
        }

        return;
      }

      /*
        Player disconnect.
      */

      room.players =
        room.players.filter(
          p =>
            p.id !== socket.id
        );

      if (
        room.players.length === 0
      ) {

        clearTimeout(
          room.timer
        );

        clearTimeout(
          room.revealTimer
        );

        clearInterval(
          room.revealInterval
        );

        rooms.delete(
          roomId
        );

        return;
      }

      /*
        If player leaves during
        an active game, stop game safely.
      */

      if (room.started) {

        room.started = false;

        room.phase =
          'lobby';

        room.index = -1;

        room.answers =
          new Map();

        room.questionEndsAt =
          null;

        clearTimeout(
          room.timer
        );

        clearTimeout(
          room.revealTimer
        );

        clearInterval(
          room.revealInterval
        );
      }

      io.to(roomId).emit(
        'errorMsg',
        'Oka player disconnect ayyadu. Game ni malli start cheyyandi.'
      );

      io.to(roomId).emit(
        'state',
        publicState(
          roomId,
          room
        )
      );
    }
  );

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
