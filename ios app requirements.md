# Aplicația iOS (iPhone) a platformei · cerințe și backlog

**Status:** definit (2026-11-03), neimplementat. **Decizie revizuită (2026-11-03): prima versiune se distribuie ca `.ipa` Ad Hoc descărcat din aplicația web; TestFlight și App Store se amână** (D3). Ales: identificator `deutsch-recapp` (D4, prefixul bundle ID-ului rămâne de stabilit). Rămân de hotărât D1 (în Ad Hoc: cerc restrâns, maximum aproximativ 100 de iPhone-uri), D2 și prefixul înainte de IOS-0.2.

## 1. Cererea clientului (cuvintele lui, 2026-11-03)

„Help me define the backlog for building a mobile iOS app from this app. I would like the user to be able to download the .ipa file from the web app.”

## 2. Ce se poate și ce nu se poate (de citit înainte de orice)

1. **Aplicația se poate transforma într-o aplicație iOS fără rescriere.** Platforma este deja un singur fișier HTML/JS care merge offline, deci un „înveliș” nativ (Capacitor, un WKWebView cu pluginuri) o poate rula ca atare. Rescrierea nativă (SwiftUI) sau în React Native / Flutter ar însemna refacerea a 2106 întrebări, a repetării eșalonate, a ligii și a autentificării: nu se justifică.
2. **Un fișier `.ipa` nu poate fi instalat pe iPhone de către oricine, direct de pe un site.** iOS instalează doar aplicații semnate de Apple sau de un cont Apple Developer, iar semnarea depinde de canalul de distribuție (secțiunea 3). Singurul canal care seamănă cu „descarc `.ipa` de pe site” este **Ad Hoc** (instalare „over the air” prin `itms-services://`), dar acesta merge **doar pe iPhone-uri ale căror UDID e înregistrat în contul tău** (limită de aproximativ 100 de dispozitive).
3. **Decizia curentă (D3, revizuită 2026-11-03):** prima versiune folosește exact fluxul cerut: pagina din aplicația web descarcă și instalează un `.ipa` **Ad Hoc** pe iPhone-urile înregistrate. Pentru public larg, TestFlight și App Store rămân etapa următoare (aceleași sarcini, mutate mai târziu). Condițiile Ad Hoc: cont Apple Developer plătit, UDID-ul fiecărui iPhone înregistrat în cont, instalare din **Safari**, un profil care **expiră după un an** (la expirare aplicația nu mai pornește pe niciun dispozitiv până la o versiune nouă).
4. **Nevoie de Apple Developer Program** (99 USD/an; verifică prețul curent) pentru orice variantă în afară de PWA. Pe acest Mac este instalat doar „Command Line Tools”, **nu Xcode**; Xcode trebuie instalat (gratuit din App Store, câțiva GB) înainte de prima construcție.
5. **Android este mai simplu:** un `.apk` poate fi descărcat direct de pe site și instalat (cu o permisiune a utilizatorului). Cu Capacitor, același cod dă și o aplicație Android; rămâne în afara acestui document.

## 3. Opțiuni de distribuție

| # | Canal | Cum ajunge aplicația pe iPhone | Cost / limite | Potrivit pentru |
|---|---|---|---|---|
| A | **PWA** („Adaugă pe ecranul de start”) | Din Safari, fără `.ipa`, fără cont Apple | Gratuit; fără App Store; notificări push doar de la iOS 16.4, după adăugare pe ecran | Pasul 0, imediat, orice număr de utilizatori |
| B | **TestFlight, link public** | Butonul din aplicația web deschide linkul TestFlight; utilizatorul instalează TestFlight, apoi aplicația | Cont Apple Developer; până la **10.000** de testeri externi; fiecare versiune expiră după **90 de zile** (se încarcă una nouă); prima versiune trece prin „Beta App Review” (de obicei 1–2 zile) | Faza 1: lansare gratuită spre public, cu feedback |
| C | **App Store** (public sau „nelistat”) | Linkul App Store, instalare obișnuită | Cont Apple Developer; verificare App Review la fiecare versiune; reguli de conținut (secțiunea 7) | Faza 2: lansare stabilă |
| D | **Ad Hoc `.ipa`** prin `itms-services` | Butonul de pe site descarcă `manifest.plist` + `.ipa` de pe HTTPS | Cont Apple Developer; **aproximativ 100 de dispozitive** înregistrate cu UDID (verifică regula curentă în documentația Apple, sursele diferă); profilul expiră după un an; la fiecare dispozitiv nou se re-semnează aplicația | Doar un cerc restrâns (colegi, prieteni) |
| E | **Enterprise Program** | Ca la D, fără UDID | Pentru **angajații proprii** ai unei organizații cu cel puțin 100 de angajați; distribuirea către public sau parteneri e interzisă și duce la revocare | **Nu** pentru acest proiect; doar dacă Accesa (cu acordul ei) l-ar avea deja și aplicația ar fi pur internă |
| F | **UE: Web Distribution / magazine alternative** (DMA) | Instalare direct de pe site, în UE, de la iOS 17.5 | Reguli de eligibilitate și taxe (inclusiv o comisie pentru tehnologie de bază); criteriile au fost relaxate de Apple, dar trebuie verificate pe pagina Apple | De reevaluat mai târziu; nu este calea simplă |

