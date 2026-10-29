# Provocarea săptămânală (liga) · cerințe

- **Stare:** cerințele pop-up-ului sunt **confirmate** (2026-10-29). **Fazele 1 (înscrierea), 2 (motorul de XP cu multiplicatorul de nivel) și 3 (clasamentul) implementate** (2026-10-29), vezi secțiunile 13 și 14; treptele, grupele, promovările și rezumatul de luni (faza 4) sunt **documentate cu valori propuse** în secțiunea 15 și nu sunt implementate. Elementul de **complexitate** (nivelurile mai înalte aduc mai multe puncte) a fost adăugat și **confirmat** la 2026-10-29, inclusiv valorile multiplicatorilor (secțiunea 10).
- **Legat de:** `features backlog.md`, feature 6
- **Despre ce este vorba:** o competiție săptămânală între utilizatori (liga), la care fiecare utilizator se poate **înscrie**. Acest document descrie deocamdată fereastra de înscriere (pop-up) și deciziile deschise. Regulile ligii (XP, trepte, promovări) sunt rezumate la final și vor fi detaliate separat.

## 1. Cerința confirmată de client

> La prima autentificare, utilizatorul primește un pop-up în care este întrebat dacă vrea să se înscrie la provocarea săptămânală. În pop-up există o casetă „skip reminders” care, bifată, face ca pop-up-ul să nu mai fie afișat în viitor.

## 2. Poveste de utilizator

Ca utilizator autentificat, vreau să fiu întrebat o dată, politicos, dacă vreau să particip la provocarea săptămânală, și să pot spune „nu mai întreba”, ca să nu fiu deranjat la fiecare autentificare.

## 3. Cerințe funcționale

| ID | Cerință | Origine |
|---|---|---|
| WL-1 | La **prima autentificare** a unui cont, după ce pagina principală s-a încărcat, se afișează un pop-up cu întrebarea dacă utilizatorul vrea să se înscrie la provocarea săptămânală. | confirmată |
| WL-2 | Pop-up-ul conține o casetă **„skip reminders”** (în interfață: „Nu-mi mai aminti”). Dacă este bifată când utilizatorul închide pop-up-ul, acesta **nu mai este afișat niciodată** pentru acel cont. | confirmată |
| WL-3 | Dacă utilizatorul **nu** bifează caseta și închide pop-up-ul („Nu acum”), pop-up-ul se afișează din nou la o autentificare ulterioară, dar **cel mult o dată pe zi** (în ziua locală a utilizatorului). | confirmată (2026-10-29) |
| WL-4 | Dacă utilizatorul alege „Da, mă înscriu”, se înscrie la provocare și pop-up-ul nu se mai afișează. | confirmată (2026-10-29) |
| WL-5 | Un utilizator care a ales „nu mai aminti” se poate înscrie oricând mai târziu din pagina principală (cardul „Liga ta” și setările profilului). | confirmată (2026-10-29) |
| WL-6 | Un utilizator înscris se poate retrage oricând; retragerea nu reactivează pop-up-ul. | confirmată (2026-10-29) |
| WL-7 | Înscrierea cere un **nume afișat** și un **avatar emoji**, completate în pasul 2 al aceluiași pop-up, cu nume preîncărcat din adresa de email. Ceilalți utilizatori văd doar numele, avatarul, XP-ul și treapta; niciodată răspunsurile. | confirmată (2026-10-29) |
| WL-8 | Starea „nu mai aminti” se păstrează **pe cont** (pe server), deci este valabilă pe toate dispozitivele. | confirmată (2026-10-29) |
| WL-9 | Conturile existente (inclusiv cele create înainte de lansarea ligii) primesc pop-up-ul la prima autentificare după lansare. | confirmată (2026-10-29) |
| WL-10 | **Liga pornește de la zero:** XP-ul se calculează doar din răspunsurile date **după lansare**; răspunsurile anterioare nu se numără. | confirmată (2026-10-29) |
| WL-11 | **Complexitate:** temele de nivel B1 primesc **mai multe puncte** decât cele de A1–A2. XP-ul unui răspuns se înmulțește cu un **multiplicator de nivel** al temei (secțiunea 10). | confirmată (2026-10-29) |
| WL-12 | Multiplicatorul se aplică **pe fiecare răspuns**, după multiplicatorul modului de exercițiu; în „Repetiția de azi” fiecare întrebare folosește multiplicatorul propriei teme. | confirmată (2026-10-29) |
| WL-13 | Bonusurile fixe (sesiune terminată, prima sesiune a zilei) **nu** se înmulțesc. | confirmată (2026-10-29) |
| WL-14 | Plafonul zilnic moale se măsoară în **puncte de bază**, înainte de multiplicator. | confirmată (2026-10-29) |
| WL-15 | Multiplicatorul aplicat se **salvează pe fiecare eveniment XP**; schimbarea ulterioară a nivelului unei teme nu recalculează XP-ul deja acordat. | confirmată (2026-10-29) |
| WL-16 | Multiplicatorul se stabilește **pe server** (nu în browser); `build.py` verifică că fiecare temă din `content/` are un nivel cunoscut. | confirmată (2026-10-29) |
| WL-17 | O temă poate avea opțional câmpul `xpMultiplier` în fișierul ei JSON, care suprascrie valoarea derivată din nivel. | confirmată (2026-10-29) |
| WL-18 | **Transparență:** multiplicatorul se vede în interfață (insignă „×2 XP” pe cardul temei și în antetul testului; la rezultate, descompunerea XP-ului). | confirmată (2026-10-29) |

