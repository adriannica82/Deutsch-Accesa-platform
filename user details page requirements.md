# Pagina „Datele mele” și meniul utilizatorului (epic) · cerințe

- **Stare:** recomandările din secțiunea 9 **aprobate** (2026-10-30). **Fazele 1 (meniul utilizatorului), 2 („Datele mele” editabile) și 3 (schimbarea parolei) implementate** (2026-10-30), vezi secțiunea 12; faza 4 (opțională) urmează la cerere.
- **Legat de:** `features backlog.md`, secțiunea 9; `admin dashboard requirements.md` (ecranul de administrare rămâne neschimbat, doar se schimbă intrarea în el).
- **Despre ce este vorba:** antetul aplicației primește **un singur element în dreapta, meniul utilizatorului**. Din el se ajunge la o pagină nouă, **„Datele mele”**, la ecranul **Administrare** (doar pentru administratori) și la **Ieși**.

## 1. Cerința inițială

> Pagină cu detaliile utilizatorului. În partea de sus să apară **un singur element** (propune tu ceva). La deschidere trebuie să apară un dropdown cu opțiunile: **Datele mele**, **Administrare** (doar pentru administratori), **Ieși**.

## 2. Situația de pornire

- Antetul are acum, în dreapta: emailul (ascuns pe ecrane mici), starea sincronizării („Sincronizat”, „N de trimis”, „Offline”), butonul **Administrare** (doar administratori), **← Toate temele** (pe ecranele interioare) și **Ieși**. Pe telefon sunt până la trei butoane lângă siglă.
- Datele utilizatorului sunt împrăștiate: **prenumele și numele** se cer o singură dată, la înregistrarea din invitație, și nu se mai pot edita; **numele afișat și avatarul** se editează doar din pop-up-ul ligii; emailul se vede doar în antet; rolul nu se vede nicăieri pentru utilizatorul obișnuit; **parola** nu se poate schimba decât printr-un email de resetare cerut de un administrator.
- Pe pagina principală, cardul „Progresul tău” are butoanele **Exportă (.md)**, **Importă** și **Resetează**.
- Pe server există deja `profiles.first_name`, `last_name` (1–60 de caractere), `display_name` (2–24), `avatar`, iar utilizatorul le poate scrie pe propriul rând; rolul nu poate fi scris de utilizator.

## 3. Elementul de sus: propunerea

**Un „chip” de utilizator** în dreapta antetului, un singur buton care arată cine ești și deschide meniul:

- **Conținut:** avatarul emoji din ligă (sau, dacă nu ai ales unul, un cerc cu prima literă a prenumelui sau a emailului), **prenumele** (se ascunde sub 480 px, rămâne doar cercul) și o săgeată ▾.
- **Starea sincronizării** nu mai e un element separat: un **punct mic** pe chip (verde = sincronizat, portocaliu = date de trimis, gri = offline), explicat în text în capul meniului.
- **Rolul** se vede în capul meniului printr-o insignă „Administrator”, nu pe chip.
- **Siglă clicabilă:** „Deutsch / antrenament” din stânga devine legătură către pagina principală și înlocuiește butonul **← Toate temele** din antet (vezi 9.1).

De ce chip și nu o simplă iconiță: afișează prenumele și avatarul deja existent din ligă, deci utilizatorul vede imediat în ce cont e conectat, iar antetul rămâne curat pe telefon (o singură țintă tactilă de minimum 44 px).

## 4. Meniul (dropdown)

| Zonă | Conținut |
|---|---|
| Cap (nu e clicabil) | Prenume și nume (sau emailul, dacă lipsesc), emailul, insigna „Administrator” (doar pentru administratori), starea sincronizării în cuvinte („Sincronizat” / „2 de trimis” / „Offline”) |
| Opțiunea 1 | **Datele mele** → pagina nouă |
| Opțiunea 2 | **Administrare** → ecranul de administrare existent; **apare doar pentru administratori** (verificarea reală rămâne pe server, ca până acum) |
| Separator | |
| Opțiunea 3 | **Ieși** → deconectarea de acum |

