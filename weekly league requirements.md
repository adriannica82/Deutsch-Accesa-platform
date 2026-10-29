# Provocarea săptămânală (liga) · cerințe

- **Stare:** doar documentat, **neimplementat** (început la 2026-10-29)
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
| WL-3 | Dacă utilizatorul **nu** bifează caseta și închide pop-up-ul („Nu acum”), pop-up-ul se afișează din nou la următoarea autentificare. | presupusă |
| WL-4 | Dacă utilizatorul alege „Da, mă înscriu”, se înscrie la provocare și pop-up-ul nu se mai afișează. | presupusă |
| WL-5 | Un utilizator care a ales „nu mai aminti” se poate înscrie oricând mai târziu din pagina principală (cardul „Liga ta” și setările profilului). | presupusă |
| WL-6 | Un utilizator înscris se poate retrage oricând; retragerea nu reactivează pop-up-ul. | presupusă |
| WL-7 | Înscrierea cere un **nume afișat** și un **avatar emoji**, completate în pasul 2 al aceluiași pop-up, cu nume preîncărcat din adresa de email. Ceilalți utilizatori văd doar numele, avatarul, XP-ul și treapta; niciodată răspunsurile. | presupusă |

## 4. Reguli de afișare

- Pop-up-ul se afișează **numai pentru conturi autentificate** (în modul local, fără cont, ligile nu există).
- Se afișează pe pagina principală, **după** încărcarea datelor contului, ca să nu apară unui utilizator deja înscris sau care a ales „nu mai aminti”. Fără conexiune la server, nu se afișează.
- Nu se afișează în timpul unui test, pe ecranul de autentificare sau peste alt dialog.
- „Autentificare” înseamnă o conectare nouă (parolă introdusă), nu simpla redeschidere a paginii cu sesiunea păstrată.
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
3. **Dat** pop-up-ul deschis, **când** utilizatorul apasă „Nu acum” fără bifă, **atunci** pop-up-ul apare din nou la următoarea autentificare.
4. **Dat** pop-up-ul deschis, **când** utilizatorul alege „Da” și completează pasul 2, **atunci** este înscris și nu mai vede pop-up-ul.
5. **Dat** un utilizator care a ales „nu mai aminti”, **când** deschide pagina principală, **atunci** poate totuși să se înscrie din cardul „Liga ta”.
6. **Dat** un utilizator deja înscris, **când** se autentifică, **atunci** pop-up-ul nu apare.
7. **Dat** fără conexiune sau fără cont, **când** se deschide aplicația, **atunci** pop-up-ul nu apare.
8. Pop-up-ul se poate folosi complet de la tastatură și pe iPhone, fără depășiri de ecran.

## 9. Întrebări deschise (cu varianta recomandată)

| # | Întrebare | Recomandare |
|---|---|---|
| 1 | La fiecare autentificare sau cel mult o dată pe zi (când nu e bifat „nu mai aminti”)? | cel mult o dată pe zi |
| 2 | „Nu mai aminti” se păstrează pe cont (peste dispozitive) sau pe dispozitiv? | pe cont |
| 3 | Eticheta în interfață: „Nu-mi mai aminti” sau „skip reminders” ca în cerere? | română: „Nu-mi mai aminti” |
| 4 | Conturile existente (3 acum) primesc pop-up-ul la următoarea autentificare? | da |
| 5 | Numele afișat și avatarul se cer în pop-up sau pe o pagină de profil? | în pop-up, pasul 2 |
| 6 | Răspunsurile de până acum se numără în XP (backfill) sau liga pornește de la zero? | de la zero, ca startul să fie corect |

## 10. Rezumatul ligii (context, de detaliat)

- **XP** pentru răspunsuri corecte: 10 la întrebări noi, 15 la cele scadente, ×1,5 la „scrie”, ×2 la „scrie + caz”, +5 comeback, +20 la terminarea unei sesiuni de cel puțin 10 întrebări cu minimum 60%, +10 la prima sesiune a zilei; plafon zilnic moale de 400 XP.
- **Săptămâna:** luni–duminică, Europe/Bucharest. **Trepte:** A1 Anfänger → A2 Entdecker → B1 Profi → B2 Meister; primii 3 promovează, ultimii 3 retrogradează (doar în grupe de cel puțin 8). Cu un singur utilizator se folosește comparația cu propria săptămână anterioară.
- **Decizii încă deschise:** denumirile treptelor, mărimea grupului, vizibilitatea acurateței, XP mai mare la „scrie”, o eventuală recompensă reală.

## 11. În afara acestui document

Calculul XP, clasamentul, promovările, ecranele ligii și mesajele săptămânale rămân de documentat și implementat în pașii următori.
