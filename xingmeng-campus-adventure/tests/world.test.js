'use strict';
const assert = require('node:assert/strict');
require('../src/learning-engine.js');
require('../src/world-rules.js');
require('../src/districts.js');
require('../src/save-state.js');

const W = globalThis.CampusWorld;
const S = globalThis.CampusSave;
const L = globalThis.CampusLearning;
const scenes = id => ['campus','street','class-22'].includes(id);

for (const kind of ['bike','car']) {
  let v = {...W.VEHICLES[kind].start,speed:0};
  const start = v.x;
  const throttle = {throttle:1,steer:0,brake:false};
  for (let i=0;i<60;i++) v=W.stepVehicle(kind,v,throttle,1/60);
  assert(v.x>start+2 && v.speed>0);
  const heading = v.heading;
  for (let i=0;i<12;i++) v=W.stepVehicle(kind,v,{...throttle,steer:1},1/60);
  assert(v.heading>heading);
  for (let i=0;i<120;i++) v=W.stepVehicle(kind,v,{...throttle,brake:true},1/60);
  assert.equal(v.speed,0);
  for (let i=0;i<600;i++) v=W.stepVehicle(kind,v,throttle,1/60);
  const spec=W.VEHICLES[kind];
  assert(v.x<=39-spec.radius && v.x>=-39+spec.radius);
  assert(v.z>spec.minZ && v.z<spec.maxZ);
}

let train={x:W.TRAINS.west,station:'west',destination:'east',speed:0};
for(let i=0;i<1000&&train.destination;i++)train=W.stepTrain(train,1/60);
assert.deepEqual([train.station,train.x,train.speed],['east',W.TRAINS.east,0]);
train.destination='west';
for(let i=0;i<1000&&train.destination;i++)train=W.stepTrain(train,1/60);
assert.deepEqual([train.station,train.x,train.speed],['west',W.TRAINS.west,0]);

let p={x:0,z:-15};
for(let i=0;i<26;i++)p=W.moveOnFoot(p,{x:0,z:-1},1/60);
assert(p.z<W.GATE_Z,'gate is passable on foot');
p={x:9,z:-15};
for(let i=0;i<40;i++)p=W.moveOnFoot(p,{x:0,z:-1},1/60);
assert(p.z>W.GATE_Z,'fence cannot be crossed away from the gate');

const snacks=W.cleanSnacks({apple:2,orange:-1,potato:1000,unknown:3});
assert.equal(snacks.apple,2);
assert.equal(snacks.potato,99);
assert.equal(snacks.unknown,undefined);
assert.equal(W.buySnack(3,snacks,'apple'),null);
assert.equal(W.buySnack(99,snacks,'potato'),null);
assert.equal(W.buySnack(99,snacks,'__proto__'),null);
const purchase=W.buySnack(11,snacks,'apple');
assert.equal(purchase.coin,7);
assert.equal(purchase.snacks.apple,3);
assert.equal(snacks.apple,2);
assert(W.stoneTuning(2,{calm:true}).speed>.77*.66*2);
assert(W.stoneTuning(2,{calm:false,mode:'challenge'}).speed>W.stoneTuning(2,{calm:false}).speed);

const profile=L.emptyProfile();
const classPlan={idx:22,progress:3,questions:L.makeQuiz('class',22,profile)};
const old={version:6,scene:'class-22',round:4,locked:false,coin:13,stamps:[4,4,9],stoneQuizProgress:{22:4},
  secretBossProgress:6,learning:{...profile,activeClass:classPlan}};
const storage={getItem:key=>key===S.KEY?'{broken':key.endsWith('-v6')?JSON.stringify(old):null};
const save=S.read(storage,scenes);
assert.equal(save.version,8);
assert.equal(save.coin,13);
assert.equal(save.scene,'class-22');
assert.deepEqual(save.stamps,[4,9]);
assert.equal(save.stoneQuizProgress[22],4);
assert.equal(save.secretBossProgress,6);
assert.equal(save.learning.classPlans[22].progress,3);
assert.deepEqual(save.learning.classPlans[22].questions,classPlan.questions);

