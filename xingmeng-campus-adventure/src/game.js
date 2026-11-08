(()=>{'use strict';
const $=id=>document.getElementById(id), HOUR=CampusSave.HOUR, SAVE=CampusSave.KEY, firstNames=['雨桐','梓轩','诗涵','宇航','思远','子墨','欣怡','泽宇','依诺','浩然','可欣','乐乐','沐阳','一诺','知远','嘉怡','睿哲','安然','语晨','星宇','佳宁','俊熙','书瑶','博文','若溪','晨曦','芷晴','奕辰','思齐','沐宸','芊羽','奕然','心怡','明轩','悦然','可昕','亦凡','知夏','乐彤','子恒','昕妍','梓萱','凌霄','昱辰','嘉禾','语彤','璟雯','宁远','景行','念初','锦程','笑语','若安','青禾','南星','予安','知微','林溪','晨雨','亦舟','明哲','安宁','书晴','星野','心禾','文轩','希言'], lastNames=['王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗','梁','宋'];
const topics=['阅读','数学','科学','语文','几何','观察','文学','计算','自然','表达','推理','地理','写作','数感','天文','词语','应用','生态','生命','拼音','逻辑','化学'];
const zones={air:{name:'晴空机场',icon:'✈️',children:[['air-cockpit','✈️ 驾驶舱'],['air-cabin','💺 客舱'],['air-hangar','🛠️ 维修机库']]},yacht:{name:'蔚蓝游艇',icon:'🛥️',children:[['yacht-deck','⚓ 甲板'],['yacht-bridge','🧭 船长室'],['yacht-treasure','💎 海底宝库']]},train:{name:'星梦轻轨',icon:'🚈',children:[['train-car','🚈 乘客车厢'],['train-control','🚦 控制中心'],['train-tunnel','🔦 神秘隧道']]},car:{name:'校园小车',icon:'🚗',children:[['car-drive','🏁 试车道'],['car-garage','🔧 车库'],['car-lab','⚙️ 工程车间']]},library:{name:'知识图书馆',icon:'📚',children:[['library-read','📖 阅读区'],['library-stack','📚 藏书室'],['library-secret','🗝️ 秘密书房']]},lab:{name:'未来科学馆',icon:'🧪',children:[['lab-chem','⚗️ 化学实验室'],['lab-robot','🤖 机器人室'],['lab-star','🔭 天文研究室']]},garden:{name:'奇妙花园',icon:'🌷',children:[['garden-glass','🌿 温室'],['garden-maze','🦋 花园迷宫'],['garden-secret','🪄 隐藏树屋']]}};
const studentsFor=c=>[0,1,2,3].map((j)=>({name:lastNames[(c+j*9)%22]+firstNames[((c-1)*3+j)%firstNames.length],seed:100+c*3+j,index:j}));
const teacherFor=c=>({name:lastNames[(c+9)%22]+'老师',seed:500+c,adult:true});
const secretParents = {
  'secret-entrance':'class-22', 'secret-shadow':'secret-entrance', 'secret-monster':'secret-shadow',
  'secret-guard':'secret-monster', 'secret-boss':'secret-guard', 'secret-final':'secret-boss'
};
function isScene(id) {
  return typeof id === 'string' && (
    ['campus', 'street', 'hall', 'floor-1', 'floor-2', CampusBellRoom.ID].includes(id) || CampusDistricts.isScene(id) ||
    /^class-([1-9]|1[0-9]|2[0-2])$/.test(id) || Object.hasOwn(secretParents, id) ||
    Object.hasOwn(zones, id) || Object.values(zones).some(z => z.children.some(([child]) => child === id))
  );
}
let s = CampusSave.read({ getItem: key => localStorage.getItem(key) }, isScene);

let currentQuiz = null, dialogMode = '', dialogRevision = 0, audioCtx = null, musicTimer, toastTimer;
let sceneMarkers = [], sceneCamera = null, camera = { theta:.72, phi:.70, dist:42, target:[0,2,0] }, lastFrame = 0;
let playerHeading = Math.PI, keysHeld = new Map(), touchHeld = new Map();
const clearInput = () => { keysHeld.clear(); touchHeld.clear(); };
const modalOpen = () => !$('shade').classList.contains('hidden') || !$('welcome').classList.contains('hidden');
function save(){try{localStorage.setItem(SAVE,JSON.stringify(s))}catch(e){}}
function sound(freq=650,duration=.12,type='sine',volume=.065,delay=0){if(!s.audio)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime+delay);g.gain.setValueAtTime(volume,audioCtx.currentTime+delay);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+delay+duration);o.connect(g).connect(audioCtx.destination);o.start(audioCtx.currentTime+delay);o.stop(audioCtx.currentTime+delay+duration+.025);}catch(e){}}
const fx={click:()=>sound(430,.08,'sine',.035),success:()=>{sound(523,.13);sound(659,.12,'sine',.06,.12);sound(784,.22,'sine',.05,.26)},wrong:()=>{sound(215,.17,'triangle',.06);sound(176,.23,'triangle',.04,.13)},coin:()=>{sound(790,.09,'sine',.06);sound(1046,.18,'sine',.06,.09)},unlock:()=>{[392,523,659,784].forEach((x,i)=>sound(x,.25,'sine',.055,i*.12))}};
function music(){clearInterval(musicTimer);if(!s.audio)return;let ix=0,mel=[262,330,392,330,294,349,440,392,330,294,262,392,349,330,294,262];musicTimer=setInterval(()=>{if(!s.audio)return; sound(mel[ix%mel.length],.24,'sine',.014);ix++;},780)}
function toast(msg){const b=$('toast');b.textContent=msg;b.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>b.classList.add('hidden'),3200)}
function hud(){ if($('goSecret'))$('goSecret').classList.toggle('hidden',!s.flags.includes('secret-seen')); $('hStar').textContent='⭐ '+s.star; $('hCoin').textContent='🪙 '+s.coin; $('hStamp').textContent='🏅 '+s.stamps.length+'/22';$('hLevel').textContent='📚 二上 · 语'+s.learning.subjects.cn.level+' 数'+s.learning.subjects.ma.level;let q=[['完成12道每小时题',!s.locked],['认识20位同学',s.talk.length>=20],['集齐22枚班级印章',s.stamps.length>=22],['探索12处隐藏彩蛋',s.eggs.length>=12],['走过三条街',CampusDistricts.streets.every(area=>s.visits.includes(area.id))],['破解22班禁区四重谜题',s.flags.includes('secret-clear')],['救出四间教室的同学',[4,9,15,22].every(c=>s.flags.includes('stone-cleared-'+c))]];$('taskList').innerHTML=q.map(([t,on])=>'<div class="quest">'+(on?'✅':'⬜')+' '+t+'</div>').join('');$('taskProg').style.width=(100*q.filter(x=>x[1]).length/q.length)+'%';}
function reward(star=1,coin=5){s.star+=star;s.coin+=coin;hud();save();fx.coin()}
function action(kind,title,id,x,y,z,fn){sceneMarkers.push({kind,title,id,x,y,z,fn});return [kind,title,id,x,y,z,fn]}
function guard(fn){if(modalOpen())return;if(s.locked){openQuiz();return}fx.click();fn()}
function go(id) {
  if (modalOpen()) return;
  if (s.locked) { openQuiz(); return; }
  if (!isScene(id) || id === s.scene || !neighborhood.dismount()) return;
  const previous = s.scene;
  s.scene = id;
  if (id.startsWith('secret-') && !s.flags.includes('secret-seen')) s.flags.push('secret-seen');
  if (id.startsWith('class-')) s.floor = Number(id.slice(6)) <= 11 ? 1 : 2;
  if (id.startsWith('floor-')) s.floor = Number(id.slice(6));
  if (!s.visits.includes(id)) { s.visits.push(id); s.coin += 2; toast('发现新地点：+2金币！'); }
  const bellSpawn = id===CampusBellRoom.ID ? CampusBellRoom.SPAWN :
    id==='campus'&&previous===CampusBellRoom.ID ? CampusBellRoom.CAMPUS_RETURN : null;
  const spawn = bellSpawn || CampusDistricts.spawn(id,previous) || (id === 'street' ? CampusWorld.STREET_SPAWN : {x:0,z:6});
  s.px = spawn.x;
  s.pz = spawn.z;
  playerHeading = CampusDistricts.isOutdoor(id) ? 0 : Math.PI;
  clearInput();
  neighborhood.reset();
  fx.click();
  renderScene();
  save();
}
function back() {
  const id = s.scene;
  if (id === 'campus') return;
  const districtParent = CampusDistricts.parent(id);
  if (districtParent) go(districtParent);
  else if (Object.hasOwn(secretParents, id)) go(secretParents[id]);
  else if (id.startsWith('class-')) go('floor-' + s.floor);
  else if (id.startsWith('floor-')) go('hall');
  else if (id.includes('-')) go(id.split('-')[0]);
  else go('campus');
}

function uniqueCollect(id,label){if(s.eggs.includes(id)){toast('已经收集过这个彩蛋啦！');return}s.eggs.push(id);reward(3,15);toast('✨ '+label+'：获得3颗星星和15金币');}
function markTalk(key){if(!s.talk.includes(key)){s.talk.push(key);reward(1,3)}}
function portrait(p){let n=p.seed, skin=['#edbf9e','#f1caa8','#d9a67f','#f4d0b3','#e7b691'][n%5], hair=['#382b2c','#614031','#241f29','#74492e','#49312e','#342e32'][n%6], shirt=['#6b84bd','#619a92','#b36d81','#937ac3','#d69467'][n%5], long=n%3===0, glasses=n%7===0;return `<div class="portrait"><svg viewBox="0 0 120 135" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg${n}" x2=".7" y2="1"><stop stop-color="#d9e7fb"/><stop offset="1" stop-color="#a5bfe4"/></linearGradient><radialGradient id="face${n}" cx=".38" cy=".36" r=".74"><stop stop-color="#fff1d8"/><stop offset=".5" stop-color="${skin}"/><stop offset="1" stop-color="#b67d66"/></radialGradient><linearGradient id="coat${n}"><stop stop-color="#354b80"/><stop offset=".47" stop-color="${shirt}"/><stop offset="1" stop-color="#314977"/></linearGradient></defs><rect width="120" height="135" fill="url(#bg${n})"/><ellipse cx="60" cy="136" rx="64" ry="47" fill="url(#coat${n})"/><path d="M43 100 L42 125 L60 130 L78 125 L76 100 Z" fill="${skin}"/><path d="M34 106 L60 128 L84 106 L99 135 L20 135 Z" fill="#edf1f8" opacity=".88"/>${long?`<path d="M22 45 Q17 91 14 121 Q34 137 42 115 L38 61 Z M82 57 L85 118 Q102 130 106 111 L99 42 Z" fill="${hair}"/>`:''}<ellipse cx="60" cy="64" rx="37" ry="45" fill="${hair}"/><path d="M26 64 Q23 96 43 109 Q61 119 81 107 Q101 90 94 58 Q90 30 59 28 Q30 29 26 64Z" fill="url(#face${n})"/><ellipse cx="25" cy="74" rx="6" ry="10" fill="${skin}"/><ellipse cx="95" cy="74" rx="6" ry="10" fill="${skin}"/><path d="M23 58 Q16 18 55 18 Q86 11 101 49 Q92 34 75 36 Q48 48 23 58Z" fill="${hair}"/><path d="M28 53 Q49 36 71 32 Q64 48 39 57Z" fill="${hair}"/><path d="M37 65 Q47 60 52 65 M68 65 Q78 60 84 65" fill="none" stroke="#564038" stroke-width="2.3" stroke-linecap="round"/><ellipse cx="46" cy="72" rx="7" ry="4.4" fill="#fff"/><ellipse cx="77" cy="72" rx="7" ry="4.4" fill="#fff"/><ellipse cx="47" cy="72" rx="3.8" ry="4" fill="#514335"/><ellipse cx="77" cy="72" rx="3.8" ry="4" fill="#514335"/><circle cx="48" cy="70.5" r="1.3" fill="white"/><circle cx="78" cy="70.5" r="1.3" fill="white"/><path d="M60 72 Q56 82 61 86" stroke="#b57f70" stroke-width="1.7" fill="none"/><path d="M51 94 Q60 100 70 94" stroke="#a96061" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="86" rx="8" ry="3.5" fill="#da8d84" opacity=".26"/><ellipse cx="82" cy="86" rx="8" ry="3.5" fill="#da8d84" opacity=".26"/>${glasses?'<g stroke="#62513d" stroke-width="2.4" fill="none"><circle cx="46" cy="73" r="12"/><circle cx="77" cy="73" r="12"/><path d="M58 72 Q62 69 65 72 M34 72 L24 69 M89 72 L98 69"/></g>':''}</svg></div>`}
function dialog(title, body, closable = true) {
  dialogRevision++;
  clearInput();
  dialogMode = closable ? 'normal' : 'locked';
  $('dTitle').textContent = title;
  $('dBody').innerHTML = body;
  $('shade').classList.remove('hidden');
  $('dClose').classList.toggle('hidden', !closable);
}
function closeDialog() {
  if (dialogMode === 'locked') return;
  dialogRevision++;
  if (currentQuiz?.kind === 'class') currentQuiz = null;
  $('shade').classList.add('hidden');
  dialogMode = '';
}
function advanceDialog(callback, delay) {
  const revision = dialogRevision;
  setTimeout(() => { if (revision === dialogRevision) callback(); }, delay);
}

function personDialog(p,lines,opts={}){let key=opts.key||p.name;markTalk(key);dialog('💬 和 '+p.name+' 交流',`<div class="portraitrow">${portrait(p)}<div><div class="speechname">${p.name}</div><div class="speechtext">${lines}</div></div></div><p class="sm" style="margin-top:14px">和校园人物交朋友，可以获得新的任务与奖励。</p><button class="btn blue full" id="personEnd">继续探索</button>`);$('personEnd').onclick=closeDialog}
function studentQuest(c,i,p){let key='student-'+c+'-'+i;markTalk(key);let interests=['我正在做一份关于'+topics[c-1]+'的研究笔记。','我喜欢观察校园里的事物，也擅长提出新问题。','我收藏了许多科学和数学的小知识卡。','我在研究星梦校园的秘密路线，可以和我一起解谜。'],done=s.flags.includes('student-quest-'+c+'-'+i);dialog('👥 '+c+'班同学 · '+p.name,`<div class="portraitrow">${portrait(p)}<div><div class="speechname">${p.name}</div><div class="speechtext">${interests[i]}<br>和我一起挑战一道稍有难度的题吧！${done?'<br><b>你已获得我的友谊贴纸。</b>':''}</div></div></div><div style="display:flex;gap:9px;margin-top:16px;flex-wrap:wrap"><button class="btn blue" id="studentStart">🧠 ${done?'再练习一次':'挑战同学 · 赢取贴纸'}</button><button class="btn" id="studentEnd">继续探索</button></div>`);$('studentStart').onclick=()=>studentMiniQuestion(c,i,p);$('studentEnd').onclick=closeDialog;}
function studentMiniQuestion(c,i,p){let type=['cn','ma','sci','cn'][i],item=CampusLearning.singleQuestion(type,c*13+i,s.learning),q=item.q,flag='student-quest-'+c+'-'+i;dialog('🧩 '+p.name+'的知识挑战',`<div class="portraitrow" style="align-items:start">${portrait(p)}<div><div class="quizmeta">${c}班 · 友谊小任务</div><div class="quiztitle" style="font-size:16px">${q[0]}</div></div></div><div class="choices" id="miniChoices">${q[1].map((v,k)=>`<button data-mini="${k}">${'ABCD'[k]}. ${v}</button>`).join('')}</div><div id="miniFeedback" class="sm" style="min-height:22px"></div><button class="btn full" id="miniBack">返回同学对话</button>`);$('miniBack').onclick=()=>studentQuest(c,i,p);$('miniChoices').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{let k=Number(btn.dataset.mini);if(k===q[2]){s.learning=CampusLearning.record(s.learning,item,Number($('miniFeedback').dataset.errors||0),'friend');save();hud();fx.success();btn.classList.add('correct');$('miniChoices').querySelectorAll('button').forEach(x=>x.disabled=true);let added=!s.flags.includes(flag);if(added){s.flags.push(flag);reward(2,6)}$('miniFeedback').innerHTML=`<div class="explain">✅ 答对！${q[3]}<br>${added?'获得 2 颗星星、6 金币和一张友谊贴纸。':'本题已经领取过奖励，继续努力！'}</div>`;}else{$('miniFeedback').dataset.errors=String(Number($('miniFeedback').dataset.errors||0)+1);fx.wrong();btn.classList.add('wrong');$('miniFeedback').textContent='再思考一下。提示：'+q[3];setTimeout(()=>btn.classList.remove('wrong'),600)}});}
function runAction(key,label){if(key==='principal')personDialog({seed:720,adult:true,name:'林校长'},'欢迎进入星梦学校！找到22位老师，完成22枚班级印章挑战；学校还有一座科学馆、图书馆和音乐喷泉。',{key:'principal'});else if(key==='egg')uniqueCollect('campus-lucky','音乐喷泉下的水晶星星');else if(key==='desk')uniqueCollect('hall-scroll','校长桌上的秘密藏宝图');else if(key==='clock')uniqueCollect('hall-clock','钟楼隐藏的时间徽章');else if(key==='chalk'){uniqueCollect('blackboard-'+s.scene,'黑板后的知识贴纸')}else if(key==='book'){uniqueCollect('books-'+s.scene,'书架里的金色书签')}else if(key==='cabinet'){uniqueCollect('cabinet-'+s.scene,'柜子里的探险纪念章')}else if(key==='safe'){uniqueCollect('safe-'+s.scene,'隐藏在深处的秘密宝藏')}else if(key==='transport'){let id='task-'+s.scene;if(s.flags.includes(id)){toast('本地点的检查任务已经完成！');return;}s.flags.push(id);reward(2,12);toast('完成场景检查任务！ +2星星 +12金币')}else if(key.startsWith('student-')){let i=Number(key.split('-')[1]),c=Number(s.scene.split('-')[1]);if(i===3&&hornState&&hornState.c===c&&hornState.lost){toast('⚠️ 这位同学暂时变成星尘，请先通过救援结界答题。');stoneRescue(c);return;}let p=studentsFor(c)[i],lines=[`我叫${p.name}。我们班最近在学${topics[c-1]}，你想一起探索教室里的小秘密吗？`,`我叫${p.name}。我在收集校园标本。你知道校园共有22个班吗？`,`我是${p.name}。老师说读书要多思考，答题时先看清题意！`,`我是${p.name}，我正在破解图书馆的谜题，一起努力吧！`];studentQuest(c,i,p);}else if(key==='teacher'){let c=Number(s.scene.split('-')[1]),p=teacherFor(c);markTalk('teacher-'+c);dialog('👩‍🏫 '+c+'班 · 老师互动',`<div class="portraitrow">${portrait(p)}<div><div class="speechname">${p.name}</div><div class="speechtext">欢迎来到二年级${c}班！这是我们的${topics[c-1]}主题课堂。要获得班级印章，需要完成<b>8道适龄题</b>，既有语文、数学，也有科学思考。答错还可以看提示再尝试。</div></div></div><div style="display:flex;gap:8px;margin-top:15px;flex-wrap:wrap"><button class="btn blue" id="startClass">📘 开始8题班级挑战</button><button class="btn" id="skipClass">稍后再做</button></div>`);$('startClass').onclick=()=>startClassQuiz(c);$('skipClass').onclick=closeDialog;} }
function getQuizPlan(kind, idx) {
  const plan = kind === 'hourly' ? s.learning.activeHourly : s.learning.classPlans[idx];
  if (plan?.idx === idx) return plan;
  const next = {idx, questions:CampusLearning.makeQuiz(kind, idx, s.learning, s.round), progress:0, mistakes:0};
  if (kind === 'hourly') s.learning.activeHourly = next;
  else s.learning.classPlans[idx] = next;
  save();
  return next;
}
function openQuiz() {
  if (!currentQuiz) {
    if (!s.locked) return;
    const plan = getQuizPlan('hourly', s.round);
    currentQuiz = { kind:'hourly', idx:s.round, questions:plan.questions, i:s.progress, mistakes:plan.mistakes, answered:false };
  }
  renderQuiz();
}

