# Ghid de Contribuție — Solaris CET

Mulțumim că ești interesat să contribui la **Solaris CET**! Urmează pașii de mai jos pentru a te asigura că fiecare contribuție este de calitate și aliniată arhitecturii proiectului.

---

## Cuprins

- [Cod de conduită](#cod-de-conduită)
- [Cum poți contribui](#cum-poți-contribui)
- [Configurarea mediului de dezvoltare](#configurarea-mediului-de-dezvoltare)
- [Flux de lucru Git](#flux-de-lucru-git)
- [Standarde de cod](#standarde-de-cod)
- [Trimiterea unui Pull Request](#trimiterea-unui-pull-request)
- [Raportarea problemelor](#raportarea-problemelor)
- [Politica de securitate](#politica-de-securitate)

---

## Cod de conduită

Acest proiect respectă principiile unui mediu deschis, prietenos și incluziv. Orice formă de hărțuire, discriminare sau comportament ostil nu este tolerată. Prin participarea la acest proiect, ești de acord să respecți aceste principii.

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

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git** >= 2.x

### Pași de instalare

```bash
# 1. Clonează repository-ul
git clone https://github.com/aamclaudiu-hash/solaris-cet.git
cd solaris-cet/app

# 2. Instalează dependențele
npm install

# 3. Pornește serverul de dezvoltare
npm run dev
```

### Comenzi disponibile

```bash
# Server de dezvoltare (http://localhost:5173)
npm run dev

# Build de producție
npm run build

# Preview build local
npm run preview

# Linting
npm run lint

# Verificare TypeScript
npx tsc --noEmit
```

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
3. **Testează** că `npm run build` și `npm run lint` trec fără erori
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

## Recunoaștere

Toți contribuitorii vor fi adăugați în secțiunea `Contributors` din README după ce primul PR este acceptat.

---

*Acest document este guvernat de licența [MIT](./LICENSE).*
