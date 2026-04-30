import FAQSection from '@/sections/FAQSection';

export default function FaqPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <h1 className="sr-only">FAQ</h1>
      <FAQSection />
    </main>
  );
}