Comportament: se deschide la clic/atingere pe chip; se închide la a doua atingere, la clic în afara lui, la **Esc**, la alegerea unei opțiuni și la schimbarea ecranului. Pe telefon se afișează ca o **foaie ancorată jos** (ca dialogurile existente), pe desktop ca un panou sub chip. Accesibilitate: butonul are `aria-haspopup="menu"` și `aria-expanded`, panoul `role="menu"` cu `menuitem`-uri, săgețile sus/jos mută focusul, Esc readuce focusul pe chip, ținte de minimum 44 px.

## 5. Pagina „Datele mele”

Ecran nou (`account`), cu propria intrare în istoricul browserului și buton **← Înapoi**. Secțiuni:

1. **Profil** — **Prenume** și **Nume** (editabile, 1–60 de caractere, aceleași reguli ca la înregistrare); **Email** (doar citire; se schimbă numai prin administrator); **Rol** (insignă: Utilizator / Administrator); **Cont creat la** și **Ultima autentificare** (din datele contului).
2. **Liga** — **Nume afișat** și **avatar** (editabile aici, aceleași reguli ca în pop-up: 2–24 de caractere, avatar din lista existentă) și starea înscrierii („Înscris la provocarea săptămânală” / „Neînscris”) cu butoanele existente **Înscrie-te** / **Retrage-te**. Pop-up-ul ligii continuă să funcționeze la fel.
3. **Securitate** — **Schimbă parola**: parolă nouă (minimum 8 caractere, „Arată parola”) cu confirmare; dacă sesiunea e mai veche de 24 de ore, Supabase cere reautentificare și aplicația explică în română ce are de făcut (vezi 9.3).
4. **Progresul meu** *(propunere, vezi 9.4)* — butoanele **Exportă (.md)**, **Importă** și **Resetează** se mută din cardul „Progresul tău” aici, ca pagina principală să rămână despre exersare.

Salvarea: butoane „Salvează” pe fiecare secțiune, mesaj de confirmare „Salvat.” sau eroare clară; câmpurile invalide sunt semnalate lângă ele. Modificările de nume afișat și avatar se reflectă imediat în clasament și în chip.

## 6. Cerințe funcționale

| ID | Cerință | Origine |
|---|---|---|
| UD-1 | Antetul conține, pentru un utilizator autentificat, **un singur element în dreapta**: chipul utilizatorului (secțiunea 3). Fără email, stare de sincronizare, **Administrare**, **← Toate temele** sau **Ieși** în afara meniului. | cerută |
| UD-2 | Chipul deschide un meniu cu **Datele mele**, **Administrare** (doar pentru administratori) și **Ieși**. | cerută |
| UD-3 | **Administrare** nu apare pentru conturile care nu sunt administratori; accesul la ecran rămâne verificat pe server (`admin_list_users`). | cerută |
| UD-4 | Meniul se comportă ca în secțiunea 4 (închidere, tastatură, accesibilitate, foaie pe telefon). | propunere |
| UD-5 | Starea sincronizării se vede prin punctul de pe chip și în textul din capul meniului; semnificația „N de trimis / Offline” nu se pierde. | propunere |
| UD-6 | Sigla din stânga duce la pagina principală (înlocuiește „← Toate temele”). | propunere |
| UD-7 | Pagina „Datele mele” arată profilul, liga și securitatea (secțiunea 5) și permite editarea prenumelui, numelui, numelui afișat și avatarului. | cerută / propunere |
| UD-8 | Emailul și rolul se văd, dar **nu se pot modifica** de utilizator. | propunere |
| UD-9 | Utilizatorul își poate schimba parola din pagină; erorile (parolă slabă, sesiune prea veche) au mesaje în română. | propunere |
| UD-10 | Conturile existente fără prenume/nume văd câmpurile goale, cu textul „Completează-ți numele”; nu sunt obligate să le completeze. | propunere |
| UD-11 | În modul local (fără cont, fără Supabase) nu se afișează niciun chip și nicio pagină „Datele mele”. | propunere |
| UD-12 | Ieșirea din cont păstrează comportamentul actual (trimite întâi ce e în coadă, apoi deconectează). | propunere |

## 7. Date și server

