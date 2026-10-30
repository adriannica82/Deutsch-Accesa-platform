# Administrator și panoul de administrare (epic) · cerințe

- **Stare:** recomandările din secțiunea 10 **aprobate** (2026-10-30). **Fazele 1 (fundația) și 2 (lista utilizatorilor) implementate** (2026-10-30), vezi secțiunea 13; fazele 3–5 urmează.
- **Legat de:** `features backlog.md`, secțiunea 8
- **Despre ce este vorba:** un rol nou, **Administrator**, și un **panou de administrare** (Admin dashboard) la care are acces doar el. Prima versiune acoperă gestionarea utilizatorilor: lista conturilor și invitarea de utilizatori noi prin email.

## 1. Cerința inițială

> Introduc un rol nou, Administrator: un utilizator special, cu acces la Admin dashboard. În dashboard vreau să văd: **gestionarea utilizatorilor** — lista tuturor utilizatorilor înregistrați; adăugarea unui utilizator nou prin trimiterea unei invitații de înregistrare. La înregistrare se cer doar **prenumele, numele și adresa de email**.

## 2. Situația de pornire

- Aplicația este un singur fișier HTML static (`deutsch.html`); cloud-ul este Supabase (`owwptchabeucxzegxdrs`), accesat din browser cu **cheia publică**. Cheia publică **nu poate** nici să citească `auth.users`, nici să trimită invitații: asta cere cheia de serviciu, care nu are voie să ajungă în browser.
- Conturile se creează acum **manual** din panoul Supabase (ecranul de login spune „Conturile sunt create de administrator”). Nu există niciun rol în aplicație: toți utilizatorii sunt egali.
- Tabela `profiles` are `display_name`, `avatar` și starea ligii; fiecare utilizator își poate modifica propriul rând (politica `profiles_update_own`). Nu are prenume, nume sau rol.
- Concluzie: rolul trebuie ținut **pe server**, iar tot ce atinge alte conturi (listă, invitații) trece prin cod de server (funcții SQL cu verificare de rol sau Edge Functions).

## 3. Povești de utilizator

1. Ca **administrator**, vreau să văd toți utilizatorii înregistrați, cu starea fiecăruia, ca să știu cine folosește platforma.
2. Ca **administrator**, vreau să invit o persoană nouă introducând doar adresa ei de email, ca să nu creez conturi manual în Supabase.
3. Ca **persoană invitată**, vreau să primesc un email cu un link și să-mi completez doar prenumele, numele (și o parolă, vezi 10.1), ca înregistrarea să dureze sub un minut.
4. Ca **administrator**, vreau să pot retrimite sau anula o invitație, ca să nu rămână invitații blocate.
5. Ca **utilizator obișnuit**, nu văd și nu pot accesa panoul de administrare, nici direct prin adresă, nici prin interogări către server.

## 4. Cerințe funcționale

### 4.1 Rolul Administrator

| ID | Cerință | Origine |
|---|---|---|
| AD-1 | Fiecare cont are un **rol**: `user` (implicit) sau `admin`. Rolul este stocat pe server și **nu poate fi modificat de utilizator** (nici propriul rol). | cerută |
| AD-2 | Primul administrator se creează **o singură dată, manual** (un `update` SQL în Supabase). Ulterior, administratorii pot promova/retrograda alte conturi din panou. | propunere |
| AD-3 | Intrarea în panou („Administrare”) apare în aplicație **doar** pentru administratori. | cerută |
| AD-4 | Orice operație de administrare este **verificată pe server**: un utilizator fără rol `admin` primește eroare, chiar dacă apelează direct API-ul. Ascunderea butonului în interfață nu este protecție. | propunere |
| AD-5 | Nu se poate **retrograda sau dezactiva ultimul administrator activ**, nici propriul cont dacă ești singurul. | propunere |

### 4.2 Lista utilizatorilor

| ID | Cerință | Origine |
|---|---|---|
| AD-6 | Tabel cu **toți utilizatorii înregistrați**: prenume, nume, email, rol, stare, data înregistrării, ultima autentificare. | cerută |
| AD-7 | Stări: **Invitat** (invitație trimisă, neacceptată), **Activ**, **Dezactivat**. Invitațiile în așteptare apar în aceeași listă, cu stare „Invitat” și data expirării. | propunere |
| AD-8 | **Căutare** după nume sau email, **filtru** după stare și rol, **sortare** după coloane, **paginare** (de ex. 25 pe pagină). | propunere |
| AD-9 | Deasupra tabelului, contoare: total conturi, active, invitații în așteptare, administratori. | propunere |
| AD-10 | Conturile existente, create manual înainte de epic, **apar în listă** cu prenume/nume goale („—”) până le completează. | propunere |
| AD-11 | Lista nu arată parole, jetoane sau date de progres; arată doar identitatea și starea contului. | propunere |