## 4. Reguli de afișare

- Pop-up-ul se afișează **numai pentru conturi autentificate** (în modul local, fără cont, ligile nu există).
- Se afișează pe pagina principală, **după** încărcarea datelor contului, ca să nu apară unui utilizator deja înscris sau care a ales „nu mai aminti”. Fără conexiune la server, nu se afișează.
- Nu se afișează în timpul unui test, pe ecranul de autentificare sau peste alt dialog.
- „Autentificare” înseamnă o conectare nouă (parolă introdusă), nu simpla redeschidere a paginii cu sesiunea păstrată.
- **Cel mult o dată pe zi:** dacă pop-up-ul s-a afișat deja în ziua locală curentă (după `league_prompted_at`), nu se mai afișează până a doua zi, chiar dacă utilizatorul se reconectează.
- Eticheta casetei în interfață este în română: **„Nu-mi mai aminti”**.
- Starea (înscris / nu mai aminti) se citește de pe server, deci decizia este valabilă pe toate dispozitivele.

## 5. Conținut propus pentru pop-up

- **Titlu:** „Vrei să participi la provocarea săptămânală?”
- **Text:** „Aduni XP din teste și te compari cu colegii într-un clasament de luni până duminică. Ceilalți văd doar numele, avatarul și XP-ul tău. Te poți retrage oricând.”
- **Butoane:** **Da, mă înscriu** (principal) · **Nu acum** (secundar).
- **Casetă:** „Nu-mi mai aminti” (nebifată implicit).
- **Pas 2 (după „Da”):** nume afișat, selector de avatar, buton „Gata”.

## 6. Cerințe de interfață și accesibilitate

- Dialog modal cu `role="dialog"`, `aria-modal`, titlu asociat, focus mutat în dialog și blocat în el, revenire a focusului la închidere.
- **Esc**, atingerea fundalului și butonul „Nu acum” înseamnă „Nu acum” (fără să seteze „nu mai aminti”, decât dacă e bifat).
- Pe telefon (iPhone 17 / 17 Pro Max): foaie ancorată jos, cu respectarea zonei sigure; ținte tactile de minimum 44 px, inclusiv caseta și eticheta ei.
- Text în română; contrast și dimensiuni ca în restul aplicației; respectă reducerea mișcării.

## 7. Date (propunere)

Tabel `profiles` (un rând pe utilizator, vizibil doar utilizatorului pentru câmpurile de preferințe):

| Câmp | Rol |
|---|---|
| `display_name`, `avatar` | identitatea în ligă |
| `league_registered` | utilizatorul este înscris |
| `league_prompt_skip` | „nu mai aminti” bifat |
| `league_prompted_at` | ultima afișare, pentru statistică și eventuale limite |

Politici de securitate pe rânduri: fiecare utilizator citește și modifică doar propriul rând; numele și avatarul sunt citite de ceilalți doar dacă `league_registered` este adevărat.

## 8. Criterii de acceptare

1. **Dat** un cont nou, **când** se autentifică prima dată, **atunci** apare pop-up-ul.
2. **Dat** pop-up-ul deschis, **când** utilizatorul bifează „Nu-mi mai aminti” și apasă „Nu acum”, **atunci** pop-up-ul nu mai apare la nicio autentificare viitoare, pe niciun dispozitiv.
3. **Dat** pop-up-ul deschis, **când** utilizatorul apasă „Nu acum” fără bifă, **atunci** pop-up-ul apare din nou la o autentificare din **ziua următoare** (nu în aceeași zi).
4. **Dat** pop-up-ul deschis, **când** utilizatorul alege „Da” și completează pasul 2, **atunci** este înscris și nu mai vede pop-up-ul.
5. **Dat** un utilizator care a ales „nu mai aminti”, **când** deschide pagina principală, **atunci** poate totuși să se înscrie din cardul „Liga ta”.
6. **Dat** un utilizator deja înscris, **când** se autentifică, **atunci** pop-up-ul nu apare.
7. **Dat** fără conexiune sau fără cont, **când** se deschide aplicația, **atunci** pop-up-ul nu apare.
8. Pop-up-ul se poate folosi complet de la tastatură și pe iPhone, fără depășiri de ecran.
9. **Dat** pop-up-ul afișat deja azi și închis cu „Nu acum” fără bifă, **când** utilizatorul se reconectează în aceeași zi, **atunci** pop-up-ul nu apare.
10. **Dat** un cont existent creat înainte de lansare, **când** se autentifică după lansare, **atunci** primește pop-up-ul (dacă nu este înscris și nu a bifat „nu mai aminti”).
11. **Dat** lansarea ligii la momentul L, **când** se calculează XP-ul, **atunci** se numără doar răspunsurile date după L.
12. **Dat** același număr de răspunsuri corecte, de același tip, **când** sunt date la o temă B1 și la una A1–A2, **atunci** XP-ul din răspunsuri la B1 este mai mare (de 2 ori, cu valorile propuse).
13. **Dat** o sesiune „Repetiția de azi” cu teme de niveluri diferite, **când** se calculează XP-ul, **atunci** fiecare răspuns folosește multiplicatorul propriei teme.
14. **Dat** un eveniment XP deja acordat, **când** nivelul temei se schimbă ulterior, **atunci** evenimentul își păstrează multiplicatorul.
15. **Dat** o sesiune terminată, **când** se afișează rezultatele, **atunci** XP-ul este descompus (puncte de bază, multiplicator de nivel, bonusuri fixe).
16. **Dat** un test la o temă cu multiplicator mai mare de 1, **când** se afișează cardul temei și antetul testului, **atunci** apare insigna cu multiplicatorul (de ex. „×2 XP”).
17. **Dat** o temă fără nivel recunoscut, **când** se rulează `build.py`, **atunci** construirea se oprește cu un mesaj clar.

