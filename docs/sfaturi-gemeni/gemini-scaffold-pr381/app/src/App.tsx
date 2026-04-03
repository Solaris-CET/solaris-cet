/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Tokenomics } from "./components/Tokenomics";
import { Roadmap } from "./components/Roadmap";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="bg-black min-h-screen font-sans text-white selection:bg-amber-500 selection:text-black">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Tokenomics />
        <Roadmap />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
