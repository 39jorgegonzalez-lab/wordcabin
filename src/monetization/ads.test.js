import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initializeAds, validAdConfig, hasAdConsent, ADS_DISABLED_KEY } from './ads.js';
const config = {enabled:'true',client:'ca-pub-1234567890123456',slot:'1234567890',cmpId:'300'};
const grant = () => ({cmpStatus:'loaded',eventStatus:'tcloaded',cmpId:300,listenerId:1,tcString:'test-fixture-not-a-live-consent-string',vendor:{consents:{755:true}},purpose:{consents:{1:true,2:true,7:true,9:true,10:true}}});
function fixture() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><ins></ins></body></html>',{url:'https://example.test/'});
  let callback, reloads=0;
  const win = {document:dom.window.document,localStorage:dom.window.localStorage,
    location:{reload(){reloads++;}},setInterval:dom.window.setInterval.bind(dom.window),clearInterval:dom.window.clearInterval.bind(dom.window),
    addEventListener:dom.window.addEventListener.bind(dom.window),
    __tcfapi(command,version,cb){assert.equal(version,2);if(command==='addEventListener')callback=cb;},};
  return {win,dom,signal:(data,success=true)=>callback(data,success),get reloads(){return reloads;},close(){win.__wordcabinAds?.dispose();dom.window.close();}};
}
test('disabled/malformed config and missing CMP cannot load advertising',()=>{
 const f=fixture();
 for(const c of [{...config,enabled:'false'},{...config,client:'fake'},{...config,slot:'x'},{...config,cmpId:''}]) {assert.equal(validAdConfig(c),false);assert.equal(initializeAds(f.win,c),null);}
 delete f.win.__tcfapi;
 const api=initializeAds(f.win,config); assert.equal(api.allowed,false); assert.equal(api.requestSlot(f.win.document.querySelector('ins')),false); assert.equal(f.win.document.scripts.length,0);f.close();
});
test('strict consent and CMP allowlist, no analytics consent shortcut',()=>{
 assert.equal(hasAdConsent(grant(),true,'300'),true);
 for (const purpose of [1,2,7,9,10]) {const data=grant();data.purpose.consents[purpose]=false;assert.equal(hasAdConsent(data,true,'300'),false);}
 assert.equal(hasAdConsent(grant(),true,'301'),false);
 assert.equal(hasAdConsent({...grant(),tcString:''},true,'300'),false);
 assert.equal(hasAdConsent({...grant(),publisher:{restrictions:{1:{755:0}}}},true,'300'),false);
 assert.equal(hasAdConsent({analytics_storage:'granted'},true,'300'),false);
 assert.equal(hasAdConsent(grant(),false,'300'),false);
});
test('grant initializes one async nonpersonalized script and one request per slot',()=>{
 const f=fixture(),api=initializeAds(f.win,config);assert.equal(initializeAds(f.win,config),api);
 f.signal(grant());const ins=f.win.document.querySelector('ins');
 assert.equal(api.requestSlot(ins),true);assert.equal(api.requestSlot(ins),false);
 assert.equal(f.win.document.scripts.length,1);assert.equal(f.win.document.scripts[0].async,true);
 assert.equal(f.win.adsbygoogle.requestNonPersonalizedAds,1);assert.equal(f.win.adsbygoogle.length,1);
 assert.equal(f.win.document.scripts[0].getAttribute('data-privacy-treatments'),'disablePersonalization');
 f.signal({...grant(),eventStatus:'cmpuishown'});assert.equal(f.reloads,0);
 f.close();
});
test('withdrawal blocks future requests, persists opt-out, removes runtime via one reload',()=>{
 const f=fixture(),api=initializeAds(f.win,config);f.signal(grant());api.requestSlot(f.win.document.querySelector('ins'));
 f.signal({...grant(),eventStatus:'useractioncomplete',vendor:{consents:{755:false}}});
 assert.equal(api.allowed,false);assert.equal(f.reloads,1);assert.equal(f.win.localStorage.getItem(ADS_DISABLED_KEY),'denied');
 assert.equal(api.requestSlot(f.win.document.createElement('ins')),false);
 f.signal(grant());assert.equal(api.allowed,false);assert.equal(f.reloads,1);f.close();
});
test('saved opt-out and denied storage prevent ad startup; explicit preference can be revisited',()=>{
 const f=fixture();f.win.localStorage.setItem(ADS_DISABLED_KEY,'denied');const api=initializeAds(f.win,config);f.signal(grant());assert.equal(api.allowed,false);
 api.setEnabled(true);assert.equal(f.win.localStorage.getItem(ADS_DISABLED_KEY),null);assert.equal(f.reloads,1);f.close();
 const g=fixture();Object.defineProperty(g.win,'localStorage',{get(){throw Error('blocked');}});const denied=initializeAds(g.win,config);g.signal(grant());assert.equal(denied.allowed,false);g.close();
});
test('CMP failure after grant and cross-tab withdrawal revoke safely',()=>{
 const f=fixture(),api=initializeAds(f.win,config);f.signal(grant());api.requestSlot(f.win.document.querySelector('ins'));
 f.win.localStorage.setItem(ADS_DISABLED_KEY,'denied');f.dom.window.dispatchEvent(new f.dom.window.StorageEvent('storage',{key:ADS_DISABLED_KEY,newValue:'denied'}));assert.equal(api.allowed,false);assert.equal(f.reloads,1);f.close();
 const g=fixture(),b=initializeAds(g.win,config);g.signal(grant());g.signal(null,false);assert.equal(b.allowed,false);assert.equal(g.win.document.scripts.length,0);g.close();
});