## 9. Decizii confirmate (2026-10-29)

Toate cele șase întrebări deschise au primit răspunsul recomandat.

| # | Întrebare | Decizie |
|---|---|---|
| 1 | La fiecare autentificare sau cel mult o dată pe zi (când nu e bifat „nu mai aminti”)? | **cel mult o dată pe zi** (WL-3) |
| 2 | „Nu mai aminti” se păstrează pe cont (peste dispozitive) sau pe dispozitiv? | **pe cont** (WL-8) |
| 3 | Eticheta în interfață: „Nu-mi mai aminti” sau „skip reminders” ca în cerere? | **română: „Nu-mi mai aminti”** (WL-2) |
| 4 | Conturile existente (3 acum) primesc pop-up-ul la următoarea autentificare? | **da** (WL-9) |
| 5 | Numele afișat și avatarul se cer în pop-up sau pe o pagină de profil? | **în pop-up, pasul 2** (WL-7) |
| 6 | Răspunsurile de până acum se numără în XP (backfill) sau liga pornește de la zero? | **de la zero**, doar răspunsurile de după lansare (WL-10) |

## 10. Complexitate: nivelurile mai înalte aduc mai multe puncte

**Cerința (2026-10-29):** temele de nivel B1 trebuie să primească mai multe puncte decât cele de A1–A2. Principiul și valorile de mai jos sunt **confirmate** (2026-10-29).

### 10.1 Formula

`XP răspuns = rotunjire( XP de bază × multiplicator mod × multiplicator nivel )`

- **XP de bază:** 10 la o întrebare nouă, 15 la una scadentă, +5 comeback (rămân ca în secțiunea 11).
- **Multiplicator mod:** ×1 „alege”, ×1,5 „scrie”, ×2 „scrie + caz”.
- **Multiplicator nivel:** din tabelul de mai jos, după nivelul temei din care vine întrebarea. Rotunjirea se face pe fiecare răspuns (jumătățile în sus), iar rezultatul se salvează ca număr întreg.
- Bonusurile fixe (+20 sesiune terminată, +10 prima sesiune a zilei) **nu** se înmulțesc (WL-13).
- Plafonul zilnic moale de 400 se măsoară în **puncte de bază**, înainte de multiplicatorul de nivel (WL-14). Astfel, cine lucrează la teme grele rămâne răsplătit și după plafon (până la 800 XP pe zi la B1).

### 10.2 Valori confirmate

| Nivelul temei | Multiplicator | Teme actuale |
|---|---|---|
| A1, A1–A2 | **×1,0** | Der, die sau das? (200), Prepoziții cu caz fix, Prezentul verbelor neregulate |
| A2 | **×1,25** | Wo? sau Wohin?, Perfekt: participiul, Indikativ Perfekt |
| A2–B1 | **×1,5** | Verbe neregulate · Perfekt, Verbe cu prepoziții |
| B1 | **×2,0** | Der, die sau das? (B1) |
| B1–B2 | ×2,5 | (viitor) |
| B2 | ×3,0 | (viitor) |

Un nivel care lipsește din tabel oprește construirea (criteriul 17), ca să nu primească din greșeală ×1.

### 10.3 Exemplu

O sesiune de 20 de întrebări cu 15 răspunsuri corecte la „alege” (8 scadente × 15 + 7 noi × 10 = **190 XP de bază**), plus +20 pentru sesiune și +10 pentru prima sesiune a zilei:

| Tema | XP răspunsuri | + bonusuri | Total |
|---|---|---|---|
| A1–A2 (×1,0) | 190 | 30 | **220** |
| A2 (×1,25) | 243 | 30 | **273** |
| A2–B1 (×1,5) | 289 | 30 | **319** |
| B1 (×2,0) | 380 | 30 | **410** |

Rotunjirea se face pe fiecare răspuns (de exemplu 15 × 1,25 = 18,75 → 19 și 10 × 1,25 = 12,5 → 13), de aceea totalurile nu sunt exact 190 × multiplicatorul.

