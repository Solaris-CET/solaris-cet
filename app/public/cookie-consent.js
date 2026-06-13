(function () {
  'use strict';

  var KEY = 'solaris_cookie_consent';
  var VER = '1';

  function getConsent() {
    try {
      var stored = localStorage.getItem(KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function saveConsent(analytics, marketing) {
    var now = new Date().toISOString();
    var value = {
      v: VER,
      date: now,
      essential: true,
      analytics: !!analytics,
      marketing: !!marketing,
      updatedAt: now,
    };

    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch (error) {}

    return value;
  }

  function removeBanner() {
    var banner = document.getElementById('sc-banner');
    if (banner && banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  }

  function shouldShowBanner() {
    var pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    return !document.getElementById('root') && pathname !== '/privacy-settings';
  }

  function createBanner() {
    if (!shouldShowBanner() || document.getElementById('sc-banner')) {
      return;
    }

    var banner = document.createElement('div');
    banner.id = 'sc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consimtamant cookie-uri');
    banner.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#0f172a;' +
      'color:#f1f5f9;padding:1rem 1.5rem;border-top:2px solid #f97316;' +
      'display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;font-family:system-ui,sans-serif;font-size:.9rem;';
    banner.innerHTML =
      '<p style="margin:0;flex:1;min-width:180px">Folosim cookie-uri pentru a imbunatati site-ul. ' +
      '<a href="/cookies/" style="color:#f97316">Mai mult</a></p>' +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
      '<button id="sc-reject" style="padding:.4rem .9rem;background:transparent;color:#94a3b8;border:1px solid #334155;border-radius:5px;cursor:pointer">Doar necesare</button>' +
      '<button id="sc-settings" style="padding:.4rem .9rem;background:transparent;color:#f1f5f9;border:1px solid #f97316;border-radius:5px;cursor:pointer">Personalizeaza</button>' +
      '<button id="sc-accept" style="padding:.4rem 1rem;background:#f97316;color:#fff;border:none;border-radius:5px;cursor:pointer;font-weight:600">Accepta toate</button>' +
      '</div>';

    document.body.appendChild(banner);

    document.getElementById('sc-accept').onclick = function () {
      saveConsent(true, true);
      removeBanner();
    };

    document.getElementById('sc-reject').onclick = function () {
      saveConsent(false, false);
      removeBanner();
    };

    document.getElementById('sc-settings').onclick = function () {
      window.location.href = '/privacy-settings/';
    };
  }

  window.SolarisCookieConsent = {
    get: getConsent,
    save: saveConsent,
    show: createBanner,
    hide: removeBanner,
  };

  if (!getConsent()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createBanner);
    } else {
      createBanner();
    }
  }
})();
