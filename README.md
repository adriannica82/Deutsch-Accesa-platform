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

O întrebare poate avea și o propoziție-exemplu, `ex` (în germană, cu forma cerută în test) și `exRo` (traducerea ei); apar în feedback după răspuns. O temă cu `"requireExample": true` cere exemplul la fiecare întrebare (folosit la temele ale căror întrebări nu sunt propoziții: „Der, die sau das?” și „Verbe cu forme neregulate”).

Temele cu articole și prepoziții pot avea `"guideHighlight"`: `prep-article` (Prepoziții cu caz fix, Wo? sau Wohin?: întrebările au `gen` = `m`/`n`/`f`/`pl`), `adjective` (întrebările au `art` = `def`/`ndef`/`non`, `caz` = `nom`/`akk`/`dat`, `gen`) `prep` (răspunsul este prepoziția; dacă fișa marchează verbele cu `data-v` = id-ul întrebării, `build.py` le cere pe toate și blocul „Din fișă” evidențiază și verbul) sau `partizip` (Partizip II: întrebările au `pat` = rândul din tabelul de tipare `data-t="pat"`, `aux` = `haben`/`sein`, iar „Verbe neregulate · Perfekt” și `ge` = `simple`/`sep`/`insep`, plus `pers` la „Perfekt cu persoană”; verbul din întrebare se caută după `key`, sau după `id` dacă lipsește `key`, într-un `span[data-v]` al rândului). După răspuns, testul arată blocul „Din fișă”, construit din `guideHtml`, cu prepoziția și celula corectă evidențiate; de aceea fișa are marcaje `data-prep`, `data-t`, `data-row`, `data-col`, `data-cell`. `build.py` verifică că fiecare întrebare are celula ei și că articolul/terminația din celulă se potrivește cu răspunsul. Pentru tabelele de conjugare (`"guideHighlight": "conj"`: verbe modale, Präteritum, prezentul verbelor neregulate, verbe reflexive, auxiliarul din Indikativ Perfekt) întrebările au `pers` (`ich`, `du`, `er`, `wir`, `ihr`, `sie`); rândul se găsește după `group` sau după răspuns, iar rândurile cu `data-ends` din fișă dau terminația evidențiată. Întrebările fără `pers` (de ex. „alege infinitivul”) nu au bloc. Detalii: `test guide highlight requirements.md`.
Editează conținutul în `content/` și `src/`, nu în `deutsch.html` (fișier generat).
Progresul se salvează în `localStorage`, doar în browserul folosit.

Timpul de exersare se măsoară ca timp **activ** din teste (se oprește după 90 s fără nicio acțiune și cât timp fila nu este vizibilă) și se afișează în timpul testului, la rezultate și în „Progresul tău” (azi, săptămâna aceasta, pe zile). Durata fiecărei sesiuni se salvează în `sessions.duration_s`.

Butonul **Exportă (.md)** din „Progresul tău” descarcă un raport Markdown (rezumat, pe teme, sesiuni recente, puncte slabe) care conține la sfârșit și datele complete; **Importă** citește acest fișier (și, pentru compatibilitate, vechiul `.json`).

## Aplicația iOS (în lucru)

Aplicația iPhone este un înveliș nativ Capacitor în jurul lui `deutsch.html`, în `ios-app/` (planul și starea: `ios app requirements.md`). Cerințe: Xcode (cu licența acceptată) și Node 22. Nu e nevoie de CocoaPods (Swift Package Manager).

```bash
cd ios-app
npm install
npm run sync   # rulează build.py, copiază deutsch.html ca www/index.html și face cap sync
npm run open   # deschide proiectul în Xcode
```

Identificatorul `ro.deutschrecapp` și numele „Deutsch RecApp” sunt provizorii. `ios-app/` nu se publică pe Vercel (`.vercelignore`).

## Publicare (Vercel)

Proiectul este static: preset „Other”, fără build command, directorul rădăcină `./`. `vercel.json` trimite adresa `/` către `deutsch.html`.

## Liga (provocarea săptămânală)

După o conectare nouă, utilizatorul este întrebat dacă vrea să se înscrie la provocarea săptămânală (cel mult o dată pe zi; caseta „Nu-mi mai aminti” oprește mesajul definitiv). Înscrierea se poate face și din cardul „Liga ta”. Profilul (`profiles`: nume afișat, avatar, înscris, „nu mai aminti”) se salvează în cont. Cerințele complete sunt în `weekly league requirements.md`; XP-ul, clasamentul și treptele sunt descrise mai jos.

### Clasament

Cei înscriși la provocare văd un clasament săptămânal (luni–duminică, ora României) în cardul „Liga ta” și pe ecranul „Clasament săptămânal”. Îl calculează funcția `league_standings` din Supabase și arată doar numele, avatarul, XP-ul și locul; cine e singur în ligă se compară cu propria săptămână anterioară.

### Trepte, grupe și rezumatul de luni

Fiecare înscris are o treaptă (🌱 A1 Anfänger → 🧭 A2 Entdecker → 🏅 B1 Profi → 👑 B2 Meister) și o grupă de cel mult 15 persoane; clasamentul arată doar grupa ta. Luni la 06:00 (ora României), la prima cerere de după, se închide săptămâna: la cel puțin 8 membri primii 3 urcă și ultimii 3 coboară, la 4–7 urcă doar primul, sub 4 nimeni nu se mută; cine are sub 50 XP e „inactiv” și rămâne pe loc. Pe pagina principală apare o dată cardul „Rezumatul săptămânii”, iar ecranul clasamentului păstrează ultimele 12 săptămâni. Logica este în `supabase/schema.sql` (secțiunea 6: `league_sync`, `league_close_week`, `league_standings`); detalii în `weekly league requirements.md`, secțiunea 15.

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