La „Repetiția de azi”, care amestecă teme, fiecare răspuns folosește multiplicatorul temei lui (WL-12).

### 10.4 Date și implementare

- Tabel pe server `topic_levels(topic_id, level, multiplier)`, cu rândurile generate din `content/*.json` (de exemplu printr-o comandă a `build.py` care scrie migrarea), ca să nu apară neconcordanțe între conținut și server.
- Pe fiecare eveniment XP se salvează `level_multiplier`, pe lângă `xp` (WL-15).
- Câmpul opțional `xpMultiplier` dintr-un fișier de temă are prioritate față de tabel (WL-17); `build.py` îl validează (număr între 0,5 și 5).
- Interfața: insigna „×N XP” pe cardul temei, în antetul testului și la rezultate, cu descompunerea „Bază 190 · Nivel B1 ×2 = 380 XP” (WL-18).

### 10.5 Riscuri și atenuări

- **Cei avansați domină clasamentul.** Atenuări: multiplicator moderat (maximum ×2 pentru B1, față de ×1 la A1–A2), trepte și grupe separate în ligă, comparația cu propria săptămână anterioară pentru cine e singur în grupă.
- **Evitarea temelor ușoare.** Repetarea spațiată cere și temele ușoare; punctele de bază pentru întrebările scadente (15 față de 10) rămân un motiv să le reiei.
- **Conținut cu nivel greșit.** Nivelul vine din `level` din fișierul temei; o greșeală se corectează la sursă, iar evenimentele vechi rămân neschimbate (WL-15).

### 10.6 Decizii confirmate (2026-10-29)

| # | Întrebare | Decizie |
|---|---|---|
| 1 | Valorile multiplicatorilor (×1 / ×1,25 / ×1,5 / ×2) | **cele din tabelul 10.2** |
| 2 | Plafonul zilnic măsurat în puncte de bază | **da** (WL-14) |
| 3 | Bonusurile fixe nu se înmulțesc | **da** (WL-13) |
| 4 | Insigna „×N XP” vizibilă în interfață | **da** (WL-18) |
| 5 | Suprascriere pe temă cu `xpMultiplier` | **da, opțional** (WL-17) |
| 6 | O dificultate pe întrebare (în afara nivelului temei) | **nu acum**, eventual într-o etapă ulterioară |

## 11. Rezumatul ligii (context, de detaliat)

- **XP** pentru răspunsuri corecte: 10 la întrebări noi, 15 la cele scadente, ×1,5 la „scrie”, ×2 la „scrie + caz”, +5 comeback, **apoi ×multiplicatorul de nivel (secțiunea 10)**, plus bonusuri fixe: +20 la terminarea unei sesiuni de cel puțin 10 întrebări cu minimum 60%, +10 la prima sesiune a zilei; plafon zilnic moale de 400 puncte de bază.
- **Săptămâna:** luni–duminică, Europe/Bucharest. **Trepte:** A1 Anfänger → A2 Entdecker → B1 Profi → B2 Meister; primii 3 promovează, ultimii 3 retrogradează (doar în grupe de cel puțin 8). Cu un singur utilizator se folosește comparația cu propria săptămână anterioară.
- **Decizii încă deschise:** denumirile treptelor, mărimea grupului, vizibilitatea acurateței, XP mai mare la „scrie”, o eventuală recompensă reală.

## 12. În afara acestui document

Calculul XP, clasamentul, promovările, ecranele ligii și mesajele săptămânale rămân de documentat și implementat în pașii următori.

## 13. Stare implementare

### Faza 1 · înscrierea (implementat, 2026-10-29)

| Cerință | Stare |
|---|---|
| WL-1 pop-up la prima autentificare | făcut: apare după o conectare nouă, pe pagina principală, după ce profilul s-a încărcat de pe server |
| WL-2 „Nu-mi mai aminti” | făcut: bifat, la „Nu acum”, Esc sau atingerea fundalului, pop-up-ul nu mai apare niciodată |
| WL-3 cel mult o dată pe zi | făcut: se compară ziua locală a ultimei afișări (`league_prompted_at`) |
| WL-4 înscriere prin „Da, mă înscriu” | făcut: pasul 2 (nume și avatar), apoi „Gata” |
| WL-5 înscriere ulterioară | făcut: cardul „Liga ta” de pe pagina principală (buton „Înscrie-te”) |
| WL-6 retragere | făcut: „Retrage-te” din card; setează și „nu mai aminti”, deci pop-up-ul nu revine |
| WL-7 nume și avatar | făcut: nume de 2–24 de caractere (preîncărcat din email), 12 avataruri emoji; „Editează profilul” din card |
| WL-8 pe cont | făcut: se salvează în tabelul `profiles`, citit la fiecare conectare |
| WL-9 conturi existente | făcut: orice cont fără rând în `profiles` primește pop-up-ul la prima conectare după lansare |
| WL-10…WL-18 XP, complexitate | făcut în faza 2, vezi mai jos |

