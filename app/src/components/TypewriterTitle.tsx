import React, { useState, useEffect } from 'react';

export const TypewriterTitle: React.FC<{ phrases: string[] }> = ({ phrases }) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentPhrase = phrases[index % phrases.length];
    
    if (isDeleting) {
      if (text === '') {
        setIsDeleting(false);
        setIndex(i => i + 1);
        timer = setTimeout(() => {}, 500); 
      } else {
        timer = setTimeout(() => {
          setText(text.slice(0, -1));
        }, 40);
      }
    } else {
      if (text === currentPhrase) {
        timer = setTimeout(() => setIsDeleting(true), 2500); 
      } else {
        timer = setTimeout(() => {
          setText(currentPhrase.slice(0, text.length + 1));
        }, 80);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, phrases]);

  return (
    <span className="inline-flex items-center">
      {text}
      <span className="w-[4px] h-[1em] bg-teal-400 ml-1 animate-pulse" />
    </span>
  );
};
