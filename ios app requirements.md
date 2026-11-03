# Aplicația iOS (iPhone) a platformei · cerințe și backlog

**Status:** definit (2026-11-03), neimplementat. Decis: **D3 = TestFlight, apoi App Store** (2026-11-03). Ales: identificator `deutsch-recapp` (D4, prefixul bundle ID-ului rămâne de stabilit). Rămân de hotărât D1, D2 și prefixul înainte de IOS-0.2; restul au recomandări (secțiunea 5).

## 1. Cererea clientului (cuvintele lui, 2026-11-03)

„Help me define the backlog for building a mobile iOS app from this app. I would like the user to be able to download the .ipa file from the web app.”

## 2. Ce se poate și ce nu se poate (de citit înainte de orice)

1. **Aplicația se poate transforma într-o aplicație iOS fără rescriere.** Platforma este deja un singur fișier HTML/JS care merge offline, deci un „înveliș” nativ (Capacitor, un WKWebView cu pluginuri) o poate rula ca atare. Rescrierea nativă (SwiftUI) sau în React Native / Flutter ar însemna refacerea a 2106 întrebări, a repetării eșalonate, a ligii și a autentificării: nu se justifică.
2. **Un fișier `.ipa` nu poate fi instalat pe iPhone de către oricine, direct de pe un site.** iOS instalează doar aplicații semnate de Apple sau de un cont Apple Developer, iar semnarea depinde de canalul de distribuție (secțiunea 3). Singurul canal care seamănă cu „descarc `.ipa` de pe site” este **Ad Hoc** (instalare „over the air” prin `itms-services://`), dar acesta merge **doar pe iPhone-uri ale căror UDID e înregistrat în contul tău** (limită de aproximativ 100 de dispozitive).
3. **Varianta recomandată păstrează ideea ta:** butonul „Descarcă aplicația pentru iPhone” din aplicația web există, dar duce la **TestFlight** (apoi la **App Store**), nu la un `.ipa`. Pentru utilizator rezultatul este același: apasă un buton și aplicația ajunge pe iPhone.
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

**Recomandare:** A imediat (fază fără risc), apoi B pentru lansarea pe iPhone, apoi C. D doar dacă vrei de la început un `.ipa` descărcat de pe site pentru o grupă mică, cu înțelegerea limitelor de mai sus.

## 4. Abordare tehnică recomandată

- **Capacitor** (Node 22 este deja instalat) în jurul fișierului generat `deutsch.html`: proiectul `ios/` conține un înveliș nativ; `build.py` rămâne sursa conținutului, iar un pas de construcție copiază `deutsch.html` ca `index.html` în directorul web al aplicației.
- **Cod și conținut în pachet** (nu un simplu `server.url` către Vercel): o aplicație care doar deschide un site riscă respingerea la App Review (ghidul 4.2, funcționalitate minimă). Valoare nativă adăugată: funcționare offline completă, haptică, notificări locale, partajare.
- **Autentificarea rămâne Supabase.** Se verifică: cererile din originea `capacitor://localhost` (Supabase le acceptă pentru REST și Auth; se testează), adresele de redirecționare din Supabase Auth, linkurile din e-mail (confirmare, resetare parolă, invitație) care trebuie să deschidă aplicația (Universal Links pe domeniul aplicației web).
- **Progresul:** `localStorage` din WKWebView poate fi golit de sistem în condiții rare; se păstrează sincronizarea cu contul (deja existentă) și, pentru utilizatorii fără cont, se salvează și în stocarea nativă (pluginul Preferences).
- **Actualizarea conținutului** este o decizie deschisă (secțiunea 5, D6).

## 5. Decizii deschise, cu recomandare

| # | Întrebare | Recomandare |
|---|---|---|
| D1 | Cine e publicul? (grup mic / public larg) | Public larg, prin TestFlight apoi App Store; un cerc mic poate folosi și PWA |
| D2 | Contul Apple Developer: persoană fizică sau organizație? | **Persoană fizică** (rapid, numele tău apare ca vânzător). Un cont de organizație cere entitate juridică și număr D-U-N-S; nu folosi numele Accesa fără acordul companiei |
| D3 | Canal: TestFlight → App Store, sau `.ipa` Ad Hoc? | **Decis (2026-11-03): TestFlight, apoi App Store.** Varianta Ad Hoc (IOS-6.3–6.4) rămâne în afara planului, doar la cerere explicită |
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
| IOS-5.2 | Încărcare manuală în App Store Connect (Xcode → Distribute → TestFlight) | M | S | Versiunea apare în TestFlight |
| IOS-5.3 | Construire automată (Xcode Cloud sau GitHub Actions pe macOS) la o etichetă de versiune; secrete în afara depozitului | S | M | Eticheta `ios-v1.0.0` produce o versiune în TestFlight fără pași manuali |
| IOS-5.4 | Calendar al expirărilor: abonamentul Apple (anual), versiunile TestFlight (90 de zile), certificate și profiluri | M | S | Reamintiri stabilite cu cel puțin 30 de zile înainte |

### Epic IOS-6 · Descărcarea din aplicația web

| ID | Sarcină | Prio | Dim. | Acceptare |
|---|---|---|---|---|
| IOS-6.1 | Buton „Descarcă aplicația pentru iPhone” (în meniul utilizatorului și pe ecranul de start): pe iPhone/Safari duce la TestFlight (faza 1) sau App Store (faza 2); pe desktop arată un cod QR; ascuns în aplicația nativă și pe Android | M | S | Se comportă diferit pe iPhone, desktop și în aplicație |
| IOS-6.2 | Adresa TestFlight / App Store se citește dintr-un câmp din `config.json` (fără modificare de cod la schimbarea ei) | M | S | Schimbarea adresei nu cere reconstruirea logicii |
| IOS-6.3 | *(Doar dacă se alege canalul D)* pagină „Instalează `.ipa`”: `manifest.plist`, `.ipa` pe HTTPS, link `itms-services://…`, formular „Trimite-mi UDID-ul” și listă în panoul de administrare cu dispozitivele aprobate | C | L | Un iPhone înregistrat instalează aplicația de pe pagină; alt iPhone primește mesaj clar |
| IOS-6.4 | *(Doar canalul D)* proces documentat: UDID nou → înregistrare → re-semnare → încărcare `.ipa` | C | M | Pași scriși, cu timpul necesar și limita de dispozitive |

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

## 8. Faze propuse

| Faza | Conținut | Rezultat |
|---|---|---|
| 0 | IOS-0.1–0.6, IOS-1 | PWA instalabilă; cont Apple, Xcode și pagini legale pregătite |
| 1 | IOS-2, IOS-5.1–5.2, IOS-6.1–6.2, IOS-8.1–8.2, IOS-8.4 | Aplicație pe iPhone prin **TestFlight**, cu butonul de descărcare în aplicația web |
| 2 | IOS-3.1–3.2, IOS-3.6, IOS-7, IOS-5.3–5.4 | Aplicație în **App Store**; livrare continuă |
| 3 | IOS-4, IOS-3.3–3.5 | Push, partajare, pronunție, mod întunecat (după nevoie) |
| Opțional | IOS-6.3–6.4 | Pagină de instalare Ad Hoc pentru un cerc restrâns, doar dacă se cere explicit |

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
