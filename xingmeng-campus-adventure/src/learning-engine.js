/* 星梦校园学习引擎 v0.7 | MIT | 目前正式支持：小学二年级上学期 */
(function(root){'use strict';
const VERSION='0.7.0';
const LIMIT=180;
const SUBJECTS={cn:'语文',ma:'数学',sci:'科学兴趣'};
const LEVEL_TEXT=['','巩固基础','标准练习','轻度拓展'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=(v)=>{let h=2166136261;for(let c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const rng=(seed)=>{let t=seed>>>0;return ()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296}};
const choose=(arr,r)=>arr[Math.floor(r()*arr.length)];
const bank=[];
function add(id,type,diff,topic,prompt,choices,answer,explain){if(new Set(choices.map(String)).size!==4||answer<0||answer>3||typeof explain!=='string')throw Error('Invalid question '+id);bank.push({id,type,diff,topic,q:[prompt,choices,answer,explain]})}
// 「二上」核心内容：识字写词、简单句子、阅读理解、100以内加减、表内乘法、角与长度、观察习惯。
const C=[
['一（　）小船应该填什么量词？',['张','条','头','台'],1,'船通常用“条”来计数。','量词',1],
['“高兴”的近义词是？',['伤心','快乐','安静','害怕'],1,'高兴和快乐意思相近。','词语',1],
['“整齐”的反义词是？',['干净','美丽','凌乱','认真'],2,'凌乱就是不整齐。','词语',1],
['下列哪一个字有“三点水”？',['河','和','禾','何'],0,'“河”的左边是三点水。','识字',1],
['“树叶像一只只小船。”把树叶比作什么？',['书本','小船','星星','雨滴'],1,'“像”前面是树叶，后面是小船。','阅读',1],
['“春天来了，桃花开了。”这句话主要写什么季节？',['春季','夏季','秋季','冬季'],0,'桃花开放常让人想到春天。','阅读',1],
['下面哪个词语能形容秋天？',['冰天雪地','秋高气爽','骄阳似火','春暖花开'],1,'秋高气爽常用来描述秋天天气。','词语',1],
['“太好啦（　）”填哪个标点？',['？','。','！','，'],2,'感叹时常用感叹号。','标点',1],
['“太阳从东方升起。”这句话说的是？',['谁在唱歌','太阳升起的方向','什么时候睡觉','学校有几班'],1,'句中说明太阳从东方升起。','阅读',1],
['“一（　）汽车”应该填什么？',['只','片','辆','支'],2,'汽车常用量词“辆”。','量词',1],
['下面哪个词最适合填“（　）的天空”？',['湛蓝','奔跑','计算','阅读'],0,'天空可以用“湛蓝”形容。','搭配',1],
['“认真”的反义词是？',['专心','仔细','马虎','勤奋'],2,'马虎指不够认真、粗心。','词语',1],
['下面哪一句是完整的句子？',['在教室里面','许多彩色的','小鸟在树上唱歌。','又高又大'],2,'完整句子通常能表达清楚的意思。','句子',1],
['“日”和“月”组成什么字？',['明','朋','早','晚'],0,'“日”加“月”组成“明”。','识字',1],
['“小猫轻轻地走过来。”哪个词写出了走路的样子？',['小猫','轻轻地','走','过来'],1,'“轻轻地”写出动作很轻。','阅读',1],
['要让句子更通顺：“我（　）书包走进教室。”',['背着','长着','唱着','飞着'],0,'“背着书包”是恰当的搭配。','搭配',1],
['“植物需要阳光和水。”这句话里提到了几种需要的东西？',['1种','2种','3种','4种'],1,'阳光和水是两种。','阅读',1],
['下列哪个字可以和“海”组成常见词语？',['洋','拖','跌','狠'],0,'“海洋”是常见词语。','识字',1],
['“白白的云朵”中哪个词表示颜色？',['云朵','白白的','的','朵'],1,'白白的描述云朵颜色。','词语',1],
['问别人“你叫什么名字（　）”应填？',['。','，','！','？'],3,'问问题句尾用问号。','标点',1],
['给“因为下雨，所以我们带伞”选择正确理解。',['带伞让天开始下雨','下雨是带伞的原因','没有下雨','伞不怕雨'],1,'因为下雨才要带伞，前面讲原因。','阅读',2],
['“慢慢地”和哪个词表达的意思接近？',['急急忙忙','飞快地','缓缓地','突然地'],2,'慢慢地和缓缓地意思相近。','词语',2],
['“黄鹂在枝头唱歌。”这里把黄鹂写得像什么？',['机器人','人','石头','小河'],1,'“唱歌”让小鸟显得很有趣，是拟人的表达。','表达',2],
['按事情先后顺序排列：①洗手 ②吃饭 ③坐到餐桌旁，合理的是？',['②①③','③②①','①③②','①②③'],2,'先洗手，再坐到桌旁，最后吃饭。','顺序',2],
['“星星一闪一闪的，像调皮的眼睛。”这是在写？',['星星的样子','星星的重量','星星的年龄','星星的温度'],0,'句子用眼睛来形容闪烁的星星。','阅读',2],
['给句子补充合适的词：“我（　）观察蚂蚁搬家。”',['认真地','沉重的','绿色的','圆圆的'],0,'“认真地”修饰动作“观察”。','搭配',2],
['“一边……一边……”最适合补充哪句？',['我一边唱歌，一边拍手。','我一边昨天，一边明天。','我一边红色，一边蓝色。','我一边大树，一边操场。'],0,'“一边……一边……”可表示同时做的动作。','句子',2],
['小朋友问：“雨后为什么会有彩虹？”这句话体现了什么？',['认真提问','随便猜测','不愿思考','逃避观察'],0,'发现问题并提问是探索的第一步。','阅读',2],
['“科学小队先观察，再记录，最后讨论。”第二步是？',['观察','记录','讨论','回家'],1,'先观察、再记录、最后讨论。','顺序',2],
['在“我把书放进书包。”中，被放进书包的是什么？',['我','书','书包','老师'],1,'句子说把“书”放进书包。','阅读',2],
['“花儿向太阳微笑。”这样写有什么特点？',['把花当成人来描写','说花有真正的嘴巴','写温度','写数学式子'],0,'把花写得像人会微笑，是有趣的写法。','表达',3],
['“如果下雨，我们就去图书馆。”合理的理解是？',['不管天气都去操场','下雨时改去图书馆','图书馆一定下雨','没说去哪'],1,'“如果……就……”说的是一种条件安排。','阅读',3],
['读短文：“小熊忘了带伞，小兔把自己的伞借给它。”谁帮助了小熊？',['小鸟','小兔','小鱼','小鹿'],1,'文中说小兔把伞借给小熊。','阅读',3],
['“我先读题目，圈出数字，再列算式。”最重要的学习方法是？',['跳过题目','按步骤思考','随便猜答案','只看最后一句'],1,'按步骤审题，能减少粗心。','学习习惯',3],
['“耐心”的意思最接近？',['愿意慢慢做完','马上放弃','随便乱做','只会跑步'],0,'耐心就是能沉住气完成事情。','词语',3]
];
C.forEach((r,i)=>add('cn-'+(i+1),'cn',r[5],r[4],r[0],r[1],r[2],r[3]));
const M=[
['36 + 20 = ?',['46','56','66','58'],1,'先算十位：30+20=50，再加6得56。','加减',1],
['78 − 30 = ?',['38','48','58','68'],1,'7个十减3个十，还剩48。','加减',1],
['45 + 12 = ?',['57','67','47','58'],0,'45+10=55，再加2是57。','加减',1],
['67 − 25 = ?',['32','42','52','43'],1,'67−20=47，再减5得42。','加减',1],
['有24枚贴纸，又得到13枚，一共多少枚？',['31','35','37','39'],2,'24+13=37枚。','应用',1],
['一本书有50页，已经看了20页，还剩多少页？',['20','25','30','70'],2,'50−20=30页。','应用',1],
['图书馆有4排书，每排3本，共有多少本？',['7','9','12','16'],2,'4个3相加：3+3+3+3=12。','乘法',1],
['5 + 5 + 5 = ?',['10','15','20','25'],1,'三个5相加等于15。','乘法',1],
['一米等于多少厘米？',['10','20','100','1000'],2,'1米=100厘米。','长度',1],
['教室里有3个直角，图形中直角有几个？',['1','2','3','4'],2,'题目已说有3个直角，直接数是3。','几何',1],
['小车有4个轮子，两辆小车一共有几个轮子？',['6','8','10','12'],1,'4+4=8，也可以写成2×4=8。','应用',1],
['一盒彩笔6支，两盒有多少支？',['8','10','12','14'],2,'6+6=12支。','乘法',1],
['28 + 17 = ?',['35','44','45','46'],2,'28+10=38，再加7=45。','加减',2],
['63 − 29 = ?',['44','34','32','36'],1,'63−30+1=34。','加减',2],
['35 + 26 = ?',['51','61','62','71'],1,'35+20=55，再加6=61。','加减',2],
['72 − 38 = ?',['44','34','36','24'],1,'72−40+2=34。','加减',2],
['8 × 3 = ?',['11','21','24','32'],2,'3个8相加得到24。','乘法',2],
['6 × 4 = ?',['20','24','26','30'],1,'6乘4等于24。','乘法',2],
['有39个苹果，送出18个，又买来15个，现在有几个？',['34','36','38','56'],1,'39−18+15=36。','应用',2],
['校园轻轨每节车厢有6个玩具座位，3节共几个？',['9','12','18','24'],2,'6×3=18。','乘法',2],
['正方形有几个直角？',['2','3','4','5'],2,'正方形四个角都是直角。','几何',2],
['一根彩带长80厘米，剪去25厘米，还剩多少？',['45','55','65','75'],1,'80−25=55厘米。','长度',2],
['小明有100元，买了45元的科学书，还剩多少元？',['45','50','55','65'],2,'100−45=55元。','应用',2],
['小火车每排4人，坐5排，一共几人？',['9','16','20','25'],2,'4×5=20人。','乘法',2],
['56 + 18 − 24 = ?',['40','50','60','70'],1,'56+18=74，74−24=50。','应用',3],
['92 − 27 + 13 = ?',['68','78','88','98'],1,'92−27=65，再加13得78。','应用',3],
['9 × 7 = ?',['56','63','72','81'],1,'7个9相加是63。','乘法',3],
['6 × 8 = ?',['42','46','48','54'],2,'6乘8等于48。','乘法',3],
['小明用了38厘米线做小船，做飞机又用了27厘米，共用多少？',['55','65','75','85'],1,'38+27=65厘米。','长度',3],
['蜗牛第一天爬18厘米，第二天爬27厘米，第三天爬25厘米，共爬多少？',['60','65','70','75'],2,'18+27=45，45+25=70厘米。','应用',3]
];
M.forEach((r,i)=>add('ma-'+(i+1),'ma',r[5],r[4],r[0],r[1],r[2],r[3]));
const S=[
['想知道石头会不会被磁铁吸住，最好怎么做？',['先猜测并观察','把磁铁吃掉','随便编结果','扔掉石头'],0,'安全地做观察并如实记录。','观察',1],
['科学实验中看见不认识的液体，应该？',['直接喝','不碰，先请老师确认','用手蘸尝','倒进饮料'],1,'未知液体不能品尝或随便接触。','安全',1],
['水在冰箱里变成冰，这种变化叫？',['融化','结冰','燃烧','蒸发'],1,'液态水变固态冰叫结冰。','物质',1],
['飞机的机翼是用来帮助飞机？',['飞起来','变成船','钻进地里','变成火车'],0,'机翼能产生使飞机升空的作用力。','航空',1],
['小船能够浮在水上，与什么有关？',['浮力','音乐','颜色','声音'],0,'水会对船产生向上的浮力。','航海',1],
['观察植物生长，可以记录什么？',['叶片数量','自己想象的结果','同学的名字就够了','随便编日期'],0,'叶片数量、长度和日期都是有用的真实观察记录。','观察',1],
['能自己发光发热的太阳属于哪一类？',['一颗恒星','一艘飞船','一块塑料','一辆车'],0,'太阳是一颗恒星。','天文',1],
['地球上我们每天看见的昼夜交替主要和什么有关？',['地球自转','树叶颜色','火车速度','海水味道'],0,'地球自转造成我们看到昼夜变化。','天文',2],
['元素符号 H 表示什么元素？',['氢','氧','氮','铁'],0,'H是氢元素的符号，属于科学兴趣拓展。','元素',2],
['元素符号 O 表示什么元素？',['金','氧','碳','铜'],1,'O表示氧元素。','元素',2],
['水的化学式是？',['CO₂','H₂O','O₂','NaCl'],1,'水的化学式是H₂O，可以先记住并观察生活中的水。','元素',2],
['观察冰块融化属于什么？',['水变成液体','石头变金子','氧气变铁','树长高'],0,'冰吸热融化成液态水。','物质',2],
['夜晚看见的月亮本身会像太阳一样发光吗？',['会','不会，主要反射太阳光','是电灯','不可能看见'],1,'月亮的亮光主要来自反射的太阳光。','天文',2],
['轻轨紧急刹车时，站立的乘客应该？',['抓稳扶手','向前冲','闭眼奔跑','站上椅子'],0,'安全乘车应抓稳扶手。','交通',2],
['元素周期表可以帮助科学家？',['按规律认识元素','改变天气','预测彩票','让物体消失'],0,'周期表把元素按一定规律排列。','元素',3],
['一个小实验重复三次，结果有差异，最好？',['如实记录并寻找原因','只写最好看的一次','丢掉记录','随便改数'],0,'记录真实结果是科学的基本习惯。','观察',3],
['为什么做化学实验要戴护目镜？',['保护眼睛','让颜色变亮','提高速度','装饰'],0,'护目镜能在实验中保护眼睛。','安全',3],
['星星的颜色可能不同，是因为它们的什么不同？',['表面温度等','都有相同颜色','距离只能为零','全部是灯泡'],0,'不同恒星的温度等性质不同，颜色也可能不同。','天文',3],
['铁钉和木块相比，哪一个通常更容易被磁铁吸住？',['木块','铁钉','都一样','纸巾'],1,'铁是常见的可被磁铁吸引的材料。','物质',3]
];
S.forEach((r,i)=>add('sci-'+(i+1),'sci',r[5],r[4],r[0],r[1],r[2],r[3]));
// 题库可持续追加，数学习题每轮还有程序化随机变式，确保长期玩时尽量减少重复。
function numericOptions(value, seed){const random=rng(seed);let nums=new Set([value]);for(let k=0;k<100&&nums.size<4;k++){let off=choose([-20,-10,-9,-5,-3,-2,-1,1,2,3,5,9,10,20],random);let n=value+off;if(n>=0&&n<=120)nums.add(n)}const array=[...nums].slice(0,4);while(array.length<4)array.push(value+array.length*2+1);for(let i=array.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[array[i],array[j]]=[array[j],array[i]]}return {choices:array.map(String),answer:array.indexOf(value)}}
function generatedMath(seed,level){let r=rng(seed),a,b,answer,text,explain,topic='加减';const mode=Math.floor(r()* (level>=3?5:level>=2?4:3));
if(mode===0){a=10+Math.floor(r()*45);b=10+Math.floor(r()* (Math.min(100-a-10,39)+1));answer=a+b;text=`${a} + ${b} = ?`;explain=`${a}+${b}=${answer}，可先加整十，再加个位。`}
else if(mode===1){a=45+Math.floor(r()*54);b=10+Math.floor(r()*(a-10));answer=a-b;text=`${a} − ${b} = ?`;explain=`${a}−${b}=${answer}，可以分步计算。`}
else if(mode===2){a=2+Math.floor(r()*(level===1?4:level===2?6:8));b=2+Math.floor(r()*(level===1?3:level===2?5:8));answer=a*b;text=`航天小队有 ${a} 个盒子，每盒 ${b} 枚星星，一共多少枚？`;explain=`${a}个${b}相加，${a}×${b}=${answer}。`;topic='乘法'}
else if(mode===3){a=20+Math.floor(r()*40);b=5+Math.floor(r()*20);let c=1+Math.floor(r()*12);answer=a+b-c;text=`收集了 ${a} 个零件，又找到 ${b} 个，修理时用了 ${c} 个，还剩多少？`;explain=`${a}+${b}−${c}=${answer}。`;topic='应用'}
else{a=2+Math.floor(r()*7);b=3+Math.floor(r()*7);answer=a*b;text=`轻轨有 ${a} 节小车厢，每节有 ${b} 个座位，一共有多少个？`;explain=`${a}×${b}=${answer}。`;topic='乘法'}
const opts=numericOptions(answer,seed^0xabc);return {id:'ma-gen-'+seed,type:'ma',diff:level,topic,q:[text,opts.choices,opts.answer,explain]}}
function emptyProfile(){return {grade:'g2a',mode:'standard',calm:true,subjects:{cn:{level:1,solved:0,firstTry:0,last:[]},ma:{level:1,solved:0,firstTry:0,last:[]},sci:{level:1,solved:0,firstTry:0,last:[]}},records:[],mistakes:[],total:0,minutes:0,created:Date.now(),historyVersion:1}}
function ensureProfile(p){if(!p||typeof p!=='object')p=emptyProfile();if(p.grade!=='g2a')p.grade='g2a';if(!['relaxed','standard','challenge'].includes(p.mode))p.mode='standard';if(typeof p.calm!=='boolean')p.calm=true;if(!p.subjects||typeof p.subjects!=='object')p.subjects={};for(const t of Object.keys(SUBJECTS)){let v=p.subjects[t];if(!v||typeof v!=='object')v={};v.level=clamp(Number(v.level)||1,1,3);v.solved=Number(v.solved)||0;v.firstTry=Number(v.firstTry)||0;v.last=Array.isArray(v.last)?v.last.filter(x=>x===0||x===1).slice(-20):[];p.subjects[t]=v}p.records=Array.isArray(p.records)?p.records.slice(-LIMIT):[];p.mistakes=Array.isArray(p.mistakes)?p.mistakes.slice(-100):[];p.total=Number(p.total)||0;return p}
function difficulty(p,type){p=ensureProfile(p);let n=p.subjects[type].level;return p.mode==='relaxed'?Math.min(n,2):p.mode==='challenge'?Math.min(n+1,3):n}
function recentIds(p){return new Set(p.records.slice(-55).map(x=>x.id))}
function makeQuiz(kind,idx,profile,nonce=0){let p=ensureProfile(profile);let pattern=kind==='hourly'?['cn','ma','cn','ma','cn','ma','cn','ma','cn','ma','cn','ma']:['cn','ma','sci','cn','ma','sci','cn','ma'];let picked=new Set(),avoid=recentIds(p);return pattern.map((type,i)=>{let level=difficulty(p,type),seed=hash(kind+'|'+idx+'|'+nonce+'|'+i+'|'+p.total+'|'+level),r=rng(seed);let candidates=bank.filter(x=>x.type===type&&x.diff<=level&&!picked.has(x.id));let newOnes=candidates.filter(x=>!avoid.has(x.id));if(newOnes.length)candidates=newOnes;let q;
// 循环进行计算题变式；不突然插入高年级内容
if(type==='ma'&&(i%3===1||candidates.length===0))q=generatedMath(seed,level);
else q=candidates.length?choose(candidates,r):generatedMath(seed,level);
picked.add(q.id);return {type,q:q.q,id:q.id,topic:q.topic,diff:q.diff};})}
function singleQuestion(type,seed,profile){let p=ensureProfile(profile),level=difficulty(p,type),r=rng(hash(type+'|single|'+seed+'|'+p.total));let options=bank.filter(x=>x.type===type&&x.diff<=level);let notRecent=options.filter(x=>!recentIds(p).has(x.id));let q=choose(notRecent.length?notRecent:options,r);return {type,id:q.id,topic:q.topic,diff:q.diff,q:q.q}}
function record(p,q,wrongCount=0,context='hourly'){p=ensureProfile(p);if(!q||!SUBJECTS[q.type])return p;const v=p.subjects[q.type],first=wrongCount===0;v.solved++;v.firstTry+=first?1:0;v.last.push(first?1:0);v.last=v.last.slice(-20);p.total++;const info={id:q.id||'legacy-'+hash(q.q&&q.q[0]||''),type:q.type,topic:q.topic||'基础',diff:q.diff||1,first,errors:wrongCount,context,at:Date.now(),question:q.q[0],explain:q.q[3]};p.records.push(info);p.records=p.records.slice(-LIMIT);if(!first){p.mistakes.unshift({...info,reviewed:false});p.mistakes=p.mistakes.slice(0,100)}if(v.last.length>=14){let acc=v.last.slice(-14).reduce((a,b)=>a+b,0)/14;
if(acc>=.86&&v.level<3){v.level++;v.last=[];p.lastLevelChange=Date.now()}
else if(acc<=.43&&v.level>1){v.level--;v.last=[];p.lastLevelChange=Date.now()}}
return p}
function report(p){p=ensureProfile(p);return Object.fromEntries(Object.keys(SUBJECTS).map(type=>{let v=p.subjects[type];let accuracy=v.solved?Math.round(100*v.firstTry/v.solved):0;return [type,{name:SUBJECTS[type],level:v.level,label:LEVEL_TEXT[v.level],total:v.solved,accuracy,recent:v.last.length?Math.round(100*v.last.reduce((a,b)=>a+b,0)/v.last.length):null}]}))}
function review(p,index){p=ensureProfile(p);if(p.mistakes[index]){p.mistakes[index].reviewed=true;p.mistakes[index].reviewAt=Date.now()}return p}
root.CampusLearning={VERSION,SUBJECTS,LEVEL_TEXT,bank,emptyProfile,ensureProfile,makeQuiz,singleQuestion,record,report,review,hash};
})(typeof globalThis!=='undefined'?globalThis:this);