- **Fără migrare obligatorie (faza 2 a adăugat totuși un declanșator de protecție, vezi secțiunea 12):** prenumele, numele, numele afișat și avatarul sunt deja coloane scriptibile de utilizator pe propriul rând (`profiles`), cu aceleași verificări. Rolul, `invited_by` și emailul rămân doar pentru server.
- **Datele contului** (data creării, ultima autentificare, email) se citesc din răspunsul `GET /auth/v1/user` al sesiunii curente; nu e nevoie de funcții noi.
- **Schimbarea parolei:** `PUT /auth/v1/user` cu parola nouă (același apel ca la înregistrare). Supabase poate cere reautentificarea pentru sesiuni mai vechi de 24 de ore; în acest caz pagina cere deconectare și reconectare, sau trimite emailul de resetare existent.
- **Interfață:** chip + meniu în antet (`src/template.html`, `src/style.css`), ecran `account` și logica lor în `src/app.js` (modulul „Cont”); butoanele actuale din antet sunt înlocuite, nu duplicate.

## 8. Faze propuse

| Faza | Conținut | Observații |
|---|---|---|
| **1. Meniul utilizatorului** | Chip, dropdown (Datele mele · Administrare · Ieși), siglă clicabilă, punctul de sincronizare, curățarea antetului; „Datele mele” duce deocamdată la o pagină simplă cu emailul și rolul | atinge **toate** ecranele; cere testarea fiecăruia pe desktop și pe 375 px |
| **2. Datele mele** | Profil editabil, liga (nume afișat, avatar, înscriere), „cont creat la / ultima autentificare” | fără server nou |
| **3. Securitate** | Schimbarea parolei | depinde de decizia 9.3 |
| **4. Opțional** | Mutarea Exportă/Importă/Resetează aici, cerere de ștergere a contului | vezi 9.4, 9.5 |

## 9. Decizii deschise (cu recomandări)

| # | Întrebare | Recomandare |
|---|---|---|
| 9.1 | Antetul trebuie să aibă un singur element: ce se întâmplă cu butonul „← Toate temele”? | Sigla devine legătura spre pagina principală; verific la implementare fiecare ecran interior (temă, studiu, rezultate, ligă, administrare) și adaug, unde lipsește, un buton „← Înapoi” în pagină, ca să nu se piardă nicio cale de întoarcere. |
| 9.2 | Chipul: ce arată? | Avatar (sau inițială) + prenume + săgeată, cu punct de sincronizare; pe telefon doar avatarul și săgeata. |
| 9.3 | Schimbarea parolei | Formular în pagină (parolă nouă + confirmare); la sesiune veche, mesaj clar și trimiterea emailului de resetare către propria adresă. Alternativa „doar email de resetare” e mai simplă, dar mai greoaie pentru utilizator. |
| 9.4 | Exportă/Importă/Resetează rămân pe pagina principală sau se mută? | Se mută în „Datele mele”, ca să simplifici pagina principală; pe pagina principală rămân statisticile. |
| 9.5 | Ștergerea contului de către utilizator | **Nu în această fază.** Opțional ulterior: buton „Cere ștergerea contului”, care înregistrează cererea și o vede administratorul (ștergerea rămâne la administrator, ca acum). |
| 9.6 | Poate utilizatorul să-și schimbe emailul? | **Nu**: identitatea vine din invitație; schimbarea o face administratorul (cerere explicită). |
| 9.7 | Prenumele/numele devin obligatorii pentru conturile vechi? | **Nu**: rămân opționale, cu o invitație discretă în pagină (UD-10). |

## 10. Criterii de acceptare (faza 1)

1. Pentru un utilizator autentificat, antetul arată doar sigla și chipul; niciun alt buton nu apare lângă ele, pe niciun ecran.
2. Chipul deschide meniul; **Administrare** apare doar pentru administrator și nu apare pentru utilizatorul obișnuit; **Ieși** deconectează ca până acum.
3. Meniul se închide la clic în afară, la Esc, la schimbarea ecranului și la alegerea unei opțiuni; focusul revine pe chip; funcționează cu tastatura.
4. Punctul de pe chip reflectă starea: sincronizat, date de trimis (cu număr în meniu), offline.
5. Din orice ecran interior se poate reveni la pagina principală (sigla sau butonul din pagină).
6. În modul local nu apare niciun chip.
7. Pe 375 px antetul nu depășește lățimea și țintele au minimum 44 px.
8. Utilizatorul obișnuit nu poate deschide ecranul Administrare nici prin istoricul browserului (comportamentul de acum se păstrează).

