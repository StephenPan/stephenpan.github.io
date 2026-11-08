/* Optional encounters in the existing campus scenes, enabled in horror mode. */
(function (root) {
  'use strict';

  const SITES={
    hall:{x:5.2,z:-5.3,y:2.6,label:'走廊尽头的旧镜子',caption:'镜子里多了一个影子。它比你晚一步才转身。',kind:'mirror'},
    library:{x:5.3,z:5.0,y:2.35,label:'没人坐的椅子',caption:'空椅子自己挪了一下。书架后有人轻轻翻页。',kind:'chair'},
    garden:{x:-5.3,z:4.6,y:2.85,label:'花园里的稻草人',caption:'风停了。稻草人的帽子下面，有两点光。',kind:'scarecrow'}
  };

  function prop(mesh,site) {
    const {x,z,kind}=site;
    if(kind==='mirror'){
      mesh.roundBox(x,1.68,z,1.84,2.8,.26,.12,'#8e786c',5);
      mesh.roundBox(x,1.7,z+.155,1.49,2.39,.10,.045,'#526373',5);
      mesh.box(x,.28,z,1.68,.38,.82,'#716059');
    }else if(kind==='chair'){
      mesh.roundBox(x,.58,z,.95,.19,.94,.084,'#71554e',4);
      mesh.roundBox(x,1.16,z-.43,.96,1.11,.14,.062,'#765b55',4);
      for(const dx of [-.34,.34])for(const dz of [-.34,.34])mesh.box(x+dx,.27,z+dz,.14,.54,.14,'#5f5051');
    }else{
      mesh.box(x,1.07,z,.13,2.12,.13,'#76605b');
      mesh.box(x,1.58,z,1.76,.16,.14,'#665d5b');
      mesh.sphere(x,2.19,z,.33,'#a18b63',14,9);
      mesh.cylinder(x,2.41,z,.48,.10,'#635759',16);
      mesh.cylinder(x,2.57,z,.27,.29,'#635759',16);
    }
  }

  function apparition(mesh,kind) {
    if(kind==='scarecrow'){
      mesh.sphere(0,1.36,0,.49,'#4a4154',17,12,[.84,2.2,.64]);
      mesh.sphere(0,2.56,0,.33,'#605360',16,11);
      mesh.cylinder(0,2.81,0,.61,.13,'#3f3548',20);
      for(const v of [-1,1]){
        mesh.line([0,2.01,0],[v*1.31,1.98,0],.10,'#4a4154');
        mesh.sphere(v*.12,2.61,.279,.065,'#ecc880',12,8);
      }
    }else if(kind==='chair'){
      mesh.sphere(0,1.1,0,.55,'#343140',18,13,[1,1.32,.73]);
      mesh.sphere(0,1.91,0,.32,'#645b6b',17,13,[.91,1.19,.81]);
      for(const v of [-1,1]){
        mesh.line([v*.29,1.47,0],[v*.50,.73,.28],.081,'#4d4658');
        mesh.line([v*.21,.63,.31],[v*.24,.28,.76],.091,'#3c3948');
      }
    }else{
      mesh.sphere(0,1.36,0,.59,'#393647',20,13,[.82,2.13,.64]);
      mesh.sphere(0,2.7,-.06,.36,'#60596d',17,12,[.79,1.22,.84]);
      for(const v of [-1,1])mesh.line([v*.34,2.1,0],[v*.67,.6,.02],.082,'#504a5b');
    }
  }

  function create({getState,marker,sound,$,Mesh}) {
    let site=null,model=null,age=-1;
    const current=()=>{
      const s=getState();
      return s.play.mode==='horror'?SITES[s.scene]:null;
    };
    function begin() {
      if(!site||(age>=0&&age<4.6))return;
      age=0;
      $('hauntCue').classList.remove('hidden');
      $('hauntCue').textContent=site.caption;
      sound(81,.20,'triangle',.048);
      sound(57,.34,'sine',.049,.32);
    }
    function add(mesh,actions) {
      const location=current();
      if(!location)return;
      prop(mesh,location);
      marker('item','🕯️ '+location.label,'mode-haunt',location.x,location.y,location.z,begin);
      actions('🕯️ 查看'+location.label,begin);
    }
    function prepare(make,drop) {
      if(model){drop(model);model=null;}
      site=current();
      age=-1;
      $('hauntCue').classList.add('hidden');
      if(!site)return;
      const mesh=new Mesh();
      apparition(mesh,site.kind);
      model=make(mesh);
    }
    function step(dt) {
      if(!site)return;
      const p=getState();
      if(age<0){
        if(Math.hypot(p.px-site.x,p.pz-site.z)<2.7)begin();
        return;
      }
      age+=dt;
      if(age>=4.6)$('hauntCue').classList.add('hidden');
    }
    function draw(drawMesh) {
      if(!model||age<.45||age>=4.6)return;
      const p=getState(), drift=Math.min(1.75,Math.max(0,age-1.4)*.68);
      const x=site.x+(site.kind==='mirror'?-.6:1.2), z=site.z+drift;
      drawMesh(model,[x,.03+.11*Math.sin(age*2.4),z],Math.atan2(p.px-x,p.pz-z));
    }
    return {add,prepare,step,draw};
  }

  root.CampusHaunts={create};
})(globalThis);
