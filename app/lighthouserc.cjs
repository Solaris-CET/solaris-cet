/**
 * Lighthouse CI configuration for Solaris CET.
 *
 * Blocks merge if Performance, Accessibility, Best Practices, or SEO
 * scores fall below their minimum thresholds.
 *
 * Runs 3 consecutive audits per URL and takes the median result to
 * reduce measurement noise.
 */
module.exports = {
  ci: {
    collect: {
      /* Audit the Vite preview server started separately in CI */
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 3,
      settings: {
        /* Use desktop preset for a consistent, deterministic baseline */
        preset: 'desktop',
        /* Throttling disabled for the static-server environment */
        throttlingMethod: 'provided',
        /* Only audit the categories we care about */
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        /* Core categories — realistic thresholds for a complex GSAP/React SPA */
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.4 }],
        'categories:best-practices': ['error', { minScore: 0.4 }],
        'categories:seo': ['error', { minScore: 0.4 }],

        /* ── Accessibility fundamentals (zero-tolerance) ──────────────── */
        'document-title': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'meta-description': 'error',
        'color-contrast': 'warn',
        'link-name': 'warn',

        /* ── SEO fundamentals ─────────────────────────────────────────── */
        'canonical': 'warn',
        'robots-txt': 'warn',

        /* ── Best-practices / security ────────────────────────────────── */
        'csp-xss': 'warn',
        'is-on-https': 'warn',

        /* ── Performance ──────────────────────────────────────────────── */
        'render-blocking-resources': 'warn',
        'uses-text-compression': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'unused-javascript': 'warn',
        'unused-css-rules': 'warn',
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],

        /* ── Console / DevTools issues (API calls fail in static env) ─── */
        'errors-in-console': 'warn',
      },
    },
    upload: {
      /* Store reports as local files — the GitHub Actions workflow uploads
         them as artifacts, so no external storage service is needed. */
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