const oldHourly={...old,locked:true,progress:5,learning:{...profile,activeHourly:{idx:4,questions:L.makeQuiz('hourly',4,profile),mistakes:2}}};
const imported=S.importFile({format:'xingmeng-save-v1',schema:1,state:oldHourly},scenes);
assert.equal(imported.progress,5);
assert.equal(imported.learning.activeHourly.mistakes,2);
oldHourly.learning.activeHourly.questions[0]=null;
const repaired=S.normalize({...oldHourly,scene:'class-999',coin:Infinity,learning:{...oldHourly.learning,records:[null]}},scenes);
assert.equal(repaired.scene,'campus');
assert.equal(repaired.coin,0);
assert.equal(repaired.progress,0);
assert.deepEqual(repaired.learning.records,[]);
assert.throws(()=>S.importFile({format:'xingmeng-save-v1',schema:2,state:old},scenes));

profile.mode='challenge';
for(let i=1;i<30;i++)assert(L.makeQuiz('hourly',i,profile).some(q=>q.diff===2));
console.log('PASS · vehicle controls, both train directions, gate collision, snacks, stone tuning, and save migration');

const D=globalThis.CampusDistricts;
assert.deepEqual(D.streets.map(s=>s.id),['school-street','street','home-street']);
const route=[['school-street',{x:33,z:0},'street'],['street',{x:41,z:0},'home-street'],
  ['home-street',{x:-33,z:0},'street'],['street',{x:-41,z:0},'school-street'],
  ['school-street',{x:-15,z:-12},'campus']];
for(const [from,position,to] of route){
  assert.equal(D.walkingExit(from,position),to);
  assert.equal(D.walkingExit(to,D.spawn(to,from)),null,'district spawns clear of the next boundary');
}
for(const cave of D.caves){
  const row=cave.rows.findIndex(r=>r.includes('S')),col=cave.rows[row].indexOf('S');
  const queue=[[row,col]],seen=new Set([`${row},${col}`]);
  for(let i=0;i<queue.length;i++){
    const [y,x]=queue[i];
    for(const [dy,dx] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const a=y+dy,b=x+dx,key=`${a},${b}`,tile=cave.rows[a]?.[b];
      if(tile&&tile!=='#'&&!seen.has(key)){queue.push([a,b]);seen.add(key);}
    }
  }
  for(const token of ['T','<','>']){
    const row=cave.rows.findIndex(r=>r.includes(token));
    if(row>=0)assert(seen.has(`${row},${cave.rows[row].indexOf(token)}`),cave.id+' reachable '+token);
  }
  const start=D.spawn(cave.id);
  assert(D.cavePassable(cave,start.x,start.z));
  const fixed=S.normalize({...old,scene:cave.id,px:100,pz:100},D.isScene);
  assert.deepEqual({x:fixed.px,z:fixed.pz},start);
}
assert(Math.abs(W.stoneTuning(1,{calm:false}).speed-7.2)<1e-9);
assert.equal(W.stoneTuning(2,{calm:false}).speed,15.5);
assert.equal(W.stoneTuning(2,{calm:false,mode:'challenge'}).speed,19.375);
assert(W.touchesPath({x:-2,z:0},{x:2,z:0},{x:0,z:0},.5),'fast stone crosses the full hit area');
assert(!W.touchesPath({x:-2,z:0},{x:2,z:0},{x:0,z:1},.5),'parallel pass is not a hit');
assert(D.isScene('home-5')&&D.isScene('friend-3-2'));
assert(!D.isScene('home-6')&&!D.isScene('friend-4-1'));
console.log('PASS · three street links, cave reachability, safe cave spawns, exact stone speeds and swept collision');
