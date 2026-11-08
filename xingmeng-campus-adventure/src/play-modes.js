/* Mode rules, the star generator, and the creative workshop. */
(function (root) {
  'use strict';

  const MODES = {
    horror:{label:'恐怖',icon:'👁️',note:'四处怪谈会出现。被怪物追上会退回安全点。'},
    creative:{label:'创造',icon:'🧱',note:'玩家无敌。到创造工坊放置、堆叠和拆除方块。'},
    survival:{label:'生存',icon:'❤️',note:'只有三颗心。体力持续下降，石怪和守钟人追得更快。零食可恢复体力。'}
  };
  const WORKSHOP='creative-workshop';
  const BOUNDS={minX:-10,maxX:10,minZ:-8,maxZ:8};
  const WORKSHOP_SPAWN={x:0,z:6.8};
  const GENERATOR={x:15.5,z:9.1};
  const RATE=800000;
  const CELL=1.6;
  const COLORS=['#77a9d4','#e5b274','#91bd9b','#b9a2d9'];
  const MAX_BLOCKS=96;
  const MAX_STAR=Number.MAX_SAFE_INTEGER;
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const cellKey=(x,z)=>x+','+z;
  const validMode=mode=>typeof mode==='string'&&Object.hasOwn(MODES,mode);

  function normalize(raw) {
    const blocks=Object.create(null);
    let remaining=MAX_BLOCKS;
    for(let x=-5;x<=5;x++)for(let z=-4;z<=4;z++){
      const key=cellKey(x,z), colors=raw?.blocks?.[key];
      if(!Array.isArray(colors))continue;
      const clean=colors.filter(color=>Number.isInteger(color)&&color>=0&&color<COLORS.length).slice(0,Math.min(6,remaining));
      if(clean.length){blocks[key]=clean;remaining-=clean.length;}
    }
    return {
      mode:validMode(raw?.mode)?raw.mode:'horror',
      generator:raw?.generator===true,
      energy:Number.isFinite(raw?.energy)?clamp(raw.energy,0,100):100,
      hearts:Number.isSafeInteger(raw?.hearts)?clamp(raw.hearts,1,3):3,
      blocks
    };
  }

  function addStars(stars, amount) {
    return stars+Math.min(MAX_STAR-stars,amount);
  }

  function starYield(milliseconds, fraction=0) {
    const produced=Math.max(0,milliseconds)*RATE/1000+fraction;
    return {whole:Math.floor(produced),fraction:produced%1};
  }

  function drainEnergy(energy,dt,moving,sprinting) {
    const cost=1.65+(moving?(sprinting?2.65:.42):0);
    return Math.max(0,energy-dt*cost);
  }

  function spendHeart(play) {
    if(play.mode!=='survival')return false;
    play.hearts--;
    if(play.hearts>0)return false;
    play.hearts=3;
    play.energy=100;
    return true;
  }

  function modifyBlock(play, x, z, color, remove) {
    if(play.mode!=='creative'||!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>5||Math.abs(z)>4)return false;
    const key=cellKey(x,z),stack=play.blocks[key]||[];
    if(remove){
      if(!stack.length)return false;
      stack.pop();
      if(!stack.length)delete play.blocks[key];
      return true;
    }
    if(!Number.isInteger(color)||color<0||color>=COLORS.length||stack.length>=6||
       Object.values(play.blocks).reduce((n,levels)=>n+levels.length,0)>=MAX_BLOCKS)return false;
    stack.push(color);
    play.blocks[key]=stack;
    return true;
  }

  function blocked(play, x, z) {
    const gx=Math.round(x/CELL),gz=Math.round(z/CELL);
    return Boolean(play.blocks[cellKey(gx,gz)]?.length);
  }

  function machine(mesh) {
    const {x,z}=GENERATOR;
    mesh.cylinder(x,.17,z,1.19,.34,'#657388',20);
    mesh.roundBox(x,1.02,z,1.42,1.54,1.28,.2,'#746ea5',5);
    mesh.roundBox(x,1.22,z+.65,.85,.69,.12,.049,'#354b63',4);
    mesh.sphere(x,2.06,z,.43,'#ffd681',18,12);
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      mesh.sphere(x+Math.cos(a)*.62,2.03+(i%2)*.28,z+Math.sin(a)*.62,.114,'#fff1b7',10,6);
    }
  }

  function workshopFloor(mesh) {
    mesh.box(0,-.26,0,21,.5,17.5,'#bac7cb');
    for(let x=-5;x<=5;x++)for(let z=-4;z<=4;z++){
      mesh.box(x*CELL,-.009,z*CELL,CELL-.028,.034,CELL-.028,(x+z)%2?'#c2d5d7':'#d4e0de');
    }
    mesh.box(0,.05,7.2,4.8,.11,1.55,'#d3b78e');
    for(const x of [-9.5,9.5]){
      mesh.box(x,.34,0,.34,.69,16.2,'#8aaba8');
      for(let z=-6;z<8;z+=3)mesh.cylinder(x,.8,z,.13,1.6,'#738f97',12);
    }
  }

  function create(api) {
    const {$,getState,go,save,dialog,closeDialog,toast,marker,Mesh,sound}=api;
    const play=()=>getState().play;
    const mode=()=>play().mode;
    let generatorAt=performance.now(), starFraction=0, damageCooldown=0, color=0;
    let blocks=null, cursor=null, makeMesh, dropMesh;

    function settleStars(now=performance.now()) {
      const elapsed=now-generatorAt;
      if(elapsed<=0)return false;
      generatorAt=now;
      if(!play().generator)return false;
      const earned=starYield(elapsed,starFraction);
      starFraction=earned.fraction;
      const s=getState(), before=s.star;
      s.star=addStars(s.star,earned.whole);
      if(before===s.star)return false;
      $('hStar').textContent='⭐ '+s.star.toLocaleString('zh-CN');
      return true;
    }

    function modeButtons(attribute) {
      return Object.entries(MODES).map(([key,info])=>
        `<button class="btn" ${attribute}="${key}" aria-pressed="${key===mode()}"><b>${info.icon} ${info.label}</b><small>${info.note}</small></button>`).join('');
    }

    function refreshHUD() {
      const info=MODES[mode()];
      $('modeBtn').textContent=info.icon+' '+info.label+'模式';
      $('generatorStatus').classList.toggle('hidden',!play().generator);
      $('survivalStatus').classList.toggle('hidden',mode()!=='survival');
      if(mode()!=='survival')return;
      const value=Math.ceil(play().energy);
      const label='❤️ '+play().hearts+'/3 · ⚡ '+value+'/100';
      const meter=$('survivalStatus');
      if(meter.textContent!==label)meter.textContent=label;
      meter.classList.toggle('low-energy',value<=20);
    }

    function choose(next) {
      if(!validMode(next)||next===mode())return;
      play().mode=next;
      damageCooldown=0;
      save();
      refreshHUD();
      api.refresh();
      toast('已切换到'+MODES[next].label+'模式');
    }

    function bind() {
      $('welcomeModes').innerHTML=modeButtons('data-welcome-mode');
      $('welcomeModes').querySelectorAll('button').forEach(button=>button.onclick=()=>{
        choose(button.dataset.welcomeMode);
        $('welcomeModes').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.welcomeMode===mode())));
      });
      $('modeBtn').onclick=()=>{
        if(api.modalOpen())return;
        dialog('选择游戏模式',`<div class="mode-options">${modeButtons('data-mode')}</div>`);
        $('dBody').querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
          closeDialog();choose(button.dataset.mode);
        });
      };
      $('workColor').onchange=()=>{color=Number($('workColor').value);};
      $('placeBlock').onclick=()=>edit(false);
      $('removeBlock').onclick=()=>edit(true);
      refreshHUD();
    }

    function showGenerator() {
      const running=play().generator;
      dialog('🌟 星星生成器',`<p>启动后，游戏开着时每秒会生成 <b>${RATE.toLocaleString('zh-CN')} 颗星星</b>。刷新页面后会接着运行。</p>
        <p>状态：<b>${running?'正在运行':'已停止'}</b></p><button class="btn full" id="toggleStarGenerator">${running?'停止生成':'启动生成'}</button>`);
      $('toggleStarGenerator').onclick=()=>{
        settleStars();
        play().generator=!running;
        starFraction=0;
        save();
        refreshHUD();
        closeDialog();
        toast(running?'星星生成器已停止。':'星星生成器开始工作！每秒 +800,000 颗星星。');
      };
    }

    function addCampus(mesh, add) {
      machine(mesh);
      marker('item','🌟 星星生成器','star-generator',GENERATOR.x,3.1,GENERATOR.z,showGenerator);
      add('🌟 星星生成器 · 每秒 800,000 颗',showGenerator);
      marker('door','🧱 创造工坊','creative-workshop',-12,3.4,10.5,()=>go(WORKSHOP));
      add('🧱 前往创造工坊',()=>go(WORKSHOP));
    }

    function buildWorkshop(mesh,add) {
      workshopFloor(mesh);
      marker('door','🚪 回校园','leave-workshop',0,2.1,7.45,()=>go('campus'));
      add('🚪 回校园',()=>go('campus'));
      return {title:'🧱 创造工坊',desc:'进入创造模式后，面朝一个格子按 B 放置方块，按 X 拆除。也可以用画面下方的按钮。每格最多叠六层。',camera:{theta:.20,phi:.88,dist:30,target:[0,.9,0]}};
    }

    function target() {
      const p=getState(),angle=api.heading();
      return {x:Math.round((p.px+Math.sin(angle)*2.2)/CELL),z:Math.round((p.pz+Math.cos(angle)*2.2)/CELL)};
    }

    function rebuildBlocks() {
      if(!makeMesh)return;
      if(blocks)dropMesh(blocks);
      const mesh=new Mesh();
      for(const [key,stack] of Object.entries(play().blocks)){
        const [x,z]=key.split(',').map(Number);
        stack.forEach((index,y)=>mesh.roundBox(x*CELL,(y+.5)*CELL,z*CELL,CELL-.085,CELL-.08,CELL-.085,.11,COLORS[index],3));
      }
      blocks=makeMesh(mesh);
    }

    function edit(remove) {
      if(getState().scene!==WORKSHOP||api.modalOpen()||getState().locked)return;
      const {x,z}=target();
      if(!modifyBlock(play(),x,z,color,remove)){
        toast(remove?'这个格子没有可拆的方块，或当前模式无法建造。':'请在创造模式面朝空格建造。每格最多六层。');
        return;
      }
      rebuildBlocks();
      save();
      sound(remove?270:520,.10,'triangle',.038);
    }

    function prepare(make,drop) {
      makeMesh=make;dropMesh=drop;
      const active=getState().scene===WORKSHOP;
      $('buildControls').classList.toggle('hidden',!active||mode()!=='creative');
      if(!active){
        if(blocks){drop(blocks);blocks=null;}
        if(cursor){drop(cursor);cursor=null;}
        return;
      }
      rebuildBlocks();
      if(!cursor){
        const mesh=new Mesh();
        mesh.box(0,.039,0,1.48,.028,1.48,'#f9df91');
        cursor=make(mesh);
      }
    }

    function draw(drawMesh) {
      if(blocks)drawMesh(blocks);
      if(!cursor||mode()!=='creative')return;
      const {x,z}=target();
      if(Math.abs(x)<=5&&Math.abs(z)<=4)
        drawMesh(cursor,[x*CELL,(play().blocks[cellKey(x,z)]?.length||0)*CELL,z*CELL]);
    }

    function step(dt,input,onFoot) {
      if(mode()!=='survival')return;
      const s=getState();
      damageCooldown=Math.max(0,damageCooldown-dt);
      s.play.energy=drainEnergy(s.play.energy,dt,onFoot&&(input.x!==0||input.z!==0),input.sprint);
      if(s.play.energy===0&&damageCooldown===0)hurt('体力耗尽了。');
      refreshHUD();
    }

    function hurt(reason) {
      if(mode()!=='survival'||damageCooldown>0)return false;
      damageCooldown=6;
      const lost=spendHeart(play());
      if(lost)api.recover();
      save();
      refreshHUD();
      toast(lost?'三颗心都用完了。你已回到校园补给点。':reason+' 少了一颗心。');
      return lost;
    }

    function feed() {
      if(mode()!=='survival')return;
      play().energy=Math.min(100,play().energy+34);
      refreshHUD();
    }

    return {mode,settleStars,bind,refreshHUD,addCampus,buildWorkshop,edit,prepare,draw,step,hurt,feed};
  }

  root.CampusPlayModes={MODES,WORKSHOP,WORKSHOP_SPAWN,BOUNDS,MAX_STAR,normalize,addStars,starYield,drainEnergy,spendHeart,modifyBlock,blocked,create};
})(globalThis);
