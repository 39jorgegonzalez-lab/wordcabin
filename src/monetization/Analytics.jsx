import { useEffect } from "react";

export function Analytics() {
  useEffect(() => {
    const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
    if (!domain || document.querySelector("script[data-wordcabin-analytics]"))
      return;
    const script = document.createElement("script");
    script.defer = true;
    script.dataset.domain = domain;
    script.dataset.wordcabinAnalytics = "true";
    script.src = "https://plausible.io/js/script.js";
    document.head.appendChild(script);
  }, []);
  return null;
}
