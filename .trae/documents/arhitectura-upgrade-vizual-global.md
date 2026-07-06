## 1.Architecture design
```mermaid
graph TD
  A["User Browser"] --> B["React Frontend Application"]
  B --> C["UI Theme Tokens (CSS Variables)"]
  B --> D["Global Layout Shell"]
  D --> E["Cosmic Background Renderer"]
  D --> F["Holographic Component Styles"]
  E --> G["CSS Gradients + SVG (default)"]
  E --> H["Canvas Particles (optional)"]
  B --> I["A11y + Motion Policy"]
  I --> J["matchMedia prefers-reduced-motion"]
  I --> K["Device/Performance Heuristics"]

  subgraph "Frontend Layer"
    B
    C
    D
    E
    F
    I
  end

  subgraph "Browser APIs"
    J
    K
  end
```

## 2.Technology Description
- Frontend: React@18 + vite
- Styling: tailwindcss@3 (sau CSS Modules) + CSS Variables pentru tokens (culori/spacing/radius/elevations)
- Animation: CSS transitions/animations (minim), fără librării grele; Canvas doar opțional și dezactivabil
- Backend: None

## 3.Route definitions
| Route | Purpose |
|-------|---------|
| / | Home (hero + secțiuni principale) |
| /pagina/:slug | Pagină de conținut (template generic) |
| /formular | Pagină de formular (template) pentru verificarea stărilor UI (inputs, erori, focus) |

## 6.Data model(if applicable)
Nu este necesar (schimbare exclusiv UI).

### Note de implementare (constrângeri cheie)
- Politică motion: dacă `prefers-reduced-motion: reduce`, atunci dezactivezi: particule, parallax, shimmer continuu; păstrezi doar tranziții scurte (ex: 120–180ms) pentru feedback.
- Performanță mobile: profil „lite” implicit pe ecrane mici; efecte costisitoare (blur mare, multe straturi, animații infinite) sunt înlocuite cu fundal static (gradient/AVIF/WebP) + noise discret.
- A11y: focus ring vizibil, fără „outline: none”; verificare contrast pentru text și stări (hover/focus/disabled); evită mișcări mari/flash; păstrează hit-area minimă pentru butoane.
