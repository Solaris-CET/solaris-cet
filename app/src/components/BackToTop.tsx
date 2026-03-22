import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * BackToTop — a floating "scroll to top" button that appears after the user
 * scrolls past 600 px. Clicking it smoothly returns to the very top of the page.
 *
 * Follows the same accessibility pattern as Navigation.tsx:
 * - visible `aria-label` for screen readers
 * - `aria-hidden` when invisible so assistive technology skips it
 * - uses `window.scrollTo({ behavior: 'smooth' })` for a graceful return
 */
const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      aria-hidden={!visible}
      className={`fixed bottom-6 right-6 z-[999] w-11 h-11 rounded-full
        bg-solaris-gold/90 text-solaris-dark shadow-lg shadow-solaris-gold/20
        flex items-center justify-center
        hover:bg-solaris-gold hover:scale-110 active:scale-95
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
};

export default BackToTop;
