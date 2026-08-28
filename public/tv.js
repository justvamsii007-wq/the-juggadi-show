const socket = io();

const params = new URLSearchParams(location.search);
const roomId = (params.get('room') || '').toUpperCase();

const $ = id => document.getElementById(id);

let timer = null;
let revealTimer = null;
let currentQuestion = null;

$('tvRoom').textContent = roomId || 'ROOM';

if (roomId) {
  socket.emit('joinTV', { roomId });
}


// ===============================
// SCREEN STATES
// ===============================

function showWaiting() {
  $('tvWaiting').classList.remove('hidden');
  $('tvQuestion').classList.add('hidden');
  $('tvResult').classList.add('hidden');
}

function showGame() {
  $('tvWaiting').classList.add('hidden');
  $('tvQuestion').classList.remove('hidden');
  $('tvResult').classList.add('hidden');
}

function showResult() {
  $('tvWaiting').classList.add('hidden');
  $('tvQuestion').classList.add('hidden');
  $('tvResult').classList.remove('hidden');
}

function clearTimers() {
  clearInterval(timer);
  clearInterval(revealTimer);

  timer = null;
  revealTimer = null;
}


// ===============================
// INITIAL TV STATE
// ===============================

showWaiting();


// ===============================
// NEW QUESTION
// ===============================

socket.on('question', q => {

  clearTimers();

  currentQuestion = q;

  showGame();

  $('tvProgress').textContent =
    `${q.index + 1}/${q.total}`;

  $('tvQNo').textContent =
    `QUESTION ${q.index + 1}`;

  $('tvQ').textContent =
    q.q;

  $('tvOptions').innerHTML =
    q.options
      .map((option, index) => `
        <div class="tvOption">
          <span class="optionLetter">
            ${String.fromCharCode(65 + index)}.
          </span>

          <span>
            ${escapeHtml(option)}
          </span>
        </div>
      `)
      .join('');

  startTimer(q.endsAt);
});


// ===============================
// GAME STATE
// ===============================

socket.on('state', state => {

  if (
    !state.started &&
    state.index < 0
  ) {
    showWaiting();
  }

});


// ===============================
// ANSWER COUNT
// ===============================
//
// TV does NOT show who answered.
// TV does NOT show correct/wrong.
// Only host needs that control information.
//

socket.on('answerState', data => {

  /*
    Intentionally no visual reveal here.
    Players remain in suspense.
  */

});


// ===============================
// TIME UP
// ===============================

socket.on('timeUp', () => {

  clearInterval(timer);

  $('tvTimerText').textContent =
    '0';

  /*
    IMPORTANT:
    Don't reveal anything automatically.

    Host must press:
    REVEAL ANSWER
  */

});


// ===============================
// HOST STARTED REVEAL
// ===============================

socket.on(
  'revealCountdown',
  data => {

    clearInterval(timer);
    clearInterval(revealTimer);

    let seconds =
      Number(data.seconds) || 5;

    /*
      Big cinematic countdown.
    */

    $('tvQNo').textContent =
      'ANSWER REVEAL';

    $('tvQ').innerHTML = `
      <div class="tvRevealTitle">
        GET READY...
      </div>
    `;

    $('tvOptions').innerHTML = `
      <div class="tvRevealCountdown">
        ${seconds}
      </div>
    `;

    $('tvTimerText').textContent =
      '';

    $('tvTimerBar').style.width =
      '0%';

    revealTimer =
      setInterval(() => {

        seconds--;

        if (seconds > 0) {

          $('tvOptions').innerHTML = `
            <div class="tvRevealCountdown">
              ${seconds}
            </div>
          `;

          return;
        }

        clearInterval(
          revealTimer
        );

        revealTimer = null;

      }, 1000);

  }
);


// ===============================
// FINAL ANSWER REVEAL
// ===============================

