const socket = io();

let me = '';
let roomId = '';
let myId = '';
let timerInterval = null;
let revealTimer = null;

const $ = id => document.getElementById(id);

function show(id) {
  document
    .querySelectorAll('.screen')
    .forEach(x => x.classList.remove('active'));

  $(id).classList.add('active');
}

function err(msg) {
  $('error').textContent = msg;
}


// ===============================
// CREATE GAME
// ===============================

$('create').onclick = () => {

  const name =
    $('name').value.trim();

  if (!name) {
    return err(
      'Mundhu nee name enter cheyyi 🙂'
    );
  }

  me = name;

  socket.emit(
    'createRoom',
    { name }
  );
};


// ===============================
// JOIN GAME
// ===============================

$('join').onclick = () => {

  const name =
    $('name').value.trim();

  const code =
    $('room')
      .value
      .trim()
      .toUpperCase();

  if (!name) {
    return err(
      'Mundhu nee name enter cheyyi 🙂'
    );
  }

  if (code.length !== 4) {
    return err(
      '4-letter room code enter cheyyi.'
    );
  }

  me = name;

  socket.emit(
    'joinRoom',
    {
      roomId: code,
      name
    }
  );
};


// ===============================
// IMPORTANT
// ===============================
//
// Players DON'T have:
// Start Game
// Reveal Answer
// Next Question
//
// Only Host has those controls.
//
// ===============================


// ===============================
// TV BUTTON
// ===============================

$('tv').onclick = () => {

  if (roomId) {

    window.open(
      `/tv.html?room=${roomId}`,
      '_blank'
    );

  }
};


// ===============================
// OLD AGAIN BUTTON
// ===============================
//
// Keep it disabled/hidden if present.
// Restart is now HOST ONLY.
//

if ($('again')) {

  $('again').style.display =
    'none';

}


// ===============================
// HOME
// ===============================

$('homeBtn').onclick = () => {

  location.reload();

};


// ===============================
// ROOM CREATED
// ===============================

socket.on(
  'roomCreated',
  data => {

    roomId =
      data.roomId;

    myId =
      data.playerId;

    enterLobby();

  }
);


// ===============================
// ROOM JOINED
// ===============================

socket.on(
  'joinedRoom',
  data => {

    roomId =
      data.roomId;

    myId =
      data.playerId;

    enterLobby();

  }
);


function enterLobby() {

  $('bigRoom').textContent =
    roomId;

  $('roomBadge').textContent =
    roomId;

  show('lobby');

}


// ===============================
// GAME STATE
// ===============================

socket.on(
  'state',
  state => {

    if (state.roomId) {

      roomId =
        state.roomId;

    }

    updatePlayers(
      state.players || []
    );

    const mine =
      state.players?.find(
        p => p.id === myId
      );

    if (mine) {

      $('score').textContent =
        `${mine.score} pts`;

    }

  }
);


// ===============================
// PLAYERS
// ===============================

function updatePlayers(players) {

  $('players').innerHTML =
    players
      .map(
        (player, index) => `
          <div class="player">
            ${index === 0 ? '👑 ' : ''}
            ${escapeHtml(player.name)}
          </div>
        `
      )
      .join('');

}


// ===============================
// QUESTION
// ===============================

socket.on(
  'question',
  q => {

    clearTimers();

    show('game');

    $('progress').textContent =
      `${q.index + 1} / ${q.total}`;

    $('question').textContent =
      q.q;

    $('answerStatus').textContent =
      '';

    $('options').innerHTML =
      q.options
        .map(
          (option, index) => `
            <button
              class="option"
              data-i="${index}"
            >
              ${String.fromCharCode(65 + index)}.
              ${escapeHtml(option)}
            </button>
          `
        )
        .join('');

    document
      .querySelectorAll('.option')
      .forEach(button => {

        button.onclick =
          () => choose(button);

      });

    startTimer(
      q.endsAt
    );

  }
);


// ===============================
// PLAYER ANSWER
// ===============================

function choose(button) {

  /*
    Prevent changing answer.
  */

  document
    .querySelectorAll('.option')
    .forEach(
      b => {
        b.disabled = true;
      }
    );

  button.classList.add(
    'selected'
  );

  $('answerStatus').textContent =
    'Answer locked 🔒 — waiting for everyone…';

  socket.emit(
    'answer',
    {
      choice:
        Number(
          button.dataset.i
        )
    }
  );

}


// ===============================
// ANSWER COUNT
// ===============================
//
// Don't reveal who answered.
// Don't reveal correct/wrong.
//