**Recomandare (revizuită):** Ad Hoc (D) pentru prima versiune, pentru un cerc restrâns de iPhone-uri înregistrate; A (PWA) ca soluție pentru cei fără UDID înregistrat sau peste limită; B (TestFlight) și C (App Store) pentru public larg, ulterior.

## 4. Abordare tehnică recomandată

- **Capacitor** (Node 22 este deja instalat) în jurul fișierului generat `deutsch.html`: proiectul `ios/` conține un înveliș nativ; `build.py` rămâne sursa conținutului, iar un pas de construcție copiază `deutsch.html` ca `index.html` în directorul web al aplicației.
- **Cod și conținut în pachet** (nu un simplu `server.url` către Vercel): o aplicație care doar deschide un site riscă respingerea la App Review (ghidul 4.2, funcționalitate minimă). Valoare nativă adăugată: funcționare offline completă, haptică, notificări locale, partajare.
- **Autentificarea rămâne Supabase.** Se verifică: cererile din originea `capacitor://localhost` (Supabase le acceptă pentru REST și Auth; se testează), adresele de redirecționare din Supabase Auth, linkurile din e-mail (confirmare, resetare parolă, invitație) care trebuie să deschidă aplicația (Universal Links pe domeniul aplicației web).
- **Progresul:** `localStorage` din WKWebView poate fi golit de sistem în condiții rare; se păstrează sincronizarea cu contul (deja existentă) și, pentru utilizatorii fără cont, se salvează și în stocarea nativă (pluginul Preferences).
- **Actualizarea conținutului** este o decizie deschisă (secțiunea 5, D6).

## 5. Decizii deschise, cu recomandare

| # | Întrebare | Recomandare |
|---|---|---|
| D1 | Cine e publicul? (grup mic / public larg) | **Pentru prima versiune: cerc restrâns** (iPhone-urile înregistrate, aproximativ 100 cel mult); public larg mai târziu, prin TestFlight și App Store. De confirmat |
| D2 | Contul Apple Developer: persoană fizică sau organizație? | **Persoană fizică** (rapid, numele tău apare ca vânzător). Un cont de organizație cere entitate juridică și număr D-U-N-S; nu folosi numele Accesa fără acordul companiei |
| D3 | Canal: TestFlight → App Store, sau `.ipa` Ad Hoc? | **Decis (2026-11-03), revizuit: prima versiune = `.ipa` Ad Hoc descărcat din aplicația web** (IOS-6). TestFlight și App Store rămân în plan, **amânate** (IOS-5.2, IOS-7, IOS-8.4). Apple descrie Ad Hoc ca distribuție limitată pe dispozitive înregistrate; pentru public larg nu este canalul potrivit |
| D4 | Numele aplicației și identificatorul (bundle ID) | **Ales (2026-11-03): identificatorul `deutsch-recapp`.** Bundle ID-ul complet cere în practică formă „domeniu inversat”; propunere: `ro.deutsch-recapp` dacă domeniul este `deutsch-recapp.ro`, altfel prefixul domeniului ales (vezi nota de mai jos). Numele afișat sub pictogramă rămâne separat (de ex. „Deutsch RecApp”) și trebuie să fie liber în App Store Connect. Bundle ID-ul nu mai poate fi schimbat după publicare |
| D5 | Notificări: acum sau mai târziu? | Locale (reamintire zilnică) în faza 1; push (rezultatele ligii) în faza 3 |
| D6 | Cum se actualizează întrebările? | Prima versiune: conținut în pachet, cu o versiune nouă la fiecare serie de modificări. Ulterior: conținutul (JSON) se poate descărca de pe server, iar codul rămâne în pachet (Apple permite date noi, nu cod care schimbă funcțiile aplicației) |
| D7 | Modul întunecat și iPad? | Prima versiune: doar iPhone, doar portret, aspect luminos (ca acum). Modul întunecat și iPad devin sarcini separate |
| D8 | Linkul de descărcare pe site: unde apare? | Pe iPhone/Safari: banner discret; pe desktop: cod QR; în aplicația nativă: ascuns |
| D9 | Android în același proiect? | Da, ca fază separată (cost mic, cu același cod) |

