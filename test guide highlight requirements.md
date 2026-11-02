# Fișa de ghidaj în test, cu evidențierea răspunsului corect · cerințe

- **Stare:** **implementat** (2026-11-02): fazele 1, 2 și 3 (etapa 1, cele 4 teme, inclusiv recapitularea de la mod examen și sesiunile mixte), cu recomandările de la secțiunea 8 aplicate. Etapa 2 (verbele) nu este făcută. Detalii de implementare și verificare: `features backlog.md`, secțiunea 20.
- **Legat de:** `features backlog.md`, feature 20; fișele din `content/*.json` (`guideHtml`), ecranul de test din `src/app.js` (`check`, `reviewHtml`).
- **Despre ce este vorba:** acum fișa de ghidaj a unei teme (de ex. „Prepoziții cu caz fix · articolele”) se vede doar pe pagina temei și pe ecranul „Fișă de recapitulare”. În test nu se vede. Funcția nouă o aduce în test, **după răspuns**, cu **celula corectă din tabel evidențiată**.

## 1. Cererea clientului (cuvintele lui, 2026-11-02)

> Ca utilizator îmi doresc la fiecare test să văd și fișa de ghidaj, de exemplu: „Prepoziții cu caz fix · articolele”. Ca utilizator îmi doresc [să văd] prepoziția sau terminația verbului folosită. Întotdeauna afișează și tabelul cu terminațiile der, die, das, cu highlight pe terminația corectă.

**Poveste de utilizator:** după ce răspund la o întrebare, vreau să văd imediat, în fișă, *unde se află* răspunsul corect (prepoziția folosită și celula cu articolul sau terminația corectă), ca să leg răspunsul de regulă și să-l rețin.

## 2. Decizii confirmate (2026-11-02)

| # | Întrebare | Decizie |
|---|---|---|
| 1 | Când apare fișa în test? | **Doar după răspuns**, în mesajul de verificare. Nu apare deloc în timpul întrebării, deci evidențierea nu dă răspunsul. |
| 2 | La ce teme? | **Etapa 1: temele cu articole și prepoziții** (4 teme, 242 de întrebări): Prepoziții cu caz fix (100), Wo? sau Wohin? (30), Declinarea adjectivului (64), Verbe cu prepoziții (48). Verbele cu tabel de conjugare (Prezent neregulat, modale, Präteritum, reflexive, Perfekt) rămân pentru etapa 2, la cerere. |
| 3 | Ce se evidențiază? | **În fișă**: prepoziția folosită în listă și celula corectă din tabelul cu articolele sau terminațiile. Propoziția din mesaj rămâne ca acum. |

Nota despre „terminația verbului” din cerere: la etapa 1 nu există tabele de conjugare; evidențierea terminațiilor verbale (de ex. `-st` la „du kommst”) intră în etapa 2.

## 3. Cerințe funcționale

| ID | Cerință |
|---|---|
| TG-1 | La o temă din etapa 1, după ce utilizatorul verifică răspunsul (la feedback imediat), sub explicație apare blocul **„Din fișă”**, deschis, fără gest suplimentar. |
| TG-2 | Blocul apare și când utilizatorul apasă „Nu știu” (răspuns sărit), nu doar la răspuns greșit sau corect. |
| TG-3 | Înainte de răspuns **nu** există fișă, buton de fișă sau evidențiere în ecranul întrebării. |
| TG-4 | Blocul conține **partea relevantă a fișei**, nu toată fișa: tabelul potrivit (vezi 4) și, la prepoziții, lista cu grupa prepoziției; sub el un link „Toată fișa” care deschide fișa completă a temei. |
| TG-5 | **Evidențierea:** celula corectă are fundal puternic, chenar și simbolul ✓; capul rândului (cazul) și al coloanei (genul) sunt îngroșate. Nu se bazează doar pe culoare (accesibilitate); cititorul de ecran primește textul „răspunsul corect”. |
| TG-6 | **Prepoziția folosită** este evidențiată în lista ei (de ex. „für” în grupa Akkusativ). |
| TG-7 | La modul „scrie + caz”, blocul arată și cazul corect; evidențierea include rândul cazului. |
| TG-8 | **O singură sursă:** blocul se construiește la rulare din `guideHtml` al temei (tabelele sunt clonate și li se marchează celula). Nu se duplică tabele în date. |
| TG-9 | **Mod examen** (feedback la sfârșit): în recapitulare, fiecare întrebare cu fișă are același bloc, **ascuns implicit** („Vezi în fișă”), deschis implicit la întrebările greșite sau sărite (vezi întrebarea 8.1). |
| TG-10 | **Sesiuni mixte** („Repetiția de azi”, test pe teme amestecate): fiecare întrebare folosește fișa propriei teme; la temele din afara etapei 1 nu apare bloc. |
| TG-11 | Funcționează și fără cont (modul local) și nu afectează XP-ul, progresul sau liga. |
| TG-12 | Pe telefon (iPhone) tabelul încape (defilare orizontală în `tablewrap` dacă e nevoie), fără defilare orizontală a paginii; butonul „Următoarea →” rămâne accesibil cu un gest (vezi 8.2). |
| TG-13 | `build.py` verifică datele noi (secțiunea 6) și oprește construirea dacă o întrebare din etapa 1 nu are celula definită sau dacă celula nu există în fișă. |