function renderQuiz(){let qz=currentQuiz;if(!qz)return;let i=qz.i,total=qz.questions.length;if(i>=total){finishQuiz();return}let q=qz.questions[i], types={cn:'📖 语文 · 二上',ma:'➕ 数学 · 二上',sci:'🔬 科学兴趣拓展'};dialog((qz.kind==='hourly'?'🔐 魔法教室 · 第'+s.round+'轮':'🏅 '+qz.idx+'班老师挑战'),`<div class="quizmeta">${types[q.type]} · 第 ${i+1} / ${total} 题</div><div class="progress"><i style="width:${100*i/total}%"></i></div><div class="quiztitle">${escapeText(q.q[0])}</div><div class="choices" id="quizChoices">${q.q[1].map((x,k)=>`<button data-choice="${k}">${'ABCD'[k]}. ${escapeText(x)}</button>`).join('')}</div><div id="quizFeedback" class="sm" style="min-height:25px;margin:10px 0"></div><div id="quizNext" class="hidden" style="text-align:right"><button class="btn blue" id="quizContinue">${i+1===total?'🏆 完成挑战':'下一题 →'}</button></div>${qz.kind==='hourly'?'<div class="warning">🔒 需要完成本轮 12 道适龄题，才能离开魔法教室。答错可重试并查看解析。</div>':'<div class="warning">🏅 班级挑战进行中：答完 8 道题即可领取班级印章。可关闭并稍后继续。</div>'}`,qz.kind==='class');
$('quizChoices').querySelectorAll('button').forEach(b=>b.onclick=()=>answerQuiz(Number(b.dataset.choice)));
}
function answerQuiz(k) {
  const qz = currentQuiz;
  if (!qz || qz.answered) return;
  const item = qz.questions[qz.i], q = item.q;
  const buttons = [...$('quizChoices').querySelectorAll('button')];
  const plan = getQuizPlan(qz.kind, qz.idx);
  if (k === q[2]) {
    qz.answered = true;
    buttons[k].classList.add('correct');
    buttons.forEach(b => b.disabled = true);
    $('quizFeedback').textContent = '✅ 答对了！知识点：' + q[3];
    fx.success();
    $('quizNext').classList.remove('hidden');
    $('quizContinue').onclick = () => {
      CampusLearning.record(s.learning, item, qz.mistakes, qz.kind);
      qz.i++;
      qz.answered = false;
      qz.mistakes = 0;
      plan.progress = qz.i;
      plan.mistakes = 0;
      if (qz.kind === 'hourly') s.progress = qz.i;
      hud();
      // The final answer and the reward are committed together.
      if (qz.i === qz.questions.length) finishQuiz();
      else { save(); renderQuiz(); }
    };
  } else {
    qz.mistakes++;
    plan.mistakes = qz.mistakes;
    save();
    fx.wrong();
    buttons[k].classList.add('wrong');
    $('quizFeedback').textContent = qz.mistakes >= 2 ? '❌ 再试一次。提示：' + q[3] : '❌ 没关系，先圈出题目中的关键词，再试一次。';
    setTimeout(() => buttons[k].classList.remove('wrong'), 600);
  }
}

function finishQuiz(){let qz=currentQuiz;currentQuiz=null;if(qz.kind==='hourly'){delete s.learning.activeHourly;s.locked=false;s.progress=0;s.star+=18;s.coin+=60;s.due=Date.now()+HOUR;save();hud();fx.unlock();dialogMode='normal';dialog('🎉 魔法教室成功解锁',`<div style="text-align:center;font-size:60px">🏆✨</div><h2 style="text-align:center;margin:5px">完成全部 12 道题！</h2><p style="text-align:center" class="sm">6 道语文 + 6 道数学，获得 <b>⭐18 星星 + 🪙60 金币</b>。现在可以自由探索整个 3D 校园了！</p><button class="btn primary full" id="quizFinished">🚪 打开魔法门，开始探险</button>`);$('quizFinished').onclick=()=>{closeDialog();renderScene()}}else{let c=qz.idx;delete s.learning.classPlans[c];if(!s.stamps.includes(c)){s.stamps.push(c);s.star+=8;s.coin+=30;}save();hud();fx.unlock();dialogMode='normal';dialog('🎓 '+c+'班挑战成功',`<div style="text-align:center;font-size:60px">🎓🏅</div><h2 style="text-align:center">领取 ${c} 班知识印章！</h2><p style="text-align:center">你答对了 8 道进阶题，获得 ⭐8 和 🪙30。</p><button class="btn primary full" id="classFinished">返回教室继续探索</button>`);$('classFinished').onclick=()=>{closeDialog();renderScene();if(s.stamps.length===22&&!s.graduated){showGraduation()}}}}
function startClassQuiz(c) {
  if (s.stamps.includes(c)) { toast('你已经获得这个班的印章了！仍可探索班级。'); closeDialog(); return; }
  const plan = getQuizPlan('class', c);
  currentQuiz = {kind:'class', idx:c, questions:plan.questions, i:plan.progress, mistakes:plan.mistakes, answered:false};
  renderQuiz();
}
function tick() {
  if (!s.locked && Date.now() >= s.due) {
    s.locked = true;
    s.round++;
    s.progress = 0;
    currentQuiz = null;
    delete s.learning.activeHourly;
    clearInput();
    save();
    if ($('welcome').classList.contains('hidden')) openQuiz();
  }
  if (s.locked) $('hTimer').textContent = '🔒 第 ' + s.round + ' 轮答题';
  else {
    const left = Math.max(0, s.due - Date.now());
    const mm = String(Math.floor(left / 60000)).padStart(2,'0'), ss = String(Math.floor(left / 1000) % 60).padStart(2,'0');
    $('hTimer').textContent = '⏰ ' + mm + ':' + ss;
  }
}

function showGraduation(){
 s.graduated=true;s.star+=200;s.coin+=500;save();hud();fx.unlock();
 dialog('🏆 星梦校园 · 全校毕业典礼',`<div class="graduation"><div style="font-size:58px">🎓🏆✨</div><h1 style="color:#ae7c39">星梦校园荣誉探险家</h1><p>你完成了全部 <b>22 个班级</b> 的知识挑战，获得全部班级印章！<br>特授予「星梦荣誉探险家」称号、200颗星星和500金币。</p><p>仍然可以继续在校园中自由漫游，完成同学的友谊任务并寻找秘密彩蛋。</p><button id="graduateBack" class="btn primary full">返回校园 · 继续探险</button></div>`);
 $('graduateBack').onclick=()=>{closeDialog();go('campus')};
}
function rebuildAvatar() {
  if (gl) dropBuf(playerBuffer);
  const mesh = new Mesh();
  character(mesh,0,0,0,s.avatar===1?71:70);
  playerBuffer=gl?bufferMesh(mesh):mesh;
}
function welcomeStart(){
  const welcome=$('welcome'), buttons=[...document.querySelectorAll('[data-avatar]')];
  const update=()=>buttons.forEach(button=>button.classList.toggle('selected',Number(button.dataset.avatar)===s.avatar));
  update();
  buttons.forEach(button=>button.onclick=()=>{
    s.avatar=Number(button.dataset.avatar);
    update();
    if(playerBuffer)rebuildAvatar();
    save();
  });
  $('enterGame').onclick=()=>{
    welcome.classList.add('hidden');
    if(s.locked)openQuiz();
    else toast('欢迎回来！去校门外探索放学街区，或继续班级挑战。');
  };
}

/* 3D rendering: purpose-built self-contained WebGL triangle engine, no dependencies */
let gl,shader,atp,atn,atc,uni={},currentMesh=null,markerNodes=[],VIEW,PROJ,VP,playerBuffer=null,softCtx=null,softLayer=null,softStamp='',softLastPaint=0,pixelRatio=1;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), rgb=(h)=>{h=h.replace('#','');return [parseInt(h.substring(0,2),16)/255,parseInt(h.substring(2,4),16)/255,parseInt(h.substring(4,6),16)/255]}, add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=a=>{let m=Math.hypot(...a)||1;return a.map(v=>v/m)};
function mat4mul(a,b){let o=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)o[col*4+row]+=a[k*4+row]*b[col*4+k];return o}
function lookAt(eye,at,up=[0,1,0]){let z=norm(sub(eye,at)),x=norm(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1])}
function perspective(fov,aspect,near,far){let f=1/Math.tan(fov/2);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0])}
class Mesh{constructor(){this.p=[];this.n=[];this.c=[]}tri(a,b,c,color,normal){const n=normal||norm(cross(sub(b,a),sub(c,a))),col=typeof color==='string'?rgb(color):color;for(let v of [a,b,c]){this.p.push(...v);this.n.push(...n);this.c.push(...col)}}quad(a,b,c,d,color,n){this.tri(a,b,c,color,n);this.tri(a,c,d,color,n)}box(x,y,z,w,h,d,col){let hx=w/2,hy=h/2,hz=d/2,p=[[x-hx,y-hy,z-hz],[x+hx,y-hy,z-hz],[x+hx,y+hy,z-hz],[x-hx,y+hy,z-hz],[x-hx,y-hy,z+hz],[x+hx,y-hy,z+hz],[x+hx,y+hy,z+hz],[x-hx,y+hy,z+hz]],faces=[[4,5,6,7,'#000000'],[1,0,3,2,'#000000'],[0,4,7,3,'#000000'],[5,1,2,6,'#000000'],[3,7,6,2,'#000000'],[0,1,5,4,'#000000']];faces.forEach((f,i)=>{let cc=rgb(col).map(v=>clamp(v*([1,.83,.88,.9,1.08,.74][i]),0,1));this.quad(p[f[0]],p[f[1]],p[f[2]],p[f[3]],cc)});}sphere(x,y,z,r,col,segments=20,rings=14,scale=[1,1,1]){let color=rgb(col);for(let j=0;j<rings;j++){let th1=Math.PI*j/rings,th2=Math.PI*(j+1)/rings;for(let i=0;i<segments;i++){let a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;let get=(t,v)=>[x+r*scale[0]*Math.sin(t)*Math.cos(v),y+r*scale[1]*Math.cos(t),z+r*scale[2]*Math.sin(t)*Math.sin(v)],p1=get(th1,a),p2=get(th2,a),p3=get(th2,b),p4=get(th1,b),n=norm([Math.sin((th1+th2)/2)*Math.cos((a+b)/2),Math.cos((th1+th2)/2),Math.sin((th1+th2)/2)*Math.sin((a+b)/2)]);this.quad(p1,p2,p3,p4,color,n)}}}
cylinder(x,y,z,r,h,col,n=20){let c=rgb(col);for(let i=0;i<n;i++){let a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;let v=(t,yy)=>[x+r*Math.cos(t),yy,z+r*Math.sin(t)];this.quad(v(a,y-h/2),v(b,y-h/2),v(b,y+h/2),v(a,y+h/2),c,[Math.cos((a+b)/2),0,Math.sin((a+b)/2)]);this.tri([x,y+h/2,z],v(a,y+h/2),v(b,y+h/2),c,[0,1,0]);this.tri([x,y-h/2,z],v(b,y-h/2),v(a,y-h/2),c,[0,-1,0]);}}
cone(x,y,z,r,h,col,n=12){for(let i=0;i<n;i++){let a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;this.tri([x,y+h/2,z],[x+r*Math.cos(a),y-h/2,z+r*Math.sin(a)],[x+r*Math.cos(b),y-h/2,z+r*Math.sin(b)],col)}}
roof(x,y,z,w,d,rise,col){let a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],d0=[x-w/2,y,z+d/2],r1=[x,y+rise,z-d/2],r2=[x,y+rise,z+d/2];this.quad(a,b,r1,r1,col);this.quad(d0,r2,r1,a,col);this.quad(b,c,r2,r1,col);this.tri(a,r1,b,col);this.tri(d0,c,r2,col);}
line(a,b,r,col){let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],l=Math.hypot(dx,dy,dz),steps=Math.max(2,Math.ceil(l/.3));for(let i=0;i<=steps;i++){let t=i/steps;this.sphere(a[0]+dx*t,a[1]+dy*t,a[2]+dz*t,r,col,6,4)}}
}

Mesh.prototype.roundBox=function(x,y,z,w,h,d,r,col,steps=4){
 r=Math.min(r,w*.49,h*.49,d*.49);const cw=w/2-r,ch=h/2-r,cd=d/2-r,center=[x,y,z],color=typeof col==='string'?rgb(col):col;
 const clampn=(v,low,hi)=>Math.max(low,Math.min(hi,v));
 const vtx=(face,u,v)=>{
  let a=[0,0,0],normFace=[0,0,0];let signs=face%2===0?1:-1;
  if(face<2){a=[signs*w/2,u*h/2,v*d/2];normFace[0]=signs}
  else if(face<4){a=[u*w/2,signs*h/2,v*d/2];normFace[1]=signs}
  else{a=[u*w/2,v*h/2,signs*d/2];normFace[2]=signs}
  let inner=[clampn(a[0],-cw,cw),clampn(a[1],-ch,ch),clampn(a[2],-cd,cd)];
  let delta=a.map((q,i)=>q-inner[i]),m=Math.hypot(...delta);let nn=m>.00001?delta.map(q=>q/m):normFace;
  return {p:inner.map((q,i)=>center[i]+q+nn[i]*r),n:nn}
 };
 const tri=(a,b,c)=>{for(let q of [a,b,c]){this.p.push(...q.p);this.n.push(...q.n);this.c.push(...color)}};
 for(let face=0;face<6;face++)for(let i=0;i<steps;i++)for(let j=0;j<steps;j++){
  let u=-1+2*i/steps,v=-1+2*j/steps,U=-1+2*(i+1)/steps,V=-1+2*(j+1)/steps;
  let a=vtx(face,u,v),b=vtx(face,U,v),c=vtx(face,U,V),d0=vtx(face,u,V);
  tri(a,b,c);tri(a,c,d0);
 }
};
function ellipseShadow(m,x,z,rx,rz,alpha=1){for(let i=0;i<16;i++){
 let a=i*Math.PI/8,b=(i+1)*Math.PI/8;
 m.tri([x,.01,z],[x+Math.cos(a)*rx,.012,z+Math.sin(a)*rz],[x+Math.cos(b)*rx,.012,z+Math.sin(b)*rz],alpha<.5?'#769b8c':'#748f81',[0,1,0]);
}}

const colors={grass:'#7fc79b',path:'#efdac1',brick:'#db967d',roof:'#ad5471',blue:'#538abe',trim:'#fbf2dd',wall:'#f4d8b9',floor:'#d6ae86',board:'#326c68',pink:'#faabd0'};

