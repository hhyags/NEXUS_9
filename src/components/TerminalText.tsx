import { useEffect, useState } from 'react';

interface TerminalTextProps {
  text: string;
  delay?: number; // Initial delay before typing
  speed?: number; // Speed of typing in ms
  className?: string;
  onComplete?: () => void;
}

export function TerminalText({ text, delay = 0, speed = 50, className = '', onComplete }: TerminalTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        setIsTyping(true);
      }, delay);
    } else {
      setIsTyping(true);
    }

    return () => clearTimeout(timeoutId);
  }, [delay]);

  useEffect(() => {
    if (!isTyping) return;

    if (displayedText.length < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timeoutId);
    } else {
      if (onComplete) onComplete();
    }
  }, [displayedText, isTyping, text, speed, onComplete]);

  return (
    <span className={`${className} ${displayedText.length < text.length ? 'border-r-2 border-neon-green pr-1 animate-pulse' : ''}`}>
      {displayedText}
    </span>
  );
}
