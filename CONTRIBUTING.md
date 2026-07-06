# Ghid de Contribuție — Solaris CET

Mulțumim că ești interesat să contribui la **Solaris CET**! Urmează pașii de mai jos pentru a te asigura că fiecare contribuție este de calitate și aliniată arhitecturii proiectului.

---

## Cuprins

- [Cod de conduită](#cod-de-conduită)
- [Cum poți contribui](#cum-poți-contribui)
- [Configurarea mediului de dezvoltare](#configurarea-mediului-de-dezvoltare)
- [Verificare monorepo](#verificare-monorepo-înainte-de-pr-sau-release)
- [Arhitectură (high-level)](#arhitectură-high-level)
- [Onboarding video (Loom)](#onboarding-video-loom)
- [Flux de lucru Git](#flux-de-lucru-git)
- [Standarde de cod](#standarde-de-cod)
- [Trimiterea unui Pull Request](#trimiterea-unui-pull-request)
- [Raportarea problemelor](#raportarea-problemelor)
- [Politica de securitate](#politica-de-securitate)
- [Issue-uri pentru începători](#issue-uri-pentru-începători)

---

## Cod de conduită

Acest proiect respectă principiile unui mediu deschis, prietenos și incluziv. Orice formă de hărțuire, discriminare sau comportament ostil nu este tolerată. Prin participarea la acest proiect, ești de acord să respecți aceste principii.

Referință: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

---

## Cum poți contribui

Contribuțiile sunt binevenite în mai multe forme:

| Tip de contribuție        | Descriere                                          |
|---------------------------|----------------------------------------------------|
| 🐛 **Raport de bug**      | Descoperești un comportament neașteptat            |
| ✨ **Cerere de funcționalitate** | Propui o funcționalitate nouă               |
| 📖 **Documentație**       | Îmbunătățești sau completezi documentația          |
| 🔧 **Refactorizare**      | Optimizezi cod existent fără a schimba funcționalitatea |
| 🧪 **Teste**              | Adaugi sau îmbunătățești teste existente           |
| 🌐 **Traduceri**          | Adaugi suport pentru o nouă limbă                  |

---

## Configurarea mediului de dezvoltare

### Cerințe preliminare

- **Node.js** >= 22.x (vezi `engines` în `app/package.json`)
- **npm** >= 10.x
- **Git** >= 2.x

### Pași de instalare

```bash
# 1. Clonează repository-ul
git clone https://github.com/Solaris-CET/solaris-cet.git
cd solaris-cet

# 2. Instalează dependențele
npm ci --include=optional --legacy-peer-deps

# 3. Pornește serverul de dezvoltare
npm run app:dev
```

### Comenzi disponibile

```bash
# Server de dezvoltare (http://localhost:5173)
npm run app:dev

# Build de producție
npm run app:build

# Preview build local
npm run start --workspace=app

# Linting
npm run lint --workspace=app

# Verificare TypeScript (același lucru ca în CI)
npm run typecheck --workspace=app

# Teste unit (Vitest)
npm run test --workspace=app

# Poartă rapidă înainte de push (monorepo): audit + typecheck + unit + build
npm run verify:fast

# Playwright E2E (Chromium; prima dată: npx playwright install --with-deps chromium)
# Necesită app/dist/: `pretest:e2e` verifică existența lui; altfel rulează mai întâi `npm run app:build` sau `npm run app:verify`.
npm run app:test:e2e
# Dacă apare `ERR_CONNECTION_REFUSED` pe preview-ul local (:4173), limitează worker-ii: `PW_WORKERS=1 npm run test:e2e` (echivalent: `npm run test:e2e:stable`)

# Verificare completă locală (monorepo): verify:fast + E2E stabil (un worker)
npm run verify:all
```

### Verificare monorepo (înainte de PR sau release)

| Zonă | Comandă |
|------|---------|
| **Monorepo (rapid)** | Din repo root: `npm ci --include=optional --legacy-peer-deps && npm run verify:fast` |
| **Monorepo (complet, include E2E stabil)** | Din repo root: `npm ci --include=optional --legacy-peer-deps && npm run verify:all` (prima dată: `npx playwright install --with-deps chromium` din `app/`) |

**CI GitHub:** job-ul Playwright rulează `npm run test:e2e` cu `PW_WORKERS` din variabila de repository **`E2E_WORKERS`** (opțional; necompletată → 1 worker). Local, `verify:all` folosește `test:e2e:stable` (un worker, predictibil).

---

## Arhitectură (high-level)

- Overview: `docs/ARCHITECTURE.md`
- Diagramă data flow: `docs/DATA_FLOW.md`
- Starea arhitecturii curente (deployment/runtime): `ARCHITECTURE_STATE.md`

---

## Onboarding video (Loom)

Nu putem include direct un video în repo, dar menținem un script scurt (2–4 minute) pe care orice maintainer îl poate înregistra:

1. Clone + `npm ci --include=optional --legacy-peer-deps` (din root)
2. Pornește local: `npm run app:dev`
3. Rulează quality gate: `npm run verify:fast`
4. (Opțional) E2E stabil: `npm run verify:all`
5. Entry points: `app/src/App.tsx`, `app/api/*`, `contracts/`, `scripts/`

În descrierea video-ului, include link către `README.md` + `CONTRIBUTING.md` + `docs/ARCHITECTURE.md`.

---

## Flux de lucru Git

### Convenție de ramuri (branches)

| Prefix          | Scop                                    | Exemplu                        |
|-----------------|----------------------------------------|--------------------------------|
| `feature/`      | Funcționalitate nouă                   | `feature/quantum-ai-module`    |
| `fix/`          | Repararea unui bug                     | `fix/hero-section-coinref`     |
| `docs/`         | Actualizare documentație               | `docs/update-contributing`     |
| `refactor/`     | Refactorizare cod                      | `refactor/gsap-registration`   |
| `test/`         | Adăugare sau modificare teste          | `test/tokenomics-unit`         |
| `chore/`        | Sarcini de mentenanță                  | `chore/update-dependencies`    |

### Convenție pentru mesaje de commit

Folosim formatul **Conventional Commits**:

```
<tip>(<domeniu>): <descriere scurtă>

[corp opțional]

[footer opțional]
```

**Tipuri acceptate:**

| Tip        | Descriere                                              |
|------------|--------------------------------------------------------|
| `feat`     | Funcționalitate nouă                                   |
| `fix`      | Reparare bug                                           |
| `docs`     | Modificări doar în documentație                        |
| `style`    | Formatare, spații, virgule (fără schimbări logice)     |
| `refactor` | Refactorizare cod (fără fix sau feature)               |
| `test`     | Adăugare sau corectare teste                           |
| `chore`    | Modificări la build system sau dependențe externe      |
| `perf`     | Îmbunătățiri de performanță                            |
| `ci`       | Modificări la configurația CI/CD                       |

**Exemple:**

Mesajul trebuie să descrie real schimbarea; nu folosi text placeholder copiat din șabloane de commit automate.

```bash
feat(quantum-ai): add predictive mining algorithm
fix(hero-section): correct coinRef type from HTMLImageElement to HTMLDivElement
docs(contributing): add git workflow section
chore(deps): remove kimi-plugin-inspect-react from devDependencies
```

---

## Standarde de cod

### TypeScript

- Folosește tipuri explicite; evită `any` acolo unde este posibil
- Toate componentele React trebuie să aibă tipuri definite pentru props
- Preferă `interface` pentru obiecte, `type` pentru uniuni și intersecții

```typescript
// ✅ Corect
interface HeroSectionProps {
  title: string;
  subtitle?: string;
}

// ❌ Evită
const HeroSection = (props: any) => { ... }
```

### React

- Folosește **functional components** cu hooks
- Înregistrează GSAP plugins o singură dată în `App.tsx`, nu în componente individuale
- Urmează arhitectura de secțiuni existentă din `src/sections/`

### CSS / Tailwind

- Preferă clasele Tailwind CSS față de CSS inline
- Stilurile custom globale se adaugă în `src/index.css`
- Stilurile specifice aplicației se adaugă în `src/App.css`

### Structura fișierelor

```
app/src/
├── sections/          # Secțiuni principale ale paginii
├── components/        # Componente reutilizabile
│   └── ui/           # Componente shadcn/ui
├── App.tsx           # Componenta principală
├── main.tsx          # Entry point
├── index.css         # Stiluri globale
└── App.css           # Stiluri specifice aplicației
```

---

## Trimiterea unui Pull Request

1. **Fork** repository-ul și creează o ramură din `main`
2. **Implementează** modificările respectând standardele de cod
3. **Testează** din repo root: `npm run verify:fast`; pentru modificări de UI/flux CET AI sau navigație, rulează și `npm run verify:all`
4. **Completează** șablonul de Pull Request cu toate detaliile necesare
5. **Deschide** PR-ul cu un titlu clar în format Conventional Commits
6. **Așteaptă** review-ul — un maintainer va răspunde în maxim 5 zile lucrătoare

> ⚠️ PR-urile care nu completează șablonul obligatoriu sau care nu trec verificările automate vor fi închise fără review.

---

## Raportarea problemelor

Folosește șabloanele GitHub Issue Forms disponibile în repository:

- 🐛 **Bug Report** — pentru comportamente neașteptate sau erori
- ✨ **Feature Request** — pentru propuneri de funcționalități noi

> ⚠️ Issue-urile care nu utilizează șabloanele predefinite vor fi închise automat.

---

## Politica de securitate

Dacă descoperi o vulnerabilitate de securitate, **nu** deschide un issue public.  
Contactează echipa direct la: **security@solaris-cet.io**

Include în mesaj:
- Descrierea vulnerabilității
- Pașii pentru reproducere
- Impactul potențial
- Sugestii de remediere (opțional)

Vom răspunde în maxim **72 de ore** și vom coordona un disclosure responsabil.

---

## Issue-uri pentru începători

- Caută label-ul **`good first issue`** pentru task-uri cu scope mic și context clar.
- Caută label-ul **`help wanted`** pentru task-uri deschise către contribuții externe.
- Dacă nu există un issue potrivit, deschide un **Feature Request** și descrie soluția propusă + impactul.

## Recunoaștere

Toți contribuitorii vor fi adăugați în secțiunea `Contributors` din README după ce primul PR este acceptat.

---

*Acest document este guvernat de licența [MIT](./LICENSE).*