function character(m,x,y,z,seed=1,adult=false,yaw=0){
 if (yaw) {
   const model = new Mesh();
   character(model,0,0,0,seed,adult);
   const c=Math.cos(yaw),d=Math.sin(yaw);
   for (let i=0;i<model.p.length;i+=3) {
     const [a,b,f]=model.p.slice(i,i+3), [nx,ny,nz]=model.n.slice(i,i+3);
     m.p.push(x+a*c+f*d,y+b,z-a*d+f*c);
     m.n.push(nx*c+nz*d,ny,-nx*d+nz*c);
     m.c.push(model.c[i],model.c[i+1],model.c[i+2]);
   }
   return;
 }

 const t=adult?1.18:1, girl=(seed%3===0)||(seed===71),skin=['#e5b493','#e9b99e','#d5a583','#efc4a8','#c99372'][seed%5],hair=['#29252a','#47312b','#241f27','#50372e','#31242a'][seed%5],uniform=adult?'#d6c5ad':(seed%4===0?'#c8d8e8':'#d5e0ee');
 const Y=v=>y+v*t;
 ellipseShadow(m,x,z,.6*t,.37*t);
 for(let q of [-.19,.19]){m.roundBox(x+q*t,Y(.38),z,.24*t,.77*t,.28*t,.11*t,'#24354c',3);m.roundBox(x+q*t,Y(.12),z+.1*t,.3*t,.2*t,.47*t,.09*t,'#393a42',3)}
 m.roundBox(x,Y(1.1),z,.74*t,.93*t,.4*t,.17*t,uniform,5);
 m.roundBox(x,Y(1.15),z-.21*t,.57*t,.6*t,.14*t,.05*t,adult?'#bda48a':'#e8f0f7',3);
 // collar, school emblem and tie
 m.sphere(x-.115*t,Y(1.48),z+.24*t,.16*t,'#fffdf3',16,10,[.65,.55,.18]);
 m.sphere(x+.115*t,Y(1.48),z+.24*t,.16*t,'#fffdf3',16,10,[.65,.55,.18]);
 m.roundBox(x,Y(1.26),z+.247*t,.09*t,.35*t,.045*t,.03*t,adult?'#845a55':'#4b6d9c',3);
 m.sphere(x+.23*t,Y(1.29),z+.225*t,.047*t,'#dcb96c',12,8,[1,.85,.32]);
 for(let q of [-1,1]){
  m.roundBox(x+q*.46*t,Y(1.1),z,.21*t,.76*t,.27*t,.10*t,uniform,4);
  m.sphere(x+q*.45*t,Y(.71),z+.02*t,.115*t,skin,12,10,[.8,1,.8]);
 }
 m.cylinder(x,Y(1.63),z,.13*t,.28*t,skin,18);
 m.sphere(x,Y(2.01),z,.35*t,skin,28,21,[.9,1.12,.83]);
 m.sphere(x,Y(2.30),z-.10*t,.34*t,hair,24,16,[1.04,.39,.91]);
 m.sphere(x-.23*t,Y(2.24),z+.03*t,.18*t,hair,16,10,[.95,.50,.65]);
 m.sphere(x+.22*t,Y(2.24),z+.02*t,.16*t,hair,16,10,[1,.5,.7]);
 if(girl){m.sphere(x-.35*t,Y(1.93),z-.16*t,.2*t,hair,14,9,[.66,1.4,.66]);m.sphere(x+.37*t,Y(2.12),z-.21*t,.17*t,hair,12,8)}
 const fz=z+.30*t;
 for(let q of [-1,1]){
  m.sphere(x+q*.145*t,Y(2.035),fz,.055*t,'#fff9f2',14,10,[1,.72,.29]);
  m.sphere(x+q*.145*t,Y(2.033),fz+.028*t,.031*t,'#473a34',14,10,[.9,1,.6]);
  m.sphere(x+q*.154*t,Y(2.046),fz+.045*t,.009*t,'#fffefd',10,7);
  m.roundBox(x+q*.145*t,Y(2.12),fz-.016*t,.13*t,.025*t,.045*t,.012*t,hair,3);
 }
 m.sphere(x,Y(1.93),fz+.042*t,.047*t,'#cf9d83',14,10,[.65,.72,.7]);
 m.roundBox(x,Y(1.81),fz+.033*t,.095*t,.018*t,.025*t,.009*t,'#bd7770',3);
 m.roundBox(x,Y(1.16),z-.37*t,.58*t,.72*t,.16*t,.11*t,'#536578',4);
 m.roundBox(x,Y(1.48),z-.45*t,.22*t,.11*t,.05*t,.02*t,'#cfae74',3);
}

function tree(m,x,z,size=1,bloom=false) {
  const h = 1.85 * size;
  m.cylinder(x,h/2,z,.16*size,h,'#796450',12);
  m.line([x,.9*h,z],[x-.46*size,1.17*h,z+.13*size],.062*size,'#8d7560');
  const tones = bloom ? ['#c9989e','#ddaeb2','#e1bbc0','#c18b97'] : ['#436e54','#4d7958','#63845d','#5c8766'];
  for (const [i, [dx,y,dz,r]] of [
    [0,2.23,0,.86],[-.52,2.02,.29,.65],[.48,2.19,-.28,.59],[.25,2.64,.14,.56],[-.29,2.55,-.32,.48]
  ].entries()) {
    m.sphere(x+dx*size,y*size,z+dz*size,r*size,tones[i%tones.length],14,10,[1,1.13,1]);
  }
}

function lamp(m,x,z){m.cylinder(x,1.9,z,.06,3.8,'#425c75');m.sphere(x,3.85,z,.24,'#ffe6a4',10,6);m.cone(x,4.3,z,.26,.25,'#455a77')}
function bench(m,x,z){m.box(x,.45,z,2.0,.16,.67,'#a47153');m.box(x,.9,z-.34,2.0,.62,.15,'#ae805f');for(let q of [-.65,.65])m.box(x+q,.25,z,.13,.47,.48,'#6e7681')}

function school(m,x,z,mini=false){
 const f=mini?.7:1,X=q=>x+q*f,Z=q=>z+q*f,Y=q=>q*f;
 m.roundBox(x,Y(3.7),z,20*f,7.3*f,7.5*f,.42*f,'#b58e78',4);
 m.roundBox(x,Y(3.75),Z(3.76),20.4*f,6.9*f,.28*f,.10*f,'#d5ab91',3);
 m.roundBox(x,Y(7.7),z,20.4*f,.42*f,8.1*f,.17*f,'#e8d2b4',3);
 m.roof(x,Y(7.99),z,21*f,8.5*f,1.55*f,'#6f5360');
 for(let h=0;h<2;h++)for(let q=-8;q<=8;q+=3.2){if(Math.abs(q)<2)continue;
  m.roundBox(X(q),Y(2.55+h*2.6),Z(3.96),1.65*f,2.05*f,.28*f,.14*f,'#d5c19b',3);
  m.roundBox(X(q),Y(2.6+h*2.6),Z(4.10),1.39*f,1.78*f,.09*f,.095*f,'#49768e',3);
  m.box(X(q),Y(2.59+h*2.6),Z(4.17),.07*f,1.77*f,.06*f,'#d1c8b3');
  m.box(X(q),Y(2.6+h*2.6),Z(4.17),1.4*f,.06*f,.06*f,'#d1c8b3');
  m.box(X(q),Y(2.0+h*2.6),Z(4.15),1.25*f,.13*f,.15*f,'#d4b48f');
 }
 for(let q of [-9.6,-6.1,6.1,9.6])m.cylinder(X(q),Y(3.5),Z(4.00),.21*f,6.1*f,'#e8d2b1',18);
 for(let a of [-9.0,9.0]){
  m.roundBox(X(a),Y(7.3),0,2.4*f,.62*f,8.0*f,.13*f,'#ecd7bc',4)
 }
 m.roundBox(x,Y(9.5),Z(-.3),5.1*f,7.5*f,5.3*f,.23*f,'#d0ae91',4);
 m.roundBox(x,Y(13.43),Z(-.3),5.6*f,.4*f,5.5*f,.1*f,'#e7d8c0',3);
 m.roof(x,Y(13.65),Z(-.3),5.9*f,5.8*f,2.0*f,'#63536a');
 m.cylinder(x,Y(10.86),Z(2.51),1.30*f,.2*f,'#f5e8d1',28);
 m.sphere(x,Y(10.9),Z(2.65),1.02*f,'#dce8e6',30,20,[1,1,.10]);
 m.line([x,Y(10.88),Z(2.79)],[X(.48),Y(11.29),Z(2.79)],.035*f,'#586070');
 m.line([x,Y(10.88),Z(2.80)],[X(-.08),Y(11.54),Z(2.80)],.025*f,'#586070');
 m.roundBox(x,Y(2.05),Z(4.06),3.5*f,4.0*f,.46*f,.34*f,'#694e43',5);
 m.roundBox(x,Y(4.7),Z(4.26),7.6*f,.92*f,.29*f,.24*f,'#725a56',4);
 m.box(x,Y(4.7),Z(4.42),5.8*f,.13*f,.09*f,'#d7bf83');
 for(let i=-3;i<=3;i++)if(i!==0)m.box(X(i*.75),Y(1.96),Z(4.31),.055*f,3.5*f,.05*f,'#c9ac83');
 // Stairway and entrance planters
 for(let k=0;k<4;k++)m.roundBox(x,Y(.11+k*.17),Z(5.7-k*.38),(7.5-k*.32)*f,.32*f,.79*f,.075*f,'#b5aaa0',3);
 for(let q of [-5,5]){
  m.cylinder(X(q),Y(.42),Z(5.15),.57*f,.65*f,'#b7a190',18);
  m.sphere(X(q),Y(1.0),Z(5.15),.74*f,'#63987d',18,14,[1,.72,1]);
 }
}


function plane(m,x,z){
 const Y=q=>q,Z=q=>z+q,X=q=>x+q;
 ellipseShadow(m,x,z,5.6,2.1);
 m.sphere(x,2.5,z,5.5,'#e9eff2',38,25,[1,.20,.27]);
 m.sphere(X(-4.5),2.55,z,1.75,'#edf6fa',28,20,[1,.43,.49]);
 m.sphere(X(1),2.71,z,4.7,'#dee7ed',36,20,[1,.15,.22]);
 // swept wings and tails, with tapered round tips
 m.roundBox(X(-.3),2.35,z,2.5,.21,11.4,.1,'#cbd9e1',5);
 for(let v of [-1,1]){
  m.sphere(X(2.1),2.45,Z(v*4.8),1.5,'#d7e3e7',20,12,[.9,.075,.36]);
  m.sphere(X(.75),1.52,Z(v*2.65),.8,'#7b919c',22,15,[.85,.55,.52]);
  m.sphere(X(.8),1.55,Z(v*2.67),.38,'#344e60',20,14,[.45,.6,.4]);
 }
 m.roundBox(X(4.55),3.8,z,.54,3.1,1.3,.18,'#6583a1',5);
 m.roundBox(X(3.85),2.75,z,1.7,.13,4.5,.06,'#c9d7df',4);
 for(let i=-4;i<6;i++)for(let v of [-1,1])m.sphere(X(i*.73),2.82,Z(v*1.19),.145,'#47778a',14,8,[1,.65,.22]);
 m.sphere(X(-3.85),2.95,Z(.55),.46,'#50778c',14,10,[1,.36,.25]);
 m.sphere(X(-3.85),2.95,Z(-.55),.46,'#50778c',14,10,[1,.36,.25]);
 for(let i of [-2.4,2.6])for(let v of [-1,1]){
 m.cylinder(X(i),.85,Z(v*.85),.14,1.4,'#b0bec7',18);
 m.sphere(X(i),.31,Z(v*.85),.35,'#273747',18,10,[1,1,.42]);
 }
}


function yacht(m,x,z){
 ellipseShadow(m,x,z,4.5,2.8);
 m.sphere(x,.65,z,4.6,'#f5f3ee',34,20,[1,.18,.36]);
 m.sphere(x,.40,z,4.1,'#263f59',30,15,[1,.10,.36]);
 m.roundBox(x,1.07,z,6.0,.34,2.9,.18,'#f1e5d5',5);
 m.roundBox(x-.6,1.88,z,3.6,1.45,2.30,.38,'#e4ebee',5);
 m.roundBox(x-.68,1.95,z+1.16,3.0,.96,.10,.05,'#7c9db0',4);
 m.roundBox(x-.68,1.95,z-1.16,3.0,.96,.10,.05,'#7c9db0',4);
 m.roundBox(x-.8,2.8,z,4.0,.23,2.65,.1,'#fbf8ef',5);
 m.cylinder(x+1.9,2.68,z,.04,1.9,'#a2a9ab',22);
 for(let v of [-1,1])m.line([x-2.8,1.35,z+v*1.25],[x+2.65,1.35,z+v*1.25],.025,'#c3c7c8');
}


function car(m,x,z){
 ellipseShadow(m,x,z,2.9,1.65);
 m.roundBox(x,1.04,z,4.15,1.35,2.15,.55,'#d6a35d',6);
 m.roundBox(x-.2,1.85,z,2.55,1.05,1.85,.43,'#deb878',6);
 m.roundBox(x-.37,1.91,z+.96,1.73,.69,.09,.06,'#53829c',4);
 m.roundBox(x-.37,1.91,z-.96,1.73,.69,.09,.06,'#53829c',4);
 m.roundBox(x-2.0,1.01,z,.10,.47,1.7,.05,'#394654',3);
 m.roundBox(x+2.0,1.01,z,.10,.42,1.85,.06,'#5d6774',3);
 for(let a of [-1.28,1.28])for(let b of [-1.04,1.04]){
 m.sphere(x+a,.57,z+b,.49,'#29343b',24,14,[1,1,.46]);
 m.sphere(x+a,.57,z+b+Math.sign(b)*.22,.25,'#bcc8cb',20,12,[1,1,.19]);
 }
 for(let b of [-.77,.77])m.roundBox(x-2.13,1.02,z+b,.06,.25,.35,.023,'#fff2c4',3);
}


function train(m,x,z){
 m.roundBox(x,2.35,z,23,.52,3.6,.12,'#879ca5',4);
 m.roundBox(x,3.01,z,23,.14,3.9,.07,'#c8cccb',4);
 for(let i=0;i<3;i++){
  let xx=x-7.35+i*7.35;
  m.roundBox(xx,4.12,z,7.08,2.55,3.0,.55,'#e5edf0',6);
  m.roundBox(xx,4.52,z+1.55,6.32,.94,.12,.055,'#5b8196',4);
  m.roundBox(xx,4.52,z-1.55,6.32,.94,.12,.055,'#5b8196',4);
  m.roundBox(xx,3.50,z+1.58,6.53,.16,.11,.03,'#477da1',3);
  for(let j=-1;j<=1;j++)m.box(xx+j*1.8,4.52,z+1.63,.13,.96,.055,'#cdd9e4');
  m.roundBox(xx,5.44,z,5.85,.13,2.75,.06,'#a2afb9',4);
 }
 for(let xx=x-11;xx<x+11;xx+=3.8)for(let v of [-1,1])m.sphere(xx,2.60,z+v*.94,.35,'#424c54',14,9,[1,1,.47]);
}