### 4.3 Invitarea unui utilizator

| ID | Cerință | Origine |
|---|---|---|
| AD-12 | Butonul **„Invită utilizator”** deschide un dialog cu **un singur câmp obligatoriu: emailul** (și, opțional, rolul, implicit „Utilizator”). Administratorul nu introduce numele: îl completează persoana invitată. | cerută / propunere |
| AD-13 | La trimitere, serverul verifică rolul de administrator, **validează emailul**, refuză emailurile deja înregistrate sau deja invitate (cu mesaj clar) și trimite emailul de invitație. | propunere |
| AD-14 | Emailul de invitație este **în limba română**, are un expeditor ușor de recunoscut și un buton/link către aplicație. Linkul este de **unică folosință** și **expiră** (recomandat: 7 zile). | propunere |
| AD-15 | Administratorul poate **retrimite** (link nou, cel vechi nu mai funcționează) și **anula** o invitație în așteptare. | propunere |
| AD-16 | Înregistrarea publică rămâne **închisă**: fără invitație nu se poate crea cont. | propunere |

### 4.4 Înregistrarea persoanei invitate

| ID | Cerință | Origine |
|---|---|---|
| AD-17 | Linkul din email deschide aplicația pe un ecran **„Finalizează înregistrarea”**. | cerută |
| AD-18 | Ecranul cere **prenumele** și **numele** (obligatorii, 1–60 de caractere, fără spații la capete) și arată **emailul din invitație, needitabil**. Nu se cere nimic altceva, în afara parolei (vezi 10.1). | cerută |
| AD-19 | După „Finalizează”, contul devine **Activ**, utilizatorul este autentificat și ajunge pe pagina principală (unde apare, ca oricărui cont nou, pop-up-ul ligii). | propunere |
| AD-20 | Link expirat, deja folosit sau anulat: mesaj clar în română („Invitația a expirat. Cere o invitație nouă administratorului.”), fără a dezvălui alte detalii. | propunere |
| AD-21 | Numele propus pentru liga săptămânală se preîncarcă din **prenume** (în loc de partea de dinaintea `@`). | propunere |

### 4.5 Gestionarea conturilor (după primele faze)

| ID | Cerință | Origine |
|---|---|---|
| AD-22 | **Dezactivează / reactivează** un cont: utilizatorul nu se mai poate autentifica, dar datele lui rămân. | propunere |
| AD-23 | **Schimbă rolul** (user ↔ admin), cu confirmare. | propunere |
| AD-24 | **Trimite resetare de parolă** unui utilizator. | propunere |
| AD-25 | **Șterge definitiv** un cont, cu confirmare tastată (emailul) și cascadă pe datele lui (progres, sesiuni, XP, ligă). Folosit pentru cereri de ștergere a datelor (GDPR). | propunere |
| AD-26 | **Jurnal de audit**: cine a invitat, a anulat, a dezactivat, a promovat sau a șters pe cine, și când; vizibil administratorilor. | propunere |

## 5. Reguli de securitate

- **Cheia de serviciu** (service role) rămâne **numai** în secretele funcțiilor de pe server, niciodată în `deutsch.html`, `config.json` sau în repository.
- Funcția `is_admin()` (SQL, `security definer`) citește rolul din `profiles`; toate politicile și funcțiile de administrare o folosesc.
- **Atenție la `profiles`:** utilizatorii au acum drept de `update` pe propriul rând. Coloana `role` trebuie exclusă din drepturile lor (drepturi pe coloane) sau protejată de un declanșator, altfel oricine și-ar putea da rolul de administrator.
- Listarea utilizatorilor se face printr-o funcție/Edge Function care întoarce **doar** câmpurile din AD-6, nu `auth.users` întreg.
- Invitațiile: limită de ritm (de ex. maximum 20 pe oră pe administrator), ca să nu poată fi folosită la spam.
- Recomandat: **autentificare în doi pași (TOTP)** pentru conturile de administrator (Supabase o oferă).
- Codul panoului ajunge în `deutsch.html`, deci vizibil oricui; este în regulă atât timp cât **toată autorizarea e pe server**.

