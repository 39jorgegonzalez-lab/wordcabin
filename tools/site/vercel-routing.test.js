import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { convertRewrites, getTransformedRoutes } from '@vercel/routing-utils';
import handler, { dailyResponse } from '../../api/daily-challenge.js';
const config=JSON.parse(readFileSync('vercel.json','utf8'));
const compiled=getTransformedRoutes(config);
assert.equal(compiled.error,null);
const routes=compiled.routes.filter(r=>r.dest);
const old=convertRewrites([{source:'/daily-word-challenge/:date',destination:'/api/daily-challenge?date=:date'}])[0];
assert.equal(new RegExp(old.src).test('/daily-word-challenge/2026-11-13/'),false,'reproduce the original platform route miss');
assert.equal(new RegExp(old.src).test('/daily-word-challenge/2026-11-13'),true);
function resolve(path){const r=routes.find(r=>new RegExp(r.src).test(path));return r ? path.replace(new RegExp(r.src),r.dest):null;}
const now=new Date('2026-11-13T17:00:00Z');
for(const date of ['2026-09-22','2026-09-23','2026-09-24','2026-11-03','2026-11-13','2026-11-14','2026-02-30','invalid']){
 for(const slash of ['','/']){
  const path=`/daily-word-challenge/${date}${slash}`;
  const destination=resolve(path); assert.equal(destination,`/api/daily-challenge?date=${date}`);
  assert.equal(compiled.routes.some(r=>r.status===308 && new RegExp(r.src).test(path)),false,'cleanUrls must not intercept dated routes');
  const result=dailyResponse(new URL(destination,'https://example.test').searchParams.get('date'),{now});
  const valid=['2026-09-22','2026-09-23','2026-09-24','2026-11-03','2026-11-13'].includes(date);
  assert.equal(result.status,valid?200:404);
  assert.equal(result.headers['Cache-Control'],'no-store');
  assert.equal(result.headers['X-Robots-Tag'],'noindex, follow');
  if(valid)assert.ok(result.body.includes(`https://wordcabin.com/daily-word-challenge/${date}/`));
 }
}
assert.equal(resolve('/daily-word-challenge/'),null,'archive must not be captured');
assert.equal(resolve('/daily-word-challenge/2026-11-13/extra'),null);
assert.equal(dailyResponse(undefined,{now}).status,404);
const missing=dailyResponse('2026-11-13',{now,readShell(){throw Error('missing shell');}});
assert.equal(missing.status,503);assert.equal(missing.headers['Retry-After'],'60');
assert.equal(dailyResponse('2026-11-13',{now,readShell:()=>'<html>invalid</html>'}).status,503);
assert.ok(existsSync(config.functions['api/daily-challenge.js'].includeFiles));
assert.ok(readFileSync(config.functions['api/daily-challenge.js'].includeFiles,'utf8').includes('/assets/'));
// HTTP integration uses Vercel's real compiled regex/destination and the real handler.
// It does not assert Vercel cloud packaging or authenticated deployment acceptance.
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');const dest=url.pathname==='/api/daily-challenge'?req.url:resolve(url.pathname);
 if(!dest){res.writeHead(404);res.end('Router not found');return;}
 req.query=Object.fromEntries(new URL(dest,'http://localhost').searchParams);
 res.status=function(code){this.statusCode=code;return this;};handler(req,res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const path of ['/daily-word-challenge/2026-11-13/','/daily-word-challenge/2026-11-13','/api/daily-challenge?date=2026-11-13']){
  const r=await fetch(base+path);assert.equal(r.status,200);assert.match(await r.text(),/2026-11-13/);assert.equal(r.headers.get('cache-control'),'no-store');
 }
 for(const path of ['/daily-word-challenge/2099-12-31/','/daily-word-challenge/invalid/','/api/daily-challenge'])assert.equal((await fetch(base+path)).status,404);
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
console.log('PASS: Vercel-compiled routing reproduces old slash miss; both repaired forms, cleanUrls precedence, HTTP handler/API, historical/V2/future/invalid dates, canonical/noindex/no-store, 503 and included shell');
