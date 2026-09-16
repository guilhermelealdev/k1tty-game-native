// src/game/hooks/useTypewriter.js
import { useState, useEffect } from 'react';

export function useTypewriter(text, speed = 8, enabled = true) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!enabled) { setDisplayed(text); setIsTyping(false); return; }
    if (!text) { setDisplayed(''); setIsTyping(false); return; }

    setDisplayed('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayed, isTyping };
}