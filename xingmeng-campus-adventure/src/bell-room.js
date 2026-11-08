/* An optional, room-local horror encounter. Only the collectible is saved. */
(function (root) {
  'use strict';

  const ID = 'old-bellroom';
  const RECORD = 'old-bellroom-last-page';
  const ENTRANCE = { x:36, z:-25.8 };
  const CAMPUS_RETURN = { x:36, z:-22.4 };
  const SPAWN = { x:0, z:7 };
  const CLOCK = { x:0, z:-8.2 };
  const BOUNDS = { minX:-6.5,maxX:6.5,minZ:-9.5,maxZ:8.2 };
  const SAFE_LINE = 6.1;

  function tower(mesh) {
    const x=ENTRANCE.x,z=ENTRANCE.z-2.7;
    mesh.box(x,.014,z+5.3,3.4,.08,6.6,'#b7b0a0');
    for(let i=0;i<5;i++)mesh.box(x,.052,z+3.1+i*.9,3.3,.028,.035,'#918c84');
    mesh.roundBox(x,4.6,z,6.3,9.2,5.1,.24,'#797e7f',5);
    mesh.roundBox(x,7.3,z,6.55,.24,5.3,.11,'#555963',4);
    mesh.roundBox(x,9.08,z,6.6,.34,5.45,.15,'#636674',4);
    mesh.cone(x,10.6,z,3.35,2.85,'#514d58',8);
    mesh.roundBox(x,1.38,z+2.59,1.65,2.72,.24,.115,'#3d4047',5);
    mesh.box(x-.68,1.42,z+2.75,.09,2.61,.09,'#96917d');
    mesh.roundBox(x,6.03,z+2.61,1.85,1.85,.18,.37,'#b7ad97',7);
    mesh.box(x,6.19,z+2.74,.082,.67,.05,'#40404a');
    mesh.box(x+.22,6.01,z+2.75,.45,.072,.05,'#40404a');
    mesh.sphere(x+1.27,2.6,z+2.74,.15,'#d2b47b',12,7);
  }

  function interior(mesh) {
    mesh.box(0,-.28,-.6,14,.5,19.2,'#393943');
    for(let x=-6.8;x<=6.8;x+=.42)mesh.box(x,-.008,-.6,.026,.019,18.95,'#292d35');
    mesh.box(0,2.32,-10,14,4.65,.45,'#444551');
    for(const sign of [-1,1]){
      mesh.box(sign*6.9,1.4,-.65,.38,2.8,18.8,'#484959');
      for(const z of [-8.9,-4.8,-.7,3.4,7.5]){
        mesh.roundBox(sign*6.38,1.71,z,.46,3.42,.52,.09,'#50505d',3);
        mesh.box(sign*6.1,2.18,z,.12,.54,.25,'#796e5e');
      }
      for(const z of [-5.8,.3,5.4]){
        mesh.roundBox(sign*5.68,.39,z,1.7,.78,.91,.1,'#61554e',4);
        mesh.box(sign*5.65,.76,z,.24,.045,.96,'#87766a');
      }
    }
    mesh.roundBox(0,2.42,-9.63,3.6,4.78,.45,.21,'#645649',6);
    mesh.roundBox(0,3.45,-9.34,1.82,1.82,.19,.42,'#b7a888',7);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      mesh.box(Math.sin(a)*.67,3.45+Math.cos(a)*.67,-9.22,.07,.087,.035,'#413940');
    }
    mesh.line([0,3.45,-9.19],[-.39,3.73,-9.19],.032,'#3a3339');
    mesh.line([0,3.45,-9.19],[.25,3.95,-9.19],.022,'#3a3339');
    mesh.roundBox(0,1.38,-9.35,1.35,1.53,.22,.08,'#34323b',4);
    mesh.line([0,1.99,-9.2],[0,.97,-9.2],.04,'#9a886c');
    mesh.sphere(0,.95,-9.18,.23,'#ad9b74',14,9,[1,1,.3]);
    mesh.box(-3,.53,6,1.76,1.01,1.18,'#60524b');
    mesh.cylinder(-3,1.26,6,.22,.5,'#aa8a5b',12);
    mesh.sphere(-3,1.6,6,.2,'#e3bf74',14,9,[.75,1.2,.75]);
    mesh.roundBox(0,.02,7.25,3.8,.043,1.22,.02,'#74664c',3);
  }

  function shadowModel(m) {
    const cloth='#292a35', edge='#383642', mask='#7b7b80';
    m.sphere(0,1.94,0,.78,cloth,24,17,[.77,2.22,.44]);
    m.sphere(0,3.49,-.035,.52,edge,22,16,[.91,1.15,.82]);
    m.sphere(0,3.44,.295,.34,mask,24,17,[.78,1.17,.34]);
    m.line([-.10,3.54,.408],[.10,3.54,.408],.032,'#484853');
    for(const v of [-1,1]){
      m.line([v*.38,2.96,.01],[v*.79,1.61,-.01],.10,cloth);
      m.line([v*.79,1.61,-.01],[v*.91,.72,.12],.077,edge);
      m.sphere(v*.92,.66,.12,.1,mask,12,8,[.78,1.26,.64]);
    }
  }

  function create(api) {
    const { $, getState, go, marker, sound, dialog, closeDialog, collect, resetPlayer, Mesh } = api;
    let phase = 'waiting', elapsed = 0, shadow = { x:.3,z:-8.2,yaw:0 }, model = null;
    const solved = () => getState().eggs.includes(RECORD);

    function updateLook(dark, text) {
      const view=$('view'), caption=$('bellCue');
      view.classList.toggle('bell-dark',dark);
      if(caption.textContent!==text)caption.textContent=text;
    }

    function resetEncounter() {
      phase=solved()?'quiet':'waiting';
      elapsed=0;
      shadow={x:.3,z:-8.2,yaw:0};
      updateLook(false,solved()?'钟停了。门边的灯亮着。':'门边还亮着一盏灯。里面一点声音也没有。');
    }

    function prepare(make, drop) {
      if (getState().scene !== ID) {
        if(model){drop(model);model=null;}
        $('view').classList.remove('bell-room','bell-dark');
        $('bellCue').classList.add('hidden');
        return;
      }
      $('view').classList.add('bell-room');
      $('bellCue').classList.remove('hidden');
      if(model)return;
      const mesh=new Mesh();
      shadowModel(mesh);
      model=make(mesh);
      resetEncounter();
    }

    function knock() {
      sound(83,.15,'triangle',.055);
      sound(72,.17,'triangle',.061,.22);
      sound(64,.27,'sine',.07,.47);
    }

    function step(dt) {
      const p=getState();
      if(p.scene!==ID||phase==='quiet')return;
      if(phase==='waiting'){
        if(p.pz>2.3)return;
        phase='glimpse';
        knock();
        updateLook(false,'咚、咚、咚。钟底下好像站着一个人。');
        return;
      }
      elapsed+=dt;
      if(phase==='glimpse'){
        if(elapsed<1.55)return;
        phase='first-dark';
        elapsed=0;
        updateLook(true,'灯暗了。刚才那三声，现在从你身后传来。');
        knock();
        return;
      }
      if(phase==='first-dark'){
        if(elapsed<1.15)return;
        shadow.x=p.px>1.5?-2.6:2.6;
        shadow.z=Math.max(-7,Math.min(5.25,p.pz+3.9));
        phase='chase';
        elapsed=0;
        updateLook(false,'灯亮了。无脸守钟人已经离开了钟底。');
        return;
      }
      const dim=elapsed%4.1>=2.35;
      const dx=p.px-shadow.x,dz=p.pz-shadow.z,distance=Math.hypot(dx,dz);
      if(distance>.01)shadow.yaw=Math.atan2(dx,dz);
      if(dim&&p.pz<SAFE_LINE){
        const advance=Math.min(distance,dt*5.4);
        if(distance>.01){
          shadow.x+=dx/distance*advance;
          shadow.z=Math.min(SAFE_LINE-.6,shadow.z+dz/distance*advance);
        }
        if(Math.hypot(p.px-shadow.x,p.pz-shadow.z)<1.03){
          sound(57,.31,'sine',.08);
          resetPlayer(SPAWN);
          resetEncounter();
          updateLook(false,'你退回了门边。那三声敲门声又停了。');
          return;
        }
      }
      const hint=p.pz>=SAFE_LINE?'你站在门边的灯下。出口就在这里。':
        elapsed<1.25?'灯亮了。无脸守钟人已经离开了钟底。':
        dim?'灯暗了。听见脚步时，继续往钟的方向走。':'灯亮时它站着不动。走到钟旁，试着停下摆锤。';
      updateLook(dim,hint);
    }

    function draw(drawMesh) {
      if(!model||!['glimpse','chase'].includes(phase))return;
      drawMesh(model,[shadow.x,0,shadow.z],shadow.yaw);
    }

    function inspectClock() {
      if(solved()){
        dialog('🕰️ 守钟室最后一页','<p>值班记录只写着一句话：「灯一灭，它就换一个地方。」</p>');
        return;
      }
      const p=getState();
      if(Math.hypot(p.px-CLOCK.x,p.pz-CLOCK.z)>2.9){
        api.toast('先走到最里面的旧钟旁，再检查摆锤。');
        return;
      }
      if(phase!=='chase'){
        api.toast('摆锤像是卡住了。等灯重新亮起，再试一次。');
        return;
      }
      dialog('🕰️ 停不下来的钟',
        '<p>钟面停在十二点。下面的摆锤却还在动。纸条上写着：「听见三声之后，把摆锤停住。」</p><button class="btn full" id="stopOldBell">🕰️ 停下摆锤</button>');
      $('stopOldBell').onclick=()=>{
        closeDialog();
        collect(RECORD,'守钟室最后一页');
        sound(116,.36,'sine',.063);
        resetEncounter();
        dialog('📜 守钟室最后一页','<p>脚步声停了。你回头时，门边只剩那盏灯和一把空椅子。</p><p>值班簿的最后一页已经放进探险收藏。</p><button class="btn full" id="leaveOldBell">🚪 回校园</button>');
        $('leaveOldBell').onclick=()=>{closeDialog();go('campus');};
      };
    }

    function build(mesh, add) {
      interior(mesh);
      const exit=()=>go('campus');
      marker('door','🚪 门边的灯 · 返回校园','leave-old-bell',0,1.95,7.4,exit);
      marker('item','🕰️ 调查旧钟','old-bell-clock',CLOCK.x,3.9,CLOCK.z,inspectClock);
      add('🕰️ 调查旧钟',inspectClock);
      add('🚪 随时返回校园',exit);
      return {
        title:'🕰️ 旧钟楼 · 封存值班室',
        desc:'校园东北角的旧钟楼。沿木地板走到尽头检查摆锤。灯暗时注意脚步，门边的灯下可以退回校园。',
        camera:{theta:.08,phi:1.03,dist:26,target:[0,1.55,-1.7]}
      };
    }

    return { prepare, step, draw, build };
  }

  root.CampusBellRoom={ID,ENTRANCE,CAMPUS_RETURN,SPAWN,BOUNDS,tower,create};
})(globalThis);