**Detalii tehnice**
- Tabelul `profiles` (migrarea `profiles_for_weekly_league`): `display_name`, `avatar`, `league_registered`, `league_prompt_skip`, `league_prompted_at`, `registered_at`; reguli de securitate pe rânduri: fiecare utilizator citește și scrie doar propriul rând; constrângeri în bază (nume 2–24 de caractere, înscrierea cere nume și avatar).
- Citirea numelor și avatarelor celorlalți utilizatori vine cu clasamentul, printr-o funcție dedicată; până atunci nimeni nu vede profilul altcuiva.
- Salvările trec prin coada de trimitere a aplicației, deci funcționează și fără conexiune și se retrimit; dacă la conectare serverul nu răspunde, pop-up-ul nu se afișează (criteriul 7).
- Pop-up-ul este un `<dialog>` nativ (focus blocat, Esc, revenire a focusului); pe telefon apare ca foaie ancorată jos, cu zona sigură respectată și ținte de cel puțin 44 px.
- Pop-up-ul așteaptă pagina principală: dacă datele sosesc în timpul unui test, apare când utilizatorul revine acasă.

**Verificare (backend simulat, fără rețea reală):** criteriile 1–9 (pop-up nou, „Nu acum” cu și fără bifă, aceeași zi / ziua următoare, înscriere cu validarea numelui, editare, retragere, cont existent înscris, fără conexiune, în timpul unui test); aspectul pe desktop și pe ecran de 402×874 (fără depășiri, ținte ≥ 44 px, câmpuri de 16 px); regulile din baza de date (două conturi de test, anulate după verificare); toate cele 2083 de răspunsuri din teme au fost acceptate ca înainte.
**Neverificat:** criteriile 10, 15, 16 și 17 țin de XP și de multiplicator (faza următoare); conectarea reală cu un cont din Supabase și Safari pe un iPhone real.

### Faza 2 · motorul de XP (implementat, 2026-10-29)

| Cerință | Stare |
|---|---|
| WL-10 liga pornește de la zero | făcut: tabelul `league_config.launch_at` (momentul lansării, 2026-10-29 08:34 UTC); se numără doar răspunsurile date după el |
| WL-11 B1 > A1–A2 | făcut: multiplicatorul de nivel A1–A2 ×1,0 · A2 ×1,25 · A2–B1 ×1,5 · B1 ×2,0 |
| WL-12 pe fiecare răspuns | făcut: calculul se face pe fiecare răspuns, după tema lui (și în „Repetiția de azi”) |
| WL-13 bonusuri fixe neînmulțite | făcut: +20 și +10 se acordă la terminarea sesiunii, fără multiplicatori |
| WL-14 plafon în puncte de bază | făcut: primele 400 de puncte (după multiplicatorul modului, înainte de cel de nivel) pe zi contează întregi, restul 25% |
| WL-15 multiplicator pe eveniment | făcut: `xp_events.level_mult` (și `mode_mult`, `base_points`, `counted_points`) se salvează pe fiecare punctaj |
| WL-16 pe server, validat | făcut: tabelul `topic_levels`; `build.py` calculează multiplicatorii, oprește construirea la un nivel necunoscut și generează `supabase/topic_levels.sql` |
| WL-17 `xpMultiplier` | făcut: câmp opțional în fișierul temei, validat (0,5–5) |
| WL-18 transparență | făcut: insigna „×N XP” pe cardul temei și în antetul testului; descompunerea la rezultate („Cum s-a calculat”) |

**Cum se calculează (server, în baza de date)**
- Baza unui răspuns corect: **10** la o întrebare nouă, **15** la una scadentă, **5** la o reluare înainte de scadență; **+5** dacă răspunsul anterior la ea a fost greșit (revenire). Apoi × modul (alege 1, scrie 1,5, scrie + caz 2), plafonul zilnic și × multiplicatorul de nivel; rotunjire pe fiecare răspuns.
- Scadența se reconstituie pe server din răspunsurile anterioare ale utilizatorului, cu aceleași cutii și intervale ca în aplicație (0, 1, 3, 7, 14, 30 de zile), deci nu depinde de ce spune browserul.
- Răspunsurile greșite sau „Nu știu” nu aduc XP. Nu se acordă XP pentru răspunsuri date înainte de lansare, mai vechi de 48 de ore sau din viitor.
- Bonusuri la terminarea sesiunii: **+20** (minimum 10 răspunsuri, minimum 60% corecte) și **+10** la prima sesiune terminată a zilei (cel puțin un răspuns). Ziua și săptămâna sunt cele din Europe/Bucharest, săptămâna începe luni.
- XP-ul se calculează pentru toate conturile; în clasament vor apărea doar cele înscrise.

**În aplicație:** la rezultate apare blocul „Puncte XP” (total și detalii; dacă nu ești conectat la server, un mesaj că punctele apar după sincronizare); cardul „Liga ta” arată XP-ul de azi, din săptămâna aceasta și din săptămâna trecută; temele cu multiplicator mai mare de 1 au insigna „×N XP” (doar pentru cei cu cont).

