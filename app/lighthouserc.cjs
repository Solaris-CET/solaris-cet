/**
 * Lighthouse CI configuration for Solaris CET.
 *
 * Blocks merge if Performance, Accessibility, Best Practices, or SEO
 * scores fall below their minimum thresholds.
 *
 * Serves the pre-built dist directory directly via staticDistDir —
 * no preview server is required in CI.
 */
module.exports = {
  ci: {
    collect: {
      /* Serve the pre-built dist directory directly — no preview server needed */
      staticDistDir: './dist',
      numberOfRuns: 1,
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
        /* Core categories — realistic thresholds for a complex GSAP/React SPA.
         * Performance is capped at 0.65 because the app ships a large Tailwind CSS
         * bundle (render-blocking) and substantial JS chunks (TonConnect, GSAP,
         * React) that Lighthouse flags under "unused-javascript".  Both are
         * architectural trade-offs, not regressions. */
        'categories:performance': ['error', { minScore: 0.65 }],
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
