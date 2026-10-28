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
const VIEWS=['login','home','topic','quiz','results','study'];
let state={active:false},currentView='home',studyReturn='home',cur=null,builtFor='',studyTopic=null,progress=Object.create(null),history=[],storageOK=true;

// ---------- Progres salvat local ----------
function clean(o){const out=Object.create(null);if(o&&typeof o==='object')for(const k in o){const id=byId[k]?k:'verben-praepositionen/'+k,p=o[k];if(byId[id]&&p&&['box','due','seen','right','wrong'].every(f=>Number.isFinite(p[f])))out[id]={box:Math.max(0,Math.min(STEPS.length-1,Math.floor(p.box))),due:p.due,seen:p.seen,right:p.right,wrong:p.wrong,last:Number.isFinite(p.last)?p.last:0}}return out}
const cleanHistory=v=>Array.isArray(v)?v.filter(h=>h&&['t','pct','n','correct'].every(f=>Number.isFinite(h[f]))&&(h.topic==='mix'||topicById[h.topic])).map(h=>({t:h.t,topic:h.topic,pct:h.pct,n:h.n,correct:h.correct})).slice(-40):[];
function loadProgress(){progress=Object.create(null);history=[];try{const raw=localStorage.getItem(PKEY+sfx()),old=CLOUD?null:localStorage.getItem(OLD_PKEY);progress=clean(JSON.parse(raw||old));history=cleanHistory(JSON.parse(localStorage.getItem(HKEY+sfx())));if(!raw&&old)save()}catch{storageOK=false}}
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
function show(id){VIEWS.forEach(x=>$(x).hidden=x!==id);currentView=id;$('navHome').hidden=id==='home'||id==='quiz'||id==='login';if(id==='home')renderHome();if(id==='topic')renderTopic();window.scrollTo(0,0)}
function renderHome(){
$('heroTopics').textContent=countRo(topics.length,['temă','teme']);$('heroItems').textContent=countRo(allItems.length,['întrebare','întrebări']);
$('progressStats').innerHTML=statsHtml(allItems);$('storeWarn').hidden=storageOK;
const r=pickFrom(allItems,'smart',Number($('todayCount').value)),due=allItems.filter(isDue).length,fresh=allItems.filter(q=>!P(q)).length;
$('todayInfo').textContent=r.filled?'Nu mai ai nimic scadent; primești cele mai apropiate repetări.':due+' de repetat acum · '+fresh+' noi, din '+allItems.length+' întrebări în toate temele.';
$('topicGrid').innerHTML=topics.map(t=>{const c=counts(t.qs),due=t.qs.filter(isDue).length;return '<button type="button" class="topic" data-topic="'+t.id+'"><div class="row"><span class="label">'+escape(t.level)+'</span><span class="pill">'+countRo(t.qs.length,t.unit)+'</span></div><h3>'+escape(t.title)+'</h3><div class="small muted" lang="de">'+escape(t.titleDe||'')+'</div><p class="small">'+escape(t.summary)+'</p>'+bar(c,t.qs.length)+'<div class="small muted">'+(due?due+' de repetat · ':'')+c.new+' noi · '+c.done+' stăpânite</div></button>'}).join('');
$('history').innerHTML=history.length?history.slice(-6).reverse().map(h=>'<li><span>'+new Date(h.t).toLocaleDateString('ro-RO')+' · '+escape(h.topic==='mix'?'Repetiția de azi':topicById[h.topic].title)+'</span><b>'+h.pct+'% · '+h.correct+'/'+h.n+'</b></li>').join(''):'<li class="muted">Încă nu ai finalizat o sesiune.</li>'}
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
function begin(qs,cfg){if(!qs.length)return;state={active:true,qs,index:0,answers:[],opts:[],mode:cfg.mode,feedbackMode:cfg.feedbackMode,topic:cfg.topic,selected:'',selectedCase:'',locked:false,sid:uuid()};if(auth)enqueue({k:'s',row:{id:state.sid,topic:cfg.topic?cfg.topic.id:'mix',mode:cfg.mode,feedback_mode:cfg.feedbackMode,started_at:new Date().toISOString()}});show('quiz');renderQuestion()}
function renderQuestion(){
const q=state.qs[state.index],m=modeFor(q),t=q.topic,prev=state.answers[state.index],exam=state.feedbackMode==='exam',n=state.qs.length,done=state.answers.filter(Boolean);
state.locked=false;state.selected=prev&&!prev.skip&&m==='choice'?prev.raw:'';state.selectedCase=prev&&!prev.skip?prev.cas:'';
if(!state.opts[state.index])state.opts[state.index]=optionsFor(q);
$('qCounter').textContent='Întrebarea '+(state.index+1)+' / '+n;$('bar').style.width=(state.index/n*100)+'%';$('progress').setAttribute('aria-valuenow',Math.round(state.index/n*100));
$('sessionLabel').textContent=(state.topic?state.topic.title.toUpperCase()+' · ':'REPETIȚIA DE AZI · ')+(exam?'corectare la final':'feedback imediat');
$('runningScore').textContent=exam?done.length+' / '+n+' răspunsuri înregistrate':done.filter(a=>a.ok).length+' corecte / '+done.length+' răspunsuri';
$('qContent').innerHTML=(state.topic?'':'<span class="pill qtopic">'+escape(t.title)+'</span>')+'<p class="sentence" lang="de">'+escape(q.prompt).replace('___','<span class="blank">…</span>')+'</p>'+(q.hint?'<p class="small hint">'+escape(q.hint)+'</p>':'')+'<p class="muted">'+escape(q.ro)+'</p><p class="small muted">'+(m==='both'?'Completează răspunsul și alege '+escape(t.extra.label.toLowerCase())+'.':escape(t.instruction))+'</p>';
$('feedback').innerHTML='';$('validation').hidden=true;$('check').hidden=false;
$('check').textContent=exam?(state.index===n-1?'Înregistrează și finalizează':prev?'Actualizează răspunsul':'Înregistrează răspunsul'):'Verifică răspunsul';
$('next').hidden=true;$('skip').hidden=false;$('prev').hidden=!(exam&&state.index>0);
if(m==='choice'){$('answerArea').innerHTML='<div class="options'+(state.opts[state.index].some(o=>o.length>24)?' wide':'')+'">'+state.opts[state.index].map((p,i)=>'<button class="option'+(p===state.selected?' selected':'')+'" type="button" data-value="'+escape(p)+'" aria-pressed="'+(p===state.selected)+'"><span>'+(i+1)+'</span>'+escape(p)+'</button>').join('')+'</div>';$('answerArea').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(state.locked)return;state.selected=b.dataset.value;$('answerArea').querySelectorAll('button').forEach(x=>{const on=x===b;x.classList.toggle('selected',on);x.setAttribute('aria-pressed',String(on))});$('validation').hidden=true})}
else{$('answerArea').innerHTML='<div class="entry"><label class="small" for="answerInput">'+escape(cap(t.answerNoun))+'</label><input type="text" id="answerInput" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Scrie aici…" lang="de" value="'+(prev&&!prev.skip?escape(prev.raw):'')+'"><p class="small muted" style="margin-top:6px">Poți scrie ä, ö, ü, ß și ca „ae”, „oe”, „ue”, „ss” (ex.: „fuer”, „weiss”).</p></div>'+(m==='both'?'<div class="cases" role="group" aria-label="'+escape(t.extra.label)+'">'+t.extra.options.map(c=>'<button type="button" data-case="'+escape(c)+'" aria-pressed="'+(c===state.selectedCase)+'">'+escape(c)+'</button>').join('')+'</div>':'');$('answerInput').addEventListener('input',()=>{$('validation').hidden=true});$('answerArea').querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{if(state.locked)return;state.selectedCase=b.dataset.case;$('answerArea').querySelectorAll('[data-case]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('validation').hidden=true});if(window.matchMedia('(min-width: 721px)').matches)$('answerInput').focus()}}
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
$('check').hidden=true;$('skip').hidden=true;$('next').hidden=false;$('next').textContent=state.index===state.qs.length-1?'Vezi rezultatele →':'Următoarea →';$('next').focus()}
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
history.push({t:Date.now(),topic:t?t.id:'mix',pct,n,correct});history=history.slice(-40);save();if(auth)enqueue({k:'sf',id:state.sid,patch:{finished_at:new Date().toISOString(),n,correct,pct}});show('results');
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
$('verbTable').innerHTML=qs.length?qs.map(q=>{const p=P(q),st=status(p),sense=q.sense||q.gloss||q.hint||q.ro;return '<tr><td><b lang="de">'+escape(q.label||q.answer)+'</b>'+(q.group?'<br>'+groupPill(q.group):'')+'</td><td><b>'+escape(sense)+'</b></td><td><span lang="de">'+escape(q.prompt).replace('___','<b>'+escape(q.answer)+'</b>')+'</span>'+(sense!==q.ro?'<br><span class="small muted">'+escape(q.ro)+'</span>':'')+'</td><td><span class="pill p-'+st+'">'+statusLabel[st]+'</span>'+(p?'<br><span class="small muted">'+p.right+'/'+p.seen+' corecte · revezi '+nextText(p)+'</span>':'')+'</td></tr>'}).join(''):'<tr><td colspan="4">Niciun rezultat. Încearcă alt cuvânt sau sens.</td></tr>'}
function openStudy(t){
studyReturn=currentView;studyTopic=t;$('studyTitle').textContent=t.title;
$('studyIntro').textContent='Toate cele '+t.qs.length+(t.qs.length<20?' ':' de ')+t.unit[1]+' din temă'+(t.groups?': '+t.groups.map(g=>g+': '+t.qs.filter(q=>q.group===g).length).join(' · '):'')+'.';
$('studyGuide').innerHTML=guideDetails(t,true);$('studyFilterField').hidden=!t.groups;$('studyFilterLabel').textContent=t.groupLabel||'Filtrează';
$('studyFilter').innerHTML='<option value="all">Toate</option>'+(t.groups||[]).map(g=>'<option>'+escape(g)+'</option>').join('');$('search').value='';renderStudy();show('study')}

// ---------- Evenimente ----------
$('start').onclick=()=>begin(pickFrom(pool(),$('selection').value,countValue(),$('shuffle').checked).qs,{mode:$('mode').value,feedbackMode:$('feedbackMode').value,topic:cur});
$('todayStart').onclick=()=>begin(pickFrom(allItems,'smart',Number($('todayCount').value)).qs,{mode:'auto',feedbackMode:'practice',topic:null});
$('retry').onclick=()=>begin(shuffled(state.answers.filter(a=>!a.ok).map(a=>byId[a.id])),{mode:state.mode,feedbackMode:'practice',topic:state.topic});
$('check').onclick=()=>check();$('skip').onclick=()=>check(true);$('next').onclick=advance;
$('prev').onclick=()=>{if(state.active&&state.index>0){state.index--;renderQuestion()}};
$('quit').onclick=()=>{if(!confirm('Închei sesiunea acum? Vei vedea scorul pentru întrebările la care ai răspuns.'))return;if(state.answers.some(Boolean))finish();else{state.active=false;show(state.topic?'topic':'home')}};
$('newTest').onclick=()=>show(state.topic?'topic':'home');$('navHome').onclick=()=>show('home');
$('resultStudy').onclick=()=>openStudy(state.topic);$('topicStudy').onclick=()=>openStudy(cur);$('studyBack').onclick=()=>show(studyReturn);
$('search').oninput=renderStudy;$('studyFilter').onchange=renderStudy;
$('topicGrid').onclick=e=>{const b=e.target.closest('[data-topic]');if(b)openTopic(b.dataset.topic)};
$('exportP').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:2,progress,history},null,1)],{type:'application/json'}));a.download='progres-deutsch.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('importP').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;f.text().then(txt=>{const j=JSON.parse(txt),incoming=clean(j.progress),n=Object.keys(incoming).length;if(!n){alert('Fișierul nu conține progres valid pentru aceste teme.');return}if(!confirm(auth?'Combini progresul din fișier ('+n+' întrebări) cu cel din cont? Se păstrează varianta cea mai recentă pentru fiecare întrebare.':'Înlocuiești progresul actual cu cel din fișier ('+n+' întrebări)?'))return;if(auth){for(const g in incoming){const p=progress[g];if(!p||incoming[g].last>p.last){progress[g]=incoming[g];queueProgress(g)}}}else{progress=incoming;history=cleanHistory(j.history)}save();renderHome()}).catch(()=>alert('Fișierul nu a putut fi citit. Alege un fișier exportat din această pagină.'))};
$('resetP').onclick=()=>{if(!confirm(auth?'Ștergi tot progresul de repetare din cont? Istoricul sesiunilor rămâne înregistrat. Acțiunea nu poate fi anulată.':'Ștergi tot progresul salvat în acest browser? Acțiunea nu poate fi anulată.'))return;progress=Object.create(null);if(auth){outbox.p=[];enqueue({k:'dp'})}else history=[];save();renderHome()};
document.addEventListener('keydown',e=>{
if(currentView!=='quiz'||e.repeat)return;
if(e.key==='Enter'){const t=e.target;if(t.tagName==='BUTTON'&&!t.matches('.option,[data-case]'))return;e.preventDefault();if(state.locked)advance();else check()}
if(!state.locked&&state.active&&modeFor(state.qs[state.index])==='choice'&&/^[1-4]$/.test(e.key)){e.preventDefault();$('answerArea').querySelectorAll('.option')[Number(e.key)-1]?.click()}});