**Notă despre identificatorul `deutsch-recapp` (de verificat la IOS-0.4 și IOS-2.1):**
- Apple acceptă în bundle ID litere, cifre, cratimă și punct, deci `deutsch-recapp` ca segment este permis; liniuța de subliniere nu este.
- Un bundle ID începe de obicei cu un domeniu inversat (`ro.…`, `com.…`); prefixul trebuie ales împreună cu domeniul propriu (D4 depinde de acel domeniu), pentru că nu se mai schimbă.
- **Capacitor** validează identificatorul ca pachet Java (litere, cifre, `_`, fără cratimă); pentru Android (D9) cratima ar fi respinsă. Dacă Android rămâne în plan, alternativa este `ro.deutschrecapp` (fără cratimă), iar `deutsch-recapp` rămâne numele proiectului, al depozitului și al adresei. Dacă aplicația rămâne doar iOS, `ro.deutsch-recapp` este în regulă. Se confirmă la crearea proiectului.

## 6. Backlog

Prioritate: **M** = obligatoriu pentru faza indicată, **S** = recomandat, **C** = opțional. Dimensiune: **S** (mic), **M** (mediu), **L** (mare). Fiecare sarcină are criterii de acceptare scurte.

### Epic IOS-0 · Premise și decizii (faza 0)

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-0.1 | Hotărăște D1–D9 | M | S | Deciziile sunt în acest document, cu data |
| IOS-0.2 | Înscriere în Apple Developer Program (D2) | M | S | Cont activ; acces la App Store Connect |
| IOS-0.3 | Instalează Xcode pe Mac; verifică `xcodebuild -version` și un simulator | M | S | Un proiect gol rulează în simulator |
| IOS-0.4 | Fixează numele afișat și bundle ID-ul complet pornind de la `deutsch-recapp` (D4, cu nota din secțiunea 5) și rezervă-le | M | S | Aplicația creată în App Store Connect; numele este liber; bundle ID-ul respectă regulile Apple și Capacitor |
| IOS-0.5 | Pagină cu **politica de confidențialitate** pe domeniul aplicației web (ce date: e-mail, progres, activitate; unde: Supabase; ștergerea contului) | M | S | Adresă publică, în română și engleză |
| IOS-0.6 | Pagină de **suport** (e-mail de contact) | M | S | Adresă publică |
| IOS-0.7 | **UDID-urile** iPhone-urilor primilor utilizatori (al tău primul): Finder / Apple Configurator, copiat exact; înregistrare în portalul Apple Developer (Devices) | M | S | Cel puțin un iPhone înregistrat; UDID-urile sunt păstrate în afara depozitului Git |

### Epic IOS-1 · PWA (faza 0, fără cont Apple)

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-1.1 | `manifest.webmanifest` + pictograme (180, 192, 512, „maskable”) + `apple-touch-icon` | M | S | Pe iPhone, „Adaugă pe ecranul de start” arată pictograma corectă și deschide aplicația fără bara Safari |
| IOS-1.2 | Service worker care păstrează `deutsch.html` pentru funcționare offline, cu versiune și mesaj „Versiune nouă, reîncarcă” | M | M | Aplicația pornește în modul avion; după o publicare nouă, utilizatorul primește versiunea nouă |
| IOS-1.3 | Indiciu în aplicație (doar iOS Safari, neinstalată): „Adaugă pe ecranul de start” cu pașii vizuali; se poate închide și nu mai apare | S | S | Apare o singură dată pe iPhone, nu apare pe desktop |
| IOS-1.4 | Verifică zonele sigure (notch, bara de jos), tastatura și derularea în modul „standalone” | M | S | Fără conținut tăiat pe iPhone SE și iPhone 15/16 Pro Max (în simulator) |

