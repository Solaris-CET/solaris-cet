## 1. Product Overview
Secțiunea **Tokenomics** explică clar distribuția, utilitatea și dinamica tokenului, folosind un chart interactiv și animații la scroll pentru a crește înțelegerea și încrederea.
Este destinată vizitatorilor (investitori, comunitate) care vor să înțeleagă rapid datele esențiale.

## 2. Core Features

### 2.1 User Roles
Nu este necesară diferențierea de roluri; conținutul este public.

### 2.2 Feature Module
Cerințele sunt acoperite de următoarele pagini:
1. **Home**: intrare în produs, navigație, CTA către Tokenomics.
2. **Tokenomics**: KPI-uri, chart interactiv (distribuție), vesting/timeline, mecanici supply, animații la scroll.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Home | Navigație către Tokenomics | Deschide pagina Tokenomics din meniu/CTA; evidențiază secțiunea în navigația principală. |
| Tokenomics | Rezumat KPI | Afișează valori cheie (ex. total supply, circulating, emissions/burn dacă există) cu unități și explicații scurte. |
| Tokenomics | Chart interactiv distribuție | Vizualizează alocarea pe categorii; permite hover pentru tooltip, click pentru evidențiere/filtrare, legendă cu toggle pe categorii; afișează procent + valoare absolută (dacă există). |
| Tokenomics | Detalii categorii alocare | Prezintă listă/tabel cu fiecare categorie: procent, descriere, lock/vesting (dacă există), note. |
| Tokenomics | Vesting / Timeline | Arată grafic/timeline cu evenimente și ferestre de vesting; permite selectarea unei categorii pentru a vedea programul ei. |
| Tokenomics | Mecanici token (supply) | Explică regulile de mint/burn/emissions (doar dacă sunt definite), într-un format ușor de parcurs (carduri / bullets). |
| Tokenomics | Animații la scroll | Animează intrarea secțiunilor (fade/slide/scale) și numărătoarea KPI; declanșează animațiile o singură dată sau la re-intrare (configurabil). |
| Tokenomics | Stări & accesibilitate | Gestionează stări de încărcare (dacă datele vin async), empty/error; include suport tastatură și texte alternative pentru chart. |

## 3. Core Process
Flux Vizitator:
1. Intri pe Home și vezi CTA/link către Tokenomics.
2. Navighezi la Tokenomics.
3. Parcurgi KPI-urile și secțiunile; animațiile la scroll ghidează atenția.
4. Interacționezi cu chart-ul: hover pentru detalii, click pe legendă pentru a ascunde/afișa categorii, selectezi o categorie pentru a vedea vesting-ul aferent.

```mermaid
graph TD
  A["Home"] --> B["Tokenomics"]
  B --> C["Interacțiune chart: hover/click"]
  C --> D["Selectare categorie -> detalii + vesting"]
  B -->