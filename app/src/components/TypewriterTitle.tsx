import React, { useState, useEffect } from 'react';

export const TypewriterTitle: React.FC<{ phrases: string[] }> = ({ phrases }) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[index % phrases.length] ?? '';

    const timer = setTimeout(() => {
      if (isDeleting) {
        if (text === '') {
          setIsDeleting(false);
          setIndex((i) => i + 1);
          return;
        }
        setText(text.slice(0, -1));
        return;
      }

      if (text === currentPhrase) {
        setIsDeleting(true);
        return;
      }

      setText(currentPhrase.slice(0, text.length + 1));
    }, (() => {
      if (isDeleting) return text === '' ? 500 : 40;
      return text === currentPhrase ? 2500 : 80;
    })());

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, phrases]);

  return (
    <span className="inline-flex items-center">
      {text}
      <span className="w-[4px] h-[1em] bg-teal-400 ml-1 animate-pulse" />
    </span>
  );
};