## 6. Date (propunere)

- `profiles`: coloane noi `first_name text`, `last_name text`, `role text not null default 'user' check (role in ('user','admin'))`, `status text not null default 'active' check (status in ('active','disabled'))`, `invited_by uuid`, `registered_at timestamptz`.
- `invitations`: `id uuid`, `email text` (unic cât timp invitația e în așteptare), `role text`, `invited_by uuid`, `invited_at`, `expires_at`, `accepted_at`, `revoked_at`, `user_id uuid` (completat la acceptare). Stare derivată: în așteptare / acceptată / anulată / expirată.
- `admin_audit` (faza 4): `id`, `actor_id`, `action`, `target_email`, `details jsonb`, `at`.
- RLS activ pe toate; fără acces direct pentru `anon` și `authenticated` la `invitations` și `admin_audit` (doar prin funcții `security definer` cu verificarea `is_admin()`).
- **Funcții/endpointuri:** `admin_list_users(search, status, role, page)` (SQL, `security definer`); Edge Functions `admin-invite`, `admin-resend-invite`, `admin-revoke-invite`, `admin-set-user` (rol, dezactivare, ștergere), pentru că trimiterea emailului și operațiile pe `auth.users` cer cheia de serviciu.
- **Fluxul invitației:** `admin-invite` → verifică rolul → `auth.admin.inviteUserByEmail(email, { redirectTo })` → persoana deschide linkul → aplicația detectează sesiunea de tip invitație (jetonul din adresa URL) → ecran AD-17 → salvează prenumele/numele în `profiles`, setează parola (`PUT /auth/v1/user`), marchează invitația acceptată.

## 7. Interfață (propunere)

- **Intrare:** un link „Administrare” în antet, vizibil doar administratorilor; ecran propriu, cu aceleași stiluri ca restul aplicației (carduri, pastile de stare, dialoguri modale accesibile ca la pop-up-ul ligii).
- **Ecranul Utilizatori:** contoare sus, bara de căutare și filtre, tabel (pe telefon: carduri una sub alta, cu aceleași informații), buton principal „Invită utilizator”.
- **Dialogul de invitație:** un câmp email, selector de rol (implicit Utilizator), butoane „Trimite invitația” / „Anulează”; confirmare „Invitație trimisă la …”.
- **Ecranul „Finalizează înregistrarea”:** titlu, emailul (needitabil), Prenume, Nume, Parola (cu indicații) și butonul „Finalizează”.
- Ținte tactile de minimum 44 px; funcționează pe iPhone 17 / 17 Pro Max; toate textele în română.

## 8. Faze de implementare propuse

| Faza | Conținut | Observații |
|---|---|---|
| **1. Fundația** | Rol pe `profiles`, `is_admin()`, protejarea coloanei `role`, primul administrator, intrarea „Administrare” vizibilă doar adminilor, ecran gol protejat | fără ea nu se poate construi nimic în siguranță |
| **2. Lista utilizatorilor** | `admin_list_users`, tabel, căutare, filtre, paginare, contoare | doar citire; util imediat |
| **3. Invitații și înregistrare** | Tabela `invitations`, Edge Function `admin-invite`, email în română, ecranul „Finalizează înregistrarea”, retrimite/anulează | cere **SMTP propriu** (vezi 9) |
| **4. Gestionarea conturilor** | Dezactivare, schimbare rol, resetare parolă, ștergere, jurnal de audit | AD-22…AD-26 |
| **5. Opțional** | Progresul unui utilizator (doar citire), invitații în masă, statistici | vezi 11 |

## 9. Riscuri și atenuări

| Risc | Atenuare |
|---|---|
| **Emailurile Supabase implicite sunt limitate** (puține pe oră, și doar către adresele echipei proiectului) | Configurez un **SMTP propriu** (de ex. Resend, Brevo) înainte de faza 3; până atunci invitațiile ar ajunge doar la tine |
| Escaladare de privilegii prin `profiles` | Drepturi pe coloane + test explicit că un utilizator obișnuit nu își poate seta `role` |
| Cheia de serviciu expusă | Doar în secretele Edge Functions; verificare înainte de fiecare commit că nu apare în fișiere |
| Blocarea fără administrator | AD-5; recuperare prin SQL manual |
| Link de invitație interceptat | Expirare, unică folosință, parola setată la înregistrare |
| Spam prin invitații | Limită de ritm + doar administratorii pot invita |