// ---------- Cont și sincronizare (Supabase) ----------
// Dacă la build nu există config.json, aplicația rămâne locală (fără cont) și nu face nicio cerere de rețea.
const CFG=(()=>{try{return JSON.parse(document.getElementById('config').textContent)}catch{return null}})();
const CLOUD=!!(CFG&&CFG.url&&CFG.key),AKEY='deutsch-auth-v1',OKEY='deutsch-outbox-v1';
let auth=null,outbox={q:[],p:[]},flushing=false;
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
function dropSession(){auth=null;progress=Object.create(null);history=[];outbox={q:[],p:[]};state={active:false};try{localStorage.removeItem(AKEY)}catch{}showLogin()}
async function api(path,opt={}){
if(auth.expires_at<Date.now()&&!await refreshSession())throw new Error('auth');
const go=()=>fetch(CFG.url+path,{method:opt.method||'GET',headers:{apikey:CFG.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json',...(opt.headers||{})},body:opt.body===undefined?undefined:JSON.stringify(opt.body)});
let r=await go();
if(r.status===401&&await refreshSession())r=await go();
return r}
// Coada de trimitere: ce nu ajunge pe server (offline, eroare) rămâne salvat local și se retrimite.
const saveOutbox=()=>{try{localStorage.setItem(OKEY+sfx(),JSON.stringify(outbox))}catch{}};
function loadOutbox(){try{const o=JSON.parse(localStorage.getItem(OKEY+sfx()));outbox={q:Array.isArray(o&&o.q)?o.q:[],p:Array.isArray(o&&o.p)?o.p:[]}}catch{outbox={q:[],p:[]}}}
function enqueue(op){outbox.q.push(op);saveOutbox();flush()}
function queueProgress(g){if(!outbox.p.includes(g))outbox.p.push(g);saveOutbox();flush()}
function setSync(){if(!auth)return;const n=outbox.q.length+outbox.p.length;$('syncState').textContent=!navigator.onLine?'Offline':n?n+' de trimis':'Sincronizat'}
async function send(path,method,body,prefer){const r=await api(path,{method,body,headers:{Prefer:[prefer,'return=minimal'].filter(Boolean).join(',')}});return r.ok?'ok':(r.status>=500||r.status===429||r.status===401||r.status===408)?'retry':(console.warn('Sincronizare respinsă',r.status,path),'drop')}
function sendOp(op){
if(op.k==='s')return send('/rest/v1/sessions?on_conflict=id','POST',[op.row],'resolution=ignore-duplicates');
if(op.k==='sf')return send('/rest/v1/sessions?id=eq.'+encodeURIComponent(op.id),'PATCH',op.patch,'');
if(op.k==='a')return send('/rest/v1/answers?on_conflict=id','POST',op.rows,'resolution=ignore-duplicates');
if(op.k==='dp')return send('/rest/v1/progress?item_id=not.is.null','DELETE',undefined,'');
return 'drop'}
async function flush(){
if(!auth||flushing)return;flushing=true;
try{for(let guard=0;guard<500;guard++){
if(outbox.q.length){if(await sendOp(outbox.q[0])==='retry')break;outbox.q.shift();saveOutbox();continue}
if(outbox.p.length){const gids=outbox.p.slice(0,200),rows=gids.filter(g=>progress[g]).map(rowOf);if(rows.length&&await send('/rest/v1/progress?on_conflict=user_id,item_id','POST',rows,'resolution=merge-duplicates')==='retry')break;outbox.p=outbox.p.filter(g=>!gids.includes(g));saveOutbox();continue}
break}}catch{}
flushing=false;setSync()}
// La autentificare: trimite ce e în așteptare, apoi combină progresul din cont cu cel local (câștigă cel mai recent).
async function sync(){
try{
await flush();
const r=await api('/rest/v1/progress?select=item_id,box,due,seen,right_count,wrong_count,last&limit=1000');
if(r.ok){const remote=Object.create(null),rows=await r.json();
for(const x of rows)remote[x.item_id]={box:x.box,due:Number(x.due),seen:x.seen,right:x.right_count,wrong:x.wrong_count,last:Number(x.last)};
const inc=clean(remote);
for(const g in inc){const p=progress[g];if(!p||inc[g].last>p.last)progress[g]=inc[g];else if(p.last>inc[g].last)queueProgress(g)}
for(const g in progress)if(!remote[g])queueProgress(g)}
if(!outbox.q.length){const s=await api('/rest/v1/sessions?select=topic,started_at,n,correct,pct&finished_at=not.is.null&order=started_at.desc&limit=40');
if(s.ok)history=cleanHistory((await s.json()).map(x=>({t:Date.parse(x.started_at),topic:x.topic,pct:x.pct,n:x.n,correct:x.correct})).reverse())}
save();if(currentView==='home')renderHome();if(currentView==='topic')renderTopic()}catch{}
setSync()}
function showLogin(){$('logout').hidden=$('userEmail').hidden=$('syncState').hidden=true;$('loginError').hidden=true;show('login')}
async function afterLogin(){
loadProgress();loadOutbox();$('userEmail').textContent=auth.user.email;$('userEmail').hidden=$('syncState').hidden=$('logout').hidden=false;
$('storeNote').textContent='Progresul și sesiunile tale se salvează în contul tău și se sincronizează între dispozitive. Exportă-l dacă vrei o copie.';
$('footNote').textContent='Exemple adaptate pentru test · Date salvate în contul personal.';
show('home');setSync();sync()}
if(CLOUD){
$('footNote').textContent='Exemple adaptate pentru test · Date salvate în contul personal.';
$('loginForm').onsubmit=async e=>{e.preventDefault();const b=$('loginBtn');b.disabled=true;$('loginError').hidden=true;
try{await authCall('password',{email:$('email').value.trim(),password:$('password').value});$('password').value='';await afterLogin()}
catch(err){$('password').value='';$('loginError').textContent=err.message==='bad'?'Email sau parolă incorecte.':'Nu m-am putut conecta la server. Verifică conexiunea și încearcă din nou.';$('loginError').hidden=false}
b.disabled=false};
$('logout').onclick=async()=>{await flush();try{await api('/auth/v1/logout',{method:'POST'})}catch{}dropSession()};
addEventListener('online',()=>{if(auth){flush().then(sync)}else setSync()});addEventListener('offline',setSync);
setInterval(()=>{if(auth)flush()},30000)}

// ---------- Inițializare ----------
if(!CLOUD){loadProgress();show('home')}
else{try{auth=JSON.parse(localStorage.getItem(AKEY))}catch{auth=null}if(auth&&auth.user&&auth.user.id&&auth.refresh_token)afterLogin();else{auth=null;showLogin()}}
