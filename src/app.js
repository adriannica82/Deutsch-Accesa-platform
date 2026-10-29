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
function show(id){VIEWS.forEach(x=>$(x).hidden=x!==id);currentView=id;$('navHome').hidden=id==='home'||id==='quiz'||id==='login';if(id==='home')renderHome();if(id==='topic')renderTopic();if(id!=='login')pushView(id);window.scrollTo(0,0)}
function renderHome(){
$('heroTopics').textContent=countRo(topics.length,['temă','teme']);$('heroItems').textContent=countRo(allItems.length,['întrebare','întrebări']);
$('progressStats').innerHTML=statsHtml(allItems);$('timeStats').innerHTML=timeHtml();$('storeWarn').hidden=storageOK;
const r=pickFrom(allItems,'smart',Number($('todayCount').value)),due=allItems.filter(isDue).length,fresh=allItems.filter(q=>!P(q)).length;
$('todayInfo').textContent=r.filled?'Nu mai ai nimic scadent; primești cele mai apropiate repetări.':due+' de repetat acum · '+fresh+' noi, din '+allItems.length+' întrebări în toate temele.';
$('topicGrid').innerHTML=topics.map(t=>{const c=counts(t.qs),due=t.qs.filter(isDue).length;return '<button type="button" class="topic" data-topic="'+t.id+'"><div class="row"><span class="label">'+escape(t.level)+'</span><span class="pill">'+countRo(t.qs.length,t.unit)+'</span></div><h3>'+escape(t.title)+'</h3><div class="small muted" lang="de">'+escape(t.titleDe||'')+'</div><p class="small">'+escape(t.summary)+'</p>'+bar(c,t.qs.length)+'<div class="small muted">'+(due?due+' de repetat · ':'')+c.new+' noi · '+c.done+' stăpânite</div></button>'}).join('');
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
const dur=stopClock();history.push({t:Date.now(),topic:t?t.id:'mix',pct,n,correct,sec:dur||undefined});history=history.slice(-40);save();if(auth)enqueue({k:'sf',id:state.sid,patch:{finished_at:new Date().toISOString(),n,correct,pct,duration_s:dur}});show('results');$('timeResult').innerHTML=timeResultHtml(dur,n);
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
$('newTest').onclick=()=>show(state.topic?'topic':'home');$('navHome').onclick=()=>show('home');
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
let auth=null,outbox={q:[],p:[],d:{}},flushing=false;
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
function dropSession(){profile=null;profileFresh=false;pendingPrompt=false;auth=null;progress=Object.create(null);history=[];timeLog=Object.create(null);clock=null;outbox={q:[],p:[],d:{}};state={active:false};try{localStorage.removeItem(AKEY)}catch{}showLogin()}
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
function setSync(){if(!auth)return;const n=outbox.q.length+outbox.p.length+Object.keys(outbox.d).length;$('syncState').textContent=!navigator.onLine?'Offline':n?n+' de trimis':'Sincronizat'}
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
flushing=false;setSync()}
// La autentificare: trimite ce e în așteptare, apoi combină progresul din cont cu cel local (câștigă cel mai recent).
async function sync(){
try{
await flush();
if(!outbox.q.some(o=>o.k==='pf')){const pr=await api('/rest/v1/profiles?select=display_name,avatar,league_registered,league_prompt_skip,league_prompted_at,registered_at&limit=1');if(pr.ok){profile=(await pr.json())[0]||{};profileFresh=true;try{localStorage.setItem(PROFKEY+sfx(),JSON.stringify(profile))}catch{}renderLeagueCard();maybePrompt()}}
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
function showLogin(){$('logout').hidden=$('userEmail').hidden=$('syncState').hidden=true;$('loginError').hidden=true;show('login')}
async function afterLogin(){
loadProgress();loadOutbox();loadProfile();$('userEmail').textContent=auth.user.email;$('userEmail').hidden=$('syncState').hidden=$('logout').hidden=false;
$('storeNote').textContent='Conectat ca '+auth.user.email+'. Progresul și sesiunile tale se salvează în contul tău și se sincronizează între dispozitive. Exportă-l dacă vrei o copie.';
$('footNote').textContent='Exemple adaptate pentru test · Date salvate în contul personal.';
show('home');setSync();sync()}
if(CLOUD){
$('footNote').textContent='Exemple adaptate pentru test · Date salvate în contul personal.';
$('loginForm').onsubmit=async e=>{e.preventDefault();const b=$('loginBtn');b.disabled=true;$('loginError').hidden=true;
try{await authCall('password',{email:$('email').value.trim(),password:$('password').value});$('password').value='';pendingPrompt=true;await afterLogin()}
catch(err){$('password').value='';$('loginError').textContent=err.message==='bad'?'Email sau parolă incorecte.':'Nu m-am putut conecta la server. Verifică conexiunea și încearcă din nou.';$('loginError').hidden=false}
b.disabled=false};
$('logout').onclick=async()=>{await flush();try{await api('/auth/v1/logout',{method:'POST'})}catch{}dropSession()};
addEventListener('online',()=>{if(auth){flush().then(sync)}else setSync()});addEventListener('offline',setSync);
setInterval(()=>{if(auth)flush()},30000)}

// ---------- Liga: înscrierea la provocarea săptămânală ----------
// Pop-up-ul apare după o autentificare nouă (parolă introdusă), cel mult o dată pe zi, doar dacă datele contului s-au încărcat
// de pe server și utilizatorul nu este înscris și nu a bifat „Nu-mi mai aminti”. Alegerile se salvează în `profiles`.
const PROFKEY='deutsch-profile-v1',AVATARS=['🦊','🐼','🦉','🐯','🐸','🦄','🐙','🦁','🐧','🦋','🐢','🐳'];
let profile=null,profileFresh=false,pendingPrompt=false,ldMode='prompt',ldHandled=false;
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const defaultName=()=>{const w=((auth&&auth.user.email)||'').split('@')[0].split(/[._+-]/)[0];return w?w.charAt(0).toUpperCase()+w.slice(1,24):''};
function loadProfile(){try{profile=JSON.parse(localStorage.getItem(PROFKEY+sfx()))}catch{profile=null}profileFresh=false}
function patchProfile(patch){profile=Object.assign({},profile||{},patch);try{localStorage.setItem(PROFKEY+sfx(),JSON.stringify(profile))}catch{}enqueue({k:'pf',patch});renderLeagueCard()}
function renderLeagueCard(){
const c=$('leagueCard');if(!c)return;
if(!CLOUD||!auth||(!profile&&!profileFresh)){c.hidden=true;return}
const reg=profile&&profile.league_registered;c.hidden=false;
c.innerHTML=reg
?'<div class="label">LIGA TA</div><h2 style="margin-top:12px"><span aria-hidden="true">'+escape(profile.avatar)+'</span> '+escape(profile.display_name)+'</h2><p class="muted small">Ești înscris la provocarea săptămânală. Clasamentul și punctele XP apar în curând; până atunci îți poți continua exercițiile.</p><div class="tools" style="margin-top:0"><button type="button" class="quiet back" data-league="edit">Editează profilul</button><button type="button" class="quiet back" data-league="leave">Retrage-te</button></div>'
:'<div class="label">LIGA TA</div><h2 style="margin-top:12px">Provocarea săptămânală</h2><p class="muted small">Aduni XP din teste și te compari cu colegii într-un clasament de luni până duminică. Temele mai grele aduc mai multe puncte.</p><button type="button" class="primary allwidth" data-league="join">Înscrie-te</button>'}
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
patchProfile(patch);ldHandled=true;$('leagueDialog').close()}
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
if(a==='join')openLeagueDialog('register');else if(a==='edit')openLeagueDialog('edit');
else if(a==='leave'&&confirm('Te retragi din provocarea săptămânală? Poți reveni oricând din cardul „Liga ta”.'))patchProfile({league_registered:false,league_prompt_skip:true})}}

// ---------- Istoric: butonul „înapoi” și gestul de pe iPhone ----------
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
else show('home')}
finally{navSilent=false}});

// ---------- Inițializare ----------
if(!CLOUD){loadProgress();show('home')}
else{try{auth=JSON.parse(localStorage.getItem(AKEY))}catch{auth=null}if(auth&&auth.user&&auth.user.id&&auth.refresh_token)afterLogin();else{auth=null;showLogin()}}
