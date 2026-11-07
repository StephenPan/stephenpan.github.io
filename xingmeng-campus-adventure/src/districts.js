/* Data-driven streets, visits and cave cells. Geometry is generated offline by the game. */
(function (root) {
  'use strict';

  const streets = [
    { id:'school-street', icon:'🏫', name:'学校街', note:'星梦校园 · 操场外路 · 校门广场' },
    { id:'street', icon:'🍡', name:'小吃摊街', note:'放学小吃 · 自行车 · 小车 · 双站轻轨' },
    { id:'home-street', icon:'🏡', name:'我的家街', note:'五层住宅 · 三位同学家 · 三座探险洞' }
  ];
  const homeFloors = [
    { name:'1 楼 · 客厅和厨房', item:'家庭相册', style:'living', color:'#c59b72' },
    { name:'2 楼 · 卧室和阅读角', item:'星星书签', style:'study', color:'#98a4be' },
    { name:'3 楼 · 家庭科学室', item:'实验观察笔记', style:'science', color:'#7eaba8' },
    { name:'4 楼 · 模型工坊', item:'轻轨模型图纸', style:'workshop', color:'#bd935e' },
    { name:'5 楼 · 屋顶花园', item:'屋顶星图', style:'roof', color:'#8eb29b' }
  ];
  const houses = [
    { index:0, x:-19, color:'#c69b7e', styles:['living','study'], items:['友谊明信片','图书交换卡'] },
    { index:1, x:14, color:'#99abb9', styles:['study','science'], items:['折纸小船','元素贴纸'] },
    { index:2, x:26, color:'#b9a681', styles:['living','workshop'], items:['放学合影画','小车模型'] }
  ];
  const caves = [
    { id:'cave-lantern', name:'灯笼洞', item:'萤石挂件', x:-24, colors:['#66677a','#40465a','#e4ad60'],
      rows:['#########','#...T...#','#.#####.#','#.......#','###.###.#','#...#...#','#.S...>.#','#########'] },
    { id:'cave-crystal', name:'晶石洞', item:'蓝晶标本', x:0, colors:['#6d7891','#4b536e','#83c3df'],
      rows:['#########','#..T....#','#.####..#','#...#...#','#.#...#.#','#.#####.#','#<..S..>#','#########'] },
    { id:'cave-stream', name:'回声水洞', item:'水纹徽章', x:25, colors:['#5c7480','#425460','#96d4c5'],
      rows:['#########','#......T#','#.###.#.#','#.#.....#','#...###.#','#.#.....#','#<..S...#','#########'] }
  ];
  const CELL = 2.6;
  const caveById = id => caves.find(c => c.id === id);
  const homeById = id => {
    const match = /^home-([1-5])$/.exec(id);
    return match ? {floor:Number(match[1]),...homeFloors[Number(match[1])-1]} : null;
  };
  const friendById = id => {
    const match = /^friend-([1-3])-([12])$/.exec(id);
    return match ? {house:houses[Number(match[1])-1],floor:Number(match[2])} : null;
  };
  const isScene = id => typeof id === 'string' &&
    (id === 'school-street' || id === 'home-street' || Boolean(caveById(id) || homeById(id) || friendById(id)));
  const isOutdoor = id => streets.some(s => s.id === id);
  const outdoorBounds = { minX:-35,maxX:35,minZ:-13,maxZ:14 };
  const caveBounds = { minX:-11.6,maxX:11.6,minZ:-10.3,maxZ:10.3 };
  const roomBounds = { minX:-10.5,maxX:10.5,minZ:-7,maxZ:8 };

  function bounds(id) {
    if (isOutdoor(id) && id !== 'street') return outdoorBounds;
    if (caveById(id)) return caveBounds;
    return isScene(id) ? roomBounds : null;
  }

  function findCell(cave, token) {
    const row = cave.rows.findIndex(line => line.includes(token));
    if (row === -1) return null;
    const col = cave.rows[row].indexOf(token);
    return {x:(col-4)*CELL,z:(row-3.5)*CELL};
  }

  function cavePassable(cave, x, z) {
    const row = Math.floor(z/CELL+4), col = Math.floor(x/CELL+4.5);
    return Boolean(cave.rows[row]?.[col] && cave.rows[row][col] !== '#');
  }

  function spawn(id, previous) {
    if (id === 'campus' && previous === 'school-street') return {x:0,z:27};
    if (id === 'school-street') return previous === 'street' ? {x:29,z:0} : {x:-15,z:-7};
    if (id === 'street') {
      if (previous === 'school-street') return {x:-36,z:0};
      if (previous === 'home-street') return {x:36,z:0};
    }
    if (id === 'home-street') {
      if (previous === 'street') return {x:-29,z:0};
      const cave = caveById(previous), friend = friendById(previous);
      if (cave) return {x:cave.x,z:7};
      if (friend) return {x:friend.house.x,z:-4};
      return {x:-5,z:-4};
    }
    const cave = caveById(id);
    if (cave) {
      const linked = previous === caves[caves.indexOf(cave)-1]?.id ? '<' : previous === caves[caves.indexOf(cave)+1]?.id ? '>' : 'S';
      return findCell(cave,linked) || findCell(cave,'S');
    }
    return isScene(id) ? {x:0,z:6} : null;
  }

  function parent(id) {
    if (id === 'school-street') return 'campus';
    if (id === 'street') return 'school-street';
    if (id === 'home-street') return 'street';
    const home = homeById(id), friend = friendById(id);
    if (home) return home.floor === 1 ? 'home-street' : 'home-' + (home.floor-1);
    if (friend) return friend.floor === 1 ? 'home-street' : 'friend-' + (friend.house.index+1) + '-1';
    return caveById(id) ? 'home-street' : null;
  }

  function walkingExit(id, {x,z}) {
    if (id === 'school-street') {
      if (Math.abs(x+15)<2.25 && z<=-11.5) return 'campus';
      if (x>=33 && Math.abs(z)<3.8) return 'street';
    }
    if (id === 'street' && Math.abs(z)<3.8) {
      if (x<=-41) return 'school-street';
      if (x>=41) return 'home-street';
    }
    if (id === 'home-street' && x<=-33 && Math.abs(z)<3.8) return 'street';
    return null;
  }

  function move(id, position, input, dt) {
    const limits = bounds(id);
    const cave = caveById(id);
    const scale = 9 * dt / (Math.hypot(input.x,input.z) || 1);
    const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
    const x = clamp(position.x + input.x * scale,limits.minX,limits.maxX);
    const z = clamp(position.z + input.z * scale,limits.minZ,limits.maxZ);
    if (!cave) {
      const buildings = id === 'home-street' ? [-5,...houses.map(h=>h.x)] : id === 'school-street' ? [17] : [];
      const blocked = (px,pz) => (pz < -7.15 && buildings.some(center=>Math.abs(center-px)<4.5)) ||
        (id === 'school-street' && pz < -12.15 && Math.abs(px+15)>2.25);
      const nx = blocked(x,position.z) ? position.x : x;
      return {x:nx,z:blocked(nx,z) ? position.z : z};
    }
    const fits = (px,pz) => [[-.22,0],[.22,0],[0,-.22],[0,.22]].every(([dx,dz]) => cavePassable(cave,px+dx,pz+dz));
    const nx = fits(x,position.z) ? x : position.x;
    return {x:nx,z:fits(nx,z) ? z : position.z};
  }

  function houseMesh(m,x,z,color,levels) {
    const h = levels * 1.2 + 1.1;
    m.roundBox(x,h/2,z,8.6,h,5.4,.22,color,4);
    m.roundBox(x,h+.18,z,9.05,.35,5.8,.12,'#686674',4);
    for (let floor=0;floor<levels;floor++) {
      const y=1.15+floor*1.2;
      for (const dx of [-2.48,2.48]) {
        m.roundBox(x+dx,y,z+2.73,1.65,.83,.11,.051,'#5d7986',4);
        m.box(x+dx,y,z+2.8,.08,.83,.045,'#ddd6c1');
      }
      if (floor) m.roundBox(x,y,z+2.73,1.6,.76,.11,.049,'#82979d',4);
    }
    m.roundBox(x,.96,z+2.78,1.55,1.88,.18,.085,'#846448',4);
    m.box(x,.08,z+3.33,2.1,.16,1.22,'#baad96');
  }

  function caveMouth(m,x,z) {
    for (let i=0;i<9;i++) {
      const a=i*Math.PI/8;
      m.sphere(x+Math.cos(a)*2,Math.sin(a)*2.1+.15,z,.65,'#737882',12,8,[1,1.1,1.35]);
    }
    m.roundBox(x,1,z+.19,3.23,2.08,.25,.11,'#293344',5);
    m.sphere(x+2.38,1.18,z-.2,.16,'#f3c47d',10,7);
  }

  function outdoor(m,home,{tree,lamp,bench}) {
    m.box(0,-.57,0,76,1,34,home?'#84a38a':'#86a58c');
    m.box(0,-.053,0,74,.13,8.2,'#60686b');
    for (const z of [-5.9,5.9]) {
      m.box(0,.04,z,74,.17,3.45,'#c9bdab');
      m.box(0,.092,z*.71,74,.19,.23,'#d5c5ab');
      for(let x=-35;x<36;x+=2.35)m.box(x,.135,z,.028,.017,3.42,'#a7a194');
    }
    for(let x=-34;x<=34;x+=4.9)m.box(x,.025,0,2.6,.02,.12,'#d3c59e');
    for (const x of [-31,-11,7,31]) {
      tree(m,x,8.5,1.05,home&&x===7);
      lamp(m,x,-6.2);
    }
    for (const x of [-28,4,23]) bench(m,x,6.35);
    if (home) {
      houseMesh(m,-5,-10,'#d6b393',5);
      houses.forEach(house => houseMesh(m,house.x,-10,house.color,2));
      caves.forEach(c => caveMouth(m,c.x,11.3));
    } else {
      for(const x of [-31,-24,-6,2,10,18,26,34]) {
        m.roundBox(x,.7,-12.7,5.4,1.42,.68,.09,'#bca18a',3);
        m.box(x,1.67,-12.7,5.4,.25,.34,'#596e66');
        tree(m,x,-10.6,.65);
      }
      for(const x of [-17.55,-12.45]) {
        m.roundBox(x,1.95,-12,1.04,3.9,1.12,.12,'#be9c81',4);
        m.sphere(x,4.02,-12,.32,'#ead2a1',12,8);
      }
      m.roundBox(-15,4.02,-12,5.9,.52,.64,.16,'#576b62',4);
      for(let z=-3.6;z<4;z+=.8)m.box(-15,.033,z,3.8,.015,.39,'#e7decb');
      houseMesh(m,17,-10.1,'#bcaa89',2);
    }
  }

  function doorMesh(m,x,z,color) {
    m.roundBox(x,1.43,z,1.68,2.76,.19,.084,color,5);
    m.sphere(x+.56,1.43,z+.13,.085,'#c9ad75',10,7);
  }

  function room(m,style,color) {
    const roof=style==='roof';
    m.box(0,-.29,0,24,.54,18,roof?'#b9b597':'#ba9979');
    m.box(0,roof?.5:2.45,-8.66,24,roof?1:4.9,.42,roof?'#879e80':'#e0d3bc');
    for(const x of [-11.85,11.85])m.box(x,roof?.5:2,0,.35,roof?1:4,17.7,'#ded3c1');
    for(let x=-10;x<=10;x+=1.33)m.box(x,-.009,0,.03,.025,17.6,roof?'#a6a88c':'#a48668');
    for(const x of [-7,0,7]) {
      m.box(x,roof?.65:3.02,-8.39,2.8,roof?.5:1.5,.1,roof?'#637f68':'#8ba9b2');
      if(!roof)m.box(x,3.02,-8.32,.07,1.52,.06,'#f1e8d4');
    }
    m.roundBox(0,.026,1.22,7,.065,4.3,.03,color,5);
    const table = (x,z,w=3,d=1.6) => {
      m.roundBox(x,1.01,z,w,.18,d,.08,'#9b7659',5);
      for(const dx of [-1,1])for(const dz of [-1,1])m.box(x+dx*(w/2-.2),.52,z+dz*(d/2-.2),.14,1,.14,'#80634f');
    };
    if (style==='living') {
      m.roundBox(-6,.72,-2,4.4,.84,1.7,.3,color,6);
      m.roundBox(-6,1.31,-2.62,4.4,1.1,.45,.2,color,6);
      table(-5,1);
      m.roundBox(6,1,-4.4,6,1.8,1.42,.22,'#aa917b',6);
      m.box(6,2,-4.35,6.05,.17,1.48,'#c8bbb0');
      for(let i=0;i<4;i++)m.cylinder(5.25+(i%2)*.49,2.1,-4.7+Math.floor(i/2)*.54,.19,.08,'#6f7273',12);
    } else if(style==='study') {
      m.roundBox(-6,.52,-2.7,2.6,.83,4.3,.24,'#95785e',6);
      m.roundBox(-6,.97,-2.55,2.4,.43,3.72,.2,color,6);
      m.roundBox(-6,1.19,-3.98,1.86,.25,.86,.11,'#ece2d4',5);
      table(6,-2.4);
      for(let i=0;i<12;i++)m.box(4.58+i%6*.49,1.6+Math.floor(i/6)*.8,-5.65,.23,.67,.43,['#ac796f','#87a7a5','#c6aa7b'][i%3]);
    } else if(style==='roof') {
      for(const x of [-6,0,6])for(const z of [-5,-1]) {
        m.roundBox(x,.33,z,2.25,.64,1.29,.13,'#9e7d63',4);
        for(let i=0;i<4;i++)m.sphere(x-.73+i*.48,.72+(i%2)*.19,z,.26,['#699071','#bd929f','#8ca678','#d0a66f'][i],10,7);
      }
      m.cylinder(4,1.15,4,.115,2.3,'#56666d',14);
      m.line([4,2.27,4],[4.67,2.83,4.2],.21,'#778fa0');
    } else {
      table(-5,-2,4.2,2.4);table(5,-4,4.6,2.1);
      for(let i=0;i<5;i++){
        const x=-6.5+i*.72;
        if(style==='science'){
          m.cylinder(x,1.37,-2,.17,.56,['#719baa','#88af99','#c0a66b'][i%3],14);
          m.sphere(x,1.2,-2,.21,'#b8d1c9',12,7);
        } else {
          m.roundBox(x,1.27,-2,.62,.35,.62,.11,['#72969e','#ad8772','#aa9c79'][i%3],4);
          m.sphere(x,1.13,-1.7,.08,'#28333a',10,6);
        }
      }
    }
  }

  function caveMesh(m,cave) {
    const [floor,wall,crystal]=cave.colors;
    m.box(0,-.44,0,24,.74,21,'#373e4c');
    for(const [r,row] of cave.rows.entries())for(const [c,tile] of [...row].entries()){
      const x=(c-4)*CELL,z=(r-3.5)*CELL;
      if(tile==='#') {
        if(![[r-1,c],[r+1,c],[r,c-1],[r,c+1]].some(([a,b])=>cave.rows[a]?.[b]&&cave.rows[a][b]!=='#'))continue;
        const h=1.3+(r*7+c*3)%6*.21;
        m.roundBox(x,h/2,z,CELL+.06,h,CELL+.06,.32,wall,3);
        if((r+c)%3===0)m.sphere(x,h+.13,z,.51,wall,10,6,[1.4,.58,1]);
      } else {
        m.box(x,-.041,z,CELL,.09,CELL,(r+c)%2?floor:wall);
        if((r+c)%4===0)m.sphere(x+.61,.09,z+.56,.18,crystal,9,5,[1,.8,.8]);
      }
    }
    const item=findCell(cave,'T');
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*.4;
      const x=item.x+Math.cos(a)*.42,z=item.z+Math.sin(a)*.42;
      m.cone(x,.76+(i%2)*.21,z,.24,1.34,crystal,6);
    }
  }

  function build(id,m,add,api) {
    const {marker,go,tree,lamp,bench,character,collect,students,person}=api;
    const register=(kind,label,key,x,y,z,fn)=>{marker(kind,label,key,x,y,z,fn);add(label,fn);};
    const door=(label,target,x,y,z)=>register('door',label,target,x,y,z,()=>go(target));
    const treasure=(label,key,x,y,z)=>register('item','✨ 寻找'+label,key,x,y,z,()=>collect(key,label));
    const home=homeById(id),friend=friendById(id),cave=caveById(id);
    const outside={theta:.25,phi:.99,dist:61,target:[0,1.2,0]};
    const inside={theta:.22,phi:1.04,dist:25,target:[0,1.8,-1]};
    if(id==='school-street'){
      outdoor(m,false,api);
      door('🏫 穿过校门 · 进入星梦校园','campus',-15,4.75,-12);
      door('🍡 沿街向东 · 小吃摊街','street',32,1.9,0);
      return {title:'🏫 学校街',desc:'这条街通向学校南门。走到校门可返回校园，沿道路向右一直走，可以到小吃摊街。',camera:outside};
    }
    if(id==='home-street'){
      outdoor(m,true,api);
      door('🍡 沿街向西 · 小吃摊街','street',-32,1.9,0);
      door('🏠 回我的家 · 五层住宅','home-1',-5,7.4,-8.8);
      for(const h of houses){
        const p=students[h.index];
        door('🏡 去'+p.name+'同学家','friend-'+(h.index+1)+'-1',h.x,4.2,-8.9);
      }
      for(const c of caves)door('🪨 探索'+c.name,c.id,c.x,3.05,10.6);
      return {title:'🏡 我的家街',desc:'一排住宅、一座五层的家和三个洞口。选一位 22 班同学拜访，或从街对面的洞口出发探险。',camera:outside};
    }
    if(home){
      room(m,home.style,home.color);
      doorMesh(m,-9,-8.28,'#967b62');doorMesh(m,9,-8.28,'#708c86');
      if(home.floor<5)door('⬆️ 上 '+(home.floor+1)+' 楼','home-'+(home.floor+1),9,2.7,-7.9);
      if(home.floor>1)door('⬇️ 下 '+(home.floor-1)+' 楼','home-'+(home.floor-1),-9,2.7,-7.9);
      door('🚪 回到我的家街','home-street',0,2.4,7);
      treasure(home.item,'home-discovery-'+home.floor,home.floor===5?4:-5,2.2,1.1);
      return {title:'🏠 我的家 / '+home.name,desc:'从楼梯去其他楼层。每层藏着一件独特的小物品，可以收进探险收藏。',camera:inside};
    }
    if(friend){
      const {house,floor}=friend,p=students[house.index];
      room(m,house.styles[floor-1],house.color);
      character(m,3.8,0,-1.2,p.seed);
      register('person','💬 和'+p.name+'聊一聊','friend-talk',3.8,2.75,-1.2,()=>
        person(p, floor===1?'放学啦，欢迎来我家！楼上有我喜欢的小收藏。':'这是我的小天地。我留了一件纪念品给你。',{key:'home-visit-'+house.index+'-'+floor}));
      doorMesh(m,9,-8.28,'#877d8c');
      door(floor===1?'⬆️ 上 2 楼':'⬇️ 下 1 楼','friend-'+(house.index+1)+'-'+(3-floor),9,2.8,-7.9);
      door('🚪 回到我的家街','home-street',0,2.4,7);
      treasure(house.items[floor-1],'friend-discovery-'+house.index+'-'+floor,-5,2.2,1.1);
      return {title:'🏡 '+p.name+'同学家 · '+floor+' 楼',desc:'可以和同学打招呼、上下楼，或者看看房间里有什么特别的小物品。',camera:inside};
    }
    if(cave){
      caveMesh(m,cave);
      const idx=caves.indexOf(cave),start=findCell(cave,'S'),item=findCell(cave,'T');
      door('🚪 从洞口返回我的家街','home-street',start.x,1.9,start.z);
      for(const [symbol,next] of [['<',caves[idx-1]],['>',caves[idx+1]]]){
        if(!next)continue;
        const point=findCell(cave,symbol);
        door('🔦 沿隧道进入'+next.name,next.id,point.x,1.9,point.z);
      }
      register('item','✨ 寻找'+cave.item,'cave-discovery-'+idx,item.x,1.75,item.z,()=>{
        const position=api.player();
        if(Math.hypot(position.x-item.x,position.z-item.z)>2.2) {
          api.toast('沿洞内通道走到发亮的石头附近，再收集纪念品。');
          return;
        }
        collect('cave-discovery-'+idx,cave.item);
      });
      return {title:'🪨 '+cave.name,desc:'沿着石墙之间的通道找纪念品。三座洞之间有相连的隧道，岩壁会挡住脚步。',camera:{theta:.05,phi:.85,dist:32,target:[0,.5,0]}};
    }
    return null;
  }

  root.CampusDistricts={streets,caves,findCell,cavePassable,isScene,isOutdoor,bounds,spawn,parent,walkingExit,move,build};
})(globalThis);
