import { useEffect } from "react";

function ensureAdSenseScript(client) {
  if (document.querySelector("script[data-wordcabin-ads]")) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.wordcabinAds = "true";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(script);
}

export function AdSlot({ slot, label = "Advertisement" }) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT;
  useEffect(() => {
    if (!client || !slot) return;
    ensureAdSenseScript(client);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [client, slot]);
  if (!client || !slot) return null;
  return (
    <aside className="adSlot" aria-label={label}>
      <span>{label}</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
