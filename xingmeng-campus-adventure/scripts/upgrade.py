#!/usr/bin/env python3
"""把上一版游戏升级成自适应二上开源版本，生成可离线运行的 index.html。"""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
base=(ROOT/'src/game-template.html').read_text(encoding='utf-8')
engine=(ROOT/'src/learning-engine.js').read_text(encoding='utf-8')
s=base
# 单文件离线运行：将可单独测试的学习引擎内联到主页面
s=s.replace('<script>\n(()=>{\'use strict\';','<script>\n'+engine+'\n</script>\n<script>\n(()=>{\'use strict\';',1)
# 历史题库中包含三四年级/成人逻辑题。本版改用可校验的学段题库，移除不合适的旧题。
start=s.index('const CN=[')
end=s.index('const topics=',start)
s=s[:start]+s[end:]
s=s.replace("SAVE='star-dream-3d-v5'","SAVE='star-dream-3d-v6'")
s=s.replace("localStorage.getItem(SAVE)||localStorage.getItem('star-dream-3d-v4')","localStorage.getItem(SAVE)||localStorage.getItem('star-dream-3d-v5')||localStorage.getItem('star-dream-3d-v4')")
s=s.replace('s.version=5;if(typeof s.avatar', 's.version=6;s.learning=CampusLearning.ensureProfile(s.learning);if(typeof s.avatar')
s=s.replace("if(!Array.isArray(s.flags))s.flags=[];","if(!Array.isArray(s.flags))s.flags=[];if(!Number.isFinite(s.round))s.round=1;if(!Number.isFinite(s.progress))s.progress=0;",1)
s=s.replace("function questionBank(type){return type==='cn'?CN:type==='ma'?MA:SCI}\nfunction pickQuestions(kind,idx){let parts=kind==='hourly'?['cn','ma','cn','ma','cn','ma','cn','ma','cn','ma','cn','ma']:['cn','ma','sci','cn','ma','sci','cn','ma'];return parts.map((type,j)=>{let bank=questionBank(type);let seed=(idx*5+j*9+(type==='ma'?3:type==='sci'?5:0))%bank.length;return {type,q:bank[seed]}})}",
"""function pickQuestions(kind,idx){const key=kind==='hourly'?'activeHourly':'activeClass';let plan=s.learning[key];if(plan&&plan.idx===idx&&Array.isArray(plan.questions)&&plan.questions.length>0)return plan.questions;let questions=CampusLearning.makeQuiz(kind,idx,s.learning,s.round);s.learning[key]={idx,questions};save();return questions}""")
s=s.replace("'📖 语文进阶题',ma:'➕ 数学思维题',sci:'🔬 科学探究题'", "'📖 语文 · 二上',ma:'➕ 数学 · 二上',sci:'🔬 科学兴趣拓展'")
s=s.replace("'❌ 还不对。再读一遍题目，试着找出关键条件。'", "'❌ 没关系，先圈出题目中的关键词，再试一次。'")
s=s.replace("qz.i++;qz.answered=false;qz.mistakes=0;if(qz.kind==='hourly'){s.progress=qz.i;save();}renderQuiz()", "s.learning=CampusLearning.record(s.learning,qz.questions[qz.i],qz.mistakes,qz.kind);qz.i++;qz.answered=false;qz.mistakes=0;if(qz.kind==='hourly')s.progress=qz.i;save();hud();renderQuiz()")
s=s.replace("if(qz.kind==='hourly'){s.locked=false;s.progress=0;", "if(qz.kind==='hourly'){delete s.learning.activeHourly;s.locked=false;s.progress=0;")
s=s.replace("else{let c=qz.idx;if(!s.stamps.includes(c))", "else{delete s.learning.activeClass;let c=qz.idx;if(!s.stamps.includes(c))")
s=s.replace("let banks=[CN,MA,SCI],bank=banks[i%3],q=bank[(c*3+i*7)%bank.length]", "let type=['cn','ma','sci','cn'][i],item=CampusLearning.singleQuestion(type,c*13+i,s.learning),q=item.q")
s=s.replace("if(k===q[2]){fx.success();btn.classList.add('correct');$('miniChoices')", "if(k===q[2]){s.learning=CampusLearning.record(s.learning,item,Number($('miniFeedback').dataset.errors||0),'friend');save();hud();fx.success();btn.classList.add('correct');$('miniChoices')")
s=s.replace("}else{fx.wrong();btn.classList.add('wrong');$('miniFeedback').textContent='再思考一下。提示：'+q[3];", "}else{$('miniFeedback').dataset.errors=String(Number($('miniFeedback').dataset.errors||0)+1);fx.wrong();btn.classList.add('wrong');$('miniFeedback').textContent='再思考一下。提示：'+q[3];")
# 禁区为二上适宜水平：8题保留，但不测试排列组合、奇偶性、三位数方程等内容。
start=s.index('const secretQs=[');end=s.index('function secretDone(',start)
replacement="""const secretQs=[
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
"""
s=s[:start]+replacement+s[end:]
s=s.replace('② 3的平方；③ 8减5；④ 2的立方。','② 3乘3；③ 8减5；④ 4加4。')
# 石怪救援：4道适龄题，禁用三四年级的复杂关系概念。
start=s.index('const STONE_CLASSES=');end=s.index('function isStoneClass(',start)
s=s[:start]+"""const STONE_CLASSES=[4,9,15,22],STONE_QUIZZES=[
 ['一（　）小船应该填什么量词？',['本','条','张','颗'],1,'小船通常用“条”来计数。'],
 ['后排有3张桌子，每张桌子有2本书，一共有几本？',['5','6','7','8'],1,'3×2=6本。'],
 ['图案按「独角、双角、独角、双角」排列，第5个是？',['独角','双角','都不是','无法判断'],0,'一、三、五位置都是独角。'],
 ['有4位同学每人拿到3张卡片，一共有多少张？',['7','10','12','14'],2,'4×3=12张。'],
 ['“石像从角落慢慢出现。”哪个词表示速度？',['石像','角落','慢慢','出现'],2,'“慢慢”表示动作比较缓慢。'],
 ['10、15、20、25、（ ）的下一个数是？',['26','28','30','35'],2,'每次加5，25+5=30。'],
 ['警示灯闪了2次，又闪了3次，一共几次？',['4','5','6','7'],1,'2+3=5次。'],
 ['冰块放进温暖的房间会怎样？',['变成液态水','变成铁','变成纸','变成玻璃'],0,'冰受热融化成水。']
];
"""+s[end:]
s=s.replace("let speed=h.horns===1?.84:1.10;", "let basic=h.horns===1?.63:.77;let speed=s.learning.calm?basic*.66:s.learning.mode==='challenge'?basic*1.12:basic;")
s=s.replace("h.age-2.0)/2.2", "h.age-3.5)/2.8")
s=s.replace("'🌳 星梦校园 · 写实光影探索世界'", "'🌳 星梦校园 · 二年级上学期冒险'")
s=s.replace('一年级22班','二年级22班')
s=s.replace("marker('item','🧪 化学迷你实验','class22',4,2,-5,()=>{dialog('🧪 22班 · 科学社团',", "marker('item','🧪 元素图鉴挑战','class22',4,2,-5,()=>{dialog('🧪 22班 · 科学社团',")
s=s.replace("A('🧪 22班特别科学互动',()=>{dialog('🧪 22班 · 科学社团',", "A('🧪 元素探索社团',()=>elementMuseum());A('🧪 22班特别科学互动',()=>{dialog('🧪 22班 · 科学社团',").replace('一年级'+"${c}", '二年级'+"${c}")
s=s.replace('四位同学分别有语言、数学、科学和探索小挑战', '四位同学分别有语文、数学、科学兴趣和观察小挑战')
s=s.replace('天天</button>', '小探险家</button>')
s=s.replace('星梦校园：22班禁区传说：角石魔影 · 3D冒险完整版', '星梦校园：成长探险 · 二年级上学期 3D开源版')
s=s.replace('星梦校园 · 角石魔影</strong>', '星梦校园 · 成长探险</strong>')
s=s.replace('<span>🪨 角石魔影 · 4间教室</span>', '<span>📚 适配小学二年级上</span>')
s=s.replace('<div class="welcome-note">', '<div class="welcome-note">本版本默认适配二年级上学期：先巩固基础，再根据正确率轻微加难；科学与化学知识作为兴趣拓展。<br>')
s=s.replace('<button class="tool" id="bagBtn">🎒 收藏</button>', '<button class="tool" id="bagBtn">🎒 收藏</button><button class="tool" id="elementBtn">🧪 元素图鉴</button><button class="tool" id="learningBtn">📊 成长档案</button><button class="tool" id="parentBtn">⚙️ 学习设置</button>')
s=s.replace('<span class="pill" id="hStamp">🏅 0/22</span>', '<span class="pill" id="hStamp">🏅 0/22</span><span class="pill" id="hLevel">📚 二上 · 基础</span>')
s=s.replace('<div class="section-title">📋 我的冒险任务</div>', '<div class="section-title">📋 我的冒险任务</div><div class="panel sm"><b>🧒 当前学段：二年级上学期</b><br>语文、数学分开记录掌握情况。高正确率才会轻微提升难度，不自动跳到高年级。</div>')
s=s.replace("$('hStamp').textContent='🏅 '+s.stamps.length+'/22';", "$('hStamp').textContent='🏅 '+s.stamps.length+'/22';$('hLevel').textContent='📚 二上 · 语'+s.learning.subjects.cn.level+' 数'+s.learning.subjects.ma.level;")
# 统一文案，保留 12+8 的关卡长度，科学是轻松奖励关，不作为每小时的硬考核。
s=s.replace('8道进阶题</b>', '8道适龄题</b>')
s=s.replace('12道进阶题（语文6题、数学6题）','12道二年级上学期适龄题（语文6题、数学6题）')
s=s.replace('8道进阶题（语文2+数学2+科学1）','8道适龄题（语文3题、数学3题、科学兴趣2题）')
s=s.replace('6 道语文 + 6 道数学','6 道语文 + 6 道数学')
s=s.replace("'🏅 '+qz.idx+'班老师挑战'", "'🏅 '+qz.idx+'班老师挑战'")
# 家长设置、成长档案、可移植存档（含验证），不会把孩子的表现上传到服务器。
ui=r'''
function escapeText(text){return String(text).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
function downloadJSON(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
function exportProgress(){downloadJSON('星梦校园_本地学习存档_'+new Date().toISOString().slice(0,10)+'.json',{format:'xingmeng-save-v1',schema:1,appVersion:'0.6.0',exportedAt:new Date().toISOString(),state:s});toast('成长记录已保存为 JSON 文件。请妥善保管个人学习记录。')}
function safeArray(v){return Array.isArray(v)?v.filter(x=>(typeof x==='string'&&x.length<70&&!/[<>]/.test(x))||Number.isInteger(x)).slice(0,200):[]}
function restoreProgress(o){if(!o||o.format!=='xingmeng-save-v1'||!o.state||typeof o.state!=='object')throw Error('不是受支持的星梦校园存档');let t=o.state;if(!Number.isFinite(t.round)||t.round<1||t.round>100000)throw Error('轮次数据无效');const safe={...s,star:Math.max(0,Number(t.star)||0),coin:Math.max(0,Number(t.coin)||0),round:Math.floor(t.round),progress:Math.max(0,Math.min(12,Math.floor(Number(t.progress)||0))),due:Number.isFinite(t.due)?t.due:Date.now()+HOUR,avatar:t.avatar===1?1:0,graduated:!!t.graduated,locked:!!t.locked,stamps:safeArray(t.stamps).filter(x=>Number.isInteger(x)&&x>=1&&x<=22),eggs:safeArray(t.eggs),visits:safeArray(t.visits),talk:safeArray(t.talk),flags:safeArray(t.flags),learning:CampusLearning.ensureProfile(t.learning),scene:typeof t.scene==='string'&&/^(campus|hall|floor-[12]|class-([1-9]|1\d|2[012])|[a-z]+(-[a-z]+)?)$/.test(t.scene)?t.scene:'campus',px:0,pz:8};delete safe.learning.activeHourly;delete safe.learning.activeClass;safe.progress=0;save();localStorage.setItem(SAVE,JSON.stringify(safe));location.reload()}
function parentPanel(){const P=s.learning;dialog('⚙️ 学习设置 · 家长可调整',`<p class="sm">当前为 <b>小学二年级上学期</b> 专用题库，后续学段将通过新增内容包扩展。不会仅凭玩得久就直接跳级。</p><div style="display:grid;gap:10px;margin:14px 0"><label>题目节奏 <select id="learningMode" style="width:100%;padding:9px;border:1px solid #a9bfde;border-radius:9px"><option value="relaxed" ${P.mode==='relaxed'?'selected':''}>轻松：优先巩固</option><option value="standard" ${P.mode==='standard'?'selected':''}>标准：随掌握情况微调</option><option value="challenge" ${P.mode==='challenge'?'selected':''}>轻度挑战：只在二上范围内</option></select></label><label style="display:flex;gap:9px;align-items:center"><input type="checkbox" id="calmMode" ${P.calm?'checked':''}/> 温和冒险模式（石怪速度更慢，保留无血腥的光点效果）</label></div><p class="sm">建议一次游玩 15—25 分钟后休息。每小时答题保留，但不会因答错扣除星星或存档；可查看提示。</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn blue" id="learningSave">保存设置</button><button class="btn" id="progressExport">💾 备份存档</button><button class="btn" id="progressImport">📂 导入存档</button><input type="file" accept="application/json,.json" id="importFile" style="display:none"/></div><p class="tiny">隐私：数据仅保存在本机浏览器。公开的 GitHub 仓库不会包含玩家答题记录，也不使用真实同学资料。</p>`);$('learningSave').onclick=()=>{P.mode=$('learningMode').value;P.calm=$('calmMode').checked;save();fx.success();toast('设置已保存');closeDialog()};$('progressExport').onclick=exportProgress;$('progressImport').onclick=()=>$('importFile').click();$('importFile').onchange=async(e)=>{try{const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('文件过大');restoreProgress(JSON.parse(await file.text()))}catch(err){toast('导入失败：'+err.message)}};}
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
'''
anchor='function bind(){'
assert anchor in s
s=s.replace(anchor,ui+'\n'+anchor,1)
s=s.replace("$('helpBtn').onclick=()=>dialog(", "$('elementBtn').onclick=elementMuseum;$('learningBtn').onclick=learningPanel;$('parentBtn').onclick=parentPanel;$('helpBtn').onclick=()=>dialog(")
s=s.replace("function hud(){", "function hud(){",1)
# content text
s=s.replace("if(qz.kind==='hourly')s.progress=qz.i;save();hud();renderQuiz()", "if(qz.kind==='hourly')s.progress=qz.i;else if(s.learning.activeClass)s.learning.activeClass.progress=qz.i;save();hud();renderQuiz()")
s=s.replace("questions:pickQuestions('class',c),i:0,mistakes:0", "questions:pickQuestions('class',c),i:(s.learning.activeClass&&s.learning.activeClass.progress)||0,mistakes:0")
s=s.replace('升级版单机离线', '成长冒险单机离线')
s=s.replace('本轮 12 道题', '本轮 12 道适龄题')
s=s.replace('22班的后面','22班的后面')
s=s.replace('一年级','二年级')
# profile public release uses fictional character placeholder
s=s.replace('🧑🏻 天天','🧑🏻 小探险家')
s=s.replace('</style>', '''
/* 小学生易读：增加文字与页面对比度 */
.quiztitle{font-size:20px;line-height:1.7}
.choices button{font-size:15px;min-height:56px}
body.stone-danger .scenehead .heading{color:#203d69!important}
body.stone-danger .scenehead .bread{color:#536f92!important}
@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
</style>''',1)
(ROOT/'index.html').write_text(s,encoding='utf-8')
print('wrote index.html',len(s),'chars')
