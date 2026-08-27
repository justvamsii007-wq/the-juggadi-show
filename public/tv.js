const socket = io();

const params = new URLSearchParams(location.search);
const roomId = (params.get('room') || '').toUpperCase();

const $ = id => document.getElementById(id);

let timer = null;
let revealTimer = null;

$('tvRoom').textContent = roomId || 'ROOM';

if (roomId) {
  socket.emit('joinTV', { roomId });
}

function showGame() {
  $('tvWaiting').classList.add('hidden');
  $('tvQuestion').classList.remove('hidden');
  $('tvResult').classList.add('hidden');
}

function showWaiting() {
  $('tvWaiting').classList.remove('hidden');
  $('tvQuestion').classList.add('hidden');
  $('tvResult').classList.add('hidden');
}

function clearAllTimers() {
  clearInterval(timer);
  clearInterval(revealTimer);

  timer = null;
  revealTimer = null;
}

/*
  QUESTION
*/

socket.on('question', q => {

  clearAllTimers();

  showGame();

  $('tvProgress').textContent =
    `${q.index + 1}/${q.total}`;

  $('tvQNo').textContent =
    `QUESTION ${q.index + 1}`;

  $('tvQ').textContent = q.q;

  $('tvOptions').innerHTML =
    q.options
      .map((o, i) => `
        <div>
          ${String.fromCharCode(65 + i)}. ${escapeHtml(o)}
        </div>
      `)
      .join('');

  startTimer(q.endsAt);
});


/*
  LOBBY / STATE
*/

socket.on('state', s => {

  if (!s.started && s.index < 0) {
    showWaiting();
  }

});


/*
  ANSWER COUNT

  TV should NOT reveal who answered
  or whether their answer is correct.
*/

socket.on('answerState', d => {

  const answered = d.answered;
  const total = d.total;

  /*
    We intentionally don't show
    player names or correct/wrong here.
  */

  if (answered < total) {
    return;
  }

});


/*
  5 SECOND REVEAL COUNTDOWN
*/

socket.on('revealCountdown', d => {

  clearInterval(timer);
  clearInterval(revealTimer);

  let seconds = Number(d.seconds) || 5;

  showGame();

  /*
    Keep the question and options hidden
    during suspense.
  */

  $('tvQ').textContent =
    'ANSWER REVEALING...';

  $('tvQNo').textContent =
    'GET READY!';

  $('tvOptions').innerHTML = `
    <div class="tvRevealCountdown">
      ${seconds}
    </div>
  `;

  revealTimer = setInterval(() => {

    seconds--;

    if (seconds > 0) {

      $('tvOptions').innerHTML = `
        <div class="tvRevealCountdown">
          ${seconds}
        </div>
      `;

      return;
    }

    clearInterval(revealTimer);

    $('tvOptions').innerHTML = `
      <div class="tvRevealCountdown">
        🎬
      </div>
    `;

  }, 1000);

});


/*
  FINAL ANSWER REVEAL

  Big answer + correct player names
*/

socket.on('answerReveal', d => {

  clearInterval(timer);
  clearInterval(revealTimer);

  const optionElements =
    document.querySelectorAll('.tvOptions div');

  /*
    Highlight correct option
  */

  optionElements.forEach((element, i) => {

    if (i === Number(d.correct)) {
      element.classList.add('tvCorrect');
    }

  });

  /*
    Correct player names
  */

  let correctNames = [];

  if (Array.isArray(d.correctPlayers)) {

    correctNames =
      d.correctPlayers.map(
        player => player.name
      );

  }

  /*
    Find correct answer text
  */

  const correctOption =
    d.correct !== undefined &&
    optionElements[d.correct]
      ? optionElements[d.correct].textContent
      : '';

  const answerText =
    correctOption
      .replace(/^[A-D]\.\s*/, '')
      .trim();

  /*
    Big answer reveal
  */

  $('tvQNo').textContent =
    'ANSWER';

  $('tvQ').innerHTML = `
    <div class="bigAnswer">
      ${escapeHtml(answerText)}
    </div>
  `;

  if (correctNames.length > 0) {

    $('tvOptions').innerHTML = `
      <div class="correctPlayers">
        🏆 ${correctNames
          .map(name => escapeHtml(name))
          .join(' • ')}
      </div>
    `;

  } else {

    $('tvOptions').innerHTML = `
      <div class="correctPlayers">
        ❌ NOBODY GOT IT!
      </div>
    `;

  }

});


/*
  GAME OVER
*/

socket.on('gameOver', s => {

  clearAllTimers();

  $('tvQuestion').classList.add('hidden');
  $('tvWaiting').classList.add('hidden');
  $('tvResult').classList.remove('hidden');

  const sorted =
    [...s.players].sort(
      (a, b) => b.score - a.score
    );

  const topScore =
    sorted[0]?.score || 0;

  const winners =
    sorted.filter(
      p => p.score === topScore
    );

  if (winners.length > 1) {

    $('tvWinner').textContent =
      'IT\'S A TIE!';

  } else {

    $('tvWinner').textContent =
      `${escapeHtml(winners[0].name)} WINS!`;

  }

  $('tvScores').innerHTML =
    sorted
      .map((p, i) => `
        <div>
          ${i === 0 ? '🏆 ' : ''}
          ${escapeHtml(p.name)}
          —
          <b>${p.score}/${s.total || 10}</b>
        </div>
      `)
      .join('');

});


/*
  TIMER
*/

function startTimer(end) {

  clearInterval(timer);

  const tick = () => {

    const left =
      Math.max(
        0,
        Math.ceil(
          (end - Date.now()) / 1000
        )
      );

    $('tvTimerText').textContent =
      left;

    $('tvTimerBar').style.width =
      `${(left / 90) * 100}%`;

    if (left <= 0) {

      clearInterval(timer);

      $('tvTimerText').textContent =
        '0';

      /*
        Server will now trigger
        the 5-second reveal countdown.
      */

    }

  };

  tick();

  timer =
    setInterval(tick, 250);
}


/*
  Safety
*/

socket.on('errorMsg', message => {

  $('tvWaiting').textContent =
    message;

  showWaiting();

});


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