### Epic IOS-2 · Înveliș nativ (Capacitor)

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-2.1 | Proiect Capacitor în depozit (directorul `ios/`, `package.json`, `capacitor.config`), numai pentru iPhone, doar portret | M | M | Aplicația pornește în simulator și arată ecranul de start |
| IOS-2.2 | Pas de construcție: `python3 build.py` → copiază `deutsch.html` ca `index.html` în directorul web → `npx cap sync ios` | M | S | O singură comandă documentată produce aplicația actualizată |
| IOS-2.3 | Supabase din origine nativă: autentificare, sincronizarea progresului, liga și datele contului funcționează în simulator și pe un iPhone real | M | M | Înscriere cu invitație, autentificare, răspuns la întrebări, sincronizare și clasament verificate |
| IOS-2.4 | **Linkuri profunde** (Universal Links): confirmarea e-mailului, resetarea parolei și invitațiile deschid aplicația; fișier `apple-app-site-association` pe domeniul web; adresele din Supabase Auth actualizate | M | M | Un link din e-mail deschide aplicația instalată; fără aplicație, deschide site-ul |
| IOS-2.5 | Stocare: copie a progresului în Preferences și revenire dacă `localStorage` e gol | S | M | După ștergerea artificială a `localStorage`, progresul revine (cont conectat sau nu) |
| IOS-2.6 | Pictogramă de aplicație (1024 px), ecran de pornire (splash), nume sub pictogramă | M | S | Elementele grafice respectă dimensiunile Apple; fără transparență în pictograma finală |
| IOS-2.7 | Elemente native: bara de stare, zonele sigure, comportamentul tastaturii, dezactivarea selectării/zoom-ului nedorit | M | M | Fără defilare a paginii, fără salturi la apariția tastaturii |
| IOS-2.8 | Ascunde în aplicația nativă ce e doar pentru web (butonul „Descarcă aplicația”, indiciul PWA) | M | S | Elementele nu apar în aplicație |

### Epic IOS-3 · Experiență iOS (după prima versiune)

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-3.1 | Haptică la răspuns corect / greșit și la sfârșitul sesiunii (cu opțiune de dezactivare) | S | S | Vibrații scurte diferite pentru corect / greșit |
| IOS-3.2 | Reamintire zilnică prin notificare locală („Ai X întrebări de repetat”), la ora aleasă de utilizator | S | M | Se programează, se poate opri; funcționează cu aplicația închisă |
| IOS-3.3 | Partajare nativă (rezultatul unui test, invitație în ligă) | C | S | Foaia de partajare iOS se deschide cu textul și linkul |
| IOS-3.4 | Pronunție în germană (sinteză vocală nativă) la cuvinte și exemple | C | M | Buton „Ascultă” care citește în germană |
| IOS-3.5 | Mod întunecat (D7) | C | L | Toate ecranele și blocul „Din fișă” lizibile; contrast verificat |
| IOS-3.6 | Accesibilitate: VoiceOver, text mărit, contrast | S | M | Parcurgerea unei sesiuni complete cu VoiceOver |

### Epic IOS-4 · Notificări push (faza 3)

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-4.1 | Cheie APNs, tabel Supabase pentru jetoanele dispozitivelor, înregistrare după consimțământ | S | M | Jetonul se salvează la acordul utilizatorului și se șterge la retragere |
| IOS-4.2 | Mesajul de luni cu rezultatele ligii și ca notificare push (pe lângă e-mailul existent) | C | M | Participanții cu aplicația primesc notificarea luni la 09:00 (Berlin), o singură dată |

