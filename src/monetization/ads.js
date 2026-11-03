// AdSense preparation only. A certified CMP and approved account are external gates.
export const ADS_DISABLED_KEY = 'wordcabin.ads-disabled.v1';
export function validAdConfig({ enabled, client, slot, cmpId }) {
  return enabled === 'true' && /^ca-pub-\d{16}$/.test(client || '') && /^\d{10}$/.test(slot || '') && /^\d{1,5}$/.test(cmpId || '');
}
export function hasAdConsent(data, success, cmpId) {
  // Global opt-in policy, even outside GDPR regions. No legitimate-interest
  // shortcut. Unknown purpose/restriction state cannot authorize ad loading.
  return success === true && data?.cmpStatus === 'loaded'
    && ['tcloaded','useractioncomplete'].includes(data.eventStatus)
    && data.cmpId === Number(cmpId) && Number(cmpId) > 0
    && typeof data.tcString === 'string' && data.tcString.length > 0
    && data.vendor?.consents?.[755] === true
    && [1,2,7,9,10].every(id => data.purpose?.consents?.[id] === true)
    && [1,2,7,9,10].every(id => data.publisher?.restrictions?.[id]?.[755] === undefined);
}
export function initializeAds(win, config) {
  if (!validAdConfig(config)) return null;
  if (win.__wordcabinAds) return win.__wordcabinAds;
  let allowed = false, started = false, revoked = false, disabled = false;
  let listenerId, attempts = 0, timer;
  const subscribers = new Set();
  const slots = new WeakSet();
  try { disabled = win.localStorage.getItem(ADS_DISABLED_KEY) !== null; } catch { disabled = true; }
  function notify() { for (const fn of subscribers) { try { fn(allowed); } catch {} } }
  function revoke() {
    allowed = false;
    notify();
    if (started && !revoked) {
      revoked = true;
      // Removing a script node does not stop its timers. Reload destroys the
      // third-party runtime. An explicit local opt-out prevents reinitialization.
      try { win.localStorage.setItem(ADS_DISABLED_KEY,'denied'); } catch {}
      win.document.querySelectorAll('[data-wordcabin-ads]').forEach(node=>node.remove());
      try { win.location.reload(); } catch {}
    }
  }
  function connect() {
    if (typeof win.__tcfapi !== 'function') return false;
    try {
      win.__tcfapi('addEventListener',2,(data,success)=>{
        listenerId = data?.listenerId;
        if (success === true && data?.eventStatus === 'cmpuishown') return;
        const granted = !disabled && !revoked && hasAdConsent(data,success,config.cmpId);
        if (!granted) revoke();
        else { allowed = true; notify(); }
      });
      return true;
    } catch { revoke(); return true; }
  }
  const api = {
    get allowed() { return allowed; },
    subscribe(fn) { subscribers.add(fn); fn(allowed); return ()=>subscribers.delete(fn); },
    requestSlot(element) {
      if (!allowed || revoked || !element || slots.has(element)) return false;
      try {
        if (!started) {
          win.adsbygoogle = win.adsbygoogle || [];
          win.adsbygoogle.requestNonPersonalizedAds = 1;
          const script = win.document.createElement('script');
          script.async = true; script.crossOrigin = 'anonymous';
          script.dataset.wordcabinAds = 'true';
          script.setAttribute('data-privacy-treatments','disablePersonalization');
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client}`;
          started = true;
          win.document.head.append(script);
        }
        win.adsbygoogle.push({}); slots.add(element); return true;
      } catch { revoke(); return false; }
    },
    setEnabled(value) {
      disabled = !value;
      if (!value) { try { win.localStorage.setItem(ADS_DISABLED_KEY,'denied'); } catch {} revoke(); }
      else {
        try { win.localStorage.removeItem(ADS_DISABLED_KEY); win.location.reload(); } catch {}
      }
    },
    dispose() { if (timer) win.clearInterval(timer); if (listenerId != null) { try { win.__tcfapi('removeEventListener',2,()=>{},listenerId); } catch {} } win.removeEventListener?.('storage', onStorage); subscribers.clear(); },
  };
  win.__wordcabinAds = api;
  if (!connect()) timer = win.setInterval(()=>{ if (connect() || ++attempts >= 60) win.clearInterval(timer); },500);
  function onStorage(event) {
    if (event.key === ADS_DISABLED_KEY || event.key === null) {
      try { if (win.localStorage.getItem(ADS_DISABLED_KEY) !== null || event.key === null) { disabled = true; revoke(); } } catch { disabled = true; revoke(); }
    }
  }
  win.addEventListener('storage', onStorage);
  return api;
}