## 4. Ce se evidențiază, pe teme

| Temă (întrebări) | Tabelul din bloc | Celula evidențiată | Prepoziția |
|---|---|---|---|
| Prepoziții cu caz fix (100) | tabelul der (m) · das (n) · die (f) · die (pl) × Nominativ/Akkusativ/Dativ | rândul = cazul, coloana = genul substantivului din întrebare; ex. „für den Lehrer” → **Akkusativ × der (m) = den** | cuvântul din etichetă („für”) în lista Akkusativ sau Dativ |
| Wo? sau Wohin? (30) | același tabel | la fel; ex. „unter das Bett” → **Akkusativ × das (n)** | prepoziția din etichetă în lista „Akkusativ + Dativ”; plus mențiunea Wo? → Dativ / Wohin? → Akkusativ |
| Declinarea adjectivului (64) | **doar tabelul potrivit** dintre cele trei (articol hotărât, nehotărât, fără articol) | rândul = cazul, coloana = genul, valoarea = terminația; ex. „Der nette Mann” → **hotărât, Nominativ × der (m) = -e** | nu e cazul |
| Verbe cu prepoziții (48) | lista de prepoziții a fișei (Akkusativ / Dativ / ambele) și, unde există, rândul din tabelul Wo?/Wohin? | prepoziția din răspuns; grupa ei marcată (de ex. „mit” în Dativ) | prepoziția din răspuns |

## 5. Interfață

- Blocul stă **sub „Următoarea →”**, nu între explicație și buton, ca trecerea la întrebarea următoare să rămână la un gest (recomandare, vezi 8.2).
- Titlul blocului: „Din fișă · {titlul fișei}”, de ex. „Din fișă · Prepoziții cu caz fix · articolele”.
- Culori: se păstrează culorile existente ale cazurilor (Akkusativ, Dativ). Evidențierea se vede și în modul întunecat.
- Respectă „reducerea mișcării”; fără animații obligatorii.
- Text în română, cu cuvintele germane marcate `lang="de"`.

## 6. Date (propunere)

Evidențierea cere să știm **celula** fiecărei întrebări. Date existente și lipsuri:

| Temă | Ce există | Ce se adaugă |
|---|---|---|
| Prepoziții cu caz fix, Wo? sau Wohin? | cazul (`extra`), articolul (`answer`), prepoziția (primul cuvânt din `label`) | câmpul **`gen`** (`m`, `n`, `f`, `pl`), necesar pentru că „die” (f sau pl) și „dem” (m sau n) sunt ambigue. Din textul explicației se deduce automat la 111 din 130 de întrebări; **cele 19 rămase se completează manual** (8 la prepoziții cu caz fix, 11 la Wo? sau Wohin?; unele deducții se verifică) |
| Declinarea adjectivului | tipul, cazul și genul sunt în identificator (`adj-def-nom-m-…`) | se scriu explicit în câmpurile `art` (`def`/`ndef`/`non`), `caz`, `gen`, generate o dată din identificator; `build.py` verifică și că terminația din răspuns se potrivește cu celula |
| Verbe cu prepoziții | prepoziția este `answer`, cazul `extra` | nimic |