### Epic IOS-5 · Construire, semnare, livrare continuă

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-5.1 | Semnare automată în Xcode; numere de versiune și de construcție (cresc la fiecare încărcare) | M | S | Arhiva se construiește și se validează |
| IOS-5.2 | *(Amânat, canal TestFlight)* Încărcare manuală în App Store Connect (Xcode → Distribute → TestFlight) | C | S | Versiunea apare în TestFlight |
| IOS-5.3 | Construire automată (Xcode Cloud sau GitHub Actions pe macOS) la o etichetă de versiune; secrete în afara depozitului | S | M | Eticheta `ios-v1.0.0` produce o versiune în TestFlight fără pași manuali |
| IOS-5.4 | Calendar al expirărilor: abonamentul Apple (anual), versiunile TestFlight (90 de zile), certificate și profiluri | M | S | Reamintiri stabilite cu cel puțin 30 de zile înainte |
| IOS-5.5 | **Export Ad Hoc:** semnare cu profil de distribuție Ad Hoc, export `.ipa` cu manifest „over the air” (Xcode → Distribute App → Ad Hoc); număr de versiune și de construcție la fiecare export; script / listă de pași în README | M | S | Din Xcode rezultă `.ipa` și `manifest.plist` care instalează aplicația pe un iPhone înregistrat |

### Epic IOS-6 · Descărcarea din aplicația web (Ad Hoc `.ipa`)

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-6.1 | Buton „Instalează aplicația pe iPhone” (meniul utilizatorului și ecranul de start): pe iPhone în Safari pornește instalarea (IOS-6.3); în alt browser de pe iPhone arată „Deschide în Safari”; pe desktop arată un cod QR către pagina de instalare; ascuns în aplicația nativă și pe Android | M | S | Comportament diferit pe iPhone (Safari), iPhone (alt browser), desktop și în aplicație |
| IOS-6.2 | Adresele (pagina de instalare, ulterior TestFlight / App Store) se citesc dintr-un câmp din `config.json` | M | S | Schimbarea adresei nu cere schimbarea logicii |
| IOS-6.3 | **Găzduire și manifest:** `.ipa` și `manifest.plist` pe HTTPS valid, fără redirecționări (propunere: bucket Supabase Storage, nu depozitul Git, ca istoricul să nu crească cu fișiere binare); `manifest.plist` generat la fiecare export (bundle ID, versiune, adresa `.ipa`); link `itms-services://?action=download-manifest&url=…` | M | M | Linkul deschis în Safari pe un iPhone înregistrat instalează aplicația; pe un iPhone neînregistrat apare un mesaj clar din pagină |
| IOS-6.4 | **Proces documentat pentru un dispozitiv nou:** UDID nou → înregistrare în portal → regenerare profil Ad Hoc → export nou → încărcare → anunț; cu timpul necesar și limita de dispozitive | M | M | Pași scriși în README; un al doilea iPhone adăugat urmând doar documentul |
| IOS-6.5 | **Acces controlat:** pagina de instalare cere autentificare; o funcție Edge (`ios-install`) verifică utilizatorul și întoarce linkuri semnate, cu expirare scurtă, pentru manifest și `.ipa`; fără linkuri publice permanente | S | M | Un vizitator neautentificat nu primește linkul; linkul expiră |
| IOS-6.6 | **Înregistrare dispozitive:** formular „Trimite-mi UDID-ul” (cu pașii din Finder), tabel Supabase `ios_devices` (utilizator, UDID, model, stare: cerut / înregistrat / respins), listă în panoul de administrare cu contor „X din 100”; UDID-ul este dată personală și se menționează în politica de confidențialitate | S | L | Utilizatorul trimite UDID-ul; administratorul îl vede și îl marchează înregistrat |
| IOS-6.7 | **Expirări și limite:** expirarea profilului Ad Hoc (1 an) și ocuparea locurilor (100) cu avertizări în panoul de administrare, la 30 de zile și la 90 de locuri | S | S | Avertizările apar la pragurile fixate |

