import { useEffect, useState } from 'react';
import { bogotaDateFromInstant } from './challenge-model.js';
export function usePublicationDate() {
  const [date, setDate] = useState(bogotaDateFromInstant);
  useEffect(() => {
    const refresh = () => setDate(bogotaDateFromInstant());
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  return date;
}