În `guideHtml` se adaugă marcaje (`data-cell="akk-m"`, `data-prep="für"`, `data-t="def"`) pe celulele tabelelor și pe prepoziții; generatoarele fișelor se actualizează, aspectul fișei rămâne identic. Fără modificări pe server.

## 7. Criterii de acceptare

1. **Dat** o întrebare la „Prepoziții cu caz fix”, **când** răspund și verific, **atunci** sub explicație apare „Din fișă” cu celula corectă evidențiată (de ex. Akkusativ × der (m) = **den**) și „für” marcat în lista Akkusativ.
2. **Dat** aceeași întrebare, **când** o citesc înainte de răspuns, **atunci** nu există fișă sau evidențiere pe ecran.
3. **Dat** că apăs „Nu știu”, **atunci** blocul apare cu răspunsul corect evidențiat.
4. **Dat** o întrebare la „Declinarea adjectivului” (articol nehotărât, Dativ, feminin), **când** verific, **atunci** apare doar tabelul „ein, kein, mein…”, cu celula Dativ × f evidențiată.
5. **Dat** „Wo? sau Wohin?” cu răspunsul „dem”, **atunci** se evidențiază coloana corectă (m sau n, după întrebare), nu ambele.
6. **Dat** o întrebare „die” la plural în Akkusativ, **atunci** se evidențiază coloana „die (pl)”, nu „die (f)”.
7. **Dat** un test în mod examen, **când** se termină, **atunci** în recapitulare fiecare întrebare din etapa 1 are „Vezi în fișă”, deschis la cele greșite.
8. **Dat** „Repetiția de azi” cu teme amestecate, **atunci** blocul apare doar la întrebările din etapa 1, cu fișa temei lor.
9. **Dat** o temă din afara etapei 1 (de ex. „Der, die sau das?”), **atunci** nu apare niciun bloc și testul arată ca înainte.
10. **Dat** un iPhone (375 px), **atunci** tabelul nu produce defilare orizontală a paginii, iar „Următoarea →” se atinge fără defilare lungă.
11. **Dat** o întrebare din etapa 1 fără câmpul `gen` (sau fără celulă potrivită în fișă), **când** rulez `build.py`, **atunci** construirea se oprește cu un mesaj clar.
12. **Dat** că dau un răspuns, **atunci** XP-ul, progresul și clasamentul se calculează exact ca înainte.

## 8. Întrebări deschise, cu recomandări

| # | Întrebare | Recomandare |
|---|---|---|
| 8.1 | La finalul unui test cu feedback la sfârșit (mod examen) lista de recapitulare are zeci de întrebări. Blocul „Din fișă” să fie deschis la toate, închis la toate sau deschis doar la cele greșite? | **Deschis la cele greșite sau sărite, închis la cele corecte** (cu „Vezi în fișă”), ca lista să rămână citibilă. |
| 8.2 | Blocul să stea între explicație și „Următoarea →” sau sub buton? | **Sub buton**: pe telefon, un tabel între explicație și buton ar împinge butonul sub ecran. |
| 8.3 | Să marcăm și răspunsul **greșit ales** de utilizator (de ex. „dem” ales în loc de „den”), cu un chenar roșu pe celula lui, lângă cea corectă? | **Nu în prima versiune.** Ar ajuta, dar cere potrivirea răspunsului cu o celulă fără ambiguitate; se poate adăuga ulterior. |
| 8.4 | Etapa 2: verbele cu tabel de conjugare (cinci teme). Se face după etapa 1? | **Da, după ce etapa 1 e folosită și aprobată**, cu terminația verbului din întrebare marcată în tabel (`-st` la „du kommst”). Se decide separat. |

## 9. Faze propuse