socket.on(
  'answerState',
  data => {

    $('answerStatus').textContent =
      `${data.answered}/${data.total} answered…`;

  }
);


// ===============================
// TIME UP
// ===============================

socket.on(
  'timeUp',
  () => {

    clearInterval(
      timerInterval
    );

    document
      .querySelectorAll('.option')
      .forEach(
        button => {
          button.disabled = true;
        }
      );

    $('timerText').textContent =
      '0';

    $('answerStatus').textContent =
      '⏰ Time up! Waiting for host to reveal…';

  }
);


// ===============================
// HOST STARTED REVEAL
// ===============================
//
// Players only WATCH the countdown.
// They cannot trigger it.
//

socket.on(
  'revealCountdown',
  data => {

    clearInterval(
      timerInterval
    );

    clearInterval(
      revealTimer
    );

    let seconds =
      Number(data.seconds) || 5;

    $('answerStatus').textContent =
      `🔓 ANSWER REVEALING IN ${seconds}...`;

    revealTimer =
      setInterval(
        () => {

          seconds--;

          if (seconds > 0) {

            $('answerStatus').textContent =
              `🔓 ANSWER REVEALING IN ${seconds}...`;

            return;

          }

          clearInterval(
            revealTimer
          );

        },
        1000
      );

  }
);


// ===============================
// FINAL ANSWER REVEAL
// ===============================

socket.on(
  'answerReveal',
  data => {

    clearInterval(
      timerInterval
    );

    clearInterval(
      revealTimer
    );

    const selected =
      findMyAnswer(
        data.answers
      );

    document
      .querySelectorAll('.option')
      .forEach(
        (button, index) => {

          button.disabled =
            true;

          /*
            Correct option.
          */

          if (
            index ===
            Number(data.correct)
          ) {

            button.classList.add(
              'correct'
            );

          }

          /*
            My wrong answer.
          */

          if (
            selected === index &&
            selected !==
              Number(data.correct)
          ) {

            button.classList.add(
              'wrong'
            );

          }

        }
      );


    /*
      Full correct answer.
    */

    const correctText =
      data.correctAnswer ||
      '';

    if (
      selected ===
      Number(data.correct)
    ) {

      $('answerStatus').textContent =
        `✅ CORRECT! +1 — ${correctText}`;

    } else {

      $('answerStatus').textContent =
        `❌ Correct Answer: ${correctText}`;

    }

  }
);


// ===============================
// GAME OVER
// ===============================

socket.on(
  'gameOver',
  state => {

    clearTimers();

    show('result');

    const sorted =
      [...state.players]
        .sort(
          (a, b) =>
            b.score - a.score
        );

    const topScore =
      sorted[0]?.score || 0;

    const winners =
      sorted.filter(
        p =>
          p.score ===
          topScore
      );

    if (
      winners.length > 1
    ) {

      $('winner').textContent =
        '🤝 IT\'S A TIE!';

    } else {

      $('winner').textContent =
        `🏆 ${escapeHtml(
          winners[0].name
        )} WINS!`;

    }

    $('finalPlayers').innerHTML =
      sorted
        .map(
          (player, index) => `
            <div class="final">

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

              <b>
                ${player.score}/${state.total || 10}
              </b>

            </div>
          `
        )
        .join('');

  }
);


// ===============================
// TIMER
// ===============================

function startTimer(endsAt) {

  clearInterval(
    timerInterval
  );

  const tick = () => {

    const left =
      Math.max(
        0,
        Math.ceil(
          (
            endsAt -
            Date.now()
          ) / 1000
        )
      );

    $('timerText').textContent =
      left;

    if (left <= 0) {

      clearInterval(
        timerInterval
      );

      document
        .querySelectorAll('.option')
        .forEach(
          button => {
            button.disabled = true;
          }
        );

    }

  };

  tick();

  timerInterval =
    setInterval(
      tick,
      250
    );

}


// ===============================
// FIND MY ANSWER
// ===============================

function findMyAnswer(
  answers
) {

  if (
    !answers ||
    !Object.prototype.hasOwnProperty.call(
      answers,
      myId
    )
  ) {

    return null;

  }

  return Number(
    answers[myId]
  );

}


// ===============================
// CLEAR TIMERS
// ===============================

function clearTimers() {

  clearInterval(
    timerInterval
  );

  clearInterval(
    revealTimer
  );

  timerInterval =
    null;

  revealTimer =
    null;

}


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


// ===============================
// ERROR
// ===============================

socket.on(
  'errorMsg',
  message => {

    err(message);

  }
);
