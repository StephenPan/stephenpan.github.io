'use strict';
const assert=require('node:assert/strict');
require('../src/learning-engine.js');
const E=globalThis.CampusLearning;
assert.equal(E.VERSION,'0.6.0');
assert.equal(E.bank.length,84);
const ids=new Set();
for(const item of E.bank){
 assert(!ids.has(item.id),'题目 ID 不重复: '+item.id);ids.add(item.id);
 assert(['cn','ma','sci'].includes(item.type));
 assert(item.diff>=1&&item.diff<=3);
 assert(Array.isArray(item.q)&&item.q.length===4);
 assert(item.q[1].length===4);
 assert(new Set(item.q[1]).size===4);
 assert(item.q[2]>=0&&item.q[2]<4);
 assert(item.q[3].length>=5);
}
let p=E.emptyProfile();
assert.equal(p.grade,'g2a');
const hourly=E.makeQuiz('hourly',1,p);
assert.equal(hourly.length,12);
assert.equal(hourly.filter(x=>x.type==='cn').length,6);
assert.equal(hourly.filter(x=>x.type==='ma').length,6);
const cls=E.makeQuiz('class',22,p);
assert.equal(cls.length,8);
assert.equal(cls.filter(x=>x.type==='sci').length,2);
for(const q of [...hourly,...cls]){
 assert(q.diff<=1,'初始只出基础题');
 assert.equal(q.q[1].length,4);
 assert(new Set(q.q[1]).size===4);
}
const wrong=E.makeQuiz('hourly',2,p)[0];
p=E.record(p,wrong,2,'hourly');
assert.equal(p.mistakes.length,1);
assert.equal(E.report(p).cn.accuracy,0);
E.review(p,0);
assert.equal(p.mistakes[0].reviewed,true);
for(let i=0;i<14;i++)E.record(p,{type:'ma',id:'sample-'+i,topic:'数感',diff:1,q:['简单题',['1','2','3','4'],0,'解析和例题。']},0,'hourly');
assert.equal(p.subjects.ma.level,2,'稳定表现后语文数学逐渐升1级');
for(let i=0;i<14;i++)E.record(p,{type:'ma',id:'sample2-'+i,topic:'数感',diff:2,q:['普通题',['1','2','3','4'],0,'解析和例题。']},0,'hourly');
assert.equal(p.subjects.ma.level,3);
for(let i=0;i<14;i++)E.record(p,{type:'ma',id:'sample3-'+i,topic:'数感',diff:3,q:['拓展题',['1','2','3','4'],0,'解析和例题。']},1,'hourly');
assert.equal(p.subjects.ma.level,2,'连续吃力降回较易档');
for(let i=1;i<500;i++){
 const q=E.makeQuiz('hourly',i,E.emptyProfile());
 for(const item of q){
  assert(item.diff<=1);
  assert.equal(item.q[1].length,4);
  assert.equal(new Set(item.q[1]).size,4);
 }
}
console.log('PASS · fixed questions:',E.bank.length,'· adaptive levels · 499 rounds with four unique choices');
