import { useEffect } from 'react';

export default function LiveChatEmbed() {
  useEffect(() => {
    const crispId = String(import.meta.env.VITE_CRISP_WEBSITE_ID ?? '').trim();
    const tawkProperty = String(import.meta.env.VITE_TAWK_PROPERTY_ID ?? '').trim();
    const tawkWidget = String(import.meta.env.VITE_TAWK_WIDGET_ID ?? '').trim();

    if (crispId) {
      const w = window as unknown as { $crisp?: unknown[]; CRISP_WEBSITE_ID?: string };
      if (!Array.isArray(w.$crisp)) w.$crisp = [];
      if (!w.CRISP_WEBSITE_ID) w.CRISP_WEBSITE_ID = crispId;
      if (document.getElementById('crisp-chat-script')) return;
      const s = document.createElement('script');
      s.id = 'crisp-chat-script';
      s.async = true;
      s.src = 'https://client.crisp.chat/l.js';
      document.head.appendChild(s);
      return;
    }

    if (tawkProperty && tawkWidget) {
      const w = window as unknown as { Tawk_API?: unknown; Tawk_LoadStart?: Date };
      if (!w.Tawk_API) w.Tawk_API = {};
      w.Tawk_LoadStart = new Date();
      if (document.getElementById('tawk-chat-script')) return;
      const s = document.createElement('script');
      s.id = 'tawk-chat-script';
      s.async = true;
      s.src = `https://embed.tawk.to/${encodeURIComponent(tawkProperty)}/${encodeURIComponent(tawkWidget)}`;
      s.charset = 'UTF-8';
      s.setAttribute('crossorigin', '*');
      document.head.appendChild(s);
    }
  }, []);

  return null;
}