Criteriile pentru fazele 2–3 se detaliază după aprobarea acestui document.

## 11. Riscuri

| Risc | Atenuare |
|---|---|
| Antetul e folosit pe toate ecranele; schimbarea poate strica navigarea | Test pe fiecare ecran și pe istoricul browserului (butonul „înapoi”) înainte de commit |
| Pierderea butonului „← Toate temele” | Decizia 9.1; verificare ecran cu ecran |
| Meniul acoperit de dialoguri sau de tastatura de pe telefon | Se închide la deschiderea unui dialog; test pe 375 px |
| Starea sincronizării devine mai puțin vizibilă | Punct colorat + text în meniu (UD-5) |
| Parola schimbată cu o sesiune veche | Mesaj clar și variantă de rezervă prin email (9.3) |

## 12. Stare implementare

### Faza 1 · meniul utilizatorului (implementat, 2026-10-30)

- **Antet:** în dreapta rămâne un singur element, **chipul** (avatar sau inițială, prenume, săgeată ▾, punct de sincronizare). Dispar din antet emailul, textul de sincronizare, **Administrare**, **← Toate temele** și **Ieși**. Sigla „Deutsch / antrenament” este acum un buton către pagina principală (nu face nimic pe ecranul de autentificare, de înregistrare și în timpul unui test).
- **Meniu:** se deschide la clic/atingere; cap cu numele, emailul, insigna „Administrator” (doar administratori) și starea sincronizării în cuvinte; opțiunile **Datele mele**, **Administrare** (ascunsă pentru utilizatorii obișnuiți; accesul real rămâne verificat pe server) și **Ieși**. Se închide la clic în afară, la Esc (focusul revine pe chip), la Tab, la alegerea unei opțiuni și la schimbarea ecranului. Săgeți sus/jos, Home și End mută focusul între opțiuni; atribute `aria-haspopup`, `aria-expanded`, `role=menu`/`menuitem`. Pe ecrane sub 720 px apare ca foaie ancorată jos, cu fundal întunecat; sub 480 px chipul arată doar avatarul.
- **Punctul de sincronizare:** verde (sincronizat), portocaliu (date de trimis, cu numărul în meniu), gri (offline).
- **Decizie la implementare:** în timpul unui test chipul este **ascuns** (testul e un mod concentrat, are propriul buton „← Încheie sesiunea”); apare din nou la rezultate și pe celelalte ecrane. Pe ecranul de autentificare și de înregistrare nu există chip; în modul local (fără cont) nu există chip.
- **Căi de întoarcere (9.1):** tema primește butonul **← Toate temele** în pagină, rezultatele primesc **Toate temele** lângă „Configurează alt test”; ecranele de studiu, ligă, administrare și „Datele mele” aveau/au propriul „← Înapoi”.
- **„Datele mele” (versiune simplă):** ecran nou, cu intrare proprie în istoricul browserului (butoanele „înapoi”/„înainte” funcționează), cu nume, email, rol și nume afișat în ligă, doar citire. Editarea vine în faza 2.
- **Fișiere:** `src/template.html` (antet, ecranul `account`, butoanele de întoarcere), `src/style.css`, `src/app.js` (modulul „Meniul utilizatorului”, `show`, `setSync`, `afterLogin`, `popstate`); regenerat `deutsch.html`. Fără modificări pe server.
- **Verificare (în browser, cu răspunsuri simulate):** antet cu doar sigla și chipul pe desktop și pe 375 px, fără depășire orizontală, țintă de 44 × 44 px; meniul pentru administrator (3 opțiuni) și pentru utilizator obișnuit (2 opțiuni, fără insignă); avatar, respectiv inițială când lipsește; tastatură (săgeți, End, Esc cu revenirea focusului), închidere prin fundal; „Datele mele” și întoarcerea; Administrare din meniu; sigla duce acasă, dar nu scoate din test; temă → înapoi; punct offline/online; ieșirea din cont; istoricul browserului pentru „Datele mele”.
- **Netestat:** butonul „Toate temele” de pe ecranul de rezultate pe un test terminat (verificat doar că există și că are același comportament ca cel din temă), ecranul ligii cu date reale, iPhone real.

