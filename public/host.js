const socket = io();

const $ = id => document.getElementById(id);

let roomId = '';
let authenticated = false;
let gameState = null;


// ===============================
// CREATE ROOM
// ===============================

$('loginBtn').onclick = () => {

  const passcode =
    $('passInput').value.trim();

  $('loginMessage').textContent = '';

  if (!passcode) {

    $('loginMessage').textContent =
      'Host passcode enter cheyyi.';

    return;
  }

  socket.emit(
    'hostCreateRoom',
    {
      passcode
    }
  );
};


// Enter key support

$('passInput').addEventListener(
  'keydown',
  event => {

    if (event.key === 'Enter') {
      $('loginBtn').click();
    }

  }
);


// ===============================
// ROOM CREATED
// ===============================

socket.on(
  'hostRoomCreated',
  data => {

    authenticated = true;

    roomId =
      data.roomId;

    $('loginCard')
      .classList.add('hidden');

    $('hostCard')
      .classList.remove('hidden');

    $('roomDisplay').textContent =
      roomId;

    setStatus(
      'Room created! Waiting for players...'
    );

  }
);


// ===============================
// HOST AUTH FAILED
// ===============================

socket.on(
  'hostAuthFailed',
  message => {

    $('loginMessage').textContent =
      message;

  }
);


// ===============================
// GAME STATE
// ===============================

socket.on(
  'state',
  state => {

    if (!authenticated)
      return;

    gameState = state;

    updatePlayers(state);

    updateControls(state);

  }
);


// ===============================
// PLAYERS
// ===============================

function updatePlayers(state) {

  const players =
    state.players || [];

  $('players').innerHTML =
    players.map(
      player => `

        <div class="player">

          <span>
            ${escapeHtml(player.name)}
          </span>

          <span class="score">

            ${
              player.ready
                ? '✅ READY'
                : '⏳ NOT READY'
            }

          </span>

        </div>

      `
    ).join('');


  if (players.length < 2) {

    setStatus(
      `Waiting for players... ${players.length}/4`
    );

    return;
  }


  const readyPlayers =
    players.filter(
      player => player.ready
    ).length;


  setStatus(
    `${readyPlayers}/${players.length} players READY`
  );

}


// ===============================
// GAME CONTROLS
// ===============================

function updateControls(state) {

  const players =
    state.players || [];

  const count =
    players.length;


  const allReady =
    count >= 2 &&
    players.every(
      player => player.ready
    );


  // =============================
  // LOBBY
  // =============================

  if (!state.started) {

    $('startBtn')
      .classList.remove('hidden');

    /*
      Host can start only when:

      minimum 2 players
      AND everyone is READY
    */

    $('startBtn').disabled =
      !allReady;


    if (allReady) {

      $('startBtn').textContent =
        '▶️ START GAME';

    } else {

      $('startBtn').textContent =
        '⏳ WAITING FOR PLAYERS';

    }


    $('revealBtn')
      .classList.add('hidden');

    $('nextBtn')
      .classList.add('hidden');

    $('restartBtn')
      .classList.add('hidden');

    $('questionCard')
      .classList.add('hidden');

    $('countdown')
      .classList.add('hidden');

    return;
  }


  // =============================
  // QUESTION
  // =============================

  if (
    state.phase === 'question'
  ) {

    $('startBtn')
      .classList.add('hidden');

    $('restartBtn')
      .classList.add('hidden');

    $('questionCard')
      .classList.remove('hidden');

    $('revealBtn')
      .classList.remove('hidden');

    $('nextBtn')
      .classList.add('hidden');

    $('countdown')
      .classList.add('hidden');

    $('revealBtn').disabled =
      false;

    return;
  }


  // =============================
  // REVEALING
  // =============================

  if (
    state.phase === 'revealing'
  ) {

    $('revealBtn')
      .classList.add('hidden');

    $('nextBtn')
      .classList.add('hidden');

    $('countdown')
      .classList.remove('hidden');

    $('restartBtn')
      .classList.add('hidden');

    return;
  }


  // =============================
  // REVEALED
  // =============================

  if (
    state.phase === 'revealed'
  ) {

    $('revealBtn')
      .classList.add('hidden');

    $('countdown')
      .classList.add('hidden');

    $('nextBtn')
      .classList.remove('hidden');

    $('nextBtn').disabled =
      false;

    $('restartBtn')
      .classList.remove('hidden');

    return;
  }


  // =============================
  // FINISHED
  // =============================

  if (
    state.phase === 'finished'
  ) {

    $('startBtn')
      .classList.add('hidden');

    $('revealBtn')
      .classList.add('hidden');

    $('nextBtn')
      .classList.add('hidden');

    $('countdown')
      .classList.add('hidden');

    $('restartBtn')
      .classList.remove('hidden');

  }

}


