import { useEffect, useState } from 'react';
import { aiService } from '../services/index.js';

/** { live, model, provider } — whether a real language model is connected (checked once per session). */
export default function useAiStatus() {
  const [status, setStatus] = useState({ live: false, pending: true });
  useEffect(() => {
    let on = true;
    aiService.status().then((s) => { if (on) setStatus(s); });
    return () => { on = false; };
  }, []);
  return status;
}
