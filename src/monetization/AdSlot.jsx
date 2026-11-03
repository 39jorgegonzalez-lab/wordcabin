import { useEffect, useRef, useState } from "react";
import { initializeAds, validAdConfig } from './ads.js';

export function AdSlot({ slot, label = "Advertisement" }) {
  const [allowed, setAllowed] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const adapter = useRef(null);
  const element = useRef(null);
  const config = { enabled: import.meta.env.VITE_ADS_ENABLED, client: import.meta.env.VITE_ADSENSE_CLIENT, slot, cmpId: import.meta.env.VITE_ADS_CMP_ID };
  useEffect(() => {
    try {
      const api = initializeAds(window, config);
      adapter.current = api;
      return api?.subscribe(setAllowed);
    } catch { /* Advertising must never break the solver. */ }
  }, [config.enabled, config.client, config.slot, config.cmpId]);
  useEffect(() => { if (allowed) adapter.current?.requestSlot(element.current); }, [allowed]);
  if (!validAdConfig(config)) return null;
  return (
    <section className="advertisingControls" aria-label="Advertising">
      {allowed && <aside className="adSlot" aria-label={label}>
        <span>{label}</span>
        <ins ref={element} className="adsbygoogle" style={{display:'block',minHeight:280}}
          data-ad-client={config.client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
      </aside>}
      <button type="button" aria-expanded={preferences} onClick={()=>setPreferences(!preferences)}>Advertising preferences</button>
      {preferences && <div>
        <p>Advertising is {allowed ? 'allowed' : 'off'}. Enabling ads here still requires permission from our advertising consent provider. Analytics permission does not enable ads. Changing this preference may reload the page.</p>
        <button type="button" onClick={()=>adapter.current?.setEnabled(true)}>Enable eligible ads</button>
        <button type="button" onClick={()=>adapter.current?.setEnabled(false)}>Turn off advertising</button>
      </div>}
    </section>
  );
}