**Decizii luate la implementare, confirmate la 2026-10-29 (nu erau în cerințele inițiale):**
1. O reluare a unei întrebări **înainte de scadență** valorează 5 puncte de bază, ca să nu merite repetarea acelorași întrebări ușoare. **Confirmat.**
2. „Prima sesiune a zilei” = prima sesiune **terminată** a zilei, cu cel puțin un răspuns; bonusul se acordă o singură dată pe zi. **Confirmat.**
3. Plafonul zilnic se aplică după multiplicatorul modului și înainte de cel de nivel. **Confirmat.**
4. O temă necunoscută serverului primește ×1: după orice schimbare de temă sau de nivel trebuie rulat `supabase/topic_levels.sql` (generat de `build.py`). **Confirmat** ca procedură.

**Verificare:** regulile de XP au fost testate direct pe baza de date, cu conturi de test anulate după aceea: răspuns nou 10, reluare înainte de scadență 5, revenire 20, reluare scadentă 15, B1 ×2 = 20, „scrie” A2 = 19, „scrie + caz” A2–B1 = 30, răspuns greșit / înainte de lansare / mai vechi de 48 h / din viitor = fără XP, livrare dublă = un singur punctaj, plafon (după 400 de puncte: 3 și 5 XP), bonusurile de sesiune (+20 și +10, o singură dată), un utilizator nu vede și nu poate scrie punctajele altuia; interfața a fost testată cu backend simulat (insigne, chip în antet, rezultate, card, sesiune amestecată, 0 XP, fără conexiune), pe desktop și la 402×874.
**Neverificat:** un test cu cont real din Supabase și Safari pe iPhone.

## 14. Clasamentul (faza 3)

### Cerințe

| ID | Cerință | Stare |
|---|---|---|
| WL-19 | Clasament **săptămânal** al celor înscriși, după XP, de luni până duminică (Europe/Bucharest). | făcut |
| WL-20 | Clasamentul îl văd și în el apar **doar cei înscriși**. Se arată doar numele, avatarul, XP-ul, locul și schimbarea față de săptămâna trecută; niciodată e-mailul, identificatorul sau răspunsurile. | făcut |
| WL-21 | La egalitate de XP decide **acuratețea** săptămânii, apoi cine a ajuns **primul** la scor, apoi numele. | făcut |
| WL-22 | Cardul „Liga ta” arată locul („Locul 2 din 5”), XP-ul săptămânii, diferența până la locul următor (sau avansul, dacă ești primul), timpul rămas din săptămână, vecinii din clasament (±2) și butonul „Clasament complet”. | făcut |
| WL-23 | Ecranul „Clasament săptămânal”: lista completă cu medalii pentru primele 3 locuri, rândul tău evidențiat, săgeți ▲ ▼ – față de săptămâna trecută (cu text pentru cititoare de ecran), perioada săptămânii, buton „Actualizează” și explicația „Cum se calculează XP-ul”. Are intrare în istoric (gestul „înapoi”). | făcut |
| WL-24 | **Mod solo:** dacă ești singurul înscris, te compari cu propria săptămână anterioară (XP și procent; „prima ta săptămână” dacă nu ai avut XP). | făcut |
| WL-25 | Clasamentul se actualizează la conectare, după fiecare sesiune terminată și după înscriere; fără conexiune sau la eroare apare un mesaj, fără să se strice restul paginii. | făcut |
| WL-26 | Cei înscriși fără XP în săptămână apar la sfârșitul listei. | făcut |

### Cum funcționează
- O funcție pe server (`league_standings`) calculează clasamentul și întoarce doar datele permise. O pot apela doar utilizatorii autentificați, iar cine nu este înscris primește un răspuns gol („nu ești înscris”).
- Locul din săptămâna trecută se calculează între cei care au avut XP atunci; cine nu a avut nu are săgeată.
- Ziua și săptămâna sunt cele din Europe/Bucharest; „timpul rămas” vine de la server (luni 00:00, ora României).

### Decizii luate la implementare, confirmate la 2026-10-29
1. Deocamdată există **o singură grupă** pentru toți cei înscriși; grupele pe trepte vin cu promovările (faza 4). **Confirmat.**
2. Clasamentul **nu se actualizează în timp real**: se reîncarcă la evenimentele din WL-25 sau cu „Actualizează”. **Confirmat.**
3. Cei înscriși cu 0 XP **se văd** în listă, la sfârșit. **Confirmat.**
4. Vizibilitate reciprocă: clasamentul îl vede **doar cine este înscris**. **Confirmat.**

### Verificare
- **Pe baza de date**, cu cinci conturi de test anulate după aceea: cine nu e înscris primește „nu ești înscris”; cine e înscris vede doar membrii înscriși (un cont neînscris cu 999 XP nu apare); ordinea 300 XP cu acuratețe 90% înaintea 300 XP cu acuratețe 70%, apoi 50 XP, apoi 0 XP; locurile din săptămâna trecută; nicio informație de identificare în răspuns; „sfârșitul săptămânii” cade în următoarele 7 zile; un apel fără cont este refuzat.
- **În aplicație**, cu backend simulat: locul 2 din 5 cu vecinii și diferența, primul loc, egalitate, mod solo și prima săptămână, eroare de server, utilizator neînscris, înscrierea și retragerea (clasamentul se încarcă / dispare), gestul „înapoi” de pe ecranul clasamentului; desktop și 402×874 (fără depășiri, ținte tactile ≥ 44 px, nume lung tăiat cu „…”); toate cele 2083 de răspunsuri din teme acceptate ca înainte.
- **Neverificat:** un clasament cu mai mulți conturi reale și Safari pe un iPhone.

