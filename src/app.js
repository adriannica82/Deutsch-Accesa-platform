'use strict';
// Conținutul (temele și întrebările) vine din content/*.json, inclus de build.py în pagină.
const CONTENT=JSON.parse(document.getElementById('content').textContent);
// Repetare spațiată: cutia 0 = nou / greșit, apoi intervale în zile până la următoarea repetare.
const STEPS=[0,1,3,7,14,30],DAY=864e5,PKEY='deutsch-progress-v1',HKEY='deutsch-history-v1',OLD_PKEY='verben-prep-progress-v1';
const $=id=>document.getElementById(id), escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Compară răspunsurile fără diferențe de majuscule și acceptă ae/oe/ue/ss în loc de ä/ö/ü/ß.
const canon=s=>s.trim().toLowerCase().normalize('NFC').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[.,!?;:„“”"]/g,'').replace(/\s+/g,' ');
const fold=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss');
const shuffled=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const daysRo=n=>n===1?'1 zi':n<20?n+' zile':n+' de zile';
const countRo=(n,u)=>n===1?'1 '+u[0]:n<20?n+' '+u[1]:n+' de '+u[1];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

// ---------- Date ----------
// Temele se ordonează după nivel (A1 → A2 → B1 → B2); la același nivel contează câmpul "order".
const LEVELS={A1:1,A2:2,B1:3,B2:4,C1:5,C2:6},levelKey=l=>{const r=(String(l).match(/[ABC][12]/g)||[]).map(x=>LEVELS[x]);return r.length?[Math.min(...r),Math.max(...r)]:[99,99]};
const topics=CONTENT.topics.slice().sort((a,b)=>{const x=levelKey(a.level),y=levelKey(b.level);return x[0]-y[0]||x[1]-y[1]||a.order-b.order}),topicById=Object.create(null),byId=Object.create(null),allItems=[];
topics.forEach(t=>{topicById[t.id]=t;t.qs=t.items.map(it=>{const q={...it,alt:it.alt||[],group:it.group||'',gid:t.id+'/'+it.id,topic:t};byId[q.gid]=q;allItems.push(q);return q})});
const VIEWS=['login','register','home','topic','quiz','results','study','league','account','admin'];
let state={active:false},currentView='home',studyReturn='home',cur=null,builtFor='',studyTopic=null,progress=Object.create(null),history=[],storageOK=true;

// ---------- Progres salvat local ----------
function clean(o){const out=Object.create(null);if(o&&typeof o==='object')for(const k in o){const id=byId[k]?k:'verben-praepositionen/'+k,p=o[k];if(byId[id]&&p&&['box','due','seen','right','wrong'].every(f=>Number.isFinite(p[f])))out[id]={box:Math.max(0,Math.min(STEPS.length-1,Math.floor(p.box))),due:p.due,seen:p.seen,right:p.right,wrong:p.wrong,last:Number.isFinite(p.last)?p.last:0}}return out}
const cleanHistory=v=>Array.isArray(v)?v.filter(h=>h&&['t','pct','n','correct'].every(f=>Number.isFinite(h[f]))&&(h.topic==='mix'||topicById[h.topic])).map(h=>({t:h.t,topic:h.topic,pct:h.pct,n:h.n,correct:h.correct,sec:Number.isFinite(h.sec)&&h.sec>0?Math.round(h.sec):undefined})).slice(-40):[];
function loadProgress(){progress=Object.create(null);history=[];try{const raw=localStorage.getItem(PKEY+sfx()),old=CLOUD?null:localStorage.getItem(OLD_PKEY);progress=clean(JSON.parse(raw||old));history=cleanHistory(JSON.parse(localStorage.getItem(HKEY+sfx())));if(!raw&&old)save()}catch{storageOK=false}loadTime()}
function save(){try{localStorage.setItem(PKEY+sfx(),JSON.stringify(progress));localStorage.setItem(HKEY+sfx(),JSON.stringify(history))}catch{storageOK=false}$('storeWarn').hidden=storageOK}
function record(q,ok){const p=progress[q.gid]||{box:0,due:0,seen:0,right:0,wrong:0,last:0};p.seen++;if(ok){p.right++;p.box=Math.min(p.box+1,STEPS.length-1)}else{p.wrong++;p.box=0}p.last=Date.now();p.due=p.last+STEPS[p.box]*DAY;progress[q.gid]=p;if(auth)queueProgress(q.gid)}
const P=q=>progress[q.gid],isDue=q=>P(q)&&P(q).due<=Date.now();
const status=p=>!p?'new':p.box<=1?'learn':p.box<=3?'mid':'done';
const statusLabel={new:'Nou',learn:'În învățare',mid:'Consolidare',done:'Stăpânit'};
const nextText=p=>p.due<=Date.now()+1000?'la următoarea sesiune':'peste '+daysRo(Math.max(1,Math.round((p.due-Date.now())/DAY)));
const counts=qs=>{const c={new:0,learn:0,mid:0,done:0};qs.forEach(q=>c[status(P(q))]++);return c};
const bar=(c,n)=>'<div class="stack" role="img" aria-label="'+['learn','mid','done'].map(k=>statusLabel[k]+': '+c[k]).join(', ')+'">'+['done','mid','learn'].map(k=>'<i class="s-'+k+'" style="width:'+(c[k]/n*100)+'%"></i>').join('')+'</div>';
const statsHtml=qs=>{const c=counts(qs);return bar(c,qs.length)+'<div class="mstats">'+['new','learn','mid','done'].map(k=>'<div><b>'+c[k]+'</b><span>'+statusLabel[k]+'</span></div>').join('')+'</div>'};
const groupPill=g=>'<span class="pill '+(g==='Dativ'?'dat':g==='Akkusativ'?'akk':'')+'">'+escape(g)+'</span>';
const modeLabel=(t,m)=>m==='choice'?'Alege '+t.answerNoun:m==='write'?'Scrie '+t.answerNoun:'Scrie '+t.answerNoun+' + alege '+t.extra.label.toLowerCase();
const guideDetails=(t,open)=>t.guideHtml?'<details class="card prep-guide"'+(open?' open':'')+'><summary>'+escape(t.guideTitle)+'</summary>'+t.guideHtml+'</details>':'';

// ---------- Navigare ----------
function show(id){VIEWS.forEach(x=>$(x).hidden=x!==id);currentView=id;closeUserMenu();syncUserMenu();if(id==='home')renderHome();if(id==='topic')renderTopic();if(id==='league')renderLeague();if(id==='account')renderAccount();if(id!=='login')pushView(id);window.scrollTo(0,0)}
function renderHome(){
$('heroTopics').textContent=countRo(topics.length,['temă','teme']);$('heroItems').textContent=countRo(allItems.length,['întrebare','întrebări']);
$('progressStats').innerHTML=statsHtml(allItems);$('timeStats').innerHTML=timeHtml();$('storeWarn').hidden=storageOK;
const r=pickFrom(allItems,'smart',Number($('todayCount').value)),due=allItems.filter(isDue).length,fresh=allItems.filter(q=>!P(q)).length;
$('todayInfo').textContent=r.filled?'Nu mai ai nimic scadent; primești cele mai apropiate repetări.':due+' de repetat acum · '+fresh+' noi, din '+allItems.length+' întrebări în toate temele.';
const LEVEL_DESC={'A1–A2':'Începător','A2':'Elementar','A2–B1':'De la elementar spre intermediar','B1':'Intermediar'};
$('topicGrid').innerHTML=topics.map((t,i)=>{const c=counts(t.qs),due=t.qs.filter(isDue).length,same=topics.filter(x=>x.level===t.level),head=i&&topics[i-1].level===t.level?'':'<h2 class="levelhead"><span class="lv">'+escape(t.level)+'</span><span class="ld">'+escape(LEVEL_DESC[t.level]||'')+'</span><span class="ln">'+same.length+(same.length===1?' temă · ':' teme · ')+same.reduce((n,x)=>n+x.qs.length,0)+' întrebări</span></h2>';return head+'<button type="button" class="topic" data-topic="'+t.id+'"><div class="row"><span class="label">'+escape(t.level)+'</span><span class="pills"><span class="pill">'+countRo(t.qs.length,t.unit)+'</span>'+(auth&&t.xp>1?'<span class="pill xp">×'+fmtMult(t.xp)+' XP</span>':'')+'</span></div><h3>'+escape(t.title)+'</h3><div class="small muted" lang="de">'+escape(t.titleDe||'')+'</div><p class="small">'+escape(t.summary)+'</p>'+bar(c,t.qs.length)+'<div class="small muted">'+(due?due+' de repetat · ':'')+c.new+' noi · '+c.done+' stăpânite</div></button>'}).join('');
$('history').innerHTML=history.length?history.slice(-6).reverse().map(h=>'<li><span>'+new Date(h.t).toLocaleDateString('ro-RO')+' · '+escape(h.topic==='mix'?'Repetiția de azi':topicById[h.topic].title)+(h.sec?' · '+fmtShort(h.sec):'')+'</span><b>'+h.pct+'% · '+h.correct+'/'+h.n+'</b></li>').join(''):'<li class="muted">Încă nu ai finalizat o sesiune.</li>';renderLeagueCard();maybePrompt()}
function openTopic(id){
cur=topicById[id];$('tLevel').textContent='TEMĂ · '+cur.level;$('tTitle').textContent=cur.title;$('tSummary').textContent=cur.summary;
if(builtFor!==id){
$('mode').innerHTML=cur.modes.map(m=>'<option value="'+m+'">'+escape(modeLabel(cur,m))+'</option>').join('');$('modeField').hidden=cur.modes.length===1;
$('filterField').hidden=!cur.groups;$('filterLabel').textContent=cur.groupLabel||'Filtru';$('filter').innerHTML='<option value="all">Toate</option>'+(cur.groups||[]).map(g=>'<option>'+escape(g)+'</option>').join('');builtFor=id}
$('tGuide').innerHTML=guideDetails(cur,false);show('topic')}
function renderTopic(){
if(!cur)return;$('topicStats').innerHTML=statsHtml(cur.qs);
const h=history.filter(x=>x.topic===cur.id).pop();$('lastResult').textContent=h?new Date(h.t).toLocaleDateString('ro-RO')+' · '+h.pct+'% · '+h.correct+'/'+h.n+' corecte.':'Încă nu ai finalizat un test la această temă.';updateInfo()}

// ---------- Alegerea întrebărilor ----------
function pool(){return cur.qs.filter(q=>$('filter').value==='all'||q.group===$('filter').value)}
function pickFrom(base,sel,n,doShuffle){
const now=Date.now();if(!Number.isFinite(n))n=Infinity;
if(sel==='all'){const qs=doShuffle?shuffled(base):base;return{qs:qs.slice(0,n),filled:false}}
if(sel==='weak'){const qs=shuffled(base.filter(q=>P(q)&&P(q).wrong>0&&P(q).box<=2)).sort((a,b)=>P(a).box-P(b).box);return{qs:shuffled(qs.slice(0,n)),filled:false}}
const due=shuffled(base.filter(q=>P(q)&&P(q).due<=now)).sort((a,b)=>P(a).box-P(b).box),fresh=shuffled(base.filter(q=>!P(q))),core=due.length+fresh.length;
let qs=[...due,...fresh];
if(!core||(n!==Infinity&&core<n))qs=qs.concat(base.filter(q=>P(q)&&P(q).due>now).sort((a,b)=>P(a).due-P(b).due));
qs=qs.slice(0,n);return{qs:shuffled(qs),filled:qs.length>core}}
const countValue=()=>$('count').value==='all'?Infinity:Number($('count').value);
function updateInfo(){
if(!cur)return;const base=pool(),sel=$('selection').value,r=pickFrom(base,sel,countValue(),$('shuffle').checked),nDue=base.filter(isDue).length,nNew=base.filter(q=>!P(q)).length;
$('shuffle').disabled=sel!=='all';$('start').disabled=!r.qs.length;
let t=r.qs.length+' întrebări în sesiune din '+base.length+' disponibile. ';
if(sel==='smart')t+=r.filled?'Nu mai ai nimic scadent; primești cele mai apropiate repetări. ':nDue+' de repetat acum · '+nNew+' noi. ';
if(sel==='weak'&&!r.qs.length)t='Nu ai încă puncte slabe. Răspunde la câteva întrebări sau alege altă selecție.';
else t+='Fără repetări în aceeași sesiune.';
$('poolInfo').textContent=t}
['filter','count','selection','shuffle'].forEach(id=>$(id).addEventListener('change',updateInfo));
$('todayCount').addEventListener('change',renderHome);
// Variante greșite: mai întâi alte răspunsuri ale aceluiași verb, apoi forme ușor de confundat, apoi restul listei.
function optionsFor(q){
const t=q.topic;if(q.options)return shuffled(q.options);
const bad=new Set([q.answer,...q.alt].map(canon)),chosen=[],same=t.qs.filter(x=>x.key&&x.key===q.key&&x.answer!==q.answer).map(x=>x.answer);
for(const p of [...shuffled(same),...shuffled((t.confusable||{})[q.answer]||[]),...shuffled(t.pool||[])]){if(!bad.has(canon(p))&&!chosen.some(c=>canon(c)===canon(p)))chosen.push(p);if(chosen.length===3)break}
return shuffled([q.answer,...chosen])}
// Tipul exercițiului pentru o întrebare: într-o sesiune mixtă ("auto") fiecare temă folosește modul ei potrivit.
function modeFor(q){const ms=q.topic.modes,m=state.mode;return m==='auto'?(ms.includes('choice')?'choice':ms[0]):ms.includes(m)?m:m==='both'&&ms.includes('write')?'write':ms[0]}

// ---------- Sesiunea de test ----------
function begin(qs,cfg){if(!qs.length)return;state={active:true,qs,index:0,answers:[],opts:[],mode:cfg.mode,feedbackMode:cfg.feedbackMode,topic:cfg.topic,selected:'',selectedCase:'',locked:false,sid:uuid()};if(auth)enqueue({k:'s',row:{id:state.sid,topic:cfg.topic?cfg.topic.id:'mix',mode:cfg.mode,feedback_mode:cfg.feedbackMode,started_at:new Date().toISOString()}});startClock();show('quiz');renderQuestion();renderTimer()}
function renderQuestion(){
const q=state.qs[state.index],m=modeFor(q),t=q.topic,prev=state.answers[state.index],exam=state.feedbackMode==='exam',n=state.qs.length,done=state.answers.filter(Boolean);
state.locked=false;state.selected=prev&&!prev.skip&&m==='choice'?prev.raw:'';state.selectedCase=prev&&!prev.skip?prev.cas:'';
if(!state.opts[state.index])state.opts[state.index]=optionsFor(q);
window.scrollTo(0,0);$('qCounter').textContent='Întrebarea '+(state.index+1)+' / '+n;$('bar').style.width=(state.index/n*100)+'%';$('progress').setAttribute('aria-valuenow',Math.round(state.index/n*100));
$('sessionLabel').textContent=(state.topic?state.topic.title.toUpperCase()+' · ':'REPETIȚIA DE AZI · ')+(exam?'corectare la final':'feedback imediat');
const xc=$('xpChip');xc.hidden=!(auth&&t.xp>1);xc.textContent='×'+fmtMult(t.xp)+' XP';xc.title='Această temă aduce de '+fmtMult(t.xp)+' ori mai multe puncte XP';
$('runningScore').textContent=exam?done.length+' / '+n+' răspunsuri înregistrate':done.filter(a=>a.ok).length+' corecte / '+done.length+' răspunsuri';
$('qContent').innerHTML=(state.topic?'':'<span class="pill qtopic">'+escape(t.title)+'</span>')+'<p class="sentence" lang="de">'+escape(q.prompt).replace('___','<span class="blank">…</span>')+'</p>'+(q.hint?'<p class="small hint">'+escape(q.hint)+'</p>':'')+'<p class="muted">'+escape(q.ro)+'</p><p class="small muted">'+(m==='both'?'Completează răspunsul și alege '+escape(t.extra.label.toLowerCase())+'.':escape(t.instruction))+'</p>';
$('feedback').innerHTML='';$('validation').hidden=true;$('check').hidden=false;
$('check').textContent=exam?(state.index===n-1?'Înregistrează și finalizează':prev?'Actualizează răspunsul':'Înregistrează răspunsul'):'Verifică răspunsul';
$('next').hidden=true;$('skip').hidden=false;$('prev').hidden=!(exam&&state.index>0);
if(m==='choice'){$('answerArea').innerHTML='<div class="options'+(state.opts[state.index].some(o=>o.length>24)?' wide':'')+'">'+state.opts[state.index].map((p,i)=>'<button class="option'+(p===state.selected?' selected':'')+'" type="button" data-value="'+escape(p)+'" aria-pressed="'+(p===state.selected)+'"><span>'+(i+1)+'</span>'+escape(p)+'</button>').join('')+'</div>';$('answerArea').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(state.locked)return;state.selected=b.dataset.value;$('answerArea').querySelectorAll('button').forEach(x=>{const on=x===b;x.classList.toggle('selected',on);x.setAttribute('aria-pressed',String(on))});$('validation').hidden=true})}
else{$('answerArea').innerHTML='<div class="entry"><label class="small" for="answerInput">'+escape(cap(t.answerNoun))+'</label><input type="text" id="answerInput" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Scrie aici…" lang="de" value="'+(prev&&!prev.skip?escape(prev.raw):'')+'"><p class="small muted" style="margin-top:6px">Poți scrie ä, ö, ü, ß și ca „ae”, „oe”, „ue”, „ss” (ex.: „fuer”, „weiss”).</p></div>'+(m==='both'?'<div class="cases" role="group" aria-label="'+escape(t.extra.label)+'">'+t.extra.options.map(c=>'<button type="button" data-case="'+escape(c)+'" aria-pressed="'+(c===state.selectedCase)+'">'+escape(c)+'</button>').join('')+'</div>':'');$('answerInput').addEventListener('input',()=>{$('validation').hidden=true});$('answerArea').querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{if(state.locked)return;state.selectedCase=b.dataset.case;$('answerArea').querySelectorAll('[data-case]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('validation').hidden=true});$('answerInput').focus()}}
function evaluate(q,raw,cas,skip){
const m=modeFor(q),a=canon(raw),prepOK=!skip&&(a===canon(q.answer)||q.alt.some(x=>a===canon(x))),viaAlt=prepOK&&a!==canon(q.answer),caseOK=!skip&&(m!=='both'||cas===q.extra);
return{id:q.gid,mode:m,raw:skip?'':raw,cas:skip?'':cas,skip,prepOK,caseOK,viaAlt,ok:prepOK&&caseOK}}
function check(skip=false){
if(state.locked||!state.active)return;const q=state.qs[state.index],m=modeFor(q),exam=state.feedbackMode==='exam',raw=m==='choice'?state.selected:$('answerInput').value,prep=canon(raw);
if(!skip&&(!prep||(m==='both'&&!state.selectedCase))){$('validation').textContent=m==='both'?'Scrie răspunsul și alege '+q.topic.extra.label.toLowerCase()+'.':m==='choice'?'Alege o variantă înainte de verificare.':'Scrie răspunsul înainte de verificare.';$('validation').hidden=false;return}
const a=evaluate(q,raw,state.selectedCase,skip);state.answers[state.index]=a;
if(exam){advance();return}
state.locked=true;record(q,a.ok);save();if(auth)enqueue({k:'a',rows:[answerRow(a,state.index)]});
$('answerArea').querySelectorAll('input,button').forEach(x=>x.disabled=true);$('answerArea').querySelectorAll('[data-value]').forEach(b=>{b.classList.toggle('correct',b.dataset.value===q.answer);b.classList.toggle('incorrect',!a.ok&&canon(b.dataset.value)===prep&&prep!==canon(q.answer))});
const title=a.ok?'Corect!':skip?'De reținut':a.prepOK&&m==='both'?'Răspunsul este corect. Verifică '+q.topic.extra.label.toLowerCase()+'.':'Răspunsul corect';
$('feedback').innerHTML='<div class="feedback '+(a.ok?'':'wrong')+'"><strong>'+title+(q.label?' · <span lang="de">'+escape(q.label)+'</span>':'')+(q.extra?' + '+escape(q.extra):'')+'</strong>'+(q.gloss?'<p class="small">Sens: <b>'+escape(q.gloss)+'</b></p>':'')+'<p lang="de">'+escape(q.prompt).replace('___','<b>'+escape(q.answer)+'</b>')+'</p><p class="small muted">'+escape(q.ro)+'</p>'+(a.viaAlt?'<p class="small">Varianta ta, „<span lang="de">'+escape(prep)+'</span>”, este corectă și ea; forma standard în acest test este „<span lang="de">'+escape(q.answer)+'</span>”.</p>':'')+'<p class="small">'+escape(q.explain)+'</p><p class="small muted">Revezi '+nextText(progress[q.gid])+'.</p></div>';
$('check').hidden=true;$('skip').hidden=true;$('next').hidden=false;$('next').textContent=state.index===state.qs.length-1?'Vezi rezultatele →':'Următoarea →';$('next').focus({preventScroll:true});$('feedback').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function advance(){
const last=state.index>=state.qs.length-1;
if(state.feedbackMode==='exam'&&last){
const open=state.qs.map((_,i)=>i).filter(i=>!state.answers[i]);
if(open.length){if(!confirm('Mai ai '+open.length+(open.length===1?' întrebare fără răspuns':' întrebări fără răspuns')+'. Le punctezi cu zero și finalizezi testul?')){state.index=open[0];renderQuestion();return}open.forEach(i=>state.answers[i]=evaluate(state.qs[i],'','',true))}
finish();return}
if(!last){state.index++;renderQuestion()}else finish()}
function finish(){
state.active=false;
if(auth&&state.feedbackMode==='exam'){const rows=[];state.answers.forEach((a,i)=>rows.push(answerRow(a,i)));if(rows.length)enqueue({k:'a',rows})}
state.answers=state.answers.filter(Boolean);
if(state.feedbackMode==='exam'){state.answers.forEach(a=>record(byId[a.id],a.ok))}
const n=state.answers.length,correct=state.answers.filter(a=>a.ok).length,pct=n?Math.round(correct/n*100):0,t=state.topic;
const dur=stopClock();history.push({t:Date.now(),topic:t?t.id:'mix',pct,n,correct,sec:dur||undefined});history=history.slice(-40);save();if(auth)enqueue({k:'sf',id:state.sid,patch:{finished_at:new Date().toISOString(),n,correct,pct,duration_s:dur}});show('results');$('timeResult').innerHTML=timeResultHtml(dur,n);$('xpBlock').hidden=true;if(auth)showSessionXp(state.sid);
$('score').innerHTML=pct+'% <small>'+correct+' / '+n+' corecte</small>';
$('resultMessage').textContent=pct===100?'Excelent. Ai răspuns corect la toate întrebările acestei sesiuni.':pct>=80?'Foarte bine. Repetă construcțiile care încă te încurcă.':pct>=50?'Baza este acolo. Repetă greșelile și revino la fișa de recapitulare.':'Recapitulează lista, apoi încearcă din nou un test scurt.';
let breakdown='';const keyOf=a=>t?byId[a.id].group:byId[a.id].topic.title;
for(const k of [...new Set(state.answers.map(keyOf))].filter(Boolean)){const as=state.answers.filter(a=>keyOf(a)===k);breakdown+='<div><strong>'+as.filter(a=>a.ok).length+'/'+as.length+'</strong><span>'+escape(k)+'</span></div>'}
if(t&&state.mode==='both')breakdown+='<div><strong>'+state.answers.filter(a=>a.prepOK).length+'/'+n+'</strong><span>Răspunsuri corecte</span></div><div><strong>'+state.answers.filter(a=>a.caseOK).length+'/'+n+'</strong><span>'+escape(t.extra.label)+' corect</span></div>';
$('breakdown').innerHTML=breakdown;const errors=n-correct;$('retry').disabled=!errors;$('retry').textContent=errors?'Repetă '+errors+' '+(errors===1?'greșeală':'greșeli')+' →':'Nicio greșeală de repetat';
$('newTest').textContent=t?'Configurează alt test':'Înapoi la teme';$('resultStudy').hidden=!t;
$('resultNote').textContent=(t&&state.mode==='both'?'Un punct se acordă numai când răspunsul și '+t.extra.label.toLowerCase()+' sunt ambele corecte. „Nu știu” se punctează cu zero.':'Un răspuns corect valorează un punct. „Nu știu” se punctează cu zero.')+' Fiecare răspuns a actualizat programul de repetare al întrebării respective.';
$('reviewTitle').textContent='Corectarea celor '+n+' răspunsuri';
$('reviewList').innerHTML=state.answers.map((a,i)=>{const q=byId[a.id],p=progress[q.gid],both=a.mode==='both';return '<div class="review"><div class="row"><b class="'+(a.ok?'good':'bad')+'">'+(i+1)+'. '+(a.ok?'Corect':a.skip?'Nu ai știut':'De repetat')+'</b><span>'+(t?'':'<span class="pill">'+escape(q.topic.title)+'</span> ')+(q.group?groupPill(q.group):'')+'</span></div><p lang="de">'+escape(q.prompt).replace('___','<b>'+escape(q.answer)+'</b>')+'</p><p class="small muted">'+escape(q.ro)+'</p><p class="small">Răspunsul tău: <b>'+escape(a.skip?'Nu știu':a.raw+(both?' + '+a.cas:''))+'</b>'+(a.viaAlt?' (variantă acceptată)':'')+' · Corect: <b>'+escape(q.answer+(both?' + '+q.extra:''))+'</b></p><p class="small">'+(q.label?'<b lang="de">'+escape(q.label)+'</b>'+(q.gloss?' = '+escape(q.gloss):'')+' — ':'')+escape(q.explain)+'</p>'+(p?'<p class="small muted">Revezi '+nextText(p)+'.</p>':'')+'</div>'}).join('')}

// ---------- Fișa de recapitulare ----------
function renderStudy(){
const t=studyTopic,query=fold($('search').value.trim()),g=$('studyFilter').value,qs=t.qs.filter(q=>(g==='all'||q.group===g)&&[q.label||'',q.answer,q.gloss||'',q.hint||'',q.ro,q.prompt].some(s=>fold(s).includes(query)));
$('studyCount').textContent=countRo(qs.length,t.unit)+' afișate';
$('verbTable').innerHTML=qs.length?qs.map(q=>{const p=P(q),st=status(p),sense=q.sense||q.gloss||q.hint||q.ro;return '<tr><td data-label="Element"><b lang="de">'+escape(q.label||q.answer)+'</b>'+(q.group?'<br>'+groupPill(q.group):'')+'</td><td data-label="Sens"><b>'+escape(sense)+'</b></td><td data-label="Exemplu"><span lang="de">'+escape(q.prompt).replace('___','<b>'+escape(q.answer)+'</b>')+'</span>'+(sense!==q.ro?'<br><span class="small muted">'+escape(q.ro)+'</span>':'')+'</td><td data-label="Progres"><span class="pill p-'+st+'">'+statusLabel[st]+'</span>'+(p?'<br><span class="small muted">'+p.right+'/'+p.seen+' corecte · revezi '+nextText(p)+'</span>':'')+'</td></tr>'}).join(''):'<tr><td colspan="4">Niciun rezultat. Încearcă alt cuvânt sau sens.</td></tr>'}
function openStudy(t){
studyReturn=currentView;studyTopic=t;$('studyTitle').textContent=t.title;
$('studyIntro').textContent='Toate cele '+t.qs.length+(t.qs.length<20?' ':' de ')+t.unit[1]+' din temă'+(t.groups?': '+t.groups.map(g=>g+': '+t.qs.filter(q=>q.group===g).length).join(' · '):'')+'.';
$('studyGuide').innerHTML=guideDetails(t,true);$('studyFilterField').hidden=!t.groups;$('studyFilterLabel').textContent=t.groupLabel||'Filtrează';
$('studyFilter').innerHTML='<option value="all">Toate</option>'+(t.groups||[]).map(g=>'<option>'+escape(g)+'</option>').join('');$('search').value='';renderStudy();show('study')}

// ---------- Export / import ----------
const mdCell=s=>String(s).replace(/\|/g,'\\|').replace(/\n/g,' ');
// Raport Markdown, ușor de citit; la sfârșit conține datele complete, pe care le citește butonul „Importă”.
function exportMarkdown(){
const now=new Date(),c=counts(allItems),L=[];
L.push('# Progres Deutsch','','Exportat: '+now.toLocaleString('ro-RO')+(auth?' · cont: '+auth.user.email:' · salvat local în browser'),'');
L.push('## Rezumat','','- Întrebări: **'+allItems.length+'** în '+topics.length+' teme','- Noi: '+c.new+' · În învățare: '+c.learn+' · Consolidare: '+c.mid+' · Stăpânit: '+c.done,'- De repetat acum: '+allItems.filter(isDue).length,'');
L.push('## Pe teme','','| Temă | Nivel | Noi | În învățare | Consolidare | Stăpânit | De repetat |','|---|---|---|---|---|---|---|');
topics.forEach(t=>{const k=counts(t.qs);L.push('| '+mdCell(t.title)+' | '+t.level+' | '+k.new+' | '+k.learn+' | '+k.mid+' | '+k.done+' | '+t.qs.filter(isDue).length+' |')});
{const s=timeStats();L.push('','## Timp de exersare','','- Azi: **'+fmtShort(s.today)+'**','- Săptămâna aceasta: **'+fmtShort(s.week)+'**','- Săptămâna trecută: '+fmtShort(s.lastWeek),'','| '+DAYSFULL.map(d=>d.slice(0,2)).join(' | ')+' |','|'+'---|'.repeat(7),'| '+s.days.map(fmtShort).join(' | ')+' |','','Zilele sunt cele din săptămâna aceasta (luni–duminică); se numără doar timpul activ din teste.')}
L.push('','## Sesiuni recente','');
if(history.length){L.push('| Data | Sesiune | Scor | Durată |','|---|---|---|---|');history.slice().reverse().forEach(h=>L.push('| '+new Date(h.t).toLocaleDateString('ro-RO')+' | '+mdCell(h.topic==='mix'?'Repetiția de azi':topicById[h.topic].title)+' | '+h.pct+'% · '+h.correct+'/'+h.n+' | '+(h.sec?fmtDur(h.sec):'–')+' |'))}else L.push('Încă nu ai finalizat o sesiune.');
const weak=allItems.filter(q=>P(q)&&P(q).wrong>0&&P(q).box<=2).sort((a,b)=>P(b).wrong-P(a).wrong||P(a).box-P(b).box).slice(0,50);
L.push('','## Puncte slabe','');
if(weak.length){L.push('| Întrebare | Temă | Corecte / văzute | Revezi |','|---|---|---|---|');weak.forEach(q=>L.push('| '+mdCell(q.label||q.answer)+' | '+mdCell(q.topic.title)+' | '+P(q).right+'/'+P(q).seen+' | '+nextText(P(q))+' |'))}else L.push('Nu ai încă puncte slabe.');
L.push('','## Date pentru import','','Nu modifica blocul de mai jos: îl citește butonul „Importă” din aplicație.','','```json',JSON.stringify({version:3,progress,history,time:timeArray()}),'```','');
return L.join('\n')}
// Importul acceptă fișierul .md exportat de aplicație și, pentru compatibilitate, vechiul .json.
function parseImport(txt){const t=txt.trim();if(t.startsWith('{'))return JSON.parse(t);const m=t.match(/```json\s*([\s\S]*?)```/);if(!m)throw new Error('format');return JSON.parse(m[1])}

// ---------- Timp de exersare ----------
// Se numără doar timpul activ din teste: se oprește după 90 s fără nicio acțiune și cât timp fila nu este vizibilă.
// Fiecare sesiune are propria înregistrare (id, început, secunde); „azi” și „săptămâna aceasta” se calculează din ele.
const TKEY='deutsch-time-v1',TWINDOW=120*DAY,IDLE=90000,DAYS=['Lu','Ma','Mi','Jo','Vi','Sâ','Du'],DAYSFULL=['luni','marți','miercuri','joi','vineri','sâmbătă','duminică'];
let timeLog=Object.create(null),clock=null,lastTick=Date.now(),lastInput=Date.now(),lastSaveT=0,timeDirty=false,timerHidden=false;
try{timerHidden=localStorage.getItem('deutsch-timer-hidden')==='1'}catch{}
const cleanTime=v=>Array.isArray(v)?v.filter(e=>e&&typeof e.id==='string'&&Number.isFinite(e.t)&&Number.isFinite(e.sec)&&e.sec>=0&&e.t>=Date.now()-TWINDOW).map(e=>({id:e.id,t:e.t,sec:Math.round(e.sec)})):[];
const timeArray=()=>Object.keys(timeLog).map(id=>({id,t:timeLog[id].t,sec:timeLog[id].sec}));
function mergeTime(list){for(const e of list){const c=timeLog[e.id];if(!c)timeLog[e.id]={t:e.t,sec:e.sec};else if(e.sec>c.sec)c.sec=e.sec}}
function loadTime(){timeLog=Object.create(null);try{mergeTime(cleanTime(JSON.parse(localStorage.getItem(TKEY+sfx()))))}catch{}}
function saveTime(){for(const id in timeLog)if(timeLog[id].t<Date.now()-TWINDOW)delete timeLog[id];try{localStorage.setItem(TKEY+sfx(),JSON.stringify(timeArray()))}catch{}}
const fmtClock=s=>{s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),p=n=>String(n).padStart(2,'0');return h?h+':'+p(m)+':'+p(s%60):p(m)+':'+p(s%60)};
const fmtDur=s=>{s=Math.round(s);if(s<60)return s+' s';const m=Math.floor(s/60);if(m<60)return m+' min'+(s%60?' '+s%60+' s':'');return Math.floor(m/60)+' h'+(m%60?' '+m%60+' min':'')};
const fmtShort=s=>{if(s<=0)return '0 min';if(s<60)return '<1 min';const m=Math.round(s/60);return m<60?m+' min':Math.floor(m/60)+' h'+(m%60?' '+String(m%60).padStart(2,'0')+' min':'')};
const activeNow=()=>currentView==='quiz'&&state.active&&!document.hidden&&Date.now()-lastInput<IDLE;
function startClock(){const now=Date.now();clock={sid:state.sid,start:now,sec:0,sent:0};lastTick=lastInput=now;timeLog[clock.sid]={t:now,sec:0};timeDirty=true}
function stopClock(){if(!clock)return 0;const d=Math.round(clock.sec);timeLog[clock.sid]={t:clock.start,sec:d};saveTime();if(auth&&outbox.d)delete outbox.d[clock.sid];clock=null;timeDirty=false;return d}
function renderTimer(){const b=$('timer');if(!clock)return;const paused=!activeNow();b.textContent=timerHidden?'⏱ ··:··':(paused?'⏸ ':'⏱ ')+fmtClock(clock.sec);b.setAttribute('aria-pressed',String(timerHidden));b.title=(timerHidden?'Arată cronometrul':'Ascunde cronometrul')+(paused&&!timerHidden?' · în pauză: nicio acțiune de peste 90 s sau fila nu este activă':'')}
function tick(){
const now=Date.now(),dt=Math.min(now-lastTick,3000)/1000;lastTick=now;if(!clock)return;
if(activeNow()){clock.sec+=dt;timeLog[clock.sid]={t:clock.start,sec:Math.round(clock.sec)};timeDirty=true}
if(timeDirty&&now-lastSaveT>5000){saveTime();lastSaveT=now;timeDirty=false}
if(auth&&Math.floor(clock.sec)-clock.sent>=15){clock.sent=Math.floor(clock.sec);outbox.d[clock.sid]=clock.sent;saveOutbox();flush()}
if(currentView==='quiz')renderTimer()}
setInterval(tick,1000);
['pointerdown','pointermove','keydown','touchstart','wheel','scroll'].forEach(e=>addEventListener(e,()=>{lastInput=Date.now()},{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{lastTick=Date.now();if(!document.hidden)lastInput=Date.now()});
// Săptămâna începe luni; o sesiune se numără în ziua în care a început.
function timeStats(){
const n=new Date(),Y=n.getFullYear(),M=n.getMonth(),D=n.getDate(),dow=(n.getDay()+6)%7,today=new Date(Y,M,D).getTime(),week=new Date(Y,M,D-dow).getTime(),prev=new Date(Y,M,D-dow-7).getTime(),days=Array(7).fill(0);let t=0,w=0,lw=0;
for(const id in timeLog){const e=timeLog[id];if(e.t>=today)t+=e.sec;if(e.t>=week){w+=e.sec;const d=new Date(e.t);days[Math.max(0,Math.min(6,Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()-week)/DAY)))]+=e.sec}else if(e.t>=prev)lw+=e.sec}
return{today:t,week:w,lastWeek:lw,days,dow}}
function timeHtml(){
const s=timeStats(),max=Math.max(60,...s.days);
return '<div class="mstats"><div><b>'+fmtShort(s.today)+'</b><span>Azi</span></div><div><b>'+fmtShort(s.week)+'</b><span>Săptămâna aceasta</span></div></div><div class="week" role="img" aria-label="Timp de exersare pe zile: '+s.days.map((v,i)=>DAYS[i]+' '+fmtShort(v)).join(', ')+'">'+s.days.map((v,i)=>'<div class="d'+(i===s.dow?' today':i>s.dow?' future':'')+'" title="'+DAYSFULL[i]+': '+fmtShort(v)+'"><div class="col"><i class="bar" style="height:'+(v>0?Math.max(8,Math.round(v/max*100)):0)+'%"></i></div><span>'+DAYS[i]+'</span></div>').join('')+'</div><p class="small muted" style="margin-top:10px">Săptămâna trecută: '+fmtShort(s.lastWeek)+'. Se numără doar timpul activ din teste.</p>'}
const timeResultHtml=(dur,n)=>{const s=timeStats();return '<div><strong>'+fmtDur(dur)+'</strong><span>Durata sesiunii</span></div><div><strong>'+(n?fmtDur(dur/n):'–')+'</strong><span>Medie pe întrebare</span></div><div><strong>'+fmtShort(s.today)+'</strong><span>Azi</span></div><div><strong>'+fmtShort(s.week)+'</strong><span>Săptămâna aceasta</span></div>'};
$('timer').onclick=()=>{timerHidden=!timerHidden;try{localStorage.setItem('deutsch-timer-hidden',timerHidden?'1':'0')}catch{}renderTimer()};

// ---------- Evenimente ----------
$('start').onclick=()=>begin(pickFrom(pool(),$('selection').value,countValue(),$('shuffle').checked).qs,{mode:$('mode').value,feedbackMode:$('feedbackMode').value,topic:cur});
$('todayStart').onclick=()=>begin(pickFrom(allItems,'smart',Number($('todayCount').value)).qs,{mode:'auto',feedbackMode:'practice',topic:null});
$('retry').onclick=()=>begin(shuffled(state.answers.filter(a=>!a.ok).map(a=>byId[a.id])),{mode:state.mode,feedbackMode:'practice',topic:state.topic});
$('check').onclick=()=>check();$('skip').onclick=()=>check(true);$('next').onclick=advance;
$('prev').onclick=()=>{if(state.active&&state.index>0){state.index--;renderQuestion()}};
$('quit').onclick=()=>{if(!confirm('Închei sesiunea acum? Vei vedea scorul pentru întrebările la care ai răspuns.'))return;endSession()};
$('newTest').onclick=()=>show(state.topic?'topic':'home');$('topicBack').onclick=$('resultsHome').onclick=()=>show('home');
$('resultStudy').onclick=()=>openStudy(state.topic);$('topicStudy').onclick=()=>openStudy(cur);$('studyBack').onclick=()=>show(studyReturn);
$('search').oninput=renderStudy;$('studyFilter').onchange=renderStudy;
$('topicGrid').onclick=e=>{const b=e.target.closest('[data-topic]');if(b)openTopic(b.dataset.topic)};
$('exportP').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([exportMarkdown()],{type:'text/markdown;charset=utf-8'}));a.download='progres-deutsch-'+new Date().toISOString().slice(0,10)+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('importP').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;f.text().then(txt=>{const j=parseImport(txt),incoming=clean(j.progress),n=Object.keys(incoming).length;if(!n){alert('Fișierul nu conține progres valid pentru aceste teme.');return}if(!confirm(auth?'Combini progresul din fișier ('+n+' întrebări) cu cel din cont? Se păstrează varianta cea mai recentă pentru fiecare întrebare.':'Înlocuiești progresul actual cu cel din fișier ('+n+' întrebări)?'))return;if(auth){for(const g in incoming){const p=progress[g];if(!p||incoming[g].last>p.last){progress[g]=incoming[g];queueProgress(g)}}}else{progress=incoming;history=cleanHistory(j.history)}mergeTime(cleanTime(j.time));saveTime();save();renderHome()}).catch(()=>alert('Fișierul nu a putut fi citit. Alege un fișier exportat din această pagină.'))};
$('resetP').onclick=()=>{if(!confirm(auth?'Ștergi tot progresul de repetare din cont? Istoricul sesiunilor rămâne înregistrat. Acțiunea nu poate fi anulată.':'Ștergi tot progresul salvat în acest browser? Acțiunea nu poate fi anulată.'))return;progress=Object.create(null);if(auth){outbox.p=[];enqueue({k:'dp'})}else{history=[];timeLog=Object.create(null);saveTime()}save();renderHome()};
document.addEventListener('keydown',e=>{
if(currentView!=='quiz'||e.repeat)return;
if(e.key==='Enter'){const t=e.target;if(t.tagName==='BUTTON'&&!t.matches('.option,[data-case]'))return;e.preventDefault();if(state.locked)advance();else check()}
if(!state.locked&&state.active&&modeFor(state.qs[state.index])==='choice'&&/^[1-4]$/.test(e.key)){e.preventDefault();$('answerArea').querySelectorAll('.option')[Number(e.key)-1]?.click()}});

// ---------- Cont și sincronizare (Supabase) ----------
// Dacă la build nu există config.json, aplicația rămâne locală (fără cont) și nu face nicio cerere de rețea.
const CFG=(()=>{try{return JSON.parse(document.getElementById('config').textContent)}catch{return null}})();
const CLOUD=!!(CFG&&CFG.url&&CFG.key),AKEY='deutsch-auth-v1',OKEY='deutsch-outbox-v1';
let auth=null,outbox={q:[],p:[],d:{}},flushing=false,lastFlushFailed=false;
const sfx=()=>auth?':'+auth.user.id:'';
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]&15;return(c==='x'?r:(r&3|8)).toString(16)});
const answerRow=(a,i)=>({id:uuid(),session_id:state.sid,position:i+1,item_id:a.id,mode:a.mode,given:a.raw,given_extra:a.cas||'',correct:a.ok,skipped:a.skip,answered_at:new Date().toISOString()});
const rowOf=g=>{const p=progress[g];return{item_id:g,box:p.box,due:p.due,seen:p.seen,right_count:p.right,wrong_count:p.wrong,last:p.last}};
function setAuth(j){auth={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Date.now()+Math.max(60,j.expires_in-60)*1000,user:{id:j.user.id,email:j.user.email}};try{localStorage.setItem(AKEY,JSON.stringify(auth))}catch{}}
async function authCall(grant,body){
let r;try{r=await fetch(CFG.url+'/auth/v1/token?grant_type='+grant,{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch{throw new Error('net')}
const j=await r.json().catch(()=>({}));
if(r.ok&&j.access_token&&j.user){setAuth(j);return}
throw new Error(r.status>=500||r.status===429?'net':'bad')}
const refreshSession=()=>authCall('refresh_token',{refresh_token:auth.refresh_token}).then(()=>true,e=>{if(e.message==='bad')dropSession();return false});
function dropSession(){standings=null;xpSummary=null;profile=null;profileFresh=false;pendingPrompt=false;auth=null;progress=Object.create(null);history=[];timeLog=Object.create(null);clock=null;outbox={q:[],p:[],d:{}};state={active:false};try{localStorage.removeItem(AKEY)}catch{}showLogin()}
async function api(path,opt={}){
if(auth.expires_at<Date.now()&&!await refreshSession())throw new Error('auth');
const go=()=>fetch(CFG.url+path,{method:opt.method||'GET',headers:{apikey:CFG.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json',...(opt.headers||{})},body:opt.body===undefined?undefined:JSON.stringify(opt.body)});
let r=await go();
if(r.status===401&&await refreshSession())r=await go();
return r}
// Coada de trimitere: ce nu ajunge pe server (offline, eroare) rămâne salvat local și se retrimite.
const saveOutbox=()=>{try{localStorage.setItem(OKEY+sfx(),JSON.stringify(outbox))}catch{}};
function loadOutbox(){try{const o=JSON.parse(localStorage.getItem(OKEY+sfx()));outbox={q:Array.isArray(o&&o.q)?o.q:[],p:Array.isArray(o&&o.p)?o.p:[],d:o&&o.d&&typeof o.d==='object'&&!Array.isArray(o.d)?o.d:{}}}catch{outbox={q:[],p:[],d:{}}}}
function enqueue(op){outbox.q.push(op);saveOutbox();flush()}
function queueProgress(g){if(!outbox.p.includes(g))outbox.p.push(g);saveOutbox();flush()}
function setSync(){if(!auth)return;const n=outbox.q.length+outbox.p.length+Object.keys(outbox.d).length,st=!navigator.onLine?'offline':n?'pending':'ok';$('syncState').textContent=st==='offline'?'Offline':st==='pending'?n+' de trimis':'Sincronizat';$('userChip').dataset.sync=st}
async function send(path,method,body,prefer){const r=await api(path,{method,body,headers:{Prefer:[prefer,'return=minimal'].filter(Boolean).join(',')}});return r.ok?'ok':(r.status>=500||r.status===429||r.status===401||r.status===408)?'retry':(console.warn('Sincronizare respinsă',r.status,path),'drop')}
function sendOp(op){
if(op.k==='s')return send('/rest/v1/sessions?on_conflict=id','POST',[op.row],'resolution=ignore-duplicates');
if(op.k==='sf')return send('/rest/v1/sessions?id=eq.'+encodeURIComponent(op.id),'PATCH',op.patch,'');
if(op.k==='a')return send('/rest/v1/answers?on_conflict=id','POST',op.rows,'resolution=ignore-duplicates');
if(op.k==='dp')return send('/rest/v1/progress?item_id=not.is.null','DELETE',undefined,'');
if(op.k==='pf')return send('/rest/v1/profiles?on_conflict=user_id','POST',[op.patch],'resolution=merge-duplicates');
return 'drop'}
async function flush(){
if(!auth||flushing)return;flushing=true;
try{for(let guard=0;guard<500;guard++){
if(outbox.q.length){if(await sendOp(outbox.q[0])==='retry')break;outbox.q.shift();saveOutbox();continue}
if(outbox.p.length){const gids=outbox.p.slice(0,200),rows=gids.filter(g=>progress[g]).map(rowOf);if(rows.length&&await send('/rest/v1/progress?on_conflict=user_id,item_id','POST',rows,'resolution=merge-duplicates')==='retry')break;outbox.p=outbox.p.filter(g=>!gids.includes(g));saveOutbox();continue}
const sids=Object.keys(outbox.d);if(sids.length){const sid=sids[0],v=outbox.d[sid];if(await send('/rest/v1/sessions?id=eq.'+encodeURIComponent(sid),'PATCH',{duration_s:v},'')==='retry')break;if(outbox.d[sid]===v)delete outbox.d[sid];saveOutbox();continue}
break}}catch{}
lastFlushFailed=outbox.q.length>0;flushing=false;setSync()}
// La autentificare: trimite ce e în așteptare, apoi combină progresul din cont cu cel local (câștigă cel mai recent).
async function sync(){
try{
await flush();
if(!outbox.q.some(o=>o.k==='pf')){const pr=await api('/rest/v1/profiles?select=display_name,avatar,league_registered,league_prompt_skip,league_prompted_at,registered_at,league_recap_seen_week,role,first_name,last_name&limit=1');if(pr.ok){profile=(await pr.json())[0]||{};profileFresh=true;try{localStorage.setItem(PROFKEY+sfx(),JSON.stringify(profile))}catch{}renderLeagueCard();syncUserMenu();maybePrompt()}}
refreshLeague();
const r=await api('/rest/v1/progress?select=item_id,box,due,seen,right_count,wrong_count,last&limit=1000');
if(r.ok){const remote=Object.create(null),rows=await r.json();
for(const x of rows)remote[x.item_id]={box:x.box,due:Number(x.due),seen:x.seen,right:x.right_count,wrong:x.wrong_count,last:Number(x.last)};
const inc=clean(remote);
for(const g in inc){const p=progress[g];if(!p||inc[g].last>p.last)progress[g]=inc[g];else if(p.last>inc[g].last)queueProgress(g)}
for(const g in progress)if(!remote[g])queueProgress(g)}
if(!outbox.q.length){const s=await api('/rest/v1/sessions?select=topic,started_at,n,correct,pct,duration_s&finished_at=not.is.null&order=started_at.desc&limit=40');
if(s.ok)history=cleanHistory((await s.json()).map(x=>({t:Date.parse(x.started_at),topic:x.topic,pct:x.pct,n:x.n,correct:x.correct,sec:x.duration_s})).reverse())}
const tr=await api('/rest/v1/sessions?select=id,started_at,duration_s&duration_s=not.is.null&started_at=gte.'+encodeURIComponent(new Date(Date.now()-TWINDOW).toISOString())+'&order=started_at.desc&limit=1000');
if(tr.ok)mergeTime(cleanTime((await tr.json()).map(x=>({id:x.id,t:Date.parse(x.started_at),sec:x.duration_s}))));
save();saveTime();if(currentView==='home')renderHome();if(currentView==='topic')renderTopic()}catch{}
setSync()}
function showLogin(){$('userMenu').hidden=true;$('loginError').hidden=true;show('login')}
async function afterLogin(){
loadProgress();loadOutbox();loadProfile();
$('storeNote').textContent='Conectat ca '+auth.user.email+'. Progresul și sesiunile tale se salvează în contul tău și se sincronizează între dispozitive. Exportă-l dacă vrei o copie.';
$('footNote').textContent='Exemple adaptate pentru test · Date salvate în contul personal.';
show('home');setSync();sync()}
if(CLOUD){
$('footNote').textContent='Exemple adaptate pentru test · Date salvate în contul personal.';
$('loginForm').onsubmit=async e=>{e.preventDefault();const b=$('loginBtn');b.disabled=true;$('loginError').hidden=true;
try{await authCall('password',{email:$('email').value.trim(),password:$('password').value});$('password').value='';pendingPrompt=true;await afterLogin()}
catch(err){$('password').value='';$('loginError').textContent=err.message==='bad'?'Email sau parolă incorecte.':'Nu m-am putut conecta la server. Verifică conexiunea și încearcă din nou.';$('loginError').hidden=false}
b.disabled=false};
$('miLogout').onclick=async()=>{closeUserMenu();await flush();try{await api('/auth/v1/logout',{method:'POST'})}catch{}dropSession()};
addEventListener('online',()=>{if(auth){flush().then(sync)}else setSync()});addEventListener('offline',setSync);
setInterval(()=>{if(auth)flush()},30000)}

// ---------- Liga: clasament ----------
// Clasamentul vine de la server (funcția league_standings): doar numele, avatarul și XP-ul celor înscriși, niciodată răspunsurile.
let standings=null,standingsErr=false;
// Treptele ligii (WL-27): cine se înscrie începe în prima; promovările și retrogradările se fac luni dimineața, la închiderea săptămânii.
const TIERS=[['A1 Anfänger','🌱'],['A2 Entdecker','🧭'],['B1 Profi','🏅'],['B2 Meister','👑']];
const tierName=n=>TIERS[n-1]?TIERS[n-1][1]+' '+TIERS[n-1][0]:'';
const tierPill=n=>TIERS[n-1]?'<span class="pill tier">'+escape(tierName(n))+'</span>':'';
const tierLine=()=>standings&&standings.tier?'<p style="margin:6px 0 0">'+tierPill(standings.tier)+'</p>':'';
const weekRange=ws=>{const a=new Date(ws+'T00:00:00'),b=new Date(a.getFullYear(),a.getMonth(),a.getDate()+6),f=d=>d.toLocaleDateString('ro-RO',{day:'numeric',month:'short'});return f(a)+' – '+f(b)};
const outcomeLabel=h=>h.outcome==='promoted'?'▲ promovat în '+tierName(h.new_tier):h.outcome==='demoted'?'▼ coborât în '+tierName(h.new_tier):h.outcome==='inactive'?'– sub 50 XP':'= ai rămas';
// Rezumatul de luni (WL-36…WL-38): un card pe pagina principală, o singură dată pe săptămână, cu ton încurajator.
function recapParts(rc){
const cmp=rc.prev_xp>0?' ('+(rc.xp>=rc.prev_xp?'+':'')+Math.round((rc.xp-rc.prev_xp)/rc.prev_xp*100)+'% față de săptămâna dinainte)':'',place='locul '+rc.place+' din '+rc.size+' în '+tierName(rc.tier),xp=rc.xp+' XP'+cmp;
if(rc.outcome==='inactive')return['Săptămâna trecută a fost liniștită','Ai avut '+rc.xp+' XP, sub pragul de 50 XP pentru clasament. Nu pierzi nimic: liga te așteaptă oricând.'];
if(rc.outcome==='promoted')return['🎉 Ai fost promovat în '+tierName(rc.new_tier)+'!',place+' · '+xp+'.'];
if(rc.outcome==='demoted')return['Treapta '+tierName(rc.new_tier)+': un nou început','Săptămâna trecută ai fost pe '+place+'. O săptămână bună te readuce sus; pornești de la '+rc.xp+' XP strânși deja.'];
if(rc.size<4)return['Rezumatul săptămânii','Grupa ta este încă mică, deci nu s-a mutat nimeni. '+xp+(rc.prev_xp>0?'':' (prima ta săptămână)')+'.'];
return[rc.first_week?'Prima ta săptămână în ligă':'Ai rămas în '+tierName(rc.tier),place+' · '+xp+'.']}
function renderRecap(){
const c=$('recapCard');if(!c)return;
const rc=auth&&standings&&standings.registered?standings.recap:null,seen=profile&&profile.league_recap_seen_week;
if(!rc||(seen&&seen>=rc.week_start)){c.hidden=true;return}
const [t,b]=recapParts(rc);c.hidden=false;
c.innerHTML='<div class="label">REZUMATUL SĂPTĂMÂNII · '+escape(weekRange(rc.week_start).toUpperCase())+'</div><h2 style="margin-top:12px">'+escape(t)+'</h2><p class="muted">'+escape(b)+'</p><div class="tools" style="margin-top:0"><button type="button" class="primary back" data-league="open">Vezi clasamentul</button><button type="button" class="quiet back" data-recap="close">Închide</button></div>'}
function renderHistory(){
const h=standings&&standings.registered&&standings.history?standings.history:[],card=$('leagueHistoryCard');
card.hidden=!h.length;
$('leagueHistory').innerHTML=h.map(x=>'<li><span class="hw">'+escape(weekRange(x.week_start))+'</span><span class="hp">'+escape(tierName(x.tier))+' · locul '+x.place+' din '+x.size+'</span><b class="hx">'+x.xp+' XP</b><span class="ho '+({promoted:'up',demoted:'down'}[x.outcome]||'same')+'">'+escape(outcomeLabel(x))+'</span></li>').join('')}
$('recapCard').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.recap==='close'&&standings&&standings.recap)patchProfile({league_recap_seen_week:standings.recap.week_start});else if(b.dataset.league==='open')openLeague()};
const dayWord=n=>n===1?'1 zi':n<20?n+' zile':n+' de zile';
const medals=['🥇','🥈','🥉'];
function rankRows(list){return '<ol class="rank">'+list.map(m=>{
const d=m.last_rank==null?null:m.last_rank-m.rank,
tr=d==null?'':d>0?'<span class="tr up" title="Față de săptămâna trecută" aria-label="a urcat '+d+(d===1?' loc':' locuri')+'">▲'+d+'</span>':d<0?'<span class="tr down" title="Față de săptămâna trecută" aria-label="a coborât '+(-d)+(d===-1?' loc':' locuri')+'">▼'+(-d)+'</span>':'<span class="tr same" aria-label="același loc ca săptămâna trecută">–</span>';
return '<li class="'+(m.me?'me':'')+'"><span class="pos" aria-label="Locul '+m.rank+'">'+(medals[m.rank-1]||m.rank)+'</span><span class="av" aria-hidden="true">'+escape(m.avatar)+'</span><span class="nm">'+escape(m.name)+(m.me?' <i>(tu)</i>':'')+'</span>'+(tr||'<span></span>')+'<b class="xp">'+m.xp+' XP</b></li>'}).join('')+'</ol>'}
function weekLeft(){if(!standings||!standings.week_end)return '';const ms=new Date(standings.week_end)-Date.now();return ms<=0?'Săptămâna s-a încheiat.':ms<DAY?'Săptămâna se încheie în mai puțin de 24 de ore.':'Mai sunt '+dayWord(Math.ceil(ms/DAY))+' până la sfârșitul săptămânii (duminică).'}
function soloHtml(me){const pct=me.last_xp>0?Math.round((me.xp-me.last_xp)/me.last_xp*100):null;
return '<p class="rankline"><b>'+me.xp+' XP</b> săptămâna aceasta · '+me.last_xp+' XP săptămâna trecută'+(pct==null?' (prima ta săptămână)':' ('+(pct>=0?'+':'')+pct+'%)')+'</p><p class="small muted">Ești singurul înscris deocamdată, deci te compari cu propria săptămână anterioară. Clasamentul apare când se înscriu și alți colegi.</p>'}
function promoHint(){
if(!standings||!standings.tier)return '';const ms=standings.members||[],me=ms.find(m=>m.me);if(!me)return '';
const n=ms.length,slots=n>=8?3:1;let t;
if(standings.tier>=TIERS.length)t='Ești pe cea mai înaltă treaptă; de aici rămâne doar clasamentul grupei.';
else if(n<4)t='Treapta se poate schimba luni, la închiderea săptămânii, dar numai într-o grupă cu cel puțin 4 înscriși (acum sunteți '+n+'). La 4–7 înscriși urcă locul 1, la 8 sau mai mulți primii 3, cu minimum 50 XP în săptămână.';
else{const need=Math.max(0,50-me.xp);
if(me.rank<=slots)t=need?'Ești în zona de promovare, dar mai ai nevoie de '+need+' XP ca să contezi (minimum 50 XP).':'Ești în zona de promovare: luni urci în '+tierName(standings.tier+1)+' dacă rămâi acolo.';
else{const g=ms[slots-1].xp-me.xp;t='Luni '+(slots===1?'urcă doar locul 1':'urcă primii 3')+' (minimum 50 XP). Îți mai trebuie '+Math.max(g,need)+' XP față de ultimul loc de promovare.'}}
return '<p class="small muted" style="margin-top:10px"><span aria-hidden="true">🎯</span> '+escape(t)+'</p>'}
function standingHtml(){
if(standingsErr&&!standings)return '<p class="small muted">Clasamentul nu a putut fi încărcat acum.</p>';
if(!standings)return '<p class="small muted">Se încarcă clasamentul…</p>';
const ms=standings.members||[],me=ms.find(m=>m.me);if(!standings.registered||!me)return '';
if(ms.length===1)return soloHtml(me)+'<p class="small muted">'+weekLeft()+'</p>'+promoHint();
let gap;
if(me.rank===1){const lead=me.xp-ms[1].xp;gap=lead>0?'Ești pe primul loc, cu '+lead+' XP avans.':'Ești pe primul loc la egalitate de XP; contează acuratețea.'}
else{const up=ms[me.rank-2],g=up.xp-me.xp;gap=g>0?'Încă '+g+' XP până la locul '+up.rank+'.':'Ești la egalitate de XP cu locul '+up.rank+'; contează acuratețea.'}
return '<p class="rankline"><b>Locul '+me.rank+'</b> din '+ms.length+' · '+me.xp+' XP săptămâna aceasta</p><p class="small">'+gap+' '+weekLeft()+'</p>'+rankRows(ms.filter(m=>Math.abs(m.rank-me.rank)<=2)).replace('class="rank"','class="rank mini"')+promoHint()}
async function refreshStandings(){
if(!auth||!profile||!profile.league_registered){standings=null;standingsErr=false;renderLeagueCard();if(currentView==='league')renderLeague();return}
try{const r=await api('/rest/v1/rpc/league_standings',{method:'POST',body:{}});if(r.ok){standings=await r.json();standingsErr=false}else standingsErr=true}catch{standingsErr=true}
renderLeagueCard();if(currentView==='league')renderLeague()}
const refreshLeague=()=>{refreshXpSummary();refreshStandings()};
function renderLeague(){
const body=$('leagueBody'),reg=profile&&profile.league_registered;
$('leagueRefresh').hidden=!reg;
if(!reg){$('leagueMeta').textContent='';body.innerHTML='<p class="muted">Înscrie-te la provocarea săptămânală ca să vezi clasamentul și să apari în el.</p><button type="button" class="primary" data-league="join">Înscrie-te</button>'}
else if(standingsErr&&!standings){$('leagueMeta').textContent='';body.innerHTML='<p class="muted">Clasamentul nu a putut fi încărcat acum. Încearcă din nou.</p>'}
else if(!standings||!standings.registered){$('leagueMeta').textContent='';body.innerHTML='<p class="muted">Se încarcă clasamentul…</p>'}
else{
const ms=standings.members||[],me=ms.find(m=>m.me),a=new Date(standings.week_start+'T00:00:00'),b=new Date(a.getFullYear(),a.getMonth(),a.getDate()+6),f=d=>d.toLocaleDateString('ro-RO',{day:'numeric',month:'short'});
$('leagueMeta').innerHTML=tierPill(standings.tier)+' '+escape('Săptămâna '+f(a)+' – '+f(b)+' · '+weekLeft());
body.innerHTML=(ms.length===1&&me?soloHtml(me):'')+rankRows(ms)+(ms.length===1?'':'<p class="small muted" style="margin-top:12px">Săgețile arată schimbarea locului față de săptămâna trecută. La egalitate de XP contează acuratețea, apoi cine a ajuns primul la scor.</p>')+promoHint()}
renderHistory();
$('leagueHowBody').innerHTML='<ul class="xplist"><li>Răspuns corect: <b>10</b> puncte de bază la o întrebare nouă, <b>15</b> la una scadentă, <b>5</b> la o reluare înainte de scadență, <b>+5</b> dacă ai greșit-o data trecută.</li><li>La „scrie” punctele se înmulțesc cu <b>1,5</b>, la „scrie + caz” cu <b>2</b>.</li><li>Primele 400 de puncte pe zi contează întregi, restul doar 25%.</li><li>Apoi se înmulțesc cu <b>multiplicatorul temei</b>: '+[...new Set(topics.map(t=>t.level+' ×'+fmtMult(t.xp)))].join(' · ')+'.</li><li>Bonusuri: <b>+20 XP</b> pentru o sesiune cu minimum 10 întrebări și minimum 60% corecte, <b>+10 XP</b> pentru prima sesiune a zilei.</li><li>Săptămâna începe luni și se încheie duminică (ora României). Clasamentul se actualizează după fiecare sesiune terminată.</li></ul>'}
function openLeague(){show('league');refreshStandings()}
// ---------- Meniul utilizatorului (chip în antet) și pagina „Datele mele”
// Singurul element din dreapta antetului: avatar + prenume + punct de sincronizare; deschide Datele mele · Administrare (doar administratori) · Ieși.
const userFirst=()=>(profile&&profile.first_name)||(profile&&profile.display_name)||((auth&&auth.user.email)||'').split('@')[0];
function syncUserMenu(){
const m=$('userMenu'),on=!!auth&&!['login','register','quiz'].includes(currentView);
m.hidden=!on;if(!on){closeUserMenu();return}
const p=profile||{},nm=userFirst(),full=[p.first_name,p.last_name].filter(Boolean).join(' ')||nm;
$('chipAv').textContent=p.avatar||(nm||'?').charAt(0).toUpperCase();$('chipName').textContent=nm;
$('mhName').textContent=full;$('mhEmail').textContent=auth.user.email;$('mhRole').hidden=!isAdmin();$('miAdmin').hidden=!isAdmin();
$('userChip').setAttribute('aria-label','Meniul utilizatorului: '+full)}
function openUserMenu(){$('userPanel').hidden=$('menuScrim').hidden=false;$('userChip').setAttribute('aria-expanded','true');const f=$('userPanel').querySelector('[role=menuitem]:not([hidden])');if(f)f.focus()}
function closeUserMenu(focusChip){if($('userPanel').hidden)return;$('userPanel').hidden=$('menuScrim').hidden=true;$('userChip').setAttribute('aria-expanded','false');if(focusChip)$('userChip').focus()}
$('userChip').onclick=()=>{if($('userPanel').hidden)openUserMenu();else closeUserMenu(true)};
$('userChip').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if($('userPanel').hidden)openUserMenu()}});
$('menuScrim').onclick=()=>closeUserMenu(true);
$('userPanel').addEventListener('keydown',e=>{
if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeUserMenu(true);return}
if(e.key==='Tab'){closeUserMenu();return}
const it=[...$('userPanel').querySelectorAll('[role=menuitem]:not([hidden])')],i=it.indexOf(document.activeElement);
if(e.key==='ArrowDown'){e.preventDefault();it[(i+1)%it.length].focus()}
else if(e.key==='ArrowUp'){e.preventDefault();it[(i-1+it.length)%it.length].focus()}
else if(e.key==='Home'){e.preventDefault();it[0].focus()}
else if(e.key==='End'){e.preventDefault();it[it.length-1].focus()}});
$('brandHome').onclick=()=>{if(CLOUD&&!auth)return;if(['login','register','quiz'].includes(currentView))return;show('home')};
$('miAccount').onclick=()=>{closeUserMenu();show('account')};
let acctInfo=null;
const acOff=()=>navigator.onLine?'':' Ești offline: se trimite când revii online.';
function acRows(){
const rows=[['Email',auth.user.email],['Rol',isAdmin()?'Administrator':'Utilizator'],['Cont creat la',acctInfo?admDate(acctInfo.created_at):'—'],['Ultima autentificare',acctInfo?admDate(acctInfo.last_sign_in_at,1):'—']];
$('accountBody').innerHTML=rows.map(r=>'<dt>'+r[0]+'</dt><dd>'+escape(r[1])+'</dd>').join('')}
function acLeagueState(){
const reg=!!(profile&&profile.league_registered);
$('acLeagueState').textContent=reg?'Ești înscris la provocarea săptămânală.':'Nu ești înscris la provocarea săptămânală.';
$('acJoin').hidden=reg;$('acLeave').hidden=!reg}
function acSay(n,msg,ok){$('acErr'+n).hidden=$('acOk'+n).hidden=true;if(msg){const e=$(ok?'acOk'+n:'acErr'+n);e.textContent=msg;e.hidden=false}}
function renderAccount(){
const p=profile||{};
if(!$('acAvatars').children.length)$('acAvatars').innerHTML=AVATARS.map(a=>'<label><input type="radio" name="acavatar" value="'+a+'"><span aria-hidden="true">'+a+'</span><span class="sr">'+a+'</span></label>').join('');
$('acFirst').value=p.first_name||'';$('acLast').value=p.last_name||'';$('acNameHint').hidden=!!p.first_name;
$('acName').value=p.display_name||defaultName();
const av=p.avatar&&AVATARS.includes(p.avatar)?p.avatar:AVATARS[0];
$('acAvatars').querySelectorAll('input').forEach(r=>r.checked=r.value===av);
acSay(1);acSay(2);acRows();acLeagueState();
api('/auth/v1/user').then(r=>r.ok?r.json():null).then(u=>{if(u&&auth&&currentView==='account'){acctInfo={created_at:u.created_at,last_sign_in_at:u.last_sign_in_at};acRows()}}).catch(()=>{})}
const cleanName=x=>x.trim().replace(/\s+/g,' ');
$('acProfile').onsubmit=e=>{e.preventDefault();
const first=cleanName($('acFirst').value),last=cleanName($('acLast').value);
if(!first){acSay(1,'Completează prenumele.');$('acFirst').focus();return}
if(!last){acSay(1,'Completează numele.');$('acLast').focus();return}
if(first.length>60||last.length>60){acSay(1,'Prenumele și numele pot avea cel mult 60 de caractere.');return}
patchProfile({first_name:first,last_name:last});$('acFirst').value=first;$('acLast').value=last;$('acNameHint').hidden=true;
acSay(1,'Salvat.'+acOff(),true)};
function acLeagueValues(){
const name=cleanName($('acName').value),av=($('acAvatars').querySelector('input:checked')||{}).value;
if(name.length<2||name.length>24){acSay(2,name.length<2?'Numele afișat trebuie să aibă cel puțin 2 caractere.':'Numele afișat poate avea cel mult 24 de caractere.');$('acName').focus();return null}
if(!av){acSay(2,'Alege un avatar.');return null}
return{name,av}}
$('acLeagueForm').onsubmit=e=>{e.preventDefault();
const v=acLeagueValues();if(!v)return;
patchProfile({display_name:v.name,avatar:v.av});$('acName').value=v.name;
if(profile&&profile.league_registered)settleQueue().then(refreshStandings);
acSay(2,'Salvat.'+acOff(),true)};
$('acJoin').onclick=()=>{const v=acLeagueValues();if(!v)return;
patchProfile({display_name:v.name,avatar:v.av,league_registered:true,registered_at:(profile&&profile.registered_at)||new Date().toISOString()});
$('acName').value=v.name;settleQueue().then(refreshStandings);acLeagueState();acSay(2,'Te-ai înscris la provocarea săptămânală.'+acOff(),true)};
$('acLeave').onclick=()=>{if(!confirm('Te retragi din provocarea săptămânală? Poți reveni oricând de aici sau din cardul „Liga ta”.'))return;
patchProfile({league_registered:false,league_prompt_skip:true});standings=null;renderLeagueCard();acLeagueState();acSay(2,'Te-ai retras din provocare.'+acOff(),true)};
$('accountBack').onclick=()=>show('home');

