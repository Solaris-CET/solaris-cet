## 📋 Descrierea modificărilor

<!-- Descrie clar și concis ce modificări ai făcut și de ce. -->

### Tipul de schimbare

<!-- Bifează toate categoriile aplicabile -->

- [ ] 🐛 **Bug fix** — rezolvă o problemă fără a schimba funcționalitatea existentă
- [ ] ✨ **Feature** — adaugă o funcționalitate nouă
- [ ] 🔧 **Refactorizare** — îmbunătățire a codului fără schimbări funcționale
- [ ] 📖 **Documentație** — actualizare exclusivă a documentației
- [ ] 🎨 **UI / Stiluri** — modificări vizuale sau de stilizare
- [ ] ⚡ **Performanță** — îmbunătățiri de viteză sau eficiență
- [ ] 🔒 **Securitate** — remediere a unei vulnerabilități
- [ ] 🧪 **Teste** — adăugare sau modificare teste
- [ ] ⚙️ **CI / Build** — modificări la pipeline sau configurație de build
- [ ] ⚠️ **Breaking change** — modificare incompatibilă cu versiunile anterioare

---

## 🔗 Issue asociat

<!-- Referințiază issue-ul rezolvat: -->
Closes #<!-- numărul issue-ului -->

---

## 🧪 Lista de verificare tehnică

> ⚠️ **Toate punctele obligatorii trebuie bifate înainte de a solicita review.**  
> PR-urile incomplete vor fi returnate fără review.

### Calitatea codului

- [ ] Codul urmează standardele TypeScript definite în `CONTRIBUTING.md`
- [ ] Nu există utilizări de `any` nejustificate în TypeScript
- [ ] Componente React noi folosesc functional components cu hooks
- [ ] GSAP plugins sunt înregistrate exclusiv în `App.tsx`, nu în componente individuale
- [ ] Nu există `console.log` sau cod de debug lăsat în cod

### Build și compatibilitate

- [ ] `npm run build` se execută fără erori
- [ ] `npm run lint` se execută fără erori sau avertismente noi
- [ ] `npx tsc --noEmit` nu raportează erori TypeScript noi
- [ ] Am testat pe minim un browser modern (Chrome / Firefox / Safari)

### Arhitectura Solaris CET

- [ ] Modificările respectă structura de directoare existentă (`src/sections/`, `src/components/`)
- [ ] Stilizarea folosește Tailwind CSS (nu CSS inline ad-hoc)
- [ ] Dependențele noi au fost justificate și adăugate corect în `package.json`
- [ ] Nu am introdus dependențe cu vulnerabilități cunoscute

### Documentație

- [ ] Am actualizat `README.md` dacă modificările afectează utilizarea sau instalarea
- [ ] Funcțiile și componentele complexe noi au comentarii JSDoc explicative
- [ ] Breaking changes sunt documentate în această descriere de PR

### Teste

- [ ] Am testat manual funcționalitatea adăugată / modificată
- [ ] Testele automate existente (dacă există) trec fără erori
- [ ] Cazurile limită (edge cases) au fost luate în considerare și testate

---

## 📸 Screenshot-uri / Demo

<!-- Dacă modificările sunt vizuale, adaugă screenshot-uri sau GIF-uri înainte/după. -->

| Înainte | După |
|---------|------|
| <!-- screenshot --> | <!-- screenshot --> |

---

## 📝 Note pentru reviewer

<!-- Există ceva specific pe care reviewerul ar trebui să verifice sau să știe? -->
<!-- Există decizii de design care necesită explicații suplimentare? -->

---

## ⚠️ Breaking Changes (dacă aplicabil)

<!-- Dacă ai bifat "Breaking change" mai sus, descrie ce se schimbă și cum pot fi migrate. -->

**Ce se schimbă:**

**Cum se migrează:**
