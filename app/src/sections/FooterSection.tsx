import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Download, FileText, Mail, ArrowRight, Sun, Github, Twitter, MessageCircle } from 'lucide-react';


// Static data defined outside component to avoid re-creation on every render
const footerLinks = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'GitHub', href: '#', icon: Github },
];

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: MessageCircle, href: '#', label: 'Discord' },
  { icon: Github, href: '#', label: 'GitHub' },
];

const FooterSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const newsletterRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // CTA Card animation
      gsap.fromTo(
        ctaCardRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: ctaCardRef.current,
            start: 'top 85%',
            end: 'top 60%',
            scrub: true,
          },
        }
      );

      // Newsletter animation
      gsap.fromTo(
        newsletterRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: newsletterRef.current,
            start: 'top 85%',
            end: 'top 65%',
            scrub: true,
          },
        }
      );

      // Footer animation
      gsap.fromTo(
        footerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            end: 'top 75%',
            scrub: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-solaris-dark pt-16 pb-8"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] grid-floor opacity-10" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-6xl mx-auto">
        {/* CTA Card */}
        <div
          ref={ctaCardRef}
          className="glass-card-gold p-8 lg:p-12 mb-12 text-center"
        >
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-4">
            Start mining in <span className="text-solaris-gold">minutes</span>.
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg mb-8 max-w-lg mx-auto">
            Download Solaris Nova. Connect a wallet. Begin earning.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-filled-gold flex items-center gap-2 group">
              <Download className="w-4 h-4" />
              Download Nova App
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="btn-gold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Read the Whitepaper
            </button>
          </div>
        </div>

        {/* Newsletter */}
        <div
          ref={newsletterRef}
          className="glass-card p-6 lg:p-8 mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-solaris-gold" />
                <span className="hud-label text-solaris-gold">Stay Updated</span>
              </div>
              <p className="text-solaris-text">Get network updates (no spam).</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 w-full lg:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 lg:w-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text placeholder:text-solaris-muted/50 focus:outline-none focus:border-solaris-gold/50 transition-colors"
              />
              <button
                type="submit"
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isSubscribed
                    ? 'bg-emerald-400 text-solaris-dark'
                    : 'btn-gold'
                }`}
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer ref={footerRef} className="pt-8 border-t border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Sun className="w-8 h-8 text-solaris-gold" />
              <span className="font-display font-semibold text-lg text-solaris-text">
                Solaris <span className="text-solaris-gold">CET</span>
              </span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center gap-6">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-solaris-muted hover:text-solaris-text transition-colors text-sm flex items-center gap-1"
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Social */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-solaris-muted hover:text-solaris-gold hover:bg-solaris-gold/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center">
            <p className="text-solaris-muted/60 text-sm">
              © {new Date().getFullYear()} Solaris CET. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default FooterSection;