## 15. Trepte, grupe, promovări și rezumatul de luni (faza 4) · documentat, neimplementat

- **Stare:** cerințe scrise la 2026-10-29, cu valori **propuse** (marcate „propusă”). Nimic din această secțiune nu este implementat. Pornește de la designul discutat (secțiunea 11) și de la clasamentul din faza 3 (secțiunea 14).
- **Scop:** să existe o progresie pe termen lung (treptele) și competiție între utilizatori de ritm asemănător (grupele), cu un moment clar la sfârșitul săptămânii (rezumatul de luni).

### 15.1 Cerințe

| ID | Cerință | Origine |
|---|---|---|
| WL-27 | Există **4 trepte**, cu nume și emoji: 🌱 **A1 Anfänger** → 🧭 **A2 Entdecker** → 🏅 **B1 Profi** → 👑 **B2 Meister**. Treapta ta se vede în cardul „Liga ta” și pe ecranul clasamentului. | propusă |
| WL-28 | Fiecare utilizator înscris are o treaptă. Cine se înscrie începe în **treapta 1** (A1 Anfänger). | propusă |
| WL-29 | Concurezi **doar cu cei din grupa ta** (aceeași treaptă, aceeași grupă). O grupă are cel mult **15** membri, ținta fiind 12. Dacă într-o treaptă sunt mai mult de 15 membri, aceștia se împart în grupe de ~12, echilibrate după XP-ul săptămânii trecute. Sub 15 membri într-o treaptă, există o singură grupă. | propusă |
| WL-30 | Clasamentul din faza 3 (WL-19…WL-26) arată **grupa ta**, nu toți înscrișii; regulile de confidențialitate (WL-20) rămân neschimbate. | propusă |
| WL-31 | La **închiderea săptămânii** se aplică, pe fiecare grupă cu *n* membri: **n ≥ 8**: primii 3 sunt **promovați**, ultimii 3 sunt **retrogradați**; **4 ≤ n ≤ 7**: primul este promovat și nimeni nu este retrogradat; **n < 4**: nimeni nu se mișcă. | propusă (din secțiunea 11) |
| WL-32 | **Prag de activitate:** cine are mai puțin de **50 XP** în săptămână este „inactiv”: nu este promovat și nu este retrogradat. Locul lui în clasament rămâne, dar nu ocupă un loc de promovare sau de retrogradare (locurile trec la următorii activi). | propusă |
| WL-33 | Nu se retrogradează din treapta 1 și nu se promovează din treapta 4 (cine ajunge în top rămâne în treapta 4). | propusă |
| WL-34 | **Închiderea săptămânii** are loc luni la **06:00** (ora României), o singură dată pe săptămână, fără job programat: se face la prima cerere a clasamentului după acea oră și este **idempotentă**. Cele 6 ore sunt o toleranță pentru răspunsurile date fără conexiune și trimise târziu. | propusă |
| WL-35 | Rezultatul fiecărui utilizator pe săptămână (treaptă, grupă, loc, XP, rezultat: promovat / rămas / retrogradat / inactiv) se **păstrează**. Pe ecranul clasamentului apare istoricul ultimelor 12 săptămâni. | propusă |
| WL-36 | **Rezumatul de luni:** după închiderea săptămânii, utilizatorul vede **o singură dată** un card pe pagina principală (nu un pop-up) cu: săptămâna, treapta și locul, XP-ul și comparația cu săptămâna anterioară, rezultatul (promovat / rămas / coborât) și butonul „Vezi clasamentul”; se închide cu „Închide” și nu mai apare pentru acea săptămână. | propusă |
| WL-37 | Textul rezumatului este **încurajator** și diferă după caz (promovat, rămas, coborât, prima săptămână, inactiv, singur în grupă). Nu se afișează formulări de rușinare sau „ultimul loc”. | propusă |
| WL-38 | Dacă în grupă sunt mai puțin de 4 membri sau nu a existat activitate, nu se mișcă nimeni, iar rezumatul compară utilizatorul cu propria săptămână anterioară (ca în modul solo). | propusă |
| WL-39 | Cine se **retrage** iese din grupă la următoarea închidere și își păstrează treapta; la reînscriere revine în treapta pe care o avea. | propusă |
| WL-40 | Cine se înscrie în timpul săptămânii intră imediat într-o grupă a treptei 1 (cu loc liber) și nu poate fi retrogradat în prima săptămână. | propusă |

### 15.2 Rezultatele la închiderea săptămânii (exemple)