## 10. Decizii deschise (cu recomandări)

| # | Întrebare | Recomandare |
|---|---|---|
| 10.1 | „Doar prenume, nume și email”: cum se autentifică apoi persoana? Ecranul de login are acum email + **parolă**. | La înregistrare se cere **și o parolă** (singurul câmp în plus, necesar tehnic). Alternativa fără parolă (link magic prin email) schimbă tot fluxul de login și nu e recomandată acum. |
| 10.2 | Poate un administrator să invite alți administratori? | **Da**, prin selectorul de rol din dialog; pe ecran apare un avertisment la alegerea rolului Administrator. |
| 10.3 | Expirarea invitației | **7 zile**, retrimitere nelimitată. |
| 10.4 | Ce se întâmplă cu conturile existente (3 acum)? | Rămân active, rol `user`; tu devii primul administrator (SQL). Prenumele/numele rămân goale până la o completare opțională viitoare. |
| 10.5 | Dezactivare sau ștergere? | **Ambele**: dezactivarea ca acțiune obișnuită, ștergerea definitivă doar cu confirmare tastată. |
| 10.6 | Expeditorul emailurilor | Adresa/domeniul de pe care vrei să plece invitațiile (trebuie decis înainte de faza 3). |
| 10.7 | Emailul de invitație: doar română? | **Doar română**, ca restul platformei. |
| 10.8 | Autentificare în doi pași pentru administratori | **Da, recomandat**, dar ca pas separat după faza 4 (nu blochează restul). |

## 11. Îmbunătățiri sugerate, în afara cerinței inițiale

Nu sunt incluse în fazele 1–4; le poți alege sau le poți lăsa pentru un epic ulterior.

- **Progresul unui utilizator, doar citire:** ultima activitate, câte întrebări a rezolvat, temele pe care le stăpânește, XP și treapta din ligă. Util dacă platforma e folosită ca un curs și vrei să vezi cine rămâne în urmă.
- **Moderare ligă:** schimbarea sau resetarea unui nume afișat neadecvat, scoaterea unui cont din ligă.
- **Invitații în masă:** lipești o listă de emailuri; fiecare primește invitație.
- **Statistici de conținut:** cele mai greșite întrebări și teme (din tabela `answers`), pentru a ști ce explicații trebuie îmbunătățite.
- **Panou de sănătate:** invitații expirate, conturi neactivate de mult, utilizatori inactivi.
- **Descărcare listă de utilizatori (.csv)** pentru evidență.

## 12. Criterii de acceptare (pentru fazele 1–3)

1. Un utilizator cu rol `user` nu vede „Administrare”; apelarea directă a funcțiilor de administrare întoarce eroare de autorizare.
2. Un utilizator `user` nu poate seta `role = 'admin'` pe propriul rând (testat cu un apel direct la API).
3. Administratorul vede toate conturile, inclusiv cele existente, cu stare corectă; căutarea, filtrele și paginarea funcționează.
4. Invitarea unui email nou trimite un email în română; invitarea unui email deja înregistrat sau invitat este refuzată cu mesaj clar.
5. Linkul din email deschide „Finalizează înregistrarea” cu emailul preîncărcat și needitabil; fără prenume sau nume, formularul nu se trimite.
6. După finalizare, contul apare ca **Activ**, persoana este autentificată, iar prenumele se vede în listă și preîncarcă numele pentru ligă.
7. Un link folosit, expirat sau anulat arată mesajul din AD-20 și nu creează cont.
8. Fără invitație, nu se poate crea cont (înregistrarea publică este oprită; verificat pe API).
9. Cheia de serviciu nu apare în `deutsch.html`, `config.json` sau în istoricul git.
10. Ecranele funcționează pe telefon (iPhone 17 / 17 Pro Max) și pe desktop.

## 13. Stare implementare

### Faza 1 · fundația (implementat, 2026-10-30)

