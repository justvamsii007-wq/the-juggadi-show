const socket=io();
const params=new URLSearchParams(location.search); const roomId=(params.get('room')||'').toUpperCase();
const $=id=>document.getElementById(id); let timer=null;
$('tvRoom').textContent=roomId||'ROOM';
if(roomId) socket.emit('joinTV',{roomId});
function showGame(){ $('tvWaiting').classList.add('hidden'); $('tvQuestion').classList.remove('hidden'); $('tvResult').classList.add('hidden'); }
socket.on('question',q=>{showGame(); $('tvProgress').textContent=`${q.index+1}/${q.total}`; $('tvQNo').textContent=`QUESTION ${q.index+1}`; $('tvQ').textContent=q.q; $('tvOptions').innerHTML=q.options.map((o,i)=>`<div>${String.fromCharCode(65+i)}. ${o}</div>`).join(''); startTimer(q.endsAt);});
socket.on('state',s=>{if(!s.started && s.index<0){$('tvWaiting').classList.remove('hidden');$('tvQuestion').classList.add('hidden');}});
socket.on('answerReveal',d=>{document.querySelectorAll('.tvOptions div').forEach((x,i)=>{if(i===d.correct)x.classList.add('tvCorrect');});});
socket.on('gameOver',s=>{clearInterval(timer); $('tvQuestion').classList.add('hidden'); $('tvWaiting').classList.add('hidden'); $('tvResult').classList.remove('hidden'); const sorted=[...s.players].sort((a,b)=>b.score-a.score); $('tvWinner').textContent=sorted[0].score===sorted[1].score?'IT\'S A TIE!':`${sorted[0].name} WINS!`; $('tvScores').innerHTML=sorted.map(p=>`<div>${p.name} — <b>${p.score}/10</b></div>`).join('');});
socket.on('errorMsg',m=>{$('tvWaiting').textContent=m;});
function startTimer(end){clearInterval(timer); const tick=()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000)); $('tvTimerText').textContent=left; $('tvTimerBar').style.width=(left/90*100)+'%'; if(left<=0)clearInterval(timer)}; tick(); timer=setInterval(tick,250);}
