# Deutsch-Accesa-platform

Platformă offline pentru exersarea limbii germane (A1–B1), cu traduceri și explicații în română,
întrebări cu alegere sau scriere, și repetare spațiată. Rezultatul este un singur fișier HTML.

## Structură

| Cale | Rol |
|---|---|
| `content/*.json` | Temele și întrebările (un fișier per temă) |
| `src/template.html`, `src/style.css`, `src/app.js` | Pagina, stilurile și motorul aplicației |
| `build.py` | Validează conținutul și generează `deutsch.html` |
| `deutsch.html` | Aplicația gata de folosit (deschide-l direct în browser) |
| `test_verbe_prepozitii.html` | Prima versiune: testul „Verbe cu prepoziții” |

## Construire

```bash
python3 build.py          # validează și scrie deutsch.html
python3 build.py --check  # doar validează
```

Fiecare întrebare trebuie să aibă traducere (`ro`) și explicație (`explain`) în română; validarea se oprește dacă lipsesc.
Editează conținutul în `content/` și `src/`, nu în `deutsch.html` (fișier generat).
Progresul se salvează în `localStorage`, doar în browserul folosit.

Timpul de exersare se măsoară ca timp **activ** din teste (se oprește după 90 s fără nicio acțiune și cât timp fila nu este vizibilă) și se afișează în timpul testului, la rezultate și în „Progresul tău” (azi, săptămâna aceasta, pe zile). Durata fiecărei sesiuni se salvează în `sessions.duration_s`.

Butonul **Exportă (.md)** din „Progresul tău” descarcă un raport Markdown (rezumat, pe teme, sesiuni recente, puncte slabe) care conține la sfârșit și datele complete; **Importă** citește acest fișier (și, pentru compatibilitate, vechiul `.json`).

## Publicare (Vercel)

Proiectul este static: preset „Other”, fără build command, directorul rădăcină `./`. `vercel.json` trimite adresa `/` către `deutsch.html`.

## Liga (provocarea săptămânală)

După o conectare nouă, utilizatorul este întrebat dacă vrea să se înscrie la provocarea săptămânală (cel mult o dată pe zi; caseta „Nu-mi mai aminti” oprește mesajul definitiv). Înscrierea se poate face și din cardul „Liga ta”. Profilul (`profiles`: nume afișat, avatar, înscris, „nu mai aminti”) se salvează în cont. Cerințele complete sunt în `weekly league requirements.md`; XP-ul și clasamentul urmează.

### XP și multiplicatori

Punctele XP se calculează **pe server** (triggere în baza de date, vezi `supabase/schema.sql`) din răspunsurile salvate. Multiplicatorul unei teme vine din nivelul ei: A1–A2 ×1 · A2 ×1,25 · A2–B1 ×1,5 · B1 ×2 (tabelul `LEVEL_XP` din `build.py`; un fișier de temă poate avea câmpul opțional `xpMultiplier`). `build.py` oprește construirea la un nivel necunoscut și generează `supabase/topic_levels.sql`: **rulează-l în Supabase după orice schimbare de temă sau de nivel**.

## Mobile (iPhone)

Aplicația este optimizată pentru iPhone 17 (402×874) și iPhone 17 Pro Max (440×956): zone sigure (Dynamic Island, bara de acasă), ținte tactile de minimum 44 px, bară de acțiuni lipită jos în test, fișa de recapitulare ca carduri, gestul „înapoi” de pe iPhone care navighează între ecrane și pictogramă pentru „Adaugă pe ecranul principal” (`src/icon.png`, generată în `deutsch.html` de `build.py`).

## Cont și sincronizare (Supabase)

`config.json` conține adresa proiectului Supabase și **cheia publică** (publishable key; este făcută să fie vizibilă în pagină).
Datele sunt protejate de Row Level Security: fiecare utilizator vede și scrie doar rândurile lui.
Fără `config.json`, aplicația rămâne locală (fără cont, fără cereri de rețea).

| Tabel | Conținut |
|---|---|
| `progress` | Starea repetării spațiate: câte un rând pe utilizator și întrebare |
| `sessions` | Câte un rând pe sesiune: temă, mod, început, sfârșit, scor |
| `answers` | Câte un rând pe răspuns dat, legat de sesiune |

Conturile se creează de administrator în Supabase (Authentication → Users); înregistrarea liberă trebuie oprită
(Authentication → Sign In / Providers → dezactivează „Allow new users to sign up”). Aplicația nu are formular de înregistrare.