// ---------- Administrare ----------
// Rolul vine de pe server (profiles.role); aici doar ascundem intrarea. Autorizarea o face serverul (is_admin()).
const isAdmin=()=>!!(auth&&profile&&profile.role==='admin');
const adm={q:'',status:'all',role:'all',sort:'created',dir:'desc',page:0,size:25};let admSeq=0,admTimer=0,admRows=new Map();
const admDate=(x,t)=>x?new Date(x).toLocaleString('ro-RO',t?{dateStyle:'short',timeStyle:'short'}:{dateStyle:'medium'}):'—';
function admDeny(){profile=Object.assign({},profile,{role:'user'});try{localStorage.setItem(PROFKEY+sfx(),JSON.stringify(profile))}catch{}$('admCounts').innerHTML='';$('admCount').textContent='';$('admPager').innerHTML='';$('admList').innerHTML='<p>Nu ai acces la această zonă.</p>';syncUserMenu()}
function admRow(u){const nm=[u.first_name,u.last_name].filter(Boolean).join(' ');
return'<tr><td data-l="Nume"><b>'+(nm?escape(nm):'<span class="muted">—</span>')+'</b>'+(u.display_name?'<span class="small muted"> · '+escape(u.display_name)+'</span>':'')+'</td><td data-l="Email" class="admem">'+escape(u.email||'')+'</td><td data-l="Rol"><span class="pill r-'+u.role+'">'+(u.role==='admin'?'Administrator':'Utilizator')+'</span></td><td data-l="Stare"><span class="pill st-'+u.status+'">'+(u.status==='active'?'Activ':u.status==='invited'?'Invitat':'Dezactivat')+'</span></td><td data-l="Înregistrat">'+admDate(u.created_at)+'</td><td data-l="Ultima autentificare">'+(u.status==='invited'?'invitat la '+admDate(u.invited_at):admDate(u.last_sign_in_at,1))+'</td><td data-l="Acțiuni">'+(u.status!=='invited'?'<div class="admact"><button type="button" data-act="manage" data-id="'+escape(u.user_id)+'">Gestionează</button></div>':'<div class="admact"><button type="button" data-act="resend" data-id="'+escape(u.user_id)+'">Retrimite</button><button type="button" data-act="revoke" data-id="'+escape(u.user_id)+'" data-email="'+escape(u.email||'')+'">Anulează</button></div>')+'</td></tr>'}
async function loadAdmin(){
const seq=++admSeq;
try{
const r=await api('/rest/v1/rpc/admin_list_users',{method:'POST',body:{p_search:adm.q,p_status:adm.status,p_role:adm.role,p_sort:adm.sort,p_dir:adm.dir,p_limit:adm.size,p_offset:adm.page*adm.size}});
if(seq!==admSeq)return;
if(r.status===401||r.status===403){admDeny();return}
if(!r.ok)throw new Error('http');
const j=await r.json();
if(seq!==admSeq)return;
admRows=new Map(j.rows.map(u=>[u.user_id,u]));
if(!j.rows.length&&j.total>0&&adm.page>0){adm.page=Math.ceil(j.total/adm.size)-1;loadAdmin();return}
const c=j.counts;
$('adminMeta').textContent='Pagină vizibilă doar administratorilor.';
$('admCounts').innerHTML=[[c.accounts,'conturi'],[c.active,'active'],[c.invited,c.invited===1?'invitat':'invitați'],[c.disabled,c.disabled===1?'dezactivat':'dezactivate'],[c.admins,c.admins===1?'administrator':'administratori']].map(x=>'<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
$('admCount').textContent=j.total===c.accounts?countRo(j.total,['utilizator','utilizatori']):j.total+' din '+countRo(c.accounts,['utilizator','utilizatori']);
$('admList').innerHTML=j.rows.length?'<table class="admtbl"><thead><tr><th>Nume</th><th>Email</th><th>Rol</th><th>Stare</th><th>Înregistrat</th><th>Ultima autentificare</th><th></th></tr></thead><tbody>'+j.rows.map(admRow).join('')+'</tbody></table>':'<p class="muted">Niciun utilizator nu corespunde filtrelor.</p>';
const pages=Math.max(1,Math.ceil(j.total/adm.size));
$('admPager').innerHTML=pages>1?'<button type="button" class="quiet back" data-pg="-1"'+(adm.page?'':' disabled')+'>← Înapoi</button><span class="small muted">Pagina '+(adm.page+1)+' din '+pages+'</span><button type="button" class="quiet back" data-pg="1"'+(adm.page+1<pages?'':' disabled')+'>Înainte →</button>':''}
catch{if(seq===admSeq)$('admList').innerHTML='<p class="error">Nu am putut încărca utilizatorii. Verifică conexiunea și încearcă din nou.</p>'}}
function openAdmin(){
if(!isAdmin()){show('home');return}
show('admin');$('adminMeta').textContent='';admSay('',true);auditRefresh();
$('admQ').value=adm.q;$('admStatus').value=adm.status;$('admRole').value=adm.role;$('admSort').value=adm.sort;$('admDir').textContent=adm.dir==='asc'?'↑ Crescător':'↓ Descrescător';
$('admList').innerHTML='<p class="muted">Se încarcă…</p>';loadAdmin()}
const admReload=()=>{adm.page=0;loadAdmin()};
$('admQ').oninput=e=>{adm.q=e.target.value;clearTimeout(admTimer);admTimer=setTimeout(admReload,250)};
$('admStatus').onchange=e=>{adm.status=e.target.value;admReload()};$('admRole').onchange=e=>{adm.role=e.target.value;admReload()};
$('admSort').onchange=e=>{adm.sort=e.target.value;admReload()};
$('admDir').onclick=()=>{adm.dir=adm.dir==='asc'?'desc':'asc';$('admDir').textContent=adm.dir==='asc'?'↑ Crescător':'↓ Descrescător';admReload()};
$('admPager').onclick=e=>{const b=e.target.closest('[data-pg]');if(!b||b.disabled)return;adm.page=Math.max(0,adm.page+Number(b.dataset.pg));loadAdmin();$('admQ').scrollIntoView({block:'start'})};
// Invitații: trimiterea emailului se face în Edge Function „admin-invite” (cheia de serviciu rămâne pe server).
const INV_ERR={email:'Adresa de email nu este validă.',exists:'Există deja un cont cu acest email.',pending:'Acest email are deja o invitație în așteptare. Folosește „Retrimite” din listă.',rate:'Ai trimis prea multe invitații într-o oră. Încearcă mai târziu.',not_pending:'Invitația nu mai este în așteptare.',last_admin:'Nu poți elimina sau bloca ultimul administrator activ.',self:'Nu poți face asta pe propriul cont.',confirm_mismatch:'Emailul scris nu corespunde.',not_found:'Contul nu mai există.',is_pending:'Contul este încă invitat: folosește „Retrimite” sau „Anulează”.',forbidden:'Nu ai acces la această acțiune.',auth:'Sesiunea a expirat. Intră din nou în cont.'};
async function invCall(body){
try{const r=await api('/functions/v1/admin-invite',{method:'POST',body});const j=await r.json().catch(()=>({}));
if(r.ok)return{ok:true};
if(r.status===502)return{msg:'Emailul nu a putut fi trimis. Verifică setările de email (SMTP) din Supabase.'};
return{msg:INV_ERR[j.error]||'Ceva nu a mers. Încearcă din nou.',code:j.error}}
catch{return{msg:'Nu am putut contacta serverul. Verifică conexiunea.'}}}
function admSay(text,ok){const m=$('admMsg');m.textContent=text;m.className='small '+(ok?'ok':'bad');m.hidden=!text}
const validEmail=x=>/^[^\s@<>()\[\]\\,;:"]+@[^\s@<>()\[\]\\,;:"]+\.[^\s@<>()\[\]\\,;:"]{2,}$/.test(x)&&x.length<=254;
$('admInvite').onclick=()=>{$('invErr').hidden=$('invOk').hidden=$('invWarn').hidden=true;$('invEmail').value='';$('invRole').value='user';$('invSend').disabled=false;$('inviteDialog').showModal();$('invEmail').focus()};
$('invRole').onchange=()=>{$('invWarn').hidden=$('invRole').value!=='admin'};
$('invClose').onclick=()=>$('inviteDialog').close();
$('inviteDialog').addEventListener('click',e=>{if(e.target===$('inviteDialog'))$('inviteDialog').close()});
$('invForm').onsubmit=async e=>{e.preventDefault();
const email=$('invEmail').value.trim().toLowerCase();$('invErr').hidden=$('invOk').hidden=true;
if(!validEmail(email)){$('invErr').textContent=INV_ERR.email;$('invErr').hidden=false;$('invEmail').focus();return}
$('invSend').disabled=true;
const r=await invCall({action:'invite',email,role:$('invRole').value});
$('invSend').disabled=false;
if(!r.ok){$('invErr').textContent=r.msg;$('invErr').hidden=false;return}
$('invOk').textContent='Invitație trimisă la '+email+'.';$('invOk').hidden=false;$('invEmail').value='';$('invEmail').focus();loadAdmin()};
$('admList').onclick=async e=>{
const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
const act=b.dataset.act;
if(act==='manage'){openManage(b.dataset.id);return}
if(act==='revoke'&&!confirm('Anulezi invitația pentru '+b.dataset.email+'? Contul invitat va fi șters.'))return;
b.disabled=true;admSay('',true);
const r=await invCall({action:act,user_id:b.dataset.id});
if(r.ok)admSay(act==='resend'?'Invitația a fost retrimisă.':'Invitația a fost anulată.',true);else admSay(r.msg,false);
if(r.ok||r.code==='not_pending')loadAdmin();else b.disabled=false;auditRefresh()};
// ---------- Gestionarea conturilor (rol, dezactivare, resetare de parolă, ștergere) și jurnalul de activitate
let mgUser=null;
const mgName=u=>[u.first_name,u.last_name].filter(Boolean).join(' ')||u.email;
const isMe=u=>!!(auth&&u.user_id===auth.user.id);
function openManage(id){
const u=admRows.get(id);if(!u)return;mgUser=u;
$('mgTitle').textContent=mgName(u);
$('mgMeta').textContent=u.email+' · '+(u.role==='admin'?'Administrator':'Utilizator')+' · '+(u.status==='disabled'?'Dezactivat':'Activ')+(isMe(u)?' · contul tău':'');
$('mgActs').innerHTML='<button type="button" data-mg="role">'+(u.role==='admin'?'Fă-l utilizator obișnuit':'Fă-l administrator')+'</button>'+(isMe(u)?'':'<button type="button" data-mg="toggle">'+(u.status==='disabled'?'Reactivează contul':'Dezactivează contul')+'</button>')+'<button type="button" data-mg="reset">Trimite email de resetare a parolei</button>'+(isMe(u)?'':'<button type="button" class="danger" data-mg="del">Șterge contul…</button>');
$('mgDelete').hidden=true;$('mgErr').hidden=true;$('mgDelInput').value='';$('mgDelGo').disabled=true;
$('manageDialog').showModal()}
const MG_OK={set_role:'Rolul a fost schimbat.',disable:'Contul a fost dezactivat.',enable:'Contul a fost reactivat.',reset_password:'Emailul de resetare a parolei a fost trimis.',delete:'Contul a fost șters.'};
async function mgCall(body){
const u=mgUser;$('mgErr').hidden=true;
$('manageDialog').querySelectorAll('button').forEach(b=>b.disabled=true);
const r=await invCall({...body,user_id:u.user_id});
$('manageDialog').querySelectorAll('#mgActs button,#mgClose,#mgDelCancel').forEach(b=>b.disabled=false);$('mgDelGo').disabled=$('mgDelInput').value.trim().toLowerCase()!==u.email.toLowerCase();
if(!r.ok){$('mgErr').textContent=r.msg;$('mgErr').hidden=false;if(r.code==='not_found'||r.code==='is_pending')loadAdmin();return}
$('manageDialog').close();
if(isMe(u)&&body.action==='set_role'&&body.role==='user'){profile=Object.assign({},profile,{role:'user'});try{localStorage.setItem(PROFKEY+sfx(),JSON.stringify(profile))}catch{}show('home');return}
admSay(MG_OK[body.action]||'Gata.',true);loadAdmin();auditRefresh()}
$('mgActs').onclick=e=>{const b=e.target.closest('[data-mg]');if(!b||b.disabled||!mgUser)return;const u=mgUser,n=mgName(u);
switch(b.dataset.mg){
case'role':{const to=u.role==='admin'?'user':'admin';
if(confirm(to==='admin'?'Faci din '+n+' administrator? Va putea vedea toți utilizatorii și invita alte persoane.':'Scoți rolul de administrator pentru '+n+'?'))mgCall({action:'set_role',role:to});break}
case'toggle':{const off=u.status!=='disabled';
if(confirm(off?'Dezactivezi contul lui '+n+'? Nu se va mai putea autentifica (o sesiune deja deschisă poate funcționa încă cel mult o oră); datele rămân.':'Reactivezi contul lui '+n+'?'))mgCall({action:off?'disable':'enable'});break}
case'reset':if(confirm('Trimiți un email de resetare a parolei către '+u.email+'?'))mgCall({action:'reset_password'});break;
case'del':$('mgDelEmail').textContent=u.email;$('mgDelete').hidden=false;$('mgDelInput').focus();break}};
$('mgDelInput').oninput=()=>{$('mgDelGo').disabled=!mgUser||$('mgDelInput').value.trim().toLowerCase()!==mgUser.email.toLowerCase()};
$('mgDelCancel').onclick=()=>{$('mgDelete').hidden=true;$('mgDelInput').value=''};
$('mgDelGo').onclick=()=>{if(mgUser)mgCall({action:'delete',confirm_email:$('mgDelInput').value})};
$('mgClose').onclick=()=>$('manageDialog').close();
$('manageDialog').addEventListener('click',e=>{if(e.target===$('manageDialog'))$('manageDialog').close()});

const AUD={invite:'a invitat',resend:'a retrimis invitația către',revoke:'a anulat invitația pentru',disable:'a dezactivat contul lui',enable:'a reactivat contul lui',set_role:'a schimbat rolul lui',reset_password:'a trimis resetare de parolă către',delete:'a șters contul lui'};
const ROLE_RO={admin:'Administrator',user:'Utilizator'};
let audRows=[],audTotal=0,audSeq=0;
function audHtml(){
if(!audRows.length)return'<p class="muted">Încă nu există activitate.</p>';
return'<ol class="hist audit">'+audRows.map(a=>{const d=a.details||{};
const extra=a.action==='set_role'?' ('+(ROLE_RO[d.from]||d.from)+' → '+(ROLE_RO[d.to]||d.to)+')':a.action==='invite'&&d.role==='admin'?' (ca administrator)':'';
return'<li><span class="when">'+admDate(a.at,1)+'</span>'+escape(a.admin_email||'un administrator șters')+' '+(AUD[a.action]||escape(a.action))+' <b>'+escape(a.target_email)+'</b>'+escape(extra)+'</li>'}).join('')+'</ol>'+(audRows.length<audTotal?'<div class="tools"><button type="button" class="quiet back" id="audMore">Mai multe</button></div>':'')}
async function loadAudit(more){
const seq=++audSeq,off=more?audRows.length:0;
try{const r=await api('/rest/v1/rpc/admin_audit_list',{method:'POST',body:{p_limit:25,p_offset:off}});
if(seq!==audSeq)return;
if(!r.ok)throw new Error('http');
const j=await r.json();audTotal=j.total;audRows=more?audRows.concat(j.rows):j.rows;$('admAudit').innerHTML=audHtml()}
catch{if(seq===audSeq)$('admAudit').innerHTML='<p class="error">Nu am putut încărca jurnalul.</p>'}}
const auditRefresh=()=>{if($('admAuditBox').open)loadAudit(false)};
$('admAuditBox').addEventListener('toggle',()=>{if($('admAuditBox').open)loadAudit(false)});
$('admAudit').onclick=e=>{if(e.target.closest('#audMore'))loadAudit(true)};
$('miAdmin').onclick=()=>{closeUserMenu();openAdmin()};$('adminBack').onclick=()=>show('home');
$('leagueBack').onclick=()=>show('home');$('leagueRefresh').onclick=refreshStandings;
$('leagueBody').onclick=e=>{if(e.target.closest('[data-league=join]'))openLeagueDialog('register')};

// ---------- Liga: puncte XP ----------
// XP-ul se calculează pe server (triggere în baza de date), din răspunsurile și sesiunile trimise; aici doar îl afișăm.
let xpSummary=null;
const fmtMult=n=>String(n).replace('.',','),fmtN=n=>String(Math.round(n*100)/100).replace('.',',');
const levelOfMult=k=>{const t=topics.find(t=>Number(t.xp)===Number(k));return t?t.level:''};
const xpLine=()=>xpSummary?'<p class="small" style="margin-top:12px">XP azi: <b>'+xpSummary.today+'</b> · în săptămâna aceasta: <b>'+xpSummary.week+'</b> · săptămâna trecută: '+xpSummary.last_week+'</p>':'';
async function refreshXpSummary(){try{const r=await api('/rest/v1/rpc/my_xp_summary',{method:'POST',body:{}});if(r.ok){xpSummary=await r.json();renderLeagueCard()}}catch{}}
// Așteaptă ca ce e în coada de trimitere să ajungă pe server (sau expiră timpul).
async function settleQueue(maxMs=8000){const t0=Date.now();while(Date.now()-t0<maxMs){await flush();if(!flushing&&!outbox.q.length)return true;if(!flushing&&lastFlushFailed)return false;await new Promise(r=>setTimeout(r,250))}return !outbox.q.length}
function xpHtml(rows){
const ans=rows.filter(r=>r.kind==='answer'),ses=rows.find(r=>r.kind==='session'),first=rows.find(r=>r.kind==='first_of_day'),total=rows.reduce((s,r)=>s+r.xp,0),by={};
ans.forEach(r=>{const k=Number(r.level_mult),g=by[k]||(by[k]={n:0,counted:0,xp:0});g.n++;g.counted+=Number(r.counted_points);g.xp+=r.xp});
const lines=Object.keys(by).sort((a,b)=>a-b).map(k=>{const g=by[k];return '<li>'+g.n+(g.n===1?' răspuns corect':' răspunsuri corecte')+' · '+fmtN(g.counted)+' puncte de bază'+(Number(k)!==1?' × '+fmtMult(Number(k))+' (nivel '+escape(levelOfMult(k))+')':'')+' → <b>'+g.xp+' XP</b></li>'});
const back=ans.filter(r=>r.is_comeback).length,capped=ans.reduce((s,r)=>s+Number(r.base_points)-Number(r.counted_points),0);
if(back)lines.push('<li>Dintre acestea, '+back+(back===1?' revenire':' reveniri')+' la întrebări greșite înainte (+5 puncte de bază fiecare)</li>');
if(capped>0.005)lines.push('<li>Plafonul zilnic a fost atins: '+fmtN(capped/0.75)+' puncte de bază au valorat doar 25%</li>');
if(ses)lines.push('<li>Sesiune terminată (minimum 10 întrebări, minimum 60% corecte): <b>+20 XP</b></li>');
if(first)lines.push('<li>Prima sesiune a zilei: <b>+10 XP</b></li>');
const join=profile&&profile.league_registered?'':'<p class="small" style="margin-top:12px"><button type="button" class="quiet back" data-league="join">Înscrie-te la provocarea săptămânală</button></p>';
return '<div class="xptotal">'+(total?'+':'')+total+' <small>XP</small></div>'+(lines.length?'<details class="xpdet"><summary>Cum s-a calculat</summary><ul class="xplist">'+lines.join('')+'</ul></details>':'<p class="small muted">Răspunde corect la întrebări ca să aduni XP.</p>')+join}
async function showSessionXp(sid){
const el=$('xpResult');$('xpBlock').hidden=false;el.innerHTML='<p class="small muted">Se calculează punctele…</p>';
try{
if(!await settleQueue()){el.innerHTML='<p class="small muted">Punctele XP apar după sincronizare. Se retrimit automat când ai din nou conexiune.</p>';return}
const r=await api('/rest/v1/xp_events?select=kind,xp,base_points,counted_points,level_mult,is_comeback&session_id=eq.'+encodeURIComponent(sid));
if(!r.ok)throw 0;const rows=await r.json();
if(currentView==='results'&&state.sid===sid)el.innerHTML=xpHtml(rows);
refreshLeague()}
catch{el.innerHTML='<p class="small muted">Punctele XP nu au putut fi încărcate acum.</p>'}}
$('xpResult').onclick=e=>{if(e.target.closest('[data-league=join]'))openLeagueDialog('register')};

// ---------- Liga: înscrierea la provocarea săptămânală ----------
// Pop-up-ul apare după o autentificare nouă (parolă introdusă), cel mult o dată pe zi, doar dacă datele contului s-au încărcat
// de pe server și utilizatorul nu este înscris și nu a bifat „Nu-mi mai aminti”. Alegerile se salvează în `profiles`.
const PROFKEY='deutsch-profile-v1',AVATARS=['🦊','🐼','🦉','🐯','🐸','🦄','🐙','🦁','🐧','🦋','🐢','🐳'];
let profile=null,profileFresh=false,pendingPrompt=false,ldMode='prompt',ldHandled=false;
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const defaultName=()=>{if(profile&&profile.first_name)return profile.first_name.slice(0,24);const w=((auth&&auth.user.email)||'').split('@')[0].split(/[._+-]/)[0];return w?w.charAt(0).toUpperCase()+w.slice(1,24):''};
function loadProfile(){try{profile=JSON.parse(localStorage.getItem(PROFKEY+sfx()))}catch{profile=null}profileFresh=false}
function patchProfile(patch){profile=Object.assign({},profile||{},patch);try{localStorage.setItem(PROFKEY+sfx(),JSON.stringify(profile))}catch{}enqueue({k:'pf',patch});renderLeagueCard();syncUserMenu()}
function renderLeagueCard(){
renderRecap();const c=$('leagueCard');if(!c)return;
if(!CLOUD||!auth||(!profile&&!profileFresh)){c.hidden=true;return}
const reg=profile&&profile.league_registered;c.hidden=false;
c.innerHTML=reg
?'<div class="label">LIGA TA</div><h2 style="margin-top:12px"><span aria-hidden="true">'+escape(profile.avatar)+'</span> '+escape(profile.display_name)+'</h2>'+tierLine()+'<p class="muted small">Ești înscris la provocarea săptămânală.</p>'+standingHtml()+xpLine()+'<div class="tools" style="margin-top:0"><button type="button" class="primary back" data-league="open">Clasament complet</button><button type="button" class="quiet back" data-league="edit">Editează profilul</button><button type="button" class="quiet back" data-league="leave">Retrage-te</button></div>'
:'<div class="label">LIGA TA</div><h2 style="margin-top:12px">Provocarea săptămânală</h2><p class="muted small">Aduni XP din teste și te compari cu colegii într-un clasament de luni până duminică. Temele mai grele aduc mai multe puncte.</p>'+xpLine()+'<button type="button" class="primary allwidth" data-league="join">Înscrie-te</button>'}
function openLeagueDialog(mode){
ldMode=mode;ldHandled=false;
const d=$('leagueDialog'),p=profile||{};
$('ldSkip').checked=false;$('ldErr').hidden=true;
$('ldStep1').hidden=mode!=='prompt';$('ldStep2').hidden=mode==='prompt';$('ldBack').hidden=mode!=='prompt';
$('ldTitle2').textContent=mode==='edit'?'Editează profilul':mode==='register'?'Înscrie-te la provocare':'Cum vrei să apari în clasament?';
$('ldName').value=p.display_name||defaultName();
const av=p.avatar&&AVATARS.includes(p.avatar)?p.avatar:AVATARS[0];
d.querySelectorAll('input[name=avatar]').forEach(r=>r.checked=r.value===av);
if(mode==='prompt')patchProfile({league_prompted_at:new Date().toISOString()});
d.showModal()}
// „Nu acum”, Esc sau atingerea fundalului: dacă „Nu-mi mai aminti” este bifat, pop-up-ul nu mai apare niciodată.
function ldDismiss(){if(ldMode==='prompt'&&$('ldSkip').checked)patchProfile({league_prompt_skip:true})}
function maybePrompt(){
if(!pendingPrompt||!auth||!profileFresh||currentView!=='home'||state.active||$('leagueDialog').open)return;
pendingPrompt=false;const p=profile||{};
if(p.league_registered||p.league_prompt_skip)return;
if(p.league_prompted_at&&sameDay(new Date(p.league_prompted_at),new Date()))return;
openLeagueDialog('prompt')}
function ldSave(){
const name=$('ldName').value.trim().replace(/\s+/g,' '),av=($('leagueDialog').querySelector('input[name=avatar]:checked')||{}).value,err=$('ldErr');
if(name.length<2||name.length>24){err.textContent=name.length<2?'Numele trebuie să aibă cel puțin 2 caractere.':'Numele poate avea cel mult 24 de caractere.';err.hidden=false;$('ldName').focus();return}
if(!av){err.textContent='Alege un avatar.';err.hidden=false;return}
const patch={display_name:name,avatar:av,league_registered:true,registered_at:(profile&&profile.registered_at)||new Date().toISOString()};
if(ldMode==='prompt'&&$('ldSkip').checked)patch.league_prompt_skip=true;
patchProfile(patch);ldHandled=true;$('leagueDialog').close();settleQueue().then(refreshStandings)}
if(CLOUD){
$('ldAvatars').innerHTML=AVATARS.map(a=>'<label><input type="radio" name="avatar" value="'+a+'"><span aria-hidden="true">'+a+'</span><span class="sr">'+a+'</span></label>').join('');
$('ldYes').onclick=()=>{$('ldStep1').hidden=true;$('ldStep2').hidden=false;$('ldBack').hidden=false;$('ldName').focus()};
$('ldBack').onclick=()=>{$('ldStep2').hidden=true;$('ldStep1').hidden=false;$('ldYes').focus()};
$('ldNo').onclick=()=>{ldDismiss();ldHandled=true;$('leagueDialog').close()};
$('ldSave').onclick=ldSave;
$('ldName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ldSave()}});
$('leagueDialog').addEventListener('close',()=>{if(!ldHandled)ldDismiss();ldHandled=false});
$('leagueDialog').addEventListener('click',e=>{if(e.target===$('leagueDialog'))$('leagueDialog').close()});
$('leagueCard').onclick=e=>{const b=e.target.closest('[data-league]');if(!b)return;const a=b.dataset.league;
if(a==='join')openLeagueDialog('register');else if(a==='open')openLeague();else if(a==='edit')openLeagueDialog('edit');
else if(a==='leave'&&confirm('Te retragi din provocarea săptămânală? Poți reveni oricând din cardul „Liga ta”.')){patchProfile({league_registered:false,league_prompt_skip:true});standings=null;renderLeagueCard()}}}

// ---------- Istoric: butonul „înapoi” și gestul de pe iPhone ----------
// ---------- Înregistrare după invitație (linkul din email aduce jetonul în adresa paginii, după #)
let reg=null;
function readAuthHash(){
const raw=location.hash.replace(/^#/,'');if(!raw)return null;
const p=new URLSearchParams(raw);
if(!p.get('access_token')&&!p.get('error'))return null;
try{window.history.replaceState(null,'',location.pathname+location.search)}catch{}
if(p.get('error'))return{error:p.get('error_code')||p.get('error')};
const type=p.get('type');
return p.get('access_token')&&(type==='invite'||type==='recovery')?{type,token:p.get('access_token'),refresh:p.get('refresh_token'),exp:Number(p.get('expires_in'))||3600}:null}
function regFail(msg){showLogin();$('loginError').textContent=msg;$('loginError').hidden=false}
const LINK_DEAD='Invitația a expirat sau a fost deja folosită. Cere o invitație nouă administratorului.';
async function startRegister(link){
if(link.error){regFail(LINK_DEAD);return}
reg={token:link.token,refresh:link.refresh,exp:link.exp,type:link.type};
$('userMenu').hidden=true;
show('register');$('regBtn').disabled=true;$('regErr').hidden=true;
try{
const H={apikey:CFG.key,Authorization:'Bearer '+reg.token};
const ur=await fetch(CFG.url+'/auth/v1/user',{headers:H});if(!ur.ok)throw new Error('link');
reg.user=await ur.json();
const pr=await fetch(CFG.url+'/rest/v1/profiles?select=first_name,last_name&user_id=eq.'+encodeURIComponent(reg.user.id),{headers:H});
const prof=pr.ok?((await pr.json())[0]||{}):{};
reg.needNames=!prof.first_name;
$('regEmail').value=reg.user.email||'';$('regFirst').value=prof.first_name||'';$('regLast').value=prof.last_name||'';$('regPass').value='';$('regShow').checked=false;$('regPass').type='password';
$('regNames').hidden=!reg.needNames;
const invite=reg.type==='invite'&&reg.needNames;
$('regLabel').textContent=invite?'ÎNREGISTRARE':'PAROLĂ NOUĂ';$('regTitle').textContent=invite?'Finalizează înregistrarea':'Alege o parolă nouă';
$('regIntro').textContent=invite?'Ai fost invitat în platformă. Completează datele de mai jos ca să-ți activezi contul.':'Alege parola cu care vei intra în cont.';
$('regBtn').disabled=false;(reg.needNames?$('regFirst'):$('regPass')).focus()}
catch{reg=null;regFail(LINK_DEAD)}}
$('regShow').onchange=()=>{$('regPass').type=$('regShow').checked?'text':'password'};
$('regForm').onsubmit=async e=>{e.preventDefault();
if(!reg)return;
const err=m=>{$('regErr').textContent=m;$('regErr').hidden=false};
const first=$('regFirst').value.trim().replace(/\s+/g,' '),last=$('regLast').value.trim().replace(/\s+/g,' '),pw=$('regPass').value;
$('regErr').hidden=true;
if(reg.needNames&&!first){err('Completează prenumele.');$('regFirst').focus();return}
if(reg.needNames&&!last){err('Completează numele.');$('regLast').focus();return}
if(pw.length<8){err('Parola trebuie să aibă cel puțin 8 caractere.');$('regPass').focus();return}
$('regBtn').disabled=true;
const H={apikey:CFG.key,Authorization:'Bearer '+reg.token,'Content-Type':'application/json'};
try{
const r=await fetch(CFG.url+'/auth/v1/user',{method:'PUT',headers:H,body:JSON.stringify({password:pw})});
if(!r.ok){const j=await r.json().catch(()=>({}));
if(j.error_code!=='same_password'){err(j.error_code==='weak_password'?'Parola este prea slabă sau apare în liste de parole compromise. Alege alta.':r.status===401||r.status===403?LINK_DEAD:'Nu am putut salva parola. Încearcă din nou.');$('regBtn').disabled=false;return}}
if(reg.needNames){
const pr=await fetch(CFG.url+'/rest/v1/profiles?on_conflict=user_id',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([{user_id:reg.user.id,first_name:first,last_name:last}])});
if(!pr.ok){err('Parola a fost salvată, dar numele nu. Apasă din nou „Finalizează”.');$('regBtn').disabled=false;return}}
setAuth({access_token:reg.token,refresh_token:reg.refresh,expires_in:reg.exp,user:{id:reg.user.id,email:reg.user.email}});
reg=null;$('regPass').value='';afterLogin()}
catch{err('Nu am putut contacta serverul. Verifică conexiunea și încearcă din nou.');$('regBtn').disabled=false}};

// Fiecare ecran are propria intrare în istoricul browserului, ca să nu ieși din aplicație la „înapoi”.
// Atenție: variabila „history” din acest fișier sunt sesiunile, deci folosim window.history.
let navSilent=false,navStarted=false;
function pushView(id){
if(navSilent)return;
const s={v:id,t:cur?cur.id:null,s:studyTopic?studyTopic.id:null};
try{if(!navStarted){navStarted=true;window.history.replaceState(s,'');return}
const h=window.history.state;if(h&&h.v===s.v&&h.t===s.t&&h.s===s.s)return;window.history.pushState(s,'')}catch{}}
function endSession(){if(state.answers.some(Boolean))finish();else{state.active=false;const dur=stopClock();if(auth&&dur){outbox.d[state.sid]=dur;saveOutbox();flush()}show(state.topic?'topic':'home')}}
addEventListener('popstate',e=>{
if(CLOUD&&!auth)return;
const s=e.state||{v:'home'};
if(state.active&&s.v!=='quiz'){
if(!confirm('Închei sesiunea acum? Vei vedea scorul pentru întrebările la care ai răspuns.')){try{window.history.pushState({v:'quiz',t:cur?cur.id:null,s:null},'')}catch{}return}
if(state.answers.some(Boolean))endSession();else{navSilent=true;try{endSession()}finally{navSilent=false}}return}
navSilent=true;
try{
if(s.v==='topic'&&topicById[s.t])openTopic(s.t);
else if(s.v==='study'&&topicById[s.s])openStudy(topicById[s.s]);
else if(s.v==='results'&&state.answers&&state.answers.length&&!state.active)show('results');
else if(s.v==='quiz'&&state.active)show('quiz');
else if(s.v==='league'&&CLOUD&&auth)openLeague();
else if(s.v==='account'&&CLOUD&&auth)show('account');
else if(s.v==='admin'&&isAdmin())openAdmin();
else show('home')}
finally{navSilent=false}});

// ---------- Inițializare ----------
if(!CLOUD){loadProgress();show('home')}
else{const link=readAuthHash();if(link)startRegister(link);else{try{auth=JSON.parse(localStorage.getItem(AKEY))}catch{auth=null}if(auth&&auth.user&&auth.user.id&&auth.refresh_token)afterLogin();else{auth=null;showLogin()}}}
