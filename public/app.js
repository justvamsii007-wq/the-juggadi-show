const socket = io();

let me = '';
let roomId = '';
let isHost = false;
let myId = '';
let timerInterval = null;
let revealTimer = null;

const $ = id => document.getElementById(id);

function show(id) {
  document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
  $(id).classList.add('active');
}

function err(msg) {
  $('error').textContent = msg;
}

$('create').onclick = () => {
  const name = $('name').value.trim();

  if (!name) {
    return err('Mundhu nee name enter cheyyi 🙂');
  }

  me = name;
  socket.emit('createRoom', { name });
};

$('join').onclick = () => {
  const name = $('name').value.trim();
  const code = $('room').value.trim().toUpperCase();

  if (!name) {
    return err('Mundhu nee name enter cheyyi 🙂');
  }

  if (code.length !== 4) {
    return err('4-letter room code enter cheyyi.');
  }

  me = name;
  socket.emit('joinRoom', {
    roomId: code,
    name
  });
};

$('start').onclick = () => {
  socket.emit('startGame');
};

$('tv').onclick = () => {
  if (roomId) {
    window.open(`/tv.html?room=${roomId}`, '_blank');
  }
};

$('again').onclick = () => {
  socket.emit('restart');
};

$('homeBtn').onclick = () => {
  location.reload();
};

socket.on('roomCreated', d => {
  roomId = d.roomId;
  myId = d.playerId;
  isHost = true;
  enterLobby();
});

socket.on('joinedRoom', d => {
  roomId = d.roomId;
  myId = d.playerId;
  isHost = false;
  enterLobby();
});

function enterLobby() {
  $('bigRoom').textContent = roomId;
  $('roomBadge').textContent = roomId;
  show('lobby');
}

socket.on('state', state => {
  if (state.roomId) {
    roomId = state.roomId;
  }

  if (state.hostId) {
    isHost = state.hostId === myId;
  }

  $('players').innerHTML = state.players
    .map((p, i) => `
      <div class="player">
        ${i === 0 ? '👑 ' : ''}
        ${escapeHtml(p.name)}
      </div>
    `)
    .join('');

  const playerCount = state.players.length;

  // Minimum 2 players, maximum 4 players
  $('start').disabled = !(
    isHost &&
    playerCount >= 2 &&
    playerCount <= 4 &&
    !state.started
  );

  if (playerCount >= 2) {
    $('wait').textContent =
      `${playerCount} players ready! Host can start 👇`;
  } else {
    $('wait').textContent =
      'Waiting for Player 2…';
  }

  const mine = state.players.find(p => p.id === myId);

  if (mine) {
    $('score').textContent = `${mine.score} pts`;
  }
});

socket.on('question', q => {
  clearReveal();

  show('game');

  $('progress').textContent =
    `${q.index + 1} / ${q.total}`;

  $('question').textContent = q.q;

  $('answerStatus').textContent = '';

  $('options').innerHTML = q.options
    .map((o, i) => `
      <button
        class="option"
        data-i="${i}"
      >
        ${String.fromCharCode(65 + i)}. ${escapeHtml(o)}
      </button>
    `)
    .join('');

  document.querySelectorAll('.option').forEach(btn => {
    btn.onclick = () => choose(btn);
  });

  startTimer(q.endsAt);
});

function choose(btn) {
  document.querySelectorAll('.option').forEach(b => {
    b.disabled = true;
  });

  btn.classList.add('selected');

  $('answerStatus').textContent =
    'Answer locked 🔒 — waiting for everyone…';

  socket.emit('answer', {
    choice: Number(btn.dataset.i)
  });
}

socket.on('answerState', d => {
  $('answerStatus').textContent =
    `${d.answered}/${d.total} answered…`;
});

/*
  IMPORTANT:
  Correct/wrong answer is NOT shown immediately.

  Server sends answerReveal only after:
  - everyone answered
  OR
  - 90 seconds finished

  Then we show a 5-second suspense countdown.
*/

socket.on('answerReveal', d => {
  clearInterval(timerInterval);
  clearReveal();

  document.querySelectorAll('.option').forEach(b => {
    b.disabled = true;
  });

  startRevealCountdown(d);
});

function startRevealCountdown(d) {
  let seconds = 5;

  const selected =
    Object.prototype.hasOwnProperty.call(d.answers, myId)
      ? Number(d.answers[myId])
      : null;

  $('answerStatus').textContent =
    `ANSWER REVEAL IN ${seconds}...`;

  revealTimer = setInterval(() => {
    seconds--;

    if (seconds > 0) {
      $('answerStatus').textContent =
        `ANSWER REVEAL IN ${seconds}...`;
      return;
    }

    clearReveal();

    // Highlight correct answer
    document.querySelectorAll('.option').forEach((btn, i) => {
      if (i === d.correct) {
        btn.classList.add('correct');
      }

      if (
        selected === i &&
        selected !== d.correct
      ) {
        btn.classList.add('wrong');
      }
    });

    // Find who answered correctly
    let winnerNames = [];

    if (d.answers) {
      Object.entries(d.answers).forEach(([playerId, choice]) => {
        if (Number(choice) === Number(d.correct)) {
          const player =
            d.players?.find(p => p.id === playerId);

          if (player) {
            winnerNames.push(player.name);
          }
        }
      });
    }

    // Server may send correct player names directly
    if (Array.isArray(d.correctPlayers)) {
      winnerNames = d.correctPlayers;
    }

    if (winnerNames.length > 0) {
      $('answerStatus').textContent =
        `🏆 ${winnerNames.join(' & ')} got it right!`;
    } else {
      $('answerStatus').textContent =
        '❌ Nobody got the answer!';
    }
  }, 1000);
}

socket.on('gameOver', state => {
  clearInterval(timerInterval);
  clearReveal();

  show('result');

  const sorted =
    [...state.players].sort(
      (a, b) => b.score - a.score
    );

  const topScore = sorted[0].score;

  const winners =
    sorted.filter(p => p.score === topScore);

  if (winners.length > 1) {
    $('winner').textContent =
      '🤝 IT\'S A TIE!';
  } else {
    $('winner').textContent =
      `🏆 ${escapeHtml(winners[0].name)} WINS!`;
  }

  $('finalPlayers').innerHTML =
    sorted
      .map((p, i) => `
        <div class="final">
          <span>
            ${i === 0 ? '🏆 ' : ''}
            ${escapeHtml(p.name)}
          </span>
          <b>${p.score}/${state.total || 10}</b>
        </div>
      `)
      .join('');
});

socket.on('errorMsg', msg => {
  err(msg);
});

function startTimer(endsAt) {
  clearInterval(timerInterval);

  const tick = () => {
    const left = Math.max(
      0,
      Math.ceil((endsAt - Date.now()) / 1000)
    );

    $('timerText').textContent = left;

    if (left <= 0) {
      clearInterval(timerInterval);

      document.querySelectorAll('.option').forEach(b => {
        b.disabled = true;
      });

      $('answerStatus').textContent =
        '⏰ Time up! Waiting for answer reveal…';
    }
  };

  tick();

  timerInterval = setInterval(tick, 250);
}

function clearReveal() {
  if (revealTimer) {
    clearInterval(revealTimer);
    revealTimer = null;
  }
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );
}