### Epic IOS-7 · Pregătire pentru App Store (faza 2)

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-7.1 | **Ștergerea contului din aplicație** (cerință Apple pentru aplicațiile cu conturi): se verifică dacă pagina „Datele mele” o permite; altfel se adaugă, cu ștergerea datelor din Supabase | M | M | Un cont de test se șterge din aplicație, iar datele lui dispar |
| IOS-7.2 | Cont de **demonstrație** pentru recenzenți (înscrierea e pe bază de invitație): cont gata făcut sau cod de invitație în notele de recenzie | M | S | Recenzentul poate intra și vedea ligă, progres, teste |
| IOS-7.3 | Eticheta „Confidențialitatea aplicației” completată în App Store Connect (e-mail, identificator de utilizator, activitate în aplicație, legate de utilizator, folosite pentru funcțiile aplicației) | M | S | Formular completat, în acord cu politica din IOS-0.5 |
| IOS-7.4 | Descriere, cuvinte-cheie, categorie (Educație), vârstă, **capturi de ecran** (iPhone 6,9" și 6,5"), text „Ce e nou”, în română (limba principală), opțional în engleză | M | M | Toate câmpurile obligatorii completate |
| IOS-7.5 | Argumentarea valorii native pentru ghidul 4.2: funcționare offline, haptică, notificări, repetare eșalonată | M | S | Text în notele pentru recenzent, cu pașii de verificat |
| IOS-7.6 | Declarația de criptare (`ITSAppUsesNonExemptEncryption`: doar HTTPS standard) și drepturile asupra conținutului | M | S | Fără întrebări suplimentare la încărcare |
| IOS-7.7 | Trimitere la App Review, corectarea eventualelor respingeri | M | M | Aplicația este publicată în App Store (public, sau „nelistat”, accesibilă doar prin link) |

### Epic IOS-8 · Testare și lansare

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-8.1 | Plan de testare: iPhone SE (ecran mic), iPhone 15/16 Pro Max, iOS-ul minim ales și cel mai nou; offline; conexiune slabă; trecerea între aplicație și fundal | M | M | Lista de verificat parcursă și semnată |
| IOS-8.2 | Testare pe iPhone real cu cont real: înscriere cu invitație, sincronizare, liga, e-mail de confirmare cu link profund | M | M | Toate fluxurile funcționează |
| IOS-8.3 | Raportare erori (opțional, de ex. Sentry) cu respectarea politicii de confidențialitate | C | S | Erorile din aplicația nativă ajung într-un panou |
| IOS-8.4 | Grup de testeri TestFlight (intern, apoi extern prin link public, cu limită de locuri); anunț către participanții ligii | S | S | Cel puțin 5 testeri din afara echipei au instalat aplicația |

### Epic IOS-9 · Documentație

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-9.1 | `README.md`: cum se construiește aplicația iOS, cum se încarcă în TestFlight, ce secrete există și unde | M | S | Un coleg poate repeta procesul doar din README |
| IOS-9.2 | `features backlog.md`, acest document și memoria proiectului actualizate cu starea fiecărei faze | M | S | Starea reală se vede în toate cele trei locuri |

## 7. Cerințe App Store de care depinde aprobarea (de reținut din start)

- **Funcționalitate minimă (4.2):** aplicația nu trebuie să fie doar un site; vezi IOS-7.5.
- **Conturi:** ștergerea contului din aplicație (IOS-7.1) și cont de demonstrație pentru recenzie (IOS-7.2). Înscrierea doar pe bază de invitație este acceptată dacă recenzentul primește acces.
- **Confidențialitate:** politică publică, etichetă de confidențialitate, consimțământ pentru notificări.
- **Plăți:** aplicația nu vinde nimic; orice viitoare funcție plătită ar trece prin sistemul Apple.

## 8. Faze propuse (revizuite 2026-11-03: Ad Hoc primul)

| Faza | Conținut | Rezultat |
|---|---|---|
| 0 · Premise | Hotărăști D1, D2 și prefixul (IOS-0.1); contul Apple Developer, Xcode, bundle ID, pagini legale, UDID-ul primului iPhone (IOS-0.2–0.7). Eu pot începe în paralel proiectul Capacitor (IOS-2.1–2.2), dar nu poate fi rulat înainte de Xcode | Cont activ, Xcode instalat, un iPhone înregistrat |
| 1 · `.ipa` Ad Hoc | Înveliș nativ: IOS-2.1–2.3 și IOS-2.6–2.8; semnare și export Ad Hoc (IOS-5.1, IOS-5.5); găzduire, manifest, buton și proces (IOS-6.1–6.4); testare pe iPhone real (IOS-8.1–8.2). IOS-2.4 (Universal Links) poate trece în faza 1b | Un `.ipa` pe care îl instalezi de pe pagina din aplicația web, pe iPhone-urile înregistrate |
| 1b · Control și scalare | IOS-6.5–6.7, IOS-2.4–2.5, IOS-3.1–3.2, IOS-3.6 | Acces controlat, înregistrare de dispozitive din aplicație, haptică și reamintire zilnică |
| 2 · Public larg *(amânat)* | PWA (IOS-1), TestFlight (IOS-5.2, IOS-8.4) și apoi App Store (IOS-7), cu livrare continuă (IOS-5.3–5.4) | Instalare fără UDID, în același loc din aplicația web |
| 3 · Extra | IOS-4, IOS-3.3–3.5 | Push, partajare, pronunție, mod întunecat (după nevoie) |

