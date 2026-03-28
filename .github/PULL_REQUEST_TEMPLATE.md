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

Run these from the `app/` directory unless only contracts/scripts changed.

- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes (when TypeScript changed)
- [ ] Automated tests pass (`npm run test` in `app/` where relevant)
- [ ] Tested manually in a browser when UI behaviour changed
- [ ] No unjustified `any`, no stray `console.log` / debug code in production paths
- [ ] New UI uses existing Tailwind / component patterns; GSAP plugins registered only where the project already does (e.g. `App.tsx`)
- [ ] Docs updated if user-facing behaviour or setup changed

## Screenshots / recordings

<!-- For visual changes, add before/after or a short clip. -->

## Breaking changes

<!-- If applicable: what breaks and how consumers should migrate. -->