function building(m,x,z,col='#eed6b3'){m.box(x,3,z,7,6,5,col);m.roof(x,6.2,z,7.6,5.5,1.4,'#aa6373');for(let q of [-2.1,0,2.1])m.box(x+q,3,z+2.58,1.2,1.8,.19,'#9bc9d6');m.box(x,1.12,z+2.65,1.55,2.2,.19,'#8d685d')}
function campus(m){m.box(0,-.8,0,105,1.4,77,'#8bcaa3');m.box(0,-.06,8,10,.11,43,'#ebd8b5');m.box(0,-.04,-22,43,.13,10,'#edddc5');m.box(19,-.04,11,8,.12,33,'#8899a8');m.box(-31,-.08,16,34,.1,27,'#69bcdf');for(let i=0;i<11;i++)m.box(-31+i*2.8,-.018,16+(i%3)*3.4,2.4,.015,.11,'#b8e8f4');m.box(-25,-.03,-14,19,.14,10,'#bfcbd2');m.box(25,-.06,-13,28,.18,5,'#8499ad');school(m,0,-12);m.cylinder(0,.4,4,4.2,.4,'#e6d6b8');m.cylinder(0,.63,4,3.6,.18,'#80c8da');m.sphere(0,1.8,4,.78,'#e7bc59',13,8);m.box(0,-.02,15,13,.2,8,'#e9d4af');plane(m,-27,-14);yacht(m,-30,16);train(m,24,-12);car(m,25,13);building(m,-11,20,'#dcbbcc');building(m,11,20,'#c1dbe0');m.cylinder(32,1.4,22,1.2,2.4,'#f1e5bb');m.cone(32,3.15,22,3,2.7,'#dbb9a6');// campus micro-detail: stepping stones, crosswalk, sports courts, flowers, miniature ornamental trees
for(let j=0;j<19;j++){m.box(-4+(j%5)*2,.003,-4+Math.floor(j/5)*2,1.75,.025,1.75,j%2?'#f3e1bc':'#e9d5b5')}
for(let j=0;j<9;j++){m.box(19,.02,-8+j*2.25,2.2,.04,1.0,'#f3f0df')}
m.box(-17,-.015,-1,14,.13,8,'#c27a74');m.box(-17,-.004,-1,12,.14,6.1,'#78c486');m.box(-17,.02,-1,9,.15,4.8,'#4aaf7c');
for(let j=0;j<14;j++){let x=-22.6+(j%7)*1.8,z=-3.1+Math.floor(j/7)*4.3;m.box(x,.1,z,.28,.16,.25,'#e8f4ed')}
for(let i=0;i<100;i++){let x=-48+(i*47%97),z=-34+(i*29%67);if((Math.abs(x)<13&&z<5)||(x<-20&&z>-14)||(x>16&&Math.abs(z)<18))continue;
m.sphere(x,.09,z,.10,i%3===0?'#ffbed0':i%3===1?'#ffeb9e':'#f9f6e8',5,3)}
for(let j=0;j<12;j++){let x=-43+j*3.5;m.box(x,.02,29,.16,.08,.6,'#c7e7c7')}
for(let i=0;i<26;i++){let x=-49+(i*31%94),z=-34+(i*19%69);if((Math.abs(x)<15&&z<0)||(x<-18&&z>-20)||(x>15&&Math.abs(z)<20))continue;tree(m,x,z,.62+(i%3)*.25,i%6===0)}for(let x of [-6,6]){lamp(m,x,5);lamp(m,x,14);bench(m,x*1.7,5)}character(m,5,0,10,83,false);for(let q=-16;q<18;q+=2.5)m.sphere(q,-.04,31,.08,'#ffd2ae',6,4)}
function shell(m,name){m.box(0,-.35,0,24,.6,18,'#e8c6ab');m.box(0,3.3,-8.8,24,7,.4,'#eeded2');m.box(-12,3.1,0,.4,6.6,18,'#edd3c6');m.box(12,3.1,0,.4,6.6,18,'#edd3c6');for(let x of [-8,0,8]){m.box(x,3.9,-8.53,3.4,2.7,.12,'#a8d5df');m.box(x,3.9,-8.4,.13,2.7,.13,'#fffdf0')}for(let i=-2;i<=2;i++)m.box(i*4.1,.02,8.3,1.8,.1,.25,'#f9efe0');m.box(0,6.4,-8.5,24,.2,.5,'#f8f7e6')}
function classroom(m,c){shell(m);m.box(0,3.7,-8.55,8,3.0,.17,'#426e66');m.box(0,2.13,-8.34,8.35,.13,.12,'#e5cfaf');m.box(-5,1.2,-4.5,3.5,1,.95,'#bf9173');// classroom decorations: chalk diagrams, miniature plants and colorful science materials
m.box(3.1,3.1,-8.39,1.1,1.1,.08,'#f2e0a4');m.box(-3.1,4.3,-8.36,1.7,.1,.08,'#f0f5e1');
for(let k=0;k<5;k++){m.box(-2.5+k*.35,3.8+(k%2)*.3,-8.35,.19,.11,.08,'#f6efdf')}
for(let k=0;k<5;k++){m.box(-2.6+k*.35,3.1,-8.35,.12,.12,.08,'#f6efdf')}
m.cylinder(6.5,.9,-4.0,.36,.45,'#c9b6a2');m.sphere(6.5,1.45,-4,.45,'#5aab76',9,6);
if(c===22){for(let k=0;k<4;k++){m.box(3.3+k*.55,1.5,-4.1,.46,.53,.46,['#a3b9ed','#e4adbe','#b7ddb1','#f5d794'][k]);m.box(3.3+k*.55,1.8,-3.86,.25,.08,.08,'#fbfbf6')}}
for(let i=0;i<3;i++)for(let j=0;j<2;j++){let x=-5+i*5,z=-.5+j*3.4;m.box(x,.95,z,2.6,.16,1.25,'#bd936c');m.box(x,.45,z-.35,.16,.85,.18,'#96765d');m.box(x,.45,z+.4,.16,.85,.18,'#96765d');m.box(x,1.03,z-.2,.9,.05,.4,'#f5e0a7')}m.box(8,2,-6,3.0,3.6,1.2,'#a87861');for(let j=0;j<4;j++)m.box(8,.7+j*.78,-5.3,2.6,.09,.65,'#f2cda1');for(let j=0;j<15;j++)m.box(6.8+j%5*.58,1.3+Math.floor(j/5)*.73,-4.8,.11,.55,.26,['#639ab9','#d9b16d','#a97cba'][j%3]);character(m,-7,0,-4.2,500+c,true);let ps=studentsFor(c);character(m,-6,0,3.0,ps[0].seed);character(m,-2,0,3.0,ps[1].seed);character(m,2,0,3.0,ps[2].seed);if(!isStoneClass(c)||(stoneCleared(c)&&!(hornState?.practice&&hornState.c===c)))character(m,6,0,3.0,ps[3].seed);m.sphere(8.2,3,-7.6,.53,'#f6c66c',8,6);if(isStoneClass(c)){m.roundBox(5.5,.26,-7.1,4.2,.40,2.1,.23,'#4c4e62',7);m.sphere(5.5,.52,-7.1,.65,'#8c7181',24,16,[1,.25,.75]);}}
function hallway(m,floor){m.box(0,-.3,0,88,.6,16,'#e3c6ae');m.box(0,3,-8,88,6,.3,'#ebd6bd');m.box(0,3,8,88,6,.3,'#efddc8');m.box(0,6.1,0,88,.3,16,'#faf4e5');m.box(0,.05,0,87,.06,3.6,'#bfa68f');for(let j=0;j<11;j++){let x=-40+j*8;for(let sign of [-1,1]){m.box(x,2.2,sign*7.7,2.5,4.2,.16,'#a37a63');m.box(x,3.3,sign*7.55,1.6,.9,.17,'#bbdbe1');m.box(x,4.85,sign*7.3,3.2,.49,.17,'#f8e5c5');m.sphere(x+1.05,2.35,sign*7.6,.085,'#f5d582',8,5)}}for(let x=-38;x<45;x+=10)lamp(m,x,0);character(m,0,0,0,717)}
function hall(m){shell(m);m.box(0,.55,-3,4,.8,1.4,'#bd9b76');m.sphere(0,1.85,-3,1.0,'#ebc16a');m.cylinder(0,.4,3.0,2.7,.45,'#d6bca0');m.cylinder(0,.73,3,2.35,.22,'#6db5d6');m.box(-7,1.4,-4,3.5,2.7,.7,'#986c57');m.box(7,1.4,-4,3.5,2.7,.7,'#986c57');character(m,-5,0,1,720,true);for(let q of [-6,6])tree(m,q,5,.45)}
function subScene(m,id){shell(m);let p=id.split('-')[0],subId=id.split('-')[1];m.box(0,1.3,-5,4.5,2.2,1.25,'#b6afaa');m.box(0,2,-4.2,3.1,1.25,.11,'#76b5ca');m.box(-7,1.0,-4,2.9,1.0,1.6,'#c29d7d');m.box(7,1.0,-4,2.9,1.0,1.6,'#c29d7d');if(p==='air'){m.box(-3,1.4,1,3,.8,1.6,'#9dc2d6');m.box(3,1.4,1,3,.8,1.6,'#9dc2d6');m.cylinder(0,1.4,-3,.53,.7,'#e8e5d1');m.box(0,2,-2.7,1.6,.35,.2,'#5b88ba')}else if(p==='yacht'){m.box(0,.7,3,10,.23,3,'#d1a17b');m.cylinder(0,1.3,-3,1,.35,'#6489a9');m.box(4,1.9,1,1.0,1.2,1,'#b9d9de')}else if(p==='train'){for(let j=0;j<4;j++)m.box(-7+j*4,.83,2,2.3,.25,1.0,'#a5bedb');m.box(0,4,-8.3,9,1.1,.17,'#70b7da')}else if(p==='car'){car(m,0,1.5);m.box(5,.5,3,3,.8,2,'#e3b67a');m.cylinder(-6,1.1,1,.55,.7,'#8294a9')}else if(p==='lab'){for(let j=-1;j<=1;j++){m.box(j*4,.95,1.5,3.5,.2,1.2,'#c8ad95');m.box(j*4,1.3,1.5,.5,.6,.5,'#91d6d5')}m.sphere(0,2.4,-5,.8,'#91b8ce')}else if(p==='library'){for(let j=-1;j<=1;j++){m.box(j*4,1.9,-7.3,3.4,3.8,1,'#a77958');for(let i=0;i<8;i++)m.box(j*4-1.2+(i%4)*.7,.85+Math.floor(i/4)*1.5,-6.7,.45,1.1,.55,['#89acb7','#c8a766','#c48b91'][i%3])}bench(m,0,3)}else if(p==='garden'){for(let x of [-6,0,6])tree(m,x,0,.7,x===0);for(let x of [-4,4])m.sphere(x,.3,4,.5,'#ea94b2',10,6)}character(m,-4,0,1,817,true)}

function campusDetails(m){
 // gridded warm stone walkway
 for(let x=-4.4;x<=4.4;x+=1.05)for(let z=0;z<=28;z+=1.14){
  if((Math.round(z*5)+Math.round(x*4))%5===0)continue;
  m.box(x+(Math.round(z)%2)*.06,.016,z,.94,.013,1.03,((Math.round(x*2)+Math.round(z*2))%3===0)?'#e6c9a8':'#e9dbc1');
 }
 // pale granite trim and the front lawn with flowerbeds
 for(let v of [-1,1]){
   m.roundBox(v*6.4,.14,9.8,.20,.26,32,.06,'#d8c6ae',3);
   for(let k=0;k<8;k++){
    let z=3+k*3.35;
    m.sphere(v*7.7,.27,z,.7,k%2?'#edbdc5':'#85b48b',16,12,[1,.4,.8]);
    m.sphere(v*7.8,.45,z+.27,.17,k%2?'#fff3d5':'#f4c3dc',12,8);
   }
 }
 // reflective fountain with sculptural golden orb
 m.cylinder(0,.18,3.4,2.8,.42,'#a0b4ac',30);
 m.cylinder(0,.41,3.4,2.57,.18,'#65a9bf',36);
 m.cylinder(0,1.30,3.4,.24,1.9,'#dec091',24);
 m.sphere(0,2.52,3.4,.75,'#d4b26d',26,16,[1,1,.34]);
 for(let i=0;i<8;i++){
  let a=i*Math.PI/4;
  m.line([Math.cos(a)*.2,1.62,3.4+Math.sin(a)*.2],[Math.cos(a)*1.15,.72,3.4+Math.sin(a)*1.15],.026,'#a9dbeb');
 }
 // wrought iron lamp rows and trimmed hedges
 for(let z=1;z<26;z+=5){for(let x of [-10.5,10.5]){
   m.roundBox(x,.3,z,2.0,.6,.6,.20,'#5f9576',4);
   lamp(m,x+(x<0?1.8:-1.8),z);
 }}
 // the runway, colorful playground and safety line
 for(let k=0;k<15;k++)m.box(-32+k*.71,.018,-18, .08,.019,1.1,'#e7e7cf');
 // train support columns
 for(let x=14;x<37;x+=6){
  m.cylinder(x,1.65,-14,.47,3.2,'#a4aeb0',18);
  m.roundBox(x,3.35,-14,5.8,.28,4.3,.08,'#c9cdca',3);
 }
 // miniature landscaped bench areas with shadows
 for(let q of [-1,1]){
  m.roundBox(q*10.7,.12,-5.3,6,.22,3,.19,'#d8cbac',4);
  bench(m,q*10.7,-5.1);
 }
}