**Ordinea fixă:** `.ipa`-ul vine din aplicația nativă, deci proiectul Capacitor (IOS-2) și contul Apple preced pagina de descărcare; PWA-ul nu este un `.ipa` și nu ajută la acest pas.

## 9. Riscuri

| Risc | Impact | Reducere |
|---|---|---|
| Respingere la App Review (aplicație „prea web”, lipsă ștergere cont, lipsă cont demo) | Întârziere de zile / săptămâni | IOS-7.1, 7.2, 7.5; TestFlight mai întâi |
| Versiunile TestFlight expiră după 90 de zile | Utilizatorii pierd aplicația | IOS-5.3 și IOS-5.4 |
| Expirarea abonamentului Apple sau a certificatelor | Aplicația dispare din App Store / nu se mai construiește | IOS-5.4 |
| Linkuri din e-mail care nu deschid aplicația | Utilizatori blocați la înscriere | IOS-2.4, IOS-8.2 |
| Pierderea progresului local | Reluarea învățării de la zero | IOS-2.5, sincronizarea cu contul |
| Actualizarea conținutului cere versiune nouă | Corecturi lente | D6 |
| Așteptarea unui `.ipa` instalabil de oricine | Dezamăgire | Secțiunea 2, punctul 2 |
| Costuri și timp ale contului Apple (abonament anual) | Cheltuială recurentă | Se acceptă explicit la D2 |
| Ad Hoc este pentru distribuție limitată: limita de dispozitive (aproximativ 100, de confirmat), fiecare iPhone nou cere re-export | Nu se poate oferi aplicația oricui | Cerc restrâns; pentru public larg, faza 2 |
| Profilul Ad Hoc expiră după un an | Aplicația nu mai pornește pe niciun iPhone până la o versiune nouă | IOS-6.7, IOS-5.4 |
| Instalarea merge doar din Safari, cu HTTPS valid și fără redirecționări | Link care „nu face nimic” | IOS-6.1 (mesaj „Deschide în Safari”), IOS-6.3 |
| Linkul de instalare ajunge la oricine | Un `.ipa` fără UDID înregistrat nu se instalează, dar fișierul poate fi descărcat | IOS-6.5 (linkuri semnate cu expirare) |
| UDID-ul este dată personală | Obligații de confidențialitate | IOS-0.5, IOS-6.6 |

## 10. Costuri și cerințe prealabile

- **Apple Developer Program:** 99 USD/an (verifică prețul curent), contul pe numele tău (D2).
- **Hardware:** un Mac cu Xcode (există; Xcode trebuie instalat) și, pentru verificare finală, cel puțin un iPhone real.
- **Software:** Node 22 (instalat), Capacitor (gratuit).
- **Construire automată:** Xcode Cloud are ore lunare incluse; GitHub Actions pe macOS se taxează după minute (verifică tarifele).
- **Domeniu propriu** (dacă îl cumperi): util pentru Universal Links și politica de confidențialitate; vezi conversația despre domeniu.

## 11. Surse verificate (2026-11-03)

- Limitele TestFlight (10.000 de testeri externi, link public, versiuni de 90 de zile): [Apple – TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview).
- Ad Hoc și instalarea `itms-services`: ghiduri terțe (sursele nu sunt de acord asupra limitei exacte de dispozitive): [Applivery](https://docs.applivery.com/en/app-distribution/platforms/apple/app-signing-types.md), [dev.to](https://dev.to/kaushalrola/how-to-install-ipa-files-over-the-air-ota-4nh2). **De confirmat în documentația Apple înainte de a alege varianta D.**
- Enterprise Program (doar angajați, minimum 100 de angajați, fără public): [Apple – Enterprise](https://developer.apple.com/programs/enterprise/enroll/).
- Web Distribution în UE (iOS 17.5+, reguli și taxe, criterii relaxate ulterior): [Apple – Web Distribution](https://developer.apple.com/support/web-distribution-eu), [TechCrunch](https://techcrunch.com/2024/03/12/apple-to-allow-web-distribution-for-ios-apps-in-latest-dma-tweaks/).
