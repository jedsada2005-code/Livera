import test from 'node:test';
import assert from 'node:assert/strict';
import { nvlCurrent, nvlProgress, nvlSeries, nvlTarget } from '../src/data/overview.ts';
import { member } from '../src/data/demo.ts';

test('NVL sample values reconcile to the displayed 40 percent goal progress',()=>{
  assert.equal(nvlCurrent,3_200_000);assert.equal(nvlTarget,8_000_000);assert.equal(nvlCurrent/nvlTarget*100,nvlProgress);assert.equal(nvlProgress,40);
});

test('every historical sample ends at current NVL and has aligned increasing labels',()=>{
  for(const item of Object.values(nvlSeries)){
    assert.equal(item.labels.length,item.values.length);assert.equal(item.values.at(-1),nvlCurrent);
    assert.ok(item.values.every((value,index)=>index===0||value>=item.values[index-1]));
  }
});

test('demo member identity is consistent with the requested account owner',()=>{
  assert.deepEqual({name:member.name,fullName:member.fullName,initials:member.initials},{name:'พีระ',fullName:'พีระ อารมณ์ดี',initials:'พ'});
});
