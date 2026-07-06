import itertools

areas = {
    "A1": "Performance (CWV: LCP/CLS/INP, bundle size)",
    "A2": "SEO / Structured content / Sitemap / Robots / Meta",
    "A3": "Accessibility (keyboard, aria, contrast, headings)",
    "A4": "Content & i18n correctness (RO-first, other locales acceptable)",
    "A5": "Conversion (CTA, contact flows, lead capture, WhatsApp/call/email)",
    "A6": "PWA (install, update flow, offline pages, caching)",
    "A7": "API reliability (graceful degradation, timeouts, rate limits)",
    "A8": "Observability (health, metrics, logs, post-deploy checks)",
    "A9": "Security hardening (CORS, headers, SSRF, token handling)",
    "A10": "Coolify/Docker reliability (npm ci, image size, healthcheck)",
    "A11": "Testing quality (unit tests, integration, e2e stability)",
    "A12": "Repo hygiene (dead code removal, docs runbooks, scripts)"
}

targets = {
    "P1": "Home",
    "P2": "Services (/servicii)",
    "P3": "Products (packages)",
    "P4": "Contact (/contact)",
    "P5": "Token CET (/token-cet)",
    "P6": "About (/about)",
    "P7": "FAQ (/faq)",
    "P8": "Legal: privacy/terms/cookies/settings",
    "P9": "Nav/Footer",
    "P10": "Chat widget",
    "O1": "Dockerfile",
    "O2": "docker/coolify.yml",
    "O3": "scripts/post-deploy.mjs",
    "O4": "scripts/smoke-http.mjs",
    "O5": "health.json + /api/health",
    "O6": "/metrics + /api/metrics",
    "O7": "GitHub workflows"
}

actions = {
    "X1": "Add",
    "X2": "Improve",
    "X3": "Remove",
    "X4": "Refactor",
    "X5": "Secure",
    "X6": "Verify",
    "X7": "Document"
}

locales = ["ro", "en", "de", "es", "pt"]
devices = ["mobile", "desktop"]
scenarios = ["new_user", "returning_user", "slow_3g", "low_end_cpu"]

variants = list(itertools.product(locales, devices, scenarios))

templates = []

# Define first 10 manually as per prompt
templates.append({
    "id": "001", "Area": "A1", "Target": "P1", "Action": "X2",
    "Goal": "Reduce JS executed on first load by lazy-loading non-critical widgets.",
    "Files": "app/src/App.tsx, app/src/pages/HomePage.tsx",
    "Change": "- Identify non-critical components rendered on initial route\n  - Lazy-load and add Suspense fallback=null",
    "Acceptance": "Commands: cd /repo && npm run app:verify\n  Expected: passes; initial bundle smaller; no runtime errors"
})
templates.append({
    "id": "002", "Area": "A2", "Target": "P1", "Action": "X2",
    "Goal": "Ensure meta title/description are correct for {LOCALE} and match company positioning (no crypto).",
    "Files": "app/src/App.tsx, app/index.html",
    "Change": "- Update per-route meta for /, /servicii, /contact, /token-cet\n  - Ensure no “test/testnet/tokenomics/defi” wording leaks to public meta",
    "Acceptance": "Commands: cd /repo && npm run app:verify\n  Expected: tests pass; meta assertions pass"
})
templates.append({
    "id": "003", "Area": "A3", "Target": "P9", "Action": "X5",
    "Goal": "Keyboard navigation for header + mobile menu works end-to-end.",
    "Files": "app/src/components/Navigation.tsx, app/src/components/Navigation.test.tsx",
    "Change": "- Ensure focus trap/close behavior\n  - aria-labels are stable across locales",
    "Acceptance": "Commands: cd /repo && npm run test --workspace=app\n  Expected: navigation tests pass; a11y checks pass"
})
templates.append({
    "id": "004", "Area": "A5", "Target": "P4", "Action": "X2",
    "Goal": "Improve contact conversion for {DEVICE} by adding WhatsApp deep link + prefilled message.",
    "Files": "app/src/pages/ContactPage.tsx",
    "Change": "- Add WhatsApp CTA (wa.me) with encoded text\n  - Keep phone/email invariants",
    "Acceptance": "Commands: cd /repo && npm run app:verify\n  Expected: build passes; CTA appears; no broken links"
})
templates.append({
    "id": "005", "Area": "A6", "Target": "P9", "Action": "X2",
    "Goal": "Ensure “Download app” button behaves correctly across browsers (install prompt vs instructions).",
    "Files": "app/src/components/company/DownloadAppButton.tsx",
    "Change": "- Test: hides prompt when already installed\n  - Add robust fallback text for iOS Safari",
    "Acceptance": "Commands: cd /repo && npm run test --workspace=app\n  Expected: tests pass; no toast “Update available”"
})
templates.append({
    "id": "006", "Area": "A7", "Target": "P10", "Action": "X5",
    "Goal": "Chat API must never hard-fail when no provider keys; degrade gracefully.",
    "Files": "app/api/chat/route.ts, app/src/__tests__/apiRoutes.integration.test.ts",
    "Change": "- Return {response} with offline guidance in company mode\n  - Keep CORS + rate limit behavior intact",
    "Acceptance": "Commands: cd /repo && npm run verify:fast\n  Expected: all tests pass; /api/chat returns 200 offline"
})
templates.append({
    "id": "007", "Area": "A8", "Target": "O3", "Action": "X2",
    "Goal": "Post-deploy checks validate core pages (no crypto routes required).",
    "Files": "scripts/post-deploy.mjs",
    "Change": "- Probe /, /servicii, /contact, /token-cet, /privacy, /terms, /cookies",
    "Acceptance": "Commands: node scripts/post-deploy.mjs (with POST_DEPLOY_BASE_URL)\n  Expected: exits 0 on success"
})
templates.append({
    "id": "008", "Area": "A10", "Target": "O1", "Action": "X2",
    "Goal": "Docker build is reproducible with npm ci and minimal layers.",
    "Files": "Dockerfile",
    "Change": "- Ensure workspace build uses app/index.html correctly\n  - Keep HEALTHCHECK stable",
    "Acceptance": "Commands: docker build .\n  Expected: build succeeds; image runs; health passes"
})
templates.append({
    "id": "009", "Area": "A4", "Target": "P2", "Action": "X2",
    "Goal": "Rewrite services copy for {LOCALE} with clear scope: PV, construction, roofing, TPO, parapets, facades, repairs.",
    "Files": "app/src/pages/ServicesPage.tsx, app/src/i18n/translations.ts",
    "Change": "- Keep claims realistic (no guarantees)\n  - Ensure headings hierarchy (h1 once)",
    "Acceptance": "Commands: cd /repo && npm run app:verify\n  Expected: build+tests pass; copy consistent"
})
templates.append({
    "id": "010", "Area": "A11", "Target": "P4", "Action": "X6",
    "Goal": "Add unit test: contact form submits to /api/support/start and shows success state.",
    "Files": "app/src/pages/ContactPage.tsx, app/src/pages/ContactPage.test.tsx (new)",
    "Change": "- Mock fetch to /api/support/start\n  - Assert payload contains phone/email + selected service",
    "Acceptance": "Commands: cd /repo && npm run test --workspace=app\n  Expected: tests pass"
})