- **Server (migrarea `admin_role_phase1`, copiată în `supabase/schema.sql`, secțiunea 7):** coloana `profiles.role` (`user` / `admin`, implicit `user`); utilizatorii au acum drepturi de `insert`/`update` **doar pe coloanele lor** (fără `role`), deci nu își pot acorda rolul; funcția `is_admin()`; funcția `admin_summary()` (numără conturile și administratorii, **refuză cu eroare 403** pe oricine nu e administrator).
- **Primul administrator:** contul `adrian.nica@accesa.eu` (singurul cont „Adrian”), pus prin SQL. Alte conturi: `user`.
- **Aplicație:** butonul **Administrare** în antet, vizibil doar când profilul are `role = admin`; ecranul „Panou de administrare” confirmă accesul prin server și arată numărul de conturi și de administratori. Dacă serverul refuză (rol local falsificat sau retras), apare „Nu ai acces la această zonă.”, iar butonul dispare.
- **Fișiere modificate:** `src/app.js` (modulul „Administrare”, `role` în citirea profilului, ruta `admin` la „înapoi”), `src/template.html` (butonul și secțiunea `#admin`), `supabase/schema.sql`; regenerat `deutsch.html`.
- **Verificare (pe baza reală, într-o tranzacție anulată):** un utilizator obișnuit nu poate nici să insereze, nici să actualizeze `role = 'admin'` (eroare de permisiune), nu poate apela `admin_summary()` și `is_admin()` întoarce `false`; administratorul primește `is_admin() = true` și `admin_summary()` = 3 conturi, 1 administrator, și își poate actualiza în continuare profilul. În browser (cu răspunsuri simulate): utilizatorul obișnuit nu vede butonul, administratorul vede ecranul cu cifrele, iar un rol falsificat local primește „Nu ai acces”; antetul încape pe telefon (375 px).
- **Nu e acoperit încă:** AD-5 (protecția ultimului administrator) se face în faza 4, odată cu schimbarea rolurilor din panou. Testul pe un iPhone real nu a fost făcut.
- **Observații Supabase (faza 1):** avertismentele „SECURITY DEFINER executabil de utilizatori autentificați” pentru `is_admin()` și `admin_summary()` sunt intenționate (funcțiile verifică singure rolul). **Protecția la parole compromise (Leaked password protection) este oprită** în proiect; recomand s-o pornești din Supabase (Authentication → Policies) înainte de faza 3, când utilizatorii noi își aleg parola.

### Faza 2 · lista utilizatorilor (implementat, 2026-10-30)

- **Server (migrarea `admin_list_users_phase2`, în `supabase/schema.sql`, secțiunea 8):** coloanele `profiles.first_name` și `profiles.last_name` (1–60 de caractere, scriptibile de utilizator; le va completa înregistrarea din faza 3); funcția `admin_list_users(căutare, stare, rol, sortare, sens, limită, deplasare)`, `security definer`, **refuză cu 403 pe oricine nu e administrator**; întoarce doar `user_id`, email, prenume, nume, nume afișat, rol, stare, data înregistrării și ultima autentificare, plus contoarele (conturi, active, dezactivate, administratori) și totalul filtrat. `admin_summary()` din faza 1 a fost ștearsă (înlocuită).
- **Stare derivată:** `Dezactivat` dacă `auth.users.banned_until` este în viitor, altfel `Activ`. Starea **Invitat** și contorul de invitații apar în faza 3, când există tabela `invitations`.
- **Aplicație (ecranul „Utilizatori”):** contoare, căutare (după nume, nume afișat sau email, fără caractere speciale), filtre Stare și Rol, sortare (data înregistrării, nume, email, rol, stare, ultima autentificare) cu sens crescător/descrescător, paginare de 25. Pe desktop este tabel, pe telefon fiecare utilizator e un card cu aceleași informații. Conturile fără prenume/nume arată „—” (și numele afișat, dacă există).
- **Fișiere modificate:** `src/app.js`, `src/template.html`, `src/style.css`, `supabase/schema.sql`; regenerat `deutsch.html`.
- **Verificare:** pe baza reală (tranzacție anulată): utilizator obișnuit → eroare de permisiune; administrator → 3 conturi, contoare corecte, sortare după email, căutarea „EDIT” găsește 1 cont, căutarea „%” nu se comportă ca simbol de înlocuire (0 rezultate), paginare (limită 2, deplasare 2 → 1 rând din 3). În browser, cu 59 de conturi simulate: 3 pagini (25 + 25 + 9) cu butoane dezactivate la capete, filtrul „Dezactivat” (6), căutare, ecran gol, eroare de rețea („Nu am putut încărca utilizatorii”), refuz 403 („Nu ai acces”), conținut HTML în nume afișat ca text (fără injectare), fără depășire orizontală la 375 px.
- **Nu e acoperit:** testul pe un iPhone real și cu cei 3 conturi reale în browser.