| Faza | Conținut | Observații |
|---|---|---|
| **1. Prepoziții și articole** | marcaje în fișele „Prepoziții cu caz fix” și „Wo? sau Wohin?”, câmpul `gen` (130 de întrebări, 19 manual), blocul „Din fișă” după răspuns, evidențierea celulei și a prepoziției, verificările din `build.py` | acoperă exact exemplul din cerere (tabelul der/die/das) |
| **2. Adjective și verbe cu prepoziții** | tabelul potrivit pentru adjectiv (64 de întrebări), prepoziția în fișa „Verbe cu prepoziții” (48) | refolosește componenta din faza 1 |
| **3. Mod examen și sesiuni mixte** | blocul în recapitulare („Vezi în fișă”), sesiuni cu teme amestecate | poate intra în faza 1 sau 2 |
| **Etapa 2 (separat)** | terminațiile verbelor în tabelele de conjugare | doar la cerere |

## 10. Riscuri

| Risc | Măsură |
|---|---|
| Un `gen` greșit evidențiază celula greșită și învață greșit. | Deducere automată din explicație, verificare manuală la cele 19 incerte, `build.py` verifică celula. |
| Mesajul de după răspuns devine lung pe telefon. | Doar partea relevantă a fișei, nu toată; blocul sub „Următoarea →”. |
| Marcajele din `guideHtml` se pierd la regenerarea fișelor. | Generatoarele fișelor se actualizează și `build.py` verifică prezența celulelor. |

## 11. Etapa 2: terminația verbului în tabelele de conjugare (implementat 2026-11-02)

Aceleași reguli ca la etapa 1 (doar după răspuns, bloc „Din fișă”, mod examen cu „Vezi în fișă”, sesiuni mixte). Ce se evidențiază:

| Temă (întrebări cu bloc) | Tabelul | Evidențiat |
|---|---|---|
| Verbe modale (56 din 64) | tabelul de conjugare | celula formei (de ex. „kannst”), **rândul cu terminațiile** (-st; „möchten” are rând propriu: -est) și coloana persoanei |
| Präteritum: sein, haben, modale (60) | tabelul de conjugare | forma, rândul cu terminațiile („haben și modale”: -te, -test… sau „sein”: —, -st…) și coloana |
| Prezentul verbelor neregulate (31) | tabelul „Schimbare” (a → ä, e → i, e → ie) pentru verbele cu schimbare de vocală; tabelul neregulatelor pentru sein, haben, werden, modale, wissen | pentru schimbarea de vocală: rândul tipului, coloana persoanei și **terminația** (-st, -t); pentru neregulate: forma |
| Verbe reflexive (50 din 60) | tabelul pronumelor (Akkusativ / Dativ) | celula pronumelui (de ex. „mir”) pe rândul cazului și coloana persoanei |
| Indikativ Perfekt, auxiliarul (20 din 70) | haben / sein | forma auxiliarului pe persoană |

- **Linia-rezumat** arată forma și terminația: „können · ihr → konntet · terminația -tet”, „sein · ich → war · fără terminație”.
- **Fără bloc (68 de întrebări):** cele fără persoană: „alege infinitivul” la modale (8), „Cu prepoziție” la reflexive (10) și propozițiile întregi sau ordinea cuvintelor la Indikativ Perfekt (50).
- **Date:** câmpul `pers` pe 217 întrebări (`ich`, `du`, `er`, `wir`, `ihr`, `sie`; „er” = er / sie / es, „sie” = sie / Sie plural); persoana se deduce din explicație sau etichetă, iar la 14 întrebări (subiect substantiv sau „man”) a fost stabilită manual. Rândul din tabel se găsește după `group` (schimbare de vocală, caz) sau după forma răspunsului.
- **Fișe:** s-au adăugat rânduri „Terminație” în tabelele modalelor, Präteritum-ului și schimbării de vocală, o notă despre „musst” / „liest” și rândurile dürfen, wollen, sollen, mögen în tabelul neregulatelor din „Prezentul verbelor neregulate” (lipseau, deși apăreau în întrebări).
- **Telefon:** tabelul de conjugare are 7 coloane; se derulează orizontal automat până la celula corectă, iar prima coloană rămâne fixă.
- **Nu intră:** „Perfekt: participiul” (tabelul lui descrie tipuri de verbe, nu terminații pe persoană), „Verbe neregulate · Perfekt” și celelalte teme.