// ===============================
// START GAME
// ===============================

$('startBtn').onclick = () => {

  if (!authenticated)
    return;

  socket.emit(
    'startGame'
  );

};


// ===============================
// QUESTION
// ===============================

socket.on(
  'question',
  question => {

    if (!authenticated)
      return;

    $('questionCard')
      .classList.remove('hidden');

    $('questionNumber').textContent =
      `QUESTION ${question.index + 1}`;

    $('question').textContent =
      question.q;

    const totalPlayers =
      gameState?.players?.length || 2;

    $('answerCount').textContent =
      `0 / ${totalPlayers} answered`;

    $('hostStatus').textContent =
      'Waiting for players to answer...';

  }
);


// ===============================
// ANSWER COUNT
// ===============================

socket.on(
  'answerState',
  data => {

    if (!authenticated)
      return;

    $('answerCount').textContent =
      `${data.answered} / ${data.total} answered`;


    if (
      data.answered >= data.total
    ) {

      $('hostStatus').textContent =
        'Everyone answered! Host can reveal 👇';

    } else {

      $('hostStatus').textContent =
        'Waiting for remaining players...';

    }

  }
);


// ===============================
// TIME UP
// ===============================

socket.on(
  'timeUp',
  () => {

    if (!authenticated)
      return;

    $('hostStatus').textContent =
      '⏰ Time up! You can reveal the answer now.';

    $('revealBtn').disabled =
      false;

  }
);


// ===============================
// REVEAL ANSWER
// ===============================

$('revealBtn').onclick = () => {

  if (!authenticated)
    return;

  $('revealBtn').disabled =
    true;

  $('hostStatus').textContent =
    '🔓 Answer revealing...';

  socket.emit(
    'revealAnswer'
  );

};


// ===============================
// REVEAL COUNTDOWN
// ===============================

socket.on(
  'revealCountdown',
  data => {

    if (!authenticated)
      return;

    $('countdown')
      .classList.remove('hidden');

    $('countdown').textContent =
      data.seconds;

    $('hostStatus').textContent =
      `Answer reveal in ${data.seconds}...`;

  }
);


// ===============================
// ANSWER REVEALED
// ===============================

socket.on(
  'answerReveal',
  data => {

    if (!authenticated)
      return;

    $('countdown')
      .classList.add('hidden');

    $('nextBtn')
      .classList.remove('hidden');

    $('nextBtn').disabled =
      false;

    $('restartBtn')
      .classList.remove('hidden');

    $('hostStatus').textContent =
      '✅ Answer revealed. Host decides when to continue.';


    if (data.players) {

      renderScores(
        data.players
      );

    }

  }
);


// ===============================
// NEXT QUESTION
// ===============================

$('nextBtn').onclick = () => {

  if (!authenticated)
    return;

  $('nextBtn').disabled =
    true;

  $('hostStatus').textContent =
    'Loading next question...';

  socket.emit(
    'nextQuestion'
  );

};


// ===============================
// RESTART
// ===============================

$('restartBtn').onclick = () => {

  if (!authenticated)
    return;

  const confirmed =
    confirm(
      'Game ni restart cheyyala?'
    );

  if (!confirmed)
    return;

  socket.emit(
    'restart'
  );

};


// ===============================
// SCORE DISPLAY
// ===============================

function renderScores(players) {

  $('players').innerHTML =
    [...players]
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .map(
        (player, index) => `

          <div class="player">

            <span>

              ${
                index === 0
                  ? '🏆 '
                  : ''
              }

              ${escapeHtml(
                player.name
              )}

            </span>

            <span class="score">

              ${player.score} pts

            </span>

          </div>

        `
      )
      .join('');

}


// ===============================
// HOST DISCONNECTED
// ===============================

socket.on(
  'hostDisconnected',
  () => {

    if (!authenticated)
      return;

    $('hostStatus').textContent =
      '⚠️ Host connection lost. Refresh and login again.';

  }
);


// ===============================
// ERROR
// ===============================

socket.on(
  'errorMsg',
  message => {

    if (authenticated) {

      $('errorMessage').textContent =
        message;

    } else {

      $('loginMessage').textContent =
        message;

    }

  }
);


// ===============================
// HTML SAFETY
// ===============================

function escapeHtml(value) {

  return String(value).replace(
    /[&<>'"]/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[character])
  );

}