### Faza 2 · „Datele mele” editabile (implementat, 2026-10-30)

- **Pagina:** card **Profil** cu prenume și nume editabile (1–60 de caractere, spații curățate, ambele obligatorii la salvare), emailul, rolul, data creării contului și ultima autentificare (citite din `/auth/v1/user`; „—” dacă serverul nu răspunde), cu mențiunea că emailul și rolul se schimbă doar prin administrator. Card **Liga** cu numele afișat (2–24 de caractere) și avatarul (aceleași reguli ca în pop-up), starea înscrierii și butoanele **Salvează**, **Înscrie-te la provocare** / **Retrage-te** (cu confirmare, aceleași efecte ca din cardul „Liga ta”). Conturile fără nume văd „Completează-ți prenumele și numele. Le văd doar administratorii.” și pot continua fără să le completeze (9.7). Modificările apar imediat în chip și în clasament; offline se salvează local și se trimit la revenire, cu mesaj.
- **Server (migrarea `profiles_keep_first_name_phase2`, în `supabase/schema.sql`, secțiunea 11):** declanșator care **interzice ștergerea prenumelui după ce a fost completat**. Motiv: starea „Invitat” din administrare înseamnă „invitat și fără prenume”; fără protecție, un utilizator și-ar fi putut șterge prenumele prin API și ar fi apărut ca „Invitat”, iar „Anulează” ar fi putut șterge contul. Redenumirea rămâne permisă.
- **Fișiere:** `src/template.html`, `src/style.css`, `src/app.js` (modulul „Meniul utilizatorului și Datele mele”), `supabase/schema.sql`; regenerat `deutsch.html`.
- **Verificare:** pe baza reală (tranzacție anulată): prenumele nu poate fi pus pe `null` și nici pe spații, dar poate fi schimbat. În browser (răspunsuri simulate): date inițiale corecte, validări (prenume lipsă, nume lipsă, peste 60, nume afișat sub 2 și peste 24, avatar), salvarea cu normalizarea spațiilor și trimiterea exactă a câmpurilor către server, actualizarea imediată a chipului (nume, avatar), retragerea (cu și fără confirmare) și reînscrierea cu starea și butoanele corecte, cont fără nume (indiciu vizibil), desktop și 375 px fără depășire orizontală.
- **Netestat:** salvarea pe contul real (efectul pe server al noilor coloane în clasament), iPhone real.

### Faza 3 · schimbarea parolei (implementat, 2026-10-30)

- **Pagina:** cardul **Securitate** din „Datele mele”: parolă nouă și repetarea ei (minimum 8, maximum 72 de caractere), „Arată parolele”, buton **Schimbă parola**; câmpurile se golesc după succes. Sub formular, butonul **Trimite-mi un email de resetare** (cu confirmare) către adresa contului, care deschide același ecran „Alege o parolă nouă” ca resetarea cerută de administrator.
- **Cum funcționează:** `PUT /auth/v1/user` cu parola nouă (același apel ca la înregistrare), cu reînnoirea automată a sesiunii. Fără modificări pe server.
- **Mesaje în română pentru:** parolă prea scurtă, parole diferite, parolă slabă sau compromisă (`weak_password`; verificarea listelor de parole compromise există doar pe planul Pro), aceeași parolă ca cea curentă, **sesiune prea veche** (`reauthentication_needed` / 401 / 403: „trebuie să te fi autentificat recent… ieși și intră din nou, sau cere un email de resetare”), schimbarea care cere parola curentă (dacă se activează acea setare în Supabase) și lipsa conexiunii; la emailul de resetare, și limita de cereri (429).
- **Fișiere:** `src/template.html`, `src/app.js` (modulul „Datele mele”); regenerat `deutsch.html`.
- **Verificare (în browser, cu răspunsuri simulate):** toate cazurile de mai sus, trimiterea exactă a parolei, golirea câmpurilor după succes, „Arată parolele”, emailul de resetare (cu și fără confirmare, adresa de redirecționare corectă, mesajul pentru 429), 375 px fără depășire orizontală, butonul revine activ după fiecare încercare.
- **Netestat:** schimbarea reală a parolei și emailul real de resetare (se încearcă pe contul propriu), comportamentul real al Supabase pentru sesiuni mai vechi de 24 de ore, iPhone real.
