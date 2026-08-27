const socket = io();
let me = '', roomId = '', isHost = false, myId = '', timerInterval = null;
const $ = id => document.getElementById(id);
function show(id){ document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active')); $(id).classList.add('active'); }
function err(msg){ $('error').textContent = msg; }

$('create').onclick = () => {
  const name = $('name').value.trim();
  if (!name) return err('Mundhu nee name enter cheyyi 🙂');
  me = name; socket.emit('createRoom',{name});
};
$('join').onclick = () => {
  const name = $('name').value.trim(), code = $('room').value.trim().toUpperCase();
  if (!name) return err('Mundhu nee name enter cheyyi 🙂');
  if (code.length !== 4) return err('4-letter room code enter cheyyi.');
  me = name; socket.emit('joinRoom',{roomId:code,name});
};
$('start').onclick = () => socket.emit('startGame');
$('tv').onclick = () => { if(roomId) window.open(`/tv.html?room=${roomId}`,'_blank'); };
$('again').onclick = () => socket.emit('restart');
$('homeBtn').onclick = () => location.reload();

socket.on('roomCreated', d => { roomId=d.roomId; myId=d.playerId; isHost=true; enterLobby(); });
socket.on('joinedRoom', d => { roomId=d.roomId; myId=d.playerId; isHost=false; enterLobby(); });
function enterLobby(){ $('bigRoom').textContent=roomId; $('roomBadge').textContent=roomId; show('lobby'); }

socket.on('state', state => {
  if(state.roomId) roomId=state.roomId;
  if(state.hostId) isHost = state.hostId===myId;
  $('players').innerHTML=state.players.map((p,i)=>`<div class="player">${i===0?'👑 ':''}${escapeHtml(p.name)}</div>`).join('');
  $('start').disabled=!(isHost && state.players.length===2 && !state.started);
  $('wait').textContent=state.players.length===2?'Both players ready! Host can start 👇':'Waiting for Player 2…';
  const mine=state.players.find(p=>p.id===myId); if(mine) $('score').textContent=`${mine.score} pts`;
});

socket.on('question', q => {
  show('game'); $('progress').textContent=`${q.index+1} / ${q.total}`; $('question').textContent=q.q; $('answerStatus').textContent='';
  $('options').innerHTML=q.options.map((o,i)=>`<button class="option" data-i="${i}">${String.fromCharCode(65+i)}. ${escapeHtml(o)}</button>`).join('');
  document.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>choose(btn));
  startTimer(q.endsAt);
});
function choose(btn){
  document.querySelectorAll('.option').forEach(b=>b.disabled=true); btn.classList.add('selected');
  $('answerStatus').textContent='Answer locked 🔒 — waiting for your friend…'; socket.emit('answer',{choice:Number(btn.dataset.i)});
}
socket.on('answerState', d => $('answerStatus').textContent=`${d.answered}/${d.total} answered…`);
socket.on('answerReveal', d => {
  const selected=Object.prototype.hasOwnProperty.call(d.answers,myId)?Number(d.answers[myId]):null;
  document.querySelectorAll('.option').forEach((b,i)=>{ b.disabled=true; if(i===d.correct)b.classList.add('correct'); if(selected===i && i!==d.correct)b.classList.add('wrong'); });
  $('answerStatus').textContent=selected===d.correct?'Correct! 🎉':'Time/answer finished.';
});
socket.on('gameOver', state => { clearInterval(timerInterval); show('result'); const sorted=[...state.players].sort((a,b)=>b.score-a.score); $('winner').textContent=sorted[0].score===sorted[1].score?'🤝 IT\'S A TIE!':`🏆 ${escapeHtml(sorted[0].name)} WINS!`; $('finalPlayers').innerHTML=sorted.map((p,i)=>`<div class="final"><span>${i===0?'🏆 ':''}${escapeHtml(p.name)}</span><b>${p.score}/10</b></div>`).join(''); });
socket.on('errorMsg', msg => err(msg));
function startTimer(endsAt){ clearInterval(timerInterval); const tick=()=>{ const left=Math.max(0,Math.ceil((endsAt-Date.now())/1000)); $('timerText').textContent=left; if(left<=0){clearInterval(timerInterval); $('answerStatus').textContent='⏰ Time up!'; document.querySelectorAll('.option').forEach(b=>b.disabled=true);} }; tick(); timerInterval=setInterval(tick,250); }
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
