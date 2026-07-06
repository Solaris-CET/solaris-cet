## Summary

<!-- What does this PR change and why? -->

## Related issues

<!-- e.g. Closes #42 -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation only
- [ ] Refactor / quality (no behaviour change)
- [ ] Tests
- [ ] CI / tooling / dependencies
- [ ] Breaking change (describe migration below)

## Checklist

Run these from the repo root. This repo uses npm workspaces and a single root `package-lock.json`.

- [ ] `npm ci --include=optional --legacy-peer-deps` succeeds
- [ ] `npm run verify:fast` succeeds
- [ ] `npm run verify:all` succeeds (when UI/routes/API contracts changed)
- [ ] `npm run contracts:test` succeeds (when contracts changed)
- [ ] `npm run contracts:typecheck` succeeds (when contracts changed)
- [ ] Tested manually in a browser when UI behaviour changed
- [ ] No unjustified `any`, no stray `console.log` / debug code in production paths
- [ ] New UI uses existing Tailwind / component patterns; GSAP plugins registered only where the project already does (e.g. `App.tsx`)
- [ ] Docs updated if user-facing behaviour or setup changed

## Screenshots / recordings

<!-- For visual changes, add before/after or a short clip. -->

## Breaking changes

<!-- If applicable: what breaks and how consumers should migrate. -->