socket.on(
  'answerReveal',
  data => {

    clearTimers();

    /*
      Correct answer text comes
      directly from the server.
    */

    const correctAnswer =
      data.correctAnswer ||
      'Answer';

    const correctLetter =
      String.fromCharCode(
        65 + Number(data.correct)
      );

    /*
      BIG ANSWER
    */

    $('tvQNo').textContent =
      'CORRECT ANSWER';

    $('tvQ').innerHTML = `
      <div class="tvAnswerLabel">
        CORRECT ANSWER
      </div>

      <div class="tvBigAnswer">
        ${correctLetter}. ${escapeHtml(correctAnswer)}
      </div>
    `;


    /*
      Correct option + all options
      */

    if (
      currentQuestion &&
      currentQuestion.options
    ) {

      $('tvOptions').innerHTML =
        currentQuestion.options
          .map(
            (option, index) => {

              const isCorrect =
                index ===
                Number(data.correct);

              return `
                <div class="tvOption ${
                  isCorrect
                    ? 'tvCorrect'
                    : 'tvDimmed'
                }">

                  <span class="optionLetter">
                    ${String.fromCharCode(
                      65 + index
                    )}.
                  </span>

                  <span>
                    ${escapeHtml(option)}
                  </span>

                  ${
                    isCorrect
                      ? '<span class="check">✓</span>'
                      : ''
                  }

                </div>
              `;
            }
          )
          .join('');

    }


    /*
      Correct players
    */

    const correctPlayers =
      Array.isArray(
        data.correctPlayers
      )
        ? data.correctPlayers
        : [];


    if (
      correctPlayers.length > 0
    ) {

      const playerHTML =
        correctPlayers
          .map(
            player => `
              <div class="correctPlayer">

                <span>
                  🏆
                  ${escapeHtml(
                    player.name
                  )}
                </span>

                <strong>
                  +${player.pointsAdded || 1}
                </strong>

              </div>
            `
          )
          .join('');

      $('tvOptions').innerHTML += `
        <div class="correctPlayersTitle">
          CORRECT PLAYERS
        </div>

        ${playerHTML}
      `;

    } else {

      $('tvOptions').innerHTML += `
        <div class="correctPlayersTitle">
          ❌ NOBODY GOT IT!
        </div>
      `;

    }


    /*
      SCOREBOARD
    */

    if (
      Array.isArray(data.players)
    ) {

      renderScoreboard(
        data.players
      );

    }

  }
);


// ===============================
// SCOREBOARD
// ===============================

function renderScoreboard(players) {

  const sorted =
    [...players].sort(
      (a, b) =>
        b.score - a.score
    );

  /*
    Reuse tvScores if it exists.
    This keeps the existing HTML compatible.
  */

  if (!$('tvScores')) {
    return;
  }

  $('tvScores').innerHTML =
    sorted
      .map(
        (player, index) => `
          <div class="tvScoreRow">

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

            <strong>
              ${player.score} pts
            </strong>

          </div>
        `
      )
      .join('');

}


// ===============================
// GAME OVER
// ===============================

socket.on(
  'gameOver',
  state => {

    clearTimers();

    showResult();

    const sorted =
      [...state.players].sort(
        (a, b) =>
          b.score - a.score
      );

    const topScore =
      sorted[0]?.score || 0;

    const winners =
      sorted.filter(
        player =>
          player.score ===
          topScore
      );

    if (
      winners.length > 1
    ) {

      $('tvWinner').textContent =
        '🤝 IT\'S A TIE!';

    } else {

      $('tvWinner').textContent =
        `${escapeHtml(
          winners[0].name
        )} WINS!`;

    }

    $('tvScores').innerHTML =
      sorted
        .map(
          (player, index) => `
            <div class="tvScoreRow">

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

              <strong>
                ${player.score}/${state.total || 10}
              </strong>

            </div>
          `
        )
        .join('');

  }
);


// ===============================
// 90 SECOND TIMER
// ===============================

function startTimer(endTime) {

  clearInterval(timer);

  const tick = () => {

    const left =
      Math.max(
        0,
        Math.ceil(
          (
            endTime -
            Date.now()
          ) / 1000
        )
      );

    $('tvTimerText').textContent =
      left;

    const percentage =
      Math.max(
        0,
        Math.min(
          100,
          (left / 90) * 100
        )
      );

    $('tvTimerBar').style.width =
      `${percentage}%`;

    if (left <= 0) {

      clearInterval(timer);

      $('tvTimerText').textContent =
        '0';

    }

  };

  tick();

  timer =
    setInterval(
      tick,
      250
    );
}


// ===============================
// ERROR
// ===============================

socket.on(
  'errorMsg',
  message => {

    clearTimers();

    $('tvWaiting').textContent =
      message;

    showWaiting();

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
