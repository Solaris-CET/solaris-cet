/**
 * Local / PR reference config. The workflow in `.github/workflows/lighthouse-ci.yml`
 * embeds the same thresholds so PR branches cannot weaken gates by editing this file alone.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        throttlingMethod: 'provided',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        // Stricter than legacy 0.4 floor; static dist + third-party scripts vary by Lighthouse run.
        'categories:performance': ['error', { minScore: 0.65 }],
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.65 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'document-title': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'meta-description': 'error',
        'color-contrast': 'warn',
        'link-name': 'warn',
        'canonical': 'warn',
        'robots-txt': 'off',
        'csp-xss': 'warn',
        'is-on-https': 'warn',
        'render-blocking-resources': 'warn',
        'uses-text-compression': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'unused-javascript': 'warn',
        'unused-css-rules': 'warn',
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'errors-in-console': 'warn',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