# Generate 011-250 using taxonomy
all_triples = list(itertools.product(areas.keys(), targets.keys(), actions.keys()))
used_triples = set([
    ("A1", "P1", "X2"), ("A2", "P1", "X2"), ("A3", "P9", "X5"), ("A5", "P4", "X2"),
    ("A6", "P9", "X2"), ("A7", "P10", "X5"), ("A8", "O3", "X2"), ("A10", "O1", "X2"),
    ("A4", "P2", "X2"), ("A11", "P4", "X6")
])

candidate_triples = [t for t in all_triples if t not in used_triples]

for i in range(11, 251):
    area_code, target_code, action_code = candidate_triples[i-11]
    area_desc = areas[area_code]
    target_desc = targets[target_code]
    action_desc = actions[action_code]

    tid = f"{i:03d}"
    templates.append({
        "id": tid,
        "Area": area_code,
        "Target": target_code,
        "Action": action_code,
        "Goal": f"{action_desc} {area_desc} for {target_desc} in scenario {{SCENARIO}} for locale {{LOCALE}}.",
        "Files": "app/src/App.tsx",
        "Change": f"- Audit {target_desc} for {area_code} requirements\n  - Implement {action_desc} logic targeting {area_desc}\n  - Verify results in {{DEVICE}} environment",
        "Acceptance": f"Commands: cd /repo && npm run verify:fast\n  Expected: {action_desc} verified on {target_desc}"
    })

# Output file
with open("JULES_TASKS_10000.md", "w") as f:
    f.write("# JULES TASKS 10,000\n\n")

    f.write("## TEMPLATES 001–250\n\n")
    for t in templates:
        f.write(f"TEMPLATE-{t['id']}\n")
        f.write(f"Area: {t['Area']}\n")
        f.write(f"Target: {t['Target']}\n")
        f.write(f"Action: {t['Action']}\n")
        f.write(f"Goal: {t['Goal']}\n")
        f.write(f"Files: {t['Files']}\n")
        f.write(f"Change:\n{t['Change']}\n")
        f.write(f"Acceptance:\n  {t['Acceptance']}\n\n")

    f.write("## TASKS T-00001..T-10000\n\n")

    task_count = 0
    for t_idx, template in enumerate(templates):
        for v_idx, variant in enumerate(variants):
            task_count += 1
            locale, device, scenario = variant

            f.write(f"T-{task_count:05d}\n")
            f.write(f"Area: {template['Area']}\n")
            f.write(f"Target: {template['Target']}\n")
            f.write(f"Action: {template['Action']}\n")
            f.write(f"Variant: locale={locale}, device={device}, scenario={scenario}\n")

            goal = template['Goal'].replace("{LOCALE}", locale).replace("{DEVICE}", device).replace("{SCENARIO}", scenario)
            f.write(f"Goal: {goal}\n")
            f.write(f"Files: {template['Files']}\n")

            change = template['Change'].replace("{LOCALE}", locale).replace("{DEVICE}", device).replace("{SCENARIO}", scenario)
            f.write(f"Change:\n{change}\n")

            acceptance = template['Acceptance'].replace("{LOCALE}", locale).replace("{DEVICE}", device).replace("{SCENARIO}", scenario)
            f.write(f"Acceptance:\n  {acceptance}\n")

            f.write(f"Risk: low (standard {template['Area']} improvement)\n\n")