function initGL(){let canvas=$('glCanvas');gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl');if(!gl){$('viewHint').textContent='当前浏览器不支持 WebGL 3D，请使用新版 Chrome 或 Edge';return false}const vs=`attribute vec3 aPos;attribute vec3 aNormal;attribute vec3 aColor;uniform mat4 uVP;uniform vec3 uOffset;uniform vec2 uYaw;uniform vec2 uSpin;varying vec3 vColor;varying float vFog;varying float vLuster;varying float vHeight;vec3 rotateModel(vec3 v){v=vec3(v.x,v.y*uSpin.x-v.z*uSpin.y,v.y*uSpin.y+v.z*uSpin.x);return vec3(v.x*uYaw.x+v.z*uYaw.y,v.y,-v.x*uYaw.y+v.z*uYaw.x);}
void main(){vec3 n=normalize(rotateModel(aNormal));vec3 sun=normalize(vec3(-.65,1.15,.62));float l=max(dot(n,sun),0.);float bounce=max(dot(n,normalize(vec3(.4,-.28,-.5))),0.);float shade=.53+l*.53+bounce*.14;float warm=max(0.,dot(n,sun))*.06;vColor=aColor*vec3(shade+warm,shade+warm*.78,shade);vLuster=pow(max(dot(reflect(-sun,n),normalize(vec3(.2,.9,1.))),0.),16.)*.13;vHeight=aPos.y;vec4 p=uVP*vec4(rotateModel(aPos)+uOffset,1.);gl_Position=p;vFog=clamp((p.w-46.)/150.,0.,.42);}`;const fs=`precision mediump float;varying vec3 vColor;varying float vFog;varying float vLuster;varying float vHeight;void main(){vec3 col=vColor+vLuster*vec3(1.,.86,.67);col=mix(col,vec3(.78,.87,.89),vFog);col=pow(max(col,vec3(.0)),vec3(.93));gl_FragColor=vec4(col,1.);}`;
function compile(type,src){let sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}shader=gl.createProgram();gl.attachShader(shader,compile(gl.VERTEX_SHADER,vs));gl.attachShader(shader,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(shader);if(!gl.getProgramParameter(shader,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(shader));gl.useProgram(shader);atp=gl.getAttribLocation(shader,'aPos');atn=gl.getAttribLocation(shader,'aNormal');atc=gl.getAttribLocation(shader,'aColor');uni.vp=gl.getUniformLocation(shader,'uVP');uni.offset=gl.getUniformLocation(shader,'uOffset');uni.yaw=gl.getUniformLocation(shader,'uYaw');uni.spin=gl.getUniformLocation(shader,'uSpin');gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);return true}
function bufferMesh(m){let buf={size:m.p.length/3};for(let [key,arr] of [['p',m.p],['n',m.n],['c',m.c]]){buf[key]=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf[key]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW)}return buf}
function dropBuf(b){if(!b)return;for(let k of ['p','n','c'])if(b[k])gl.deleteBuffer(b[k])}
function drawBuf(b,offset=[0,0,0],yaw=0,spin=0){if(!b||!gl)return;gl.uniform3fv(uni.offset,offset);gl.uniform2f(uni.yaw,Math.cos(yaw),Math.sin(yaw));gl.uniform2f(uni.spin,Math.cos(spin),Math.sin(spin));for(let [k,loc] of [['p',atp],['n',atn],['c',atc]]){gl.bindBuffer(gl.ARRAY_BUFFER,b[k]);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0)}gl.drawArrays(gl.TRIANGLES,0,b.size)}
function setupCamera(){let dim=$('view').getBoundingClientRect(),ratio=dim.width/Math.max(1,dim.height),t=camera.target,th=camera.theta,ph=camera.phi,r=camera.dist;let eye=[t[0]+r*Math.sin(ph)*Math.sin(th),t[1]+r*Math.cos(ph),t[2]+r*Math.sin(ph)*Math.cos(th)];VIEW=lookAt(eye,t);PROJ=perspective(.88,ratio,.1,260);VP=mat4mul(PROJ,VIEW)}
function project(x,y,z){let v=[x,y,z,1],o=[0,0,0,0];for(let row=0;row<4;row++)for(let k=0;k<4;k++)o[row]+=VP[k*4+row]*v[k];let w=o[3]||1;if(w<0)return null;return [(o[0]/w*.5+.5)*$('view').clientWidth,(1-(o[1]/w*.5+.5))*$('view').clientHeight,w]}
function marker(kind,title,id,x,y,z,fn,anchor){sceneMarkers.push({kind,title,id,x,y,z,fn,anchor});}
function markerPosition(mark) { return mark.anchor ? mark.anchor() : mark; }
const neighborhood = CampusNeighborhood.create({
  $, marker, getState:() => s, save, toast, fx, hud, dialog, closeDialog, go, Mesh, tree, lamp, bench, character, clearInput,
  rideCamera:dist=>{camera.dist=dist;}
});

/* ══ 22班隐藏禁区：独立可完成的四幕剧情、线索、谜题和终章 ══ */
const secretLevels=[['secret-shadow','神秘黑影'],['secret-monster','雾影怪物'],['secret-guard','机械守卫'],['secret-boss','禁区Boss']];
const secretQs=[
['光照到手掌，墙上出现影子，是因为？',['手掌挡住一部分光','墙会画画','声音太大','空气变成石头'],0,'光被手掌挡住，就可能形成影子。'],
['“走廊安静极了，只听见滴答的钟声。”这句话写出了？',['很安静','特别吵闹','太阳很热','有人跳舞'],0,'钟声让安静的环境更有画面感。'],
['图案按照「星星、月亮、星星、月亮」交替排列，第7个是？',['月亮','星星','小船','无规律'],1,'奇数位置是星星，所以第7个是星星。']
];
const bossQs=[
['知识核心有24格能量，点亮了13格，还有多少格没点亮？',['9','10','11','12'],2,'24−13=11格。'],
['六盒彩笔每盒4支，一共有多少支？',['10','20','24','30'],2,'6×4=24支。'],
['“仔细观察”中的“仔细”最接近？',['马虎','认真','急躁','害怕'],1,'仔细就是认真地看、想和做。'],
['符号顺序是「太阳、月亮、星星」，第二个是什么？',['太阳','月亮','星星','雨滴'],1,'第二个是月亮。'],
['楼梯有28阶，走过了16阶，还剩几阶？',['12','14','16','18'],0,'28−16=12阶。'],
['下面哪一种是记录科学实验的好习惯？',['随便改结果','真实写下观察','只记成功时','不观察'],1,'真实记录是科学研究的重要一步。'],
['核心密码：先算6×3，再加2，得到多少？',['18','20','21','22'],1,'6×3=18，18+2=20。'],
['看到一道难题时，哪种做法最好？',['放弃','读题、列式、检查','蒙答案','直接问答案'],1,'认真读题、分步计算、核对结果是好习惯。']
];
function secretDone(key){return s.flags.includes('secret-'+key)}
function secretFlag(key){let id='secret-'+key;if(!s.flags.includes(id)){s.flags.push(id);save();hud();return true}return false}
function secretStepCount(){return ['shadow-done','monster-done','guard-done','clear'].filter(secretDone).length}
function secretProgress(current){return '<div class="secret-progress">'+[['shadow','① 黑影'],['monster','② 雾怪'],['guard','③ 守卫'],['boss','④ Boss']].map(([k,label],i)=>'<span class="'+(secretDone(k==='boss'?'clear':k+'-done')?'done':current===k?'current':'')+'">'+label+'</span>').join('')+'</div>'}
function secretStory(title,body,buttons=[],face='👁️'){
 dialog('🔮 '+title,`<div class="secret-boss-portrait">${face}</div>${body}${buttons.length?'<div class="secret-btn-row" id="secretButtons"></div>':''}`);
 if(buttons.length){let box=$('secretButtons');buttons.forEach(([txt,fn])=>{let b=document.createElement('button');b.textContent=txt;b.onclick=fn;box.appendChild(b)})}
}
function secretDoor(){secretStory('二年级22班 · 后墙暗门',`<div class="secret-frame"><b>墙上的校徽忽然泛出蓝光。</b><p>同学们发现，书架后有一扇从未打开的门，门牌写着「知识禁区」。里面传来轻微的脚步声，却没有危险的武器；这是一场用勇气、观察与智慧完成的冒险。</p><p>提示：有悬疑气氛，但不会伤害校园师生。</p></div>`,[['🚪 进入暗门',()=>{closeDialog();go('secret-entrance')}],['📚 回到教室',closeDialog]],'🚪')}
function secretCheck(flag,dest,why){if(secretDone(flag)){go(dest)}else{fx.wrong();secretStory('通道尚未解锁',`<div class="secret-frame">${why}</div>`,[['🔍 继续寻找线索',closeDialog]],'🔒')}}
function secretCollect(n,label){let id='clue-'+n;if(secretFlag(id)){reward(2,8);fx.success();}const count=[1,2,3].filter(i=>secretDone('clue-'+i)).length;
secretStory('找到了线索 '+count+'/3',`<div class="secret-frame"><b>${label}</b><p>已找到 ${count}/3 条线索。线索记录会一直保存在探险档案中。</p>${count===3?'<p>三枚线索组合成「月·书·星」，黑影之门已解锁！</p>':'<p>再找一找走廊里的其他物品。</p>'}</div>`,count===3?[["👁️ 前往黑影之门",()=>{closeDialog();go('secret-shadow')}],["留在走廊",closeDialog]]:[["继续调查",closeDialog]],'🔎');}
function shadowPuzzle(){let sequence=['月','书','星'],index=0;function render(){secretStory('黑影的镜像顺序',`${secretProgress('shadow')}<div class="secret-frame">黑影缓缓浮在墙边，指向旧日记上的一句话：<b>「先月光，再书页，最后星辰」</b>。<br>按正确顺序触碰三个符号，它就会恢复原本温和的模样。</div><div class="secret-status" id="shadowStatus">已点亮 ${index}/3 枚符号</div><div class="secret-btn-row" id="shadowChoices"><button data-symbol="星">⭐ 星</button><button data-symbol="月">🌙 月</button><button data-symbol="书">📖 书</button></div>`,[],'👤');document.querySelectorAll('#shadowChoices button').forEach(b=>b.onclick=()=>{if(b.dataset.symbol===sequence[index]){fx.success();index++;if(index===3){if(secretFlag('shadow-done'))reward(9,25);secretStory('神秘黑影 · 谜题完成',`<div class="secret-frame">黑影消散，显出一位旧日守护者留下的光影投影。它轻声说：「后面还有一位怕黑的雾影朋友，去帮帮它吧。」<br>获得 <b>黑影记忆徽章</b>！</div>`,[['🌫️ 前往雾影区',()=>{closeDialog();go('secret-monster')}],['稍后再去',closeDialog]],'✨')}else render();}else{fx.wrong();index=0;$('shadowStatus').textContent='顺序不对，符号重新暗下来了，试试「月、书、星」。'}})}render()}
function monsterQuiz(){let pos=Number(s.secretMonsterProgress)||0;function show(){if(pos>=secretQs.length){s.secretMonsterProgress=3;if(secretFlag('monster-done'))reward(12,35);secretStory('雾影怪物 · 平静下来',`${secretProgress('monster')}<div class="secret-frame">原来雾影怪物只是负责保护藏书的「迷雾小巨人」，它害怕走廊里突然熄灭的灯。你用知识帮助它辨别光和影，它送来 <b>迷雾之心</b>。</div>`,[['🤖 前往机械守卫区',()=>{closeDialog();go('secret-guard')}],['继续探索',closeDialog]],'🌟');return}
const q=secretQs[pos];dialog('🌫️ 雾影怪物 · 知识安抚',`${secretProgress('monster')}<div class="secret-frame"><b>雾影正在渐渐平静：</b> 完成 ${pos+1}/3 道谜题，用声音和知识安抚它。怪物不攻击任何人。</div><div class="quiztitle">${q[0]}</div><div class="choices" id="monsterChoices">${q[1].map((x,i)=>`<button data-m="${i}">${'ABCD'[i]}. ${x}</button>`).join('')}</div><div id="monsterFeedback" class="secret-status">选择一个答案。</div>`);$('monsterChoices').querySelectorAll('button').forEach(b=>b.onclick=()=>{let i=Number(b.dataset.m);if(i!==q[2]){fx.wrong();$('monsterFeedback').textContent='先别急，想一想：'+q[3];return}fx.success();pos++;s.secretMonsterProgress=pos;save();$('monsterFeedback').textContent='✅ '+q[3];Array.from($('monsterChoices').children).forEach(b=>b.disabled=true);advanceDialog(show,500)})}show()}
function guardKeypad(){let code='';function show(){dialog('🤖 机械守卫 · 四位逻辑密钥',`${secretProgress('guard')}<div class="secret-frame"><b>守卫不是敌人，只是在校验来访者。</b><p>要取得权限，求出四个数字：<br>① 两个2相加；② 3乘3；③ 8减5；④ 4加4。<br><small>把答案按顺序输入，四位密钥依次是什么？</small></p></div><div class="secret-display" id="secretDisplay">${(code+'____').slice(0,4).replace(/_/g,'·')}</div><div class="secret-keypad" id="secretPad">${['1','2','3','4','5','6','7','8','9','清除','0','确定'].map(x=>`<button data-key="${x}">${x}</button>`).join('')}</div><div class="secret-status" id="secretKeyFeedback">通过考核后获得机械通行证。</div>`);
$('secretPad').querySelectorAll('button').forEach(b=>b.onclick=()=>{const v=b.dataset.key;if(v==='清除'){code='';show()}else if(v==='确定'){if(code==='4938'){fx.unlock();if(secretFlag('guard-done'))reward(15,40);secretStory('机械守卫 · 身份验证通过',`${secretProgress('guard')}<div class="secret-frame">胸前的指示灯从红色变为绿色，机械守卫侧身让开，递来一张「核心研究室通行证」。<br><b>禁区Boss房大门已开启。</b></div>`,[['🌀 进入Boss房',()=>{closeDialog();go('secret-boss')}],['稍后再去',closeDialog]],'🤖')}else{fx.wrong();code='';$('secretKeyFeedback').textContent='❌ 密钥不正确，请重新计算四个数字。';$('secretDisplay').textContent='····'}}else if(code.length<4){code+=v;$('secretDisplay').textContent=(code+'____').slice(0,4).replace(/_/g,'·')}})}show()}
function bossQuiz(){let pos=Math.min(Number(s.secretBossProgress)||0,bossQs.length);function show(){if(pos>=bossQs.length){s.secretBossProgress=bossQs.length;save();if(secretFlag('clear')){reward(50,150);s.secretBadge=true;save()}fx.unlock();secretStory('禁区Boss · 知识核心恢复',`${secretProgress('boss')}<div class="secret-frame"><b>🎉 你完成了全部八道核心难题！</b><p>核心不再闪烁红光，屏幕上出现字样：「谢谢你，探险家。」</p><p>奖励：⭐50、🪙150，以及永久收藏 <b>星梦核心守护者徽章</b>。</p></div>`,[['🏆 前往结局纪念殿堂',()=>{closeDialog();go('secret-final')}],['留在Boss房',closeDialog]],'🏆');return}
const q=bossQs[pos];dialog('👑 禁区Boss · 最终知识试炼',`${secretProgress('boss')}<div class="secret-boss-portrait">🌀</div><div class="secret-frame">幽蓝知识核心正在等待修复。你每答对一题，就点亮一个知识能源格；<b>不会发生战斗或伤害</b>。</div><div class="secret-pulsebar"><i style="width:${100*pos/bossQs.length}%"></i></div><div class="quizmeta">核心能源 ${pos}/8 · 第 ${pos+1} 题</div><div class="quiztitle">${q[0]}</div><div class="choices" id="bossChoices">${q[1].map((x,i)=>`<button data-b="${i}">${'ABCD'[i]}. ${x}</button>`).join('')}</div><div id="bossFeedback" class="secret-status">慢慢思考，答错可以重试。</div>`);$('bossChoices').querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.b);if(i!==q[2]){fx.wrong();$('bossFeedback').textContent='❌ 再想想，提示：'+q[3];return;}fx.success();pos++;s.secretBossProgress=pos;save();$('bossFeedback').textContent='✅ '+q[3];$('bossChoices').querySelectorAll('button').forEach(b=>b.disabled=true);advanceDialog(show,520)})}show()}
function secretPortal(m){m.roundBox(10.4,2.55,-7.78,2.6,4.75,.31,.24,'#34324f',6);m.roundBox(10.4,2.6,-7.52,1.82,3.85,.12,.18,'#191f3d',6);m.sphere(10.4,4.1,-7.43,.27,'#b6a7fc',24,15,[1,1,.3]);for(let j=0;j<5;j++)m.sphere(9.65+j*.38,.65,-7.44,.055,'#adcaef',8,6)}
function secretRoom(m,mode){ // 3D geometry; connected rooms use cool palette, rounded shapes and luminous clues
 const pal=mode==='entrance'?['#263b56','#1f2e49','#4c6680']:mode==='shadow'?['#24233e','#17192d','#775e93']:mode==='monster'?['#234659','#183445','#57a6a3']:mode==='guard'?['#2c384d','#141f30','#577a98']:mode==='boss'?['#252a4f','#111c35','#6859a5']:['#335779','#324966','#96bae2'];
 m.roundBox(0,-.35,0,24,.65,18,.17,pal[0],4);m.roundBox(0,3.2,-8.8,24,6.6,.4,.17,pal[1],4);m.roundBox(-12,3.1,0,.45,6.5,18,.17,pal[1],4);m.roundBox(12,3.1,0,.45,6.5,18,.17,pal[1],4);
 for(let i=-10;i<=10;i+=2.5){m.roundBox(i,.02,0,.035,.04,17,.016,pal[2],3);m.roundBox(i,6.25,0,.06,.08,17,.02,pal[2],3)}
 for(let z=-7;z<=6;z+=4){for(let x of [-11.5,11.5]){m.cylinder(x,2.7,z,.11,4.8,'#7c80af',20);m.sphere(x,5.0,z,.25,'#aadce4',22,15,[.7,1.5,.7])}}
 m.roundBox(0,2.6,-8.35,5.0,4.7,.34,.38,pal[2],6);m.roundBox(0,2.55,-8.06,3.45,3.7,.16,.28,'#17243a',6);m.sphere(0,4.02,-7.9,.38,'#d0c6f3',24,16,[1,1,.2]);
 for(let k=0;k<8;k++){let x=-10+k*2.8;const col=k%2?'#4b6191':'#38456e';m.roundBox(x,.07,5,.7,.12,2.3,.04,col,3)}
}
function shadowEntity(m,x,z){ellipseShadow(m,x,z,1.3,.8);m.sphere(x,2.0,z,.95,'#262540',28,20,[.85,1.8,.75]);m.sphere(x,3.18,z,.63,'#33304e',28,20,[.95,1.08,.75]);m.sphere(x-.22,3.23,z+.48,.10,'#bfa5f3',18,12,[1,.75,.55]);m.sphere(x+.22,3.23,z+.48,.10,'#bfa5f3',18,12,[1,.75,.55]);for(let i=0;i<5;i++){let a=i*1.256;m.sphere(x+Math.sin(a)*.83,.85,z+Math.cos(a)*.5,.35,'#343047',16,10,[.35,1.5,.4])}}
function monsterEntity(m,x,z){ellipseShadow(m,x,z,2,1.2);m.sphere(x,2.25,z,2.0,'#79b9bf',32,24,[.83,1.18,.75]);m.sphere(x,3.63,z,.95,'#a3d8d2',30,22,[1,1,.88]);for(let xoff of [-.35,.35]){m.sphere(x+xoff,3.72,z+.72,.21,'#eefcf4',22,12,[1,.78,.5]);m.sphere(x+xoff,3.72,z+.83,.10,'#344963',18,12)}m.sphere(x,3.24,z+.83,.24,'#6a8899',16,12,[1,.25,.42]);for(let v of [-1,1])m.sphere(x+v*1.6,2.1,z,.52,'#92c8c8',24,16,[.75,1.4,.75]);for(let v of [-1,1])m.sphere(x+v*.8,.45,z+.2,.51,'#679ea5',22,14,[.85,.55,.95]);}
function robotEntity(m,x,z){ellipseShadow(m,x,z,1.25,.8);const gunmetal='#586c85',metal='#a7b8c9';for(let v of [-1,1]){m.roundBox(x+v*.49,.58,z,.42,1.12,.51,.17,gunmetal,5);m.sphere(x+v*.49,.32,z+.21,.24,'#30384a',16,10);m.roundBox(x+v*1.05,2.0,z,.40,1.65,.51,.19,metal,5);m.sphere(x+v*1.05,2.72,z,.27,gunmetal,20,12)}m.roundBox(x,2.14,z,1.67,2.0,.92,.40,metal,6);m.roundBox(x,2.22,z+.48,1.1,.72,.14,.09,'#364c6d',5);m.sphere(x,2.22,z+.57,.2,'#a9f5df',24,12,[1,1,.35]);m.roundBox(x,3.66,z,1.28,1.04,.94,.30,gunmetal,6);for(let v of [-1,1])m.sphere(x+v*.33,3.73,z+.46,.19,'#86dcdf',22,12,[.95,.52,.33]);m.cylinder(x,4.4,z,.07,.6,'#758faa',18);m.sphere(x,4.8,z,.20,'#d8eef4',20,12)}
function bossEntity(m,x,z){m.cylinder(x,.30,z,3.2,.60,'#364d79',40);m.cylinder(x,.70,z,2.9,.20,'#7786be',42);m.sphere(x,3.5,z,2.20,'#5e6fba',38,28,[1,1,.88]);m.sphere(x,3.50,z+.55,1.48,'#94d7e4',34,25,[1,1,.5]);m.sphere(x,3.55,z+1.29,.67,'#e0f8e8',28,20,[1,1,.3]);for(let j=0;j<3;j++){let r=2.55+j*.35;for(let k=0;k<28;k++){let a=k*Math.PI/14,b=(k+1)*Math.PI/14;m.line([x+r*Math.cos(a),3.4+Math.sin(a)*.16,z+r*Math.sin(a)],[x+r*Math.cos(b),3.4+Math.sin(b)*.16,z+r*Math.sin(b)],.065,['#7dd0e0','#b0a9ed','#cfca91'][j])}}for(let j=0;j<4;j++){let a=j*Math.PI/2;m.roundBox(x+Math.cos(a)*4.3,1.55,z+Math.sin(a)*4.3,1.05,2.8,1.05,.32,'#39466e',5);m.sphere(x+Math.cos(a)*4.3,3.20,z+Math.sin(a)*4.3,.36,'#a5daea',20,15)}}
function secretFinish(){secretStory('毕业典礼之外的隐藏结局',`${secretProgress('boss')}<div class="secret-frame"><b>星梦学校恢复了平静！</b><p>神秘黑影、雾影怪物、机械守卫和知识核心都不是敌人，而是守护知识的古老朋友。你获得「星梦核心守护者」称号和永不消失的徽章。</p><p>你依然可以返回22班，继续挑战其他21个班级、探索飞机和游艇，或再次挑战Boss知识题。</p></div>`,[['🏫 返回22班',()=>{closeDialog();go('class-22')}],['🌀 重看Boss房',()=>{closeDialog();go('secret-boss')}]],'🏆')}
function buildSecretScene(m,id,A){let code=id.slice(7),titles={entrance:'🔦 22班后方 · 被遗忘的走廊',shadow:'👤 第一关 · 神秘黑影',monster:'🌫️ 第二关 · 雾影怪物',guard:'🤖 第三关 · 机械守卫',boss:'🌀 最终关 · 禁区Boss房',final:'🏆 隐藏结局 · 星梦纪念殿堂'},descs={entrance:'寻找走廊里的三条线索，开启黑影之门。脚步声与闪光会提示你调查。',shadow:'光影守护者需要你按「月、书、星」重现记忆。完成谜题即可继续。',monster:'神秘的雾影朋友害怕黑暗，答对三道跨学科题，帮助它平静下来。',guard:'高大的机械守卫并不伤人，它需要一组通过数学推理得到的四位通行密码。',boss:'禁区知识核心正在闪烁：答对八道更有难度的语文数学逻辑题，让能量回归正常。',final:'你找到了全部秘密，校园中的光与知识再次汇聚。'};
 secretRoom(m,code);const common={theta:.35,phi:1.02,dist:24,target:[0,2,-1]};
 const reg=(label,key,x,y,z,fn,kind='item')=>{marker(kind,label,key,x,y,z,fn);A(label,fn)};
 if(code==='entrance'){
  shadowEntity(m,0,-4.8);for(let x of [-7,0,7]){m.roundBox(x,1.65,-5.5,2.8,3.0,1,.32,'#47566a',5);m.sphere(x,3.5,-5.0,.30,'#bac7ed',20,12)}
  reg('📓 调查旧日记','clue1',-7,2.2,-4,()=>secretCollect(1,'日记：记录了月亮标记'));reg('🔔 调查静止的铜铃','clue2',0,3.1,-3,()=>secretCollect(2,'铜铃：铃上刻着一本书'));reg('🔭 调查发光望远镜','clue3',7,2.3,-4,()=>secretCollect(3,'望远镜：星星符号闪烁'));
  reg('👤 黑影之门','enter-shadow',0,3,-8,()=>secretCheck('clue-1','secret-shadow','先收集全部三条线索，才能看懂黑影的提示。'), 'door');
  const enter=()=>[1,2,3].every(i=>secretDone('clue-'+i))?go('secret-shadow'):secretStory('缺少线索',`<div class="secret-frame">你已找到 ${[1,2,3].filter(i=>secretDone('clue-'+i)).length}/3 条线索，继续调查旧日记、铜铃和望远镜。</div>`,[['继续寻找',closeDialog]],'🔍');
  sceneMarkers[sceneMarkers.length-1].fn=enter;A('🚪 解锁黑影之门（3条线索）',enter);
 }else if(code==='shadow'){
  shadowEntity(m,0,-3);for(let i=0;i<3;i++){const x=-6+i*6;m.roundBox(x,2.4,-6.5,2.0,3.4,.2,.18,'#69628a',5);m.sphere(x,3.0,-6.1,.55,['#d3c4f3','#d5bf99','#e9e3a9'][i],28,16,[1,1,.2])}
  reg('👤 与黑影对话','shadow-puzzle',0,3,-2,shadowPuzzle,'person');reg('🪞 解开记忆之镜','shadow-mirror',-6,3,-6,shadowPuzzle);
  reg('🌫️ 通往雾影区','to-monster',7,3,-7,()=>secretCheck('shadow-done','secret-monster','完成「月、书、星」的符号谜题之后，雾影区才会开启。'),'door');
 }else if(code==='monster'){
  monsterEntity(m,0,-3);for(let i=-2;i<=2;i++){m.sphere(i*3,.6,-6,1.1,'#709da8',24,14,[1,.48,1.1]);m.sphere(i*2.4,3.4,-7.9,.27,'#aad8db',18,11)}
  reg('🌫️ 与雾影怪物交流','monster-friend',0,4,-3,monsterQuiz,'person');reg('💡 用知识安抚怪物','monster-quiz',-6,2,-4,monsterQuiz);
  reg('🤖 通往机械守卫区','to-guard',7,3,-6,()=>secretCheck('monster-done','secret-guard','先完成3道知识题，安抚雾影朋友。'),'door');
 }else if(code==='guard'){
  robotEntity(m,0,-2.7);for(let i=-1;i<=1;i++){m.cylinder(i*5,1.45,-5.6,.65,2.4,'#4b647a',22);m.sphere(i*5,3.0,-5.6,.4,i%2?'#a5d8d5':'#e0c5aa',22,16)}
  reg('🤖 和机械守卫交流','robot-key',0,4,-2.7,guardKeypad,'person');reg('🔢 输入四位逻辑密码','keypad',-6,3,-4,guardKeypad);
  reg('🌀 打开Boss房大门','to-boss',6,3,-7,()=>secretCheck('guard-done','secret-boss','完成四位密码推理，才能获得进入核心研究室的权限。'),'door');
 }else if(code==='boss'){
  bossEntity(m,0,-3);for(let x of [-8,8]){m.roundBox(x,2,-4.5,2.4,3.3,1.0,.30,'#52648a',5);m.sphere(x,4,-4.3,.35,'#a5f0e6',22,14)}
  reg('👑 挑战禁区Boss','boss-quiz',0,5,-2,bossQuiz,'person');reg('⚡ 知识能源控制台','boss-control',-6,2,-5,bossQuiz);
  reg('🏆 进入隐藏结局','to-final',7,3,-6,()=>secretCheck('clear','secret-final','完成Boss的8道综合知识题，才能开启最终纪念殿堂。'),'door');
 }else if(code==='final'){
  m.cylinder(0,.6,-3,3.1,1.05,'#9aabcb',40);m.sphere(0,3,-3,1.6,'#e5d19c',36,25,[1,1,.25]);for(let i=0;i<8;i++){let a=i*Math.PI/4;m.sphere(Math.cos(a)*5,3,-3+Math.sin(a)*4.4,.6,'#c7d6f3',22,14)}character(m,-4,0,0,522,true);character(m,5,0,1,171,false);
  reg('🎓 查看禁区结局','final-dialog',0,3,-3,secretFinish);reg('🏫 返回22班','class-22',6,2,5,()=>go('class-22'),'door');
 }
 return {title:titles[code]||'禁区',desc:descs[code]||'禁区探索',camera:common};
}


/* 🪨 角石魔影：四间教室中的自主石怪、碰撞、非血腥粒子消散与救援。 */
const STONE_CLASSES=[4,9,15,22],STONE_QUIZZES=[
 ['一（　）小船应该填什么量词？',['本','条','张','颗'],1,'小船通常用“条”来计数。'],
 ['后排有3张桌子，每张桌子有2本书，一共有几本？',['5','6','7','8'],1,'3×2=6本。'],
 ['图案按「独角、双角、独角、双角」排列，第5个是？',['独角','双角','都不是','无法判断'],0,'一、三、五位置都是独角。'],
 ['有4位同学每人拿到3张卡片，一共有多少张？',['7','10','12','14'],2,'4×3=12张。'],
 ['“石像从角落慢慢出现。”哪个词表示速度？',['石像','角落','慢慢','出现'],2,'“慢慢”表示动作比较缓慢。'],
 ['10、15、20、25、（ ）的下一个数是？',['26','28','30','35'],2,'每次加5，25+5=30。'],
 ['警示灯闪了2次，又闪了3次，一共几次？',['4','5','6','7'],1,'2+3=5次。'],
 ['冰块放进温暖的房间会怎样？',['变成液态水','变成铁','变成纸','变成玻璃'],0,'冰受热融化成水。']
];
function isStoneClass(c){return STONE_CLASSES.includes(Number(c))}
function stoneClassNo(){let c=s.scene.startsWith('class-')?Number(s.scene.slice(6)):0;return isStoneClass(c)?c:0}
function stoneCleared(c){return s.flags.includes('stone-cleared-'+c)}
let hornState=null,hornBuf=null,hornStudentBuf=null,hornSparkBuf=null;
function hornModel(m,horns){const dark='#4b4b58',bright='#82838d',glow='#d3658a';m.sphere(0,1.15,0,1.18,dark,34,24,[1,1.04,.80]);m.sphere(-.54,1.58,-.19,.59,'#696a75',24,18,[1,1,.95]);m.sphere(.64,.82,.12,.52,bright,24,18,[1.22,.65,.97]);m.sphere(.05,1.85,.31,.74,'#777781',26,20,[1,.47,.62]);let centers=horns===1?[0]:[-.56,.56];for(let x of centers){m.sphere(x,2.07,-.06,.41,'#a29b95',24,18,[.70,1,.82]);m.cone(x,2.90,-.13,.39,1.43,'#bfb8ad',24);m.sphere(x,3.60,-.13,.12,'#d5c9c1',18,12,[.65,1,.65])}for(let x of [-.38,.38]){m.sphere(x,1.58,.79,.22,'#d9c7cf',22,14,[1,.75,.39]);m.sphere(x,1.57,.91,.115,glow,20,14,[1,.68,.40])}m.sphere(0,1.04,.90,.33,'#30313a',24,16,[1,.18,.34]);for(let x of [-.77,.77])m.sphere(x,.39,.28,.31,'#575765',20,14,[.8,.4,1]);}
function sparkleModel(){let m=new Mesh();for(let i=0;i<22;i++){let a=i*Math.PI*2/22,r=.22+(i%5)*.17;m.sphere(Math.cos(a)*r, .4+(i%7)*.24, Math.sin(a)*r,.065+(i%3)*.025,['#b9e7ff','#e4e1ff','#b8c7fc'][i%3],10,7)}return m}
function initHornStoneForScene(practice=false) {
  const c=stoneClassNo();
  if(!practice&&hornState?.c===c&&(!stoneCleared(c)||hornState.practice))return;
  if(gl){dropBuf(hornBuf);dropBuf(hornStudentBuf);dropBuf(hornSparkBuf);}
  hornBuf=hornStudentBuf=hornSparkBuf=null;
  $('stoneMeter').classList.add('hidden');
  $('stoneParticles').style.display='none';
  document.body.classList.remove('stone-danger');
  if(!c||(!practice&&stoneCleared(c))){hornState=null;return;}
  const mesh=new Mesh(),student=new Mesh(),spark=sparkleModel();
  const horns=stoneQuestionCount(c)===6?2:1;
  hornModel(mesh,horns);
  character(student,0,0,0,studentsFor(c)[3].seed);
  hornBuf=gl?bufferMesh(mesh):mesh;
  hornStudentBuf=gl?bufferMesh(student):student;
  hornSparkBuf=gl?bufferMesh(spark):spark;
  hornState={c,horns,practice,age:0,emerge:0,x:5.5,z:-7.1,
    lost:!practice&&s.flags.includes('stone-lost-'+c),lostTime:-1,hitCool:0,warning:false};
  $('stoneMeter').classList.remove('hidden');
  document.body.classList.add('stone-danger');
  $('stoneMeterTitle').textContent=(practice?'⚡ 石怪竞速演练 · ':'🪨 后排苏醒 · ')+(horns===1?'独角':'双角');
}
function updateHornStone(dt) {
  const h = hornState;
  if (!h || s.locked || modalOpen()) return;
  const tune = CampusWorld.stoneTuning(h.horns, s.learning);
  h.age += dt;
  h.hitCool -= dt;
  h.emerge = clamp((h.age - tune.wake) / tune.rise, 0, 1);
  if (h.emerge > 0 && !h.warning) {
    h.warning = true;
    toast('⚠️ 后排石怪醒了！避开石怪，从讲台左侧接近救援结界。');
    sound(180,.40,'sawtooth',.038);
    sound(140,.40,'triangle',.034,.18);
  }
  if (h.emerge === 1) {
    const from = {x:h.x,z:h.z};
    const target = h.lost ? {x:s.px,z:s.pz} : {x:6,z:3};
    const dx = target.x - h.x, dz = target.z - h.z, distance = Math.hypot(dx,dz);
    if (distance > .01) {
      const advance = Math.min(distance, dt * tune.speed);
      h.x += dx / distance * advance;
      h.z += dz / distance * advance;
      h.heading = Math.atan2(dx,dz);
    }
    if (!h.lost && CampusWorld.touchesPath(from,h,{x:6,z:3},1.25)) {
      h.lost = true;
      h.lostTime = h.age;
      const flag = 'stone-lost-' + h.c;
      if (!h.practice && !s.flags.includes(flag)) { s.flags.push(flag); save(); }
      fx.wrong();
      toast('✨ 同学化作星尘暂时离场。到结界答题，就能把他带回来！');
      const particles = $('stoneParticles');
      particles.innerHTML = Array.from({length:22},(_,i) =>
        '<span style="--a:'+i*360/22+'deg;animation-delay:'+(i%4)*.03+'s"></span>').join('');
      particles.style.display = 'block';
    }
    const inSeal = Math.hypot(s.px-STONE_SEAL.x,s.pz-STONE_SEAL.z)<=4;
    if (!inSeal && h.hitCool <= 0 && CampusWorld.touchesPath(from,h,{x:s.px,z:s.pz},1.45)) {
      h.hitCool = 2.8;
      s.px = 0;
      s.pz = 7;
      clearInput();
      save();
      fx.wrong();
      toast('🌀 回到了安全点。趁短暂保护时间，按住 Shift 冲向结界。');
    }
  }
  const status = h.lost ? '⚠️ 同学等待救援' : h.emerge < 1 ? '从后排缓缓升起……' : '石怪正在向同学移动';
  const label = status + ' · ' + (h.horns === 1 ? '独角' : '双角') + ' · ' + tune.speed.toFixed(2) + ' 米/秒';
  if ($('stoneMeterText').textContent !== label) $('stoneMeterText').textContent = label;
  $('stoneMeterBar').style.width = Math.round(h.emerge*100)+'%';
}

function hornOffset(now){let h=hornState;return [h.x,h.emerge*2.55-2.55+Math.sin(now*.0023)*.12,h.z]}
function drawHornStoneGL(now){let h=hornState;if(!h)return;if(h.emerge>.01)drawBuf(hornBuf,hornOffset(now),h.heading || 0);if(!h.lost)drawBuf(hornStudentBuf,[6,0,3]);else if(h.lostTime>=0&&h.age-h.lostTime<2.0)drawBuf(hornSparkBuf,[6,.2+Math.max(0,h.age-h.lostTime)*.65,3]);stoneParticlesPosition(h);}
function drawHornStoneSoft(now){let h=hornState;if(!h)return;if(h.emerge>.01)renderSoftMesh(softCtx,hornBuf,hornOffset(now),h.heading || 0);if(!h.lost)renderSoftMesh(softCtx,hornStudentBuf,[6,0,3]);else if(h.lostTime>=0&&h.age-h.lostTime<2.0)renderSoftMesh(softCtx,hornSparkBuf,[6,.2+Math.max(0,h.age-h.lostTime)*.65,3]);stoneParticlesPosition(h);}
function stoneParticlesPosition(h){let b=$('stoneParticles');if(h.lostTime<0||h.age-h.lostTime>2.5){b.style.display='none';return}let p=project(6,1.3,3);if(p){b.style.left=p[0]+'px';b.style.top=p[1]+'px';}}
const DOUBLE_STONE_QUESTIONS = [
  ['结界原来有27点能量，又加了18点，最后用掉9点，还剩多少点？',['34','36','38','46'],1,'27＋18＝45，45－9＝36。'],
  ['有7排护盾，每排6面，其中8面没有点亮。已经点亮多少面？',['32','34','36','42'],1,'先算7×6＝42，再算42－8＝34。']
];
const STONE_SEAL = {x:-3,z:-5.5};
function stoneQuestionCount(c) { return c === 9 || c === 22 ? 6 : 4; }
function stoneObserve(c) {
  const cleared = stoneCleared(c), double = stoneQuestionCount(c) === 6;
  dialog('🪨 '+c+'班后排 · '+(double?'双角':'独角')+'石怪',
    `<div class="stone-card"><strong>后墙旁的石头会自己从地面升起！</strong>
    <p>${double?'双角石怪醒得更早，移动更快。':'独角石怪会向后排同学移动。'}触碰后角色会化作星尘，等待结界救援。</p>
    <p>${cleared?'✅ 本班已完成救援。':'🛡️ 走到讲台左侧的救援结界，完成 '+stoneQuestionCount(c)+' 道题。'}</p></div>
    <button class="btn blue full" id="stoneResolve">${cleared?'查看救援记录':'前往救援结界'}</button>`);
  $('stoneResolve').onclick = () => { closeDialog(); stoneRescue(c); };
}
function stoneRescue(c) {
  const key = 'stone-cleared-' + c;
  if (stoneCleared(c)) {
    dialog('🏅 '+c+'班已经安全',
      '<div class="stone-card">同学回到了教室。救援记录已保存。</div><button class="btn blue full" id="stoneResume">继续探索</button>');
    $('stoneResume').onclick = closeDialog;
    if(hornState?.practice){
      if(Math.hypot(s.px-STONE_SEAL.x,s.pz-STONE_SEAL.z)>4){
        closeDialog();toast('走到蓝色结界附近，即可结束演练。');return;
      }
      hornState=null;renderScene();
      $('dTitle').textContent='🏁 石怪竞速演练完成';
      return;
    }
    const practice=document.createElement('button');
    practice.className='btn full';
    practice.textContent='⚡ 重玩石怪追逐';
    practice.onclick=()=>{
      closeDialog();
      s.px=0;s.pz=6;
      initHornStoneForScene(true);
      renderScene();
      toast('按住 Shift 或屏幕冲刺按钮。走到蓝色结界可结束演练。');
    };
    $('dBody').appendChild(practice);
    return;
  }
  const total = stoneQuestionCount(c);
  if (total === 6 && Math.hypot(s.px - STONE_SEAL.x, s.pz - STONE_SEAL.z) > 4) {
    toast('走进讲台左侧的蓝色安全结界，再启动双角石怪救援。');
    return;
  }
  let idx = Math.min(s.stoneQuizProgress[c] || 0,total);
  const questions = [0,1,3,5].map(offset => STONE_QUIZZES[(c+offset)%8]);
  if (total === 6) questions.push(...DOUBLE_STONE_QUESTIONS);
  function show() {
    if (idx === total) {
      s.flags = s.flags.filter(v => v !== 'stone-lost-'+c);
      s.flags.push(key);
      s.stoneQuizProgress[c] = total;
      reward(12,35);
      fx.unlock();
      renderScene();
      dialog('🎊 '+c+'班同学救援成功！',
        `<div class="stone-card">你答对了 ${total} 道题。同学在一阵星光中回到了教室！<p>获得 ⭐12、🪙35，以及「${c}班石怪守护者」记录。</p></div>
        <button class="btn blue full" id="stoneSuccess">返回安全教室</button>`);
      $('stoneSuccess').onclick = closeDialog;
      return;
    }
    const q = questions[idx];
    dialog('🛡️ '+c+'班 · 石怪救援挑战',
      `<div class="stone-quiz-bar"><span>语文 · 数学 · 逻辑 · 科学</span><span>第 ${idx+1} / ${total} 题</span></div>
      <div class="progress"><i style="width:${idx/total*100}%"></i></div><div class="quiztitle">${q[0]}</div>
      <div class="choices" id="stoneQuizChoices">${q[1].map((v,i)=>`<button data-answer="${i}">${'ABCD'[i]}. ${v}</button>`).join('')}</div>
      <div class="sm" id="stoneQuizFeed">答错可以重试。对话期间石怪会暂停。</div><button class="btn full" id="stoneQuizLeave">暂时退出救援</button>`);
    $('stoneQuizLeave').onclick = closeDialog;
    const buttons = [...$('stoneQuizChoices').querySelectorAll('button')];
    buttons.forEach(button => button.onclick = () => {
      if (Number(button.dataset.answer) !== q[2]) {
        fx.wrong(); $('stoneQuizFeed').textContent = '❌ 再想一想。提示：' + q[3]; return;
      }
      fx.success();
      idx++;
      if (idx === total) { show(); return; }
      s.stoneQuizProgress[c] = idx;
      save();
      $('stoneQuizFeed').textContent = '✅ ' + q[3];
      buttons.forEach(b => b.disabled = true);
      advanceDialog(show,400);
    });
  }
  show();
}

const bellRoom=CampusBellRoom.create({
  $,getState:()=>s,go,marker,sound,dialog,closeDialog,collect:uniqueCollect,toast,Mesh,
  resetPlayer:position=>{s.px=position.x;s.pz=position.z;clearInput();save();}
});
function buildScene(){let m=new Mesh();sceneMarkers=[];let id=s.scene,desc='',title='',bread='星梦世界 / ',tag='鼠标拖动旋转3D视角',actions=[];const A=(t,fn)=>actions.push([t,fn]);
if(id===CampusBellRoom.ID){
 const data=bellRoom.build(m,A);
 return {mesh:m,title:data.title,desc:data.desc,bread:bread+data.title,tag:'可选惊悚地点',actions,camera:data.camera};
}
if(CampusDistricts.isScene(id)){
 const data=CampusDistricts.build(id,m,A,{
   marker,go,tree,lamp,bench,character,collect:uniqueCollect,students:studentsFor(22),person:personDialog,
   player:()=>({x:s.px,z:s.pz}),toast
 });
 if(data)return {mesh:m,title:data.title,desc:data.desc,bread:bread+data.title,tag:'三街探险',actions,camera:data.camera};
}
if(id==='street'){
 const data=neighborhood.build(m,A);
 return {mesh:m,title:data.title,desc:data.desc,bread:bread+data.title,tag:'自行车 · 小车 · 轻轨 · 小吃摊',actions,camera:data.camera};
}if(id==='campus'){campus(m);campusDetails(m);neighborhood.gateAtCampus(m);CampusBellRoom.tower(m);
const oldDoor=()=>go(CampusBellRoom.ID);
const oldEntrance=CampusBellRoom.ENTRANCE;
marker('door','🕰️ 旧钟楼','old-bellroom-entrance',oldEntrance.x,3.5,oldEntrance.z,oldDoor);
A('🕰️ 探索校园东北角的旧钟楼',oldDoor);
marker('door','🚪 走出校门','exit-campus',0,4.8,30,()=>go('school-street'));
A('🚪 走出校门 · 学校街',()=>go('school-street'));title='🌳 星梦校园 · 二年级上学期冒险';desc='校园的每个地点都有可旋转的立体空间。乘飞机、坐轻轨、驾驶小车、开游艇，也可以进入学校学习、与同学交朋友。';camera={theta:.74,phi:.96,dist:73,target:[0,3,-1]};const buildings=[['🏫 星梦学校','hall',0,7,-8],['✈️ 飞机场','air',-27,4,-14],['🛥️ 游艇','yacht',-30,3,16],['🚈 轻轨','train',24,7,-12],['🚗 小车','car',25,4,13],['📚 图书馆','library',-11,7,20],['🧪 科学馆','lab',11,7,20],['🌷 花园','garden',32,4,22]];buildings.forEach(([label,to,x,y,z])=>{marker('door',label,to,x,y,z,()=>go(to));A(label,()=>go(to))});marker('item','✨ 隐藏彩蛋','egg',0,2.6,4,()=>runAction('egg'));A('✨ 音乐喷泉彩蛋',()=>runAction('egg'));}else if(id==='hall'){hall(m);title='🏛️ 星梦学校 · 探索大厅';desc='大理石地板、金色校徽、书柜和校长办公室。请探索一楼、二楼，22个班级都能进门。';camera={theta:.20,phi:1.04,dist:23.5,target:[0,2,-2]};marker('person','👨‍🏫 林校长','principal',-5,3,1,()=>runAction('principal'));marker('item','🗝️ 秘密书柜','desk',-7,3,-4,()=>runAction('desk'));marker('door','🚪 一层教室','floor-1',-5,4,-8,()=>go('floor-1'));marker('door','🚪 二层教室','floor-2',5,4,-8,()=>go('floor-2'));marker('item','🏫 钟楼秘密','clock',0,3,-3,()=>runAction('clock'));[['👨‍🏫 找校长','principal'],['🗝️ 调查校长书柜','desk'],['🕒 调查神秘时钟','clock']].forEach(([t,k])=>A(t,()=>runAction(k)));A('🚪 进入教学楼一层',()=>go('floor-1'));A('🚪 进入教学楼二层',()=>go('floor-2'));}else if(id.startsWith('floor-')){let f=Number(id.slice(6));hallway(m,f);title='🚪 教学楼 '+(f===1?'一':'二')+'层 · 班级长廊';desc=f===1?'一层：二年级1班至11班。点击教室门牌进入班级，与老师和四位同学交流。':'二层：二年级12班至22班。22班里藏着化学实验特别任务。';camera={theta:.09,phi:1.0,dist:62,target:[0,2,0]};for(let i=1;i<=11;i++){let c=f===1?i:i+11,x=-40+(i-1)*8,z=i%2?7.7:-7.7;marker('door',c+'班','class-'+c,x,4,z,()=>go('class-'+c));A('🚪 进入二年级'+c+'班'+(s.stamps.includes(c)?' · 已通关':''),()=>go('class-'+c))}marker('door','🔄 切换楼层','swap',0,4,0,()=>go('floor-'+(f===1?2:1)));A('🛗 切换到'+(f===1?'二':'一')+'层',()=>go('floor-'+(f===1?2:1)));}else if(id.startsWith('class-')){let c=Number(id.slice(6)),p=teacherFor(c);classroom(m,c);if(c===22)secretPortal(m);title='📘 二年级'+c+'班 · '+topics[c-1]+'课堂';desc=`欢迎来到二年级${c}班。本班由${p.name}带领，四位同学都能和你交流；回答老师8道进阶题，就能获得专属班级印章。`;camera={theta:.18,phi:1.09,dist:23.0,target:[0,1.9,-2]};marker('person','👩‍🏫 '+p.name,'teacher',-7,3.0,-4.2,()=>runAction('teacher'));A('👩‍🏫 和 '+p.name+' 交流、挑战',()=>runAction('teacher'));studentsFor(c).forEach((p,i)=>{let x=-6+i*4,z=3.0;marker('person','👤 '+p.name,'student-'+i,x,2.7,z,()=>runAction('student-'+i));A('👤 和 '+p.name+' 同学聊天',()=>{if(hornState?.lost&&i===3){toast('这位同学暂时离场。去结界完成救援吧。');return}runAction('student-'+i)})});marker('item','📖 黑板上的秘密','chalk',0,5,-8.2,()=>runAction('chalk'));marker('item','📚 翻看图书角','book',8,4,-5.6,()=>runAction('book'));A('🖍️ 看看黑板的隐藏彩蛋',()=>runAction('chalk'));A('📚 探索班级图书角',()=>runAction('book'));if(isStoneClass(c)){desc+=' ⚠️ 请小心，教室后排出现一块会自己活动的长角石头！';marker('item','🪨 调查后排角石怪','stone-watch',5.5,3.5,-6.2,()=>stoneObserve(c));A('🪨 调查石怪的独角或双角',()=>stoneObserve(c));marker('item','🛡️ 开启石怪救援结界','stone-rescue',-3,2.4,-5.5,()=>stoneRescue(c));A('🛡️ 回答'+stoneQuestionCount(c)+'道题 · 救援同学',()=>stoneRescue(c));m.cylinder(-3,.024,-5.5,3.95,.022,'#a6b8b2',32);m.cylinder(-3,.09,-5.5,1.18,.12,'#679bb0',24);m.cylinder(-3,.16,-5.5,.86,.07,'#9cd1ce',24);}if(c===22){marker('item','🧪 元素图鉴挑战','class22',4,2,-5,()=>{dialog('🧪 22班 · 科学社团',`<h3>化学元素和小小实验</h3><p>氦的化学符号是 He，铁是 Fe，水是 H₂O。实验室的化学试剂不能尝、不能随意混合。今天我们一起当校园科学家！</p><button class="btn blue full" id="lab22">🔬 前往未来科学馆</button>`);$('lab22').onclick=()=>{closeDialog();go('lab')}});A('🧪 元素探索社团',()=>elementMuseum());A('🧪 22班特别科学互动',()=>{dialog('🧪 22班 · 科学社团',`<p>元素周期表探索：氢 H、氦 He、氧 O、铁 Fe。所有化学实验必须由老师指导，不能混合未知物质。</p><button class="btn blue full" id="lab22">前往未来科学馆</button>`);$('lab22').onclick=()=>{closeDialog();go('lab')}});marker('door','👁️ 22班后墙 · 禁区暗门','secret-door',9.4,3.2,-7.6,()=>secretDoor());A('👁️ 调查22班后墙：神秘禁区',()=>secretDoor());}}else if(id.startsWith('secret-')){let sec=buildSecretScene(m,id,A);title=sec.title;desc=sec.desc;camera=sec.camera;}else{let p=id.split('-')[0],cfg=zones[p];if(!cfg){title=id;desc='秘密房间';}else{let sub=id.includes('-'),entry=cfg.children.find(x=>x[0]===id);title=cfg.icon+' '+cfg.name+(sub?' · '+(entry?entry[1]:'内部探索'):'');desc=sub?'深入探索内部设施。可与工作人员交谈、完成检查、寻找隐藏宝物，再返回上一级房间。':'这里不是单一点击按钮！你可以继续进入三个不同的三维子空间，并在那里调查道具、领取奖励。';camera={theta:.35,phi:1.0,dist:sub?23:32,target:[0,2,0]};if(!sub){m.box(0,-.45,0,36,.8,29,'#9dcfb1');m.box(0,-.04,5,17,.15,12,'#ecd5ac');if(p==='air')plane(m,0,0);if(p==='yacht'){m.box(0,-.13,-5,40,.25,35,'#71bddd');yacht(m,0,0)}if(p==='car')car(m,0,0);if(p==='train')train(m,0,0);if(p==='lab'||p==='library'||p==='garden'){building(m,0,0,p==='lab'?'#c2d9df':'#e3b5bb');for(let x of [-11,11])tree(m,x,2,.7)}cfg.children.forEach((child,i)=>{let x=-8+i*8, y=p==='air'?4:3,z=8;marker('door',child[1],child[0],x,y,z,()=>go(child[0]));A('🚪 '+child[1],()=>go(child[0]))});if(p==='car'||p==='train')A('🚪 前往校门外 · 实际驾驶或乘车',()=>go('street'));}else{subScene(m,id);for(let k of [['🔍 搜索秘密道具','safe',-7,2,-3],['🗣️ 向工作人员学习','worker',0,4,-4],['⭐ 完成场景任务','transport',7,2,2]]){let [label,key,x,y,z]=k;marker('item',label,key,x,y,z,()=>key==='worker'?personDialog({name:'校园工作人员',seed:848,adult:true},'这里的机械和科学装置都有用。先观察、再思考，并始终把安全放在第一位。',{key:'worker-'+id}):runAction(key));A(label,()=>key==='worker'?personDialog({name:'校园工作人员',seed:848,adult:true},'只要学会发现问题、独立思考，任何地方都能成为课堂。',{key:'worker-'+id}):runAction(key));}marker('item','📦 调查物品箱','cabinet',5,2,-5,()=>runAction('cabinet'));A('📦 调查物品箱',()=>runAction('cabinet'));}}}if(id!=='campus'){marker('door','↩ 返回上一级','back',-9,3,6,()=>back());A('↩ 返回上一场景',back)}return {mesh:m,title,desc,bread:bread+title,tag,actions};}
function renderScene(){document.body.classList.toggle('shadow-zone',s.scene.startsWith('secret-')||s.scene.startsWith('cave-')||s.scene===CampusBellRoom.ID);$('sprintBtn').classList.toggle('hidden',!stoneClassNo());if(s.scene.startsWith('secret-')&&s.audio)sound(118,.33,'triangle',.025);let data=buildScene();if(data.camera)camera=data.camera;
sceneCamera={...camera,target:[...camera.target]};
if(gl)dropBuf(currentMesh);currentMesh=gl?bufferMesh(data.mesh):data.mesh;
const prepareMesh=gl?bufferMesh:mesh=>mesh, releaseMesh=gl?dropBuf:()=>{};
neighborhood.prepare(prepareMesh,releaseMesh);
bellRoom.prepare(prepareMesh,releaseMesh);
softStamp='';initHornStoneForScene();$('sceneTitle').textContent=data.title;$('bread').textContent=data.bread;$('sceneDesc').textContent=data.desc;$('sceneTag').textContent=stoneClassNo()?'🪨 角石守护 · '+(s.flags.includes('stone-cleared-'+stoneClassNo())?'已净化':'危险区域'):(s.scene.startsWith('class-')?'🏅 '+s.stamps.length+'/22 枚班级印章':(s.scene===CampusBellRoom.ID||CampusDistricts.isOutdoor(s.scene)||CampusDistricts.isScene(s.scene)?data.tag:'可自由旋转视角'));$('actions').innerHTML='';for(let [t,fn] of data.actions){let b=document.createElement('button');b.className='action';b.innerHTML='<span class="ic">'+t.split(' ')[0]+'</span><span>'+t.split(' ').slice(1).join(' ')+'</span>';b.onclick=()=>guard(fn);$('actions').appendChild(b)}$('markers').innerHTML='';markerNodes=[];sceneMarkers.forEach((m,i)=>{let b=document.createElement('button');b.className='floatlabel '+(m.kind==='person'?'person':m.kind==='door'?'door':'');b.innerHTML='<span class="dot"></span>'+m.title;b.onclick=e=>{e.stopPropagation();guard(m.fn)};$('markers').appendChild(b);markerNodes.push([m,b])});$('classPanel').classList.toggle('hidden',s.scene!=='hall'&&!s.scene.startsWith('floor-')&&!s.scene.startsWith('class-'));buildClassGrid();hud();save();}
function buildClassGrid(){const g=$('classGrid');g.innerHTML='';for(let i=1;i<=22;i++){let b=document.createElement('button');b.textContent=i+'班';b.className=(s.stamps.includes(i)?'on ':'')+(s.scene==='class-'+i?'active':'');b.onclick=()=>go('class-'+i);g.appendChild(b)}}
function renderSoftMesh(ctx,mesh,offset=[0,0,0],yaw=0,spin=0) {
  if(!mesh||!mesh.p)return;
  const p=mesh.p,n=mesh.n,c=mesh.c,tris=[],wd=$('view').clientWidth,ht=$('view').clientHeight;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(spin),sx=Math.sin(spin);
  const vertex = i => {
    const x=p[i], y=p[i+1]*cx-p[i+2]*sx, z=p[i+1]*sx+p[i+2]*cx;
    return project(x*cy+z*sy+offset[0],y+offset[1],-x*sy+z*cy+offset[2]);
  };
  for(let i=0;i<p.length;i+=9){
    const a=vertex(i),b=vertex(i+3),cc=vertex(i+6);
    if(!a||!b||!cc||a[2]<.1||b[2]<.1||cc[2]<.1)continue;
    if(Math.max(a[0],b[0],cc[0])<0||Math.min(a[0],b[0],cc[0])>wd||Math.max(a[1],b[1],cc[1])<0||Math.min(a[1],b[1],cc[1])>ht)continue;
    const intensity=.66+Math.max(0,n[i]*-.45+n[i+1]*.9+n[i+2]*.65)*.35;
    let depth=(a[2]+b[2]+cc[2])/3;
    const fog=clamp((depth-35)/125,0,.45);
    const color=[c[i],c[i+1],c[i+2]].map(v=>Math.min(255,Math.round(255*((1-fog)*v*intensity+fog*.81))));
    if(Math.max(p[i+1],p[i+4],p[i+7])+offset[1]<.23&&Math.abs(n[i+1])>.7)depth+=300;
    tris.push({a,b,c:cc,depth,fill:'rgb('+color.join(',')+')'});
  }
  tris.sort((a,b)=>b.depth-a.depth);
  for(const t of tris){
    ctx.fillStyle=t.fill;ctx.beginPath();ctx.moveTo(t.a[0],t.a[1]);
    ctx.lineTo(t.b[0],t.b[1]);ctx.lineTo(t.c[0],t.c[1]);ctx.closePath();ctx.fill();
  }
}

function renderSoft(now){let canvas=$('glCanvas'),w=canvas.width,h=canvas.height;if(!w||!h)return;let key=[s.scene,camera.theta.toFixed(4),camera.phi.toFixed(4),camera.dist.toFixed(2),w,h].join('|');if(!softLayer){softLayer=document.createElement('canvas');softStamp='';}if(softLayer.width!==w||softLayer.height!==h){softLayer.width=w;softLayer.height=h;softStamp=''}if(key!==softStamp&&(now-softLastPaint>75||!softLastPaint)){let c=softLayer.getContext('2d');c.clearRect(0,0,w,h);c.setTransform(pixelRatio,0,0,pixelRatio,0,0);renderSoftMesh(c,currentMesh);softStamp=key;softLastPaint=now}softCtx.setTransform(1,0,0,1,0,0);softCtx.clearRect(0,0,w,h);if(softLayer.width>0&&softLayer.height>0)softCtx.drawImage(softLayer,0,0);softCtx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
if(!neighborhood.active())renderSoftMesh(softCtx,playerBuffer,[s.px,0,s.pz],playerHeading);
if(s.scene==='street')neighborhood.draw((...args)=>renderSoftMesh(softCtx,...args));drawHornStoneSoft(now);bellRoom.draw((...args)=>renderSoftMesh(softCtx,...args));softCtx.setTransform(1,0,0,1,0,0)}
function readInput() {
  const active = new Set([...keysHeld.values(), ...touchHeld.values()]);
  return {
    x:Number(active.has('right'))-Number(active.has('left')),
    z:Number(active.has('down'))-Number(active.has('up')),
    brake:active.has('brake'),sprint:active.has('sprint')
  };
}
function walk(input, dt) {
  const {x,z}=input;
  if (!x && !z) return;
  playerHeading=Math.atan2(x,z);
  if (s.scene==='street') {
    const next=CampusWorld.moveOnFoot({x:s.px,z:s.pz},input,dt);
    s.px=next.x;s.pz=next.z;
  } else if (s.scene===CampusBellRoom.ID) {
    const b=CampusBellRoom.BOUNDS, stride=8.8*dt/Math.hypot(x,z);
    s.px=clamp(s.px+x*stride,b.minX,b.maxX);
    s.pz=clamp(s.pz+z*stride,b.minZ,b.maxZ);
    if(s.pz>=8&&Math.abs(s.px)<1.6)go('campus');
  } else if (CampusDistricts.isScene(s.scene)) {
    const next=CampusDistricts.move(s.scene,{x:s.px,z:s.pz},input,dt);
    s.px=next.x;s.pz=next.z;
  } else {
    const width=s.scene==='campus'?44:s.scene.startsWith('floor-')?42:10.5;
    const velocity=(stoneClassNo()&&input.sprint?22:9)*dt/Math.hypot(x,z);
    s.px=clamp(s.px+x*velocity,-width,width);
    s.pz=clamp(s.pz+z*velocity,s.scene==='campus'?-32:-7,s.scene==='campus'?34:8);
    if(s.scene==='campus' && s.pz>=31.5 && Math.abs(s.px)<2.8)go('school-street');
  }
  const nextStreet=CampusDistricts.walkingExit(s.scene,{x:s.px,z:s.pz});
  if(nextStreet)go(nextStreet);
}
function draw(now) {
  requestAnimationFrame(draw);
  if(!gl&&!softCtx)return;
  const dt=lastFrame?clamp((now-lastFrame)/1000,0,.12):0;
  lastFrame=now;
  const playing=!s.locked&&!modalOpen();
  if(playing){
    const input=readInput();
    if(!neighborhood.active())walk(input,dt);
    if(s.scene==='street')neighborhood.tick(dt,{throttle:-input.z,steer:input.x,brake:input.brake});
    updateHornStone(dt);
    bellRoom.step(dt);
  }
  const canvas=$('glCanvas'),r=$('view').getBoundingClientRect();
  pixelRatio=Math.min(2,window.devicePixelRatio||1);
  const w=Math.floor(r.width*pixelRatio),h=Math.floor(r.height*pixelRatio);
  if(canvas.width!==w||canvas.height!==h){
    canvas.width=w;canvas.height=h;if(gl)gl.viewport(0,0,w,h);softStamp='';
  }
  if(CampusDistricts.isOutdoor(s.scene) && gl){
    const tracked=neighborhood.anchor() || {x:s.px,z:s.pz};
    const mounted=Boolean(neighborhood.active());
    const follow=1-Math.exp(-dt*3.5);
    const tx=clamp(tracked.x,mounted?-38:-23,mounted?38:23),tz=clamp(tracked.z,mounted?-17:s.scene==='street'?2:-5,mounted?24:15);
    camera.target[0]+=(tx-camera.target[0])*follow;
    camera.target[2]+=(tz-camera.target[2])*follow;
  }
  setupCamera();
  if(gl){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(shader);
    gl.uniformMatrix4fv(uni.vp,false,VP);
    drawBuf(currentMesh);
    if(!neighborhood.active())drawBuf(playerBuffer,[s.px,0,s.pz],playerHeading);
    if(s.scene==='street')neighborhood.draw(drawBuf);
    drawHornStoneGL(now);
    bellRoom.draw(drawBuf);
  }else renderSoft(now);
  for(const [m,b] of markerNodes){
    const position=markerPosition(m),p=project(position.x,position.y,position.z);
    const missing=hornState?.lost && m.id==='student-3';
    const driving=neighborhood.active() && m.id!=='station-west' && m.id!=='station-east';
    b.style.display=!missing&&!driving&&p&&p[0]>-80&&p[0]<r.width+80&&p[1]>-30&&p[1]<r.height+30?'block':'none';
    if(p){b.style.left=p[0]+'px';b.style.top=p[1]+'px';}
  }
}
function interactNearest() {
  if(modalOpen())return;
  if(s.locked){openQuiz();return;}
  if(neighborhood.active()){neighborhood.dismount();return;}
  const available=sceneMarkers.filter(m=>m.id!=='back' && !(hornState?.lost && m.id==='student-3'));
  const list=available.map(m=>{
    const p=markerPosition(m);
    return {m,d:Math.hypot(p.x-s.px,p.z-s.pz)};
  }).sort((a,b)=>a.d-b.d);
  if(!list.length){toast('附近没有可以互动的物品');return;}
  if(list[0].d<=7.5)guard(list[0].m.fn);
  else toast('请向 '+list[0].m.title+' 走近一些，再按 E 互动。');
}

function escapeText(text){return String(text).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
function downloadJSON(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
function exportProgress(){downloadJSON('星梦校园_本地学习存档_'+new Date().toISOString().slice(0,10)+'.json',{format:'xingmeng-save-v1',schema:1,appVersion:CampusLearning.VERSION,exportedAt:new Date().toISOString(),state:s});toast('成长记录已保存为 JSON 文件。请妥善保管个人学习记录。')}
function restoreProgress(file) {
  const restored = CampusSave.importFile(file, isScene);
  localStorage.setItem(SAVE,JSON.stringify(restored));
  location.reload();
}

function parentPanel(){const P=s.learning;dialog('⚙️ 学习设置 · 家长可调整',`<p class="sm">当前为 <b>小学二年级上学期</b> 专用题库，后续学段将通过新增内容包扩展。不会仅凭玩得久就直接跳级。</p><div style="display:grid;gap:10px;margin:14px 0"><label>题目节奏 <select id="learningMode" style="width:100%;padding:9px;border:1px solid #a9bfde;border-radius:9px"><option value="relaxed" ${P.mode==='relaxed'?'selected':''}>轻松：优先巩固</option><option value="standard" ${P.mode==='standard'?'selected':''}>标准：随掌握情况微调</option><option value="challenge" ${P.mode==='challenge'?'selected':''}>轻度挑战：在二上范围内提高一档</option></select></label><label style="display:flex;gap:9px;align-items:center"><input type="checkbox" id="calmMode" ${P.calm?'checked':''}/> 温和冒险模式（石怪速度更慢，保留无血腥的光点效果）</label></div><p class="sm">建议一次游玩 15—25 分钟后休息。每小时答题保留，但不会因答错扣除星星或存档；可查看提示。</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn blue" id="learningSave">保存设置</button><button class="btn" id="progressExport">💾 备份存档</button><button class="btn" id="progressImport">📂 导入存档</button><input type="file" accept="application/json,.json" id="importFile" style="display:none"/></div><p class="tiny">隐私：数据仅保存在本机浏览器。公开的 GitHub 仓库不会包含玩家答题记录，也不使用真实同学资料。</p>`);$('learningSave').onclick=()=>{P.mode=$('learningMode').value;P.calm=$('calmMode').checked;save();fx.success();toast('设置已保存');closeDialog()};$('progressExport').onclick=exportProgress;$('progressImport').onclick=()=>$('importFile').click();$('importFile').onchange=async(e)=>{try{const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('文件过大');restoreProgress(JSON.parse(await file.text()))}catch(err){toast('导入失败：'+err.message)}};}
const ELEMENTS=[
 ['H','氢','氢是元素周期表中的第1号元素','H'],
 ['He','氦','氦是很轻的气体，也是稀有气体','He'],
 ['C','碳','铅笔芯主要含石墨，它由碳组成','C'],
 ['N','氮','空气里含量最多的气体主要是氮气','N'],
 ['O','氧','氧是空气的重要成分，呼吸离不开氧气','O'],
 ['Fe','铁','很多常见铁制品能被磁铁吸引','Fe'],
 ['Cu','铜','很多电线里面使用铜金属导电','Cu'],
 ['Au','金','金是一种金属元素，它的元素符号是Au','Au']
];
function elementMuseum(){let owned=Array.isArray(s.learning.elements)?s.learning.elements:[];dialog('🧪 我的元素图鉴 · 自由探索',`<p class="sm">这是兴趣奖励区，不计入语文和数学的强制通关。了解元素符号、生活用途和安全常识，收集八张元素卡片（${owned.length}/8）。</p><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px">${ELEMENTS.map((x,i)=>`<button class="btn" data-element="${i}" style="min-height:87px;padding:8px 4px"><span style="display:block;font-size:25px;color:#395eac">${x[0]}</span>${x[1]}<br><span class="tiny">${owned.includes(x[0])?'✅ 已收集':'🔍 探索'}</span></button>`).join('')}</div><p class="tiny">实验安全：这里不要求真实操作化学品，也不要品尝或混合不认识的物质。</p>`);$('dBody').querySelectorAll('[data-element]').forEach(b=>b.onclick=()=>elementChallenge(Number(b.dataset.element)))}
function elementChallenge(i){let e=ELEMENTS[i],opts=[e[1],ELEMENTS[(i+1)%8][1],ELEMENTS[(i+3)%8][1],ELEMENTS[(i+5)%8][1]];let order=[2,0,3,1].map(x=>opts[x]);const answer=order.indexOf(e[1]);dialog('🔬 元素卡片 · '+e[0],`<div style="text-align:center;border-radius:16px;padding:12px;background:#e6efff"><b style="font-size:45px;color:#345fbd">${e[0]}</b><div>${e[2]}。</div></div><p class="quiztitle">选择题：元素符号 ${e[0]} 表示什么元素？</p><div class="choices" id="elementChoices">${order.map((x,k)=>`<button data-ec="${k}">${'ABCD'[k]}. ${x}</button>`).join('')}</div><p class="sm" id="elementFeed">仔细观察，答错可以再试。</p><button class="btn full" id="backElements">返回元素图鉴</button>`);$('backElements').onclick=elementMuseum;$('elementChoices').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(Number(b.dataset.ec)!==answer){fx.wrong();$('elementFeed').textContent='再看看卡片的元素名称和符号。';return}let owned=Array.isArray(s.learning.elements)?s.learning.elements:[];if(!owned.includes(e[0])){owned.push(e[0]);s.learning.elements=owned;reward(3,10)}fx.success();$('elementFeed').textContent='✅ 答对了！收藏元素 '+e[1]+' · '+e[0]+'。';$('elementChoices').querySelectorAll('button').forEach(b=>b.disabled=true);save()})}
function learningPanel(){const rep=CampusLearning.report(s.learning),subjects=['cn','ma','sci'];const parts=subjects.map(t=>{let x=rep[t];return `<div class="panel"><b>${x.name}</b> · ${x.label}（${x.level}/3）<div class="progress"><i style="width:${x.total?x.accuracy:0}%"></i></div><div class="sm">已答 ${x.total} 题 · 首次答对率 ${x.total?x.accuracy+'%':'尚未开始'} ${x.recent!==null?'· 最近表现 '+x.recent+'%':''}</div></div>`}).join('');let mistakes=s.learning.mistakes.filter(v=>!v.reviewed).slice(0,8);dialog('📊 我的成长档案 · 二年级上学期',`<div class="panel"><b>🎯 当前成长目标</b><p class="sm">不追求一直做更难的题：优先做到读题准确、计算稳定、敢于观察和提问。连续表现稳定后，难度最多提高一个小台阶。</p><div class="sm">累计完成 ${s.learning.total} 道题 · 22班印章 ${s.stamps.length}/22 · 科学兴趣题可以作为奖励探索</div></div>${parts}<h3>📒 错题回顾（未复习 ${s.learning.mistakes.filter(v=>!v.reviewed).length} 题）</h3>${mistakes.length?mistakes.map((x,i)=>`<div class="panel"><b>${escapeText(x.question)}</b><p class="sm">${escapeText(x.explain)}</p><button class="btn" data-reviewed="${s.learning.mistakes.indexOf(x)}">我已经理解了 ✓</button></div>`).join(''):'<p class="sm">现在没有待复习的错题。</p>'}<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn blue" id="learningBackup">💾 导出成长记录</button><button class="btn" id="learningSettings">⚙️ 设置</button></div>`);$('learningBackup').onclick=exportProgress;$('learningSettings').onclick=parentPanel;$('dBody').querySelectorAll('[data-reviewed]').forEach(b=>b.onclick=()=>{CampusLearning.review(s.learning,Number(b.dataset.reviewed));save();learningPanel()})}

