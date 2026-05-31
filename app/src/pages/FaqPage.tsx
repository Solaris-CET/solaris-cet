import { SolarisFooter } from '@/components/company/SolarisFooter';
import FAQSection from '@/sections/FAQSection';

export default function FaqPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="pt-24 pb-0 bg-slate-950 text-white"
    >
      <FAQSection />
      <div className="mt-0">
        <SolarisFooter />
      </div>
    </main>
  );
}