| Grupă | Membri activi | Rezultat |
|---|---|---|
| 10 membri, 9 activi | 9 | primii 3 activi sus, ultimii 3 activi jos, ceilalți rămân; cel inactiv rămâne |
| 6 membri | 6 | primul sus; nimeni jos |
| 3 membri (situația actuală: 3 conturi) | 3 | nimeni nu se mișcă; fiecare vede comparația cu săptămâna anterioară |

**Atenție:** cu cele **3 conturi actuale** treptele nu se vor mișca. Competiția cu promovări devine reală de la aproximativ **8 conturi înscrise**; până atunci rămâne clasamentul din faza 3 și modul de comparare cu propria săptămână.

### 15.3 Date și implementare (propuse)

- `league_members(user_id, tier, division, joined_week, protected_until)`: treapta și grupa curentă; păstrează treapta la retragere.
- `league_results(week_start, user_id, tier, division, rank, xp, outcome)`: istoricul rezultatelor.
- `league_recaps` sau câmpul `profiles.league_recap_seen_week`: ce rezumat a fost închis.
- Funcția de clasament își restrânge rezultatele la grupa apelantului; o funcție `league_close_week()` (apelată din funcția de clasament, idempotentă) face împărțirea în grupe, promovările și retrogradările.
- Răspunsurile date după închidere pentru săptămâna încheiată rămân în XP-ul total, dar **nu** mai schimbă rezultatul deja stabilit.

### 15.4 Criterii de acceptare

1. **Dat** un utilizator nou înscris, **atunci** este în treapta „A1 Anfänger”.
2. **Dat** o grupă de 10 membri (9 activi), **când** se închide săptămâna, **atunci** primii 3 activi sunt promovați și ultimii 3 activi sunt retrogradați.
3. **Dat** o grupă de 6 membri, **când** se închide săptămâna, **atunci** doar primul este promovat.
4. **Dat** o grupă de 3 membri, **când** se închide săptămâna, **atunci** nimeni nu se mișcă.
5. **Dat** un membru cu mai puțin de 50 XP, **când** se închide săptămâna, **atunci** nu este nici promovat, nici retrogradat.
6. **Dat** un utilizator în treapta 1 pe ultimele locuri, **atunci** rămâne în treapta 1; un utilizator din treapta 4 în top rămâne în treapta 4.
7. **Dat** că săptămâna s-a încheiat, **când** clasamentul este cerut de mai multe ori după luni 06:00, **atunci** închiderea se face o singură dată.
8. **Dat** o treaptă cu 20 de membri, **atunci** sunt create 2 grupe de câte 10 (echilibrate după XP-ul săptămânii trecute) și fiecare vede doar grupa lui.
9. **Dat** o săptămână încheiată, **când** utilizatorul deschide pagina principală, **atunci** vede rezumatul o singură dată și îl poate închide.
10. **Dat** un utilizator inactiv, **atunci** rezumatul lui este neutru și încurajator.
11. **Dat** un utilizator care se retrage și se reînscrie, **atunci** revine în treapta pe care o avea.
12. Rezumatul și ecranele noi se folosesc de la tastatură și pe iPhone (402×874 și 440×956), fără depășiri.

### 15.5 Întrebări deschise (cu varianta recomandată)

| # | Întrebare | Recomandare |
|---|---|---|
| 1 | Denumirile și numărul treptelor | 4 trepte: A1 Anfänger, A2 Entdecker, B1 Profi, B2 Meister (cu emoji 🌱 🧭 🏅 👑) |
| 2 | Mărimea grupei | maximum 15, țintă 12; o singură grupă sub 15 membri într-o treaptă |
| 3 | Câți promovează / retrogradează | 3 / 3 la ≥ 8 membri; 1 / 0 la 4–7; 0 / 0 sub 4 |
| 4 | Pragul de activitate | 50 XP pe săptămână |
| 5 | Ora închiderii săptămânii | luni 06:00 (ora României), la prima cerere, fără job programat |
| 6 | Forma rezumatului de luni | card pe pagina principală, o dată pe săptămână; fără pop-up și fără e-mail deocamdată |
| 7 | Se afișează și acuratețea în clasament? | nu (rămâne doar pentru departajare) |
| 8 | O recompensă reală (de exemplu masa de echipă pentru locul 1)? | nu, doar insigne și trepte |
| 9 | Retragere și reînscriere | treapta se păstrează |
| 10 | Cu puțini utilizatori, ce facem până la ~8 conturi? | rămâne clasamentul unic din faza 3 și compararea cu propria săptămână |

### 15.6 Riscuri

- **Prea puțini utilizatori:** treptele nu se mișcă; se atenuează cu modul de comparare cu săptămâna anterioară și cu mesaje clare în rezumat.
- **Retrogradarea demotivează:** se aplică doar la grupe de cel puțin 8 și doar celor activi; textele rămân încurajatoare.
- **Răspunsuri trimise târziu fără conexiune:** toleranța de 6 ore (WL-34); după aceea nu mai schimbă rezultatul.
- **Cei avansați au multiplicatori mai mari:** grupele pe trepte îi separă de începători; multiplicatorul maxim rămâne moderat (×2 la B1).