function showWorldMap(){
  if(modalOpen())return;
  if(s.locked){openQuiz();return;}
  dialog('🗺️ 三街地图',`<p class="sm">从西向东依次经过学校街、小吃摊街和我的家街。也可以直接选择要去的街。</p>
    <div class="map-links">${CampusDistricts.streets.map(area=>`<button class="btn" data-district="${area.id}">
      ${area.icon} ${area.name}<small>${area.note}</small></button>`).join('')}</div>`);
  $('dBody').querySelectorAll('[data-district]').forEach(button=>button.onclick=()=>{closeDialog();go(button.dataset.district);});
}
function bind(){
  let drag=null;
  const view=$('view');
  view.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,theta:camera.theta,phi:camera.phi};
    view.setPointerCapture(e.pointerId);
    view.classList.add('drag');
  });
  view.addEventListener('pointermove',e=>{
    if(drag?.id!==e.pointerId)return;
    camera.theta=drag.theta-(e.clientX-drag.x)*.007;
    camera.phi=clamp(drag.phi-(e.clientY-drag.y)*.006,.29,1.38);
  });
  const endDrag=e=>{if(drag?.id===e.pointerId){drag=null;view.classList.remove('drag');}};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])view.addEventListener(event,endDrag);
  view.addEventListener('wheel',e=>{
    e.preventDefault();
    camera.dist=clamp(camera.dist*(e.deltaY>0?1.1:.91),12,(s.scene==='campus'||CampusDistricts.isOutdoor(s.scene))?135:95);
  },{passive:false});
  $('resetCamera').onclick=()=>{if(sceneCamera)camera={...sceneCamera,target:[...sceneCamera.target]};};
  $('interactBtn').onclick=interactNearest;
  $('camLeft').onclick=()=>{camera.theta-=.24;fx.click();};
  $('camRight').onclick=()=>{camera.theta+=.24;fx.click();};
  for(const button of document.querySelectorAll('[data-move]')){
    button.addEventListener('pointerdown',e=>{
      if(modalOpen()||s.locked)return;
      touchHeld.set(e.pointerId,button.dataset.move);
      button.setPointerCapture(e.pointerId);
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{
      if(touchHeld.delete(e.pointerId)&&!neighborhood.active())save();
    });
  }
  const keys={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right',shift:'sprint'};
  window.addEventListener('keydown',e=>{
    if(modalOpen()||e.target.matches('input,textarea,select,[contenteditable]'))return;
    const key=e.key.toLowerCase();
    if(key==='e'&&!e.repeat){e.preventDefault();interactNearest();}
    const direction=keys[key] || (key===' '&&neighborhood.active()?'brake':null);
    if(direction&&!s.locked){keysHeld.set(e.code||key,direction);e.preventDefault();}
  });
  window.addEventListener('keyup',e=>{if(keysHeld.delete(e.code||e.key.toLowerCase())&&!neighborhood.active())save();});
  window.addEventListener('blur',clearInput);
  window.addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();save();}});
  $('rideLeave').onclick=()=>neighborhood.dismount();
  $('rideDepart').onclick=()=>neighborhood.depart();
  $('goStreet').onclick=()=>go('street');
  $('goSchoolStreet').onclick=()=>go('school-street');
  $('goHomeStreet').onclick=()=>go('home-street');
  $('worldMap').onclick=showWorldMap;
  $('goMap').onclick=()=>go('campus');$('goHall').onclick=()=>go('hall');$('go22').onclick=()=>go('class-22');$('goSecret').onclick=()=>go('secret-entrance');$('goFloor').onclick=()=>go('floor-1');$('floor1').onclick=()=>go('floor-1');$('floor2').onclick=()=>go('floor-2');$('backBtn').onclick=back;$('dClose').onclick=closeDialog;$('shade').addEventListener('click',e=>{if(e.target===$('shade'))closeDialog()});$('soundBtn').onclick=()=>{s.audio=!s.audio;save();$('soundBtn').textContent=s.audio?'🔊 音效开启':'🔇 开启音效';if(s.audio)fx.unlock();music()};$('bagBtn').onclick=()=>{dialog('🎒 我的探险收藏',`<h3>🌟 探险奖励</h3><p>游戏目标：集齐22枚知识印章，解锁荣誉毕业典礼。${s.graduated?'🎓 已完成全校主线！':''}</p><p>累计获得 ⭐${s.star} 星星，🪙${s.coin} 金币。</p><h3>🏅 班级印章（${s.stamps.length}/22）</h3><p class="sm">${s.stamps.length?s.stamps.map(x=>x+'班').join('、'):'还没有印章，去教室向老师挑战！'}</p><h3>🪨 后排石怪救援记录</h3><p class="sm">${[4,9,15,22].map(c=>c+'班：'+(s.flags.includes('stone-cleared-'+c)?'✅ 已净化':s.flags.includes('stone-lost-'+c)?'⚠️ 同学待救援':'🔎 尚未调查')).join(' · ')}</p><h3>👁️ 22班禁区档案</h3><p class="sm">${s.flags.includes('secret-clear')?'🏆 禁区最终Boss已净化！':'已完成'+secretStepCount()+'/4重试炼。入口位于二年级22班的教室后墙。'}</p><h3>✨ 隐藏发现（${s.eggs.length}）</h3><p class="sm">${s.eggs.length?s.eggs.map(x=>'⭐ '+escapeText(x)).join('、'):'细心调查每个教室和交通工具。'}</p><button class="btn full" id="collectionSnacks">🍡 打开零食袋</button>`);$('collectionSnacks').onclick=neighborhood.showBag;};$('elementBtn').onclick=elementMuseum;$('learningBtn').onclick=learningPanel;$('parentBtn').onclick=parentPanel;$('helpBtn').onclick=()=>dialog('📜 3D 校园探险玩法',`<p><b>操作：</b>按住鼠标左键或手指拖动可旋转3D视角，滚轮缩放；用方向键、WASD或触屏方向键控制人物在校园或教室里行走。按 E 或点「互动」与附近的人物、物品交流，也可以直接点击场景标签。</p><p><b>放学街区：</b>从校门出去，穿过学校街，再到小吃摊街和我的家街。骑车或开车时 W 加速、S 倒车、A/D 转向，空格刹车；停稳按 E 下车。轻轨停站后上车，按 W 或点击发车。小吃可用游戏金币购买。</p><p><b>学习关卡：</b>首次进入游戏进行12道二年级上学期适龄题（语文6题、数学6题）；此后每60分钟进行一次。未完成不能离开魔法教室。每班还有8道适龄题（语文3题、数学3题、科学兴趣2题）。</p><p><b>同学：</b>每个班有4位有名字和不同形象的同学，还有本班老师；四位同学分别有语文、数学、科学兴趣和观察小挑战，可以收集88张友谊贴纸。老师可开启班级挑战并发放专属印章。</p><p><b>角石魔影：</b>第4、9、15、22班的教室后排藏着独角或双角石怪，会自动现身并靠近同学。触碰后人物化为光点并暂时离场（无血腥画面）；可躲避危险并完成4道独角或6道双角救援题，让同学重新出现。玩家被碰到会返回安全位置，可按住 Shift 或屏幕的冲刺按钮迅速接近结界。</p><p><b>22班禁区：</b>在二年级22班后墙找到发光暗门，依次经历黑影线索、雾影怪物、机械守卫、禁区Boss。通过观察与答题化解危机，不进行攻击；完成后奖励传说徽章。</p><p><b>声音：</b>点击右上角🔇开启音效后播放提示声和轻柔的原创合成背景旋律，随时可关闭。</p><p><b>存档：</b>当前浏览器自动保存。文件不依赖联网，但不同浏览器或设备的存档不自动同步。</p>`)}
function start(){
  welcomeStart();
  let ok=false;
  try{ok=initGL();}
  catch{
    const canvas=$('glCanvas');
    canvas.replaceWith(canvas.cloneNode(false));
    gl=null;
  }
  if(!ok){
    softCtx=$('glCanvas').getContext('2d',{alpha:true});
    ok=Boolean(softCtx);
    $('viewHint').textContent=ok?'🎨 兼容模式 · 可旋转的3D立体校园':'浏览器不支持画面绘制';
  }
  bind();
  neighborhood.reset();
  if(ok){
    rebuildAvatar();
    requestAnimationFrame(draw);
  }
  renderScene();
  s.audio=false; // Browsers require a fresh user gesture before audio playback.
  $('soundBtn').textContent='🔇 开启音效';
  hud();
  tick();
  setInterval(tick,1000);
}

start();
})();
