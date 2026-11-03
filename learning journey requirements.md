# „Călătoria ta de învățare” · recomandări de repetare și bară de efort pe categorie · cerințe

**Status:** definit (2026-11-03); **faza 1 și faza 2 implementate și verificate în browser (2026-11-03)**, vezi secțiunea 13. **Deciziile D11–D16 (remindere) sunt confirmate de utilizator (2026-11-03);** D1–D10 sunt recomandări, încă neconfirmate explicit, și se confirmă înainte de prima sarcină (secțiunea 9).

## 1. Cererea clientului (cuvintele lui, 2026-11-03)

„Revenind la conținut, ajută-mă să definesc un epic nou: aș dori ca utilizatorii să aibă și un «learning journey» prin recomandări legat de ce anume trebuie să repete. Pentru fiecare categorie aș vedea o bară care să indice nivelul de exercițiu zilnic necesar. Are sens în bunele practici de consolidare?”

## 2. Răspuns la întrebarea de pedagogie: are sens?

**Da, dar cu o reformulare importantă.** O bară care arată **cât trebuie repetat azi** are sens și se leagă direct de cele mai solide practici de consolidare. O bară care ar arăta o **normă zilnică fixă** („fă 30 de exerciții la această categorie”) nu are sens, din motivele de mai jos.

| Practică de învățare | Ce spune în linii mari cercetarea | Ce înseamnă pentru bară |
|---|---|---|
| **Repetare spațiată** (distributed practice; Ebbinghaus, apoi sinteze ca Cepeda și colegii, 2006) | Repetările distanțate în timp fixează mai bine decât aceleași repetări concentrate; intervalul potrivit crește pe măsură ce informația se consolidează | „Necesarul de azi” se calculează din **scadențe** (ce a ajuns la termen), nu dintr-o cotă. Aplicația are deja scara 0–1–3–7–14–30 de zile |
| **Efectul testării** (retrieval practice; Roediger și Karpicke, 2006) | Încercarea activă de a-ți aminti învață mai mult decât recitirea | Recomandarea trimite la **exerciții**, nu la citit fișe; fișa vine după răspuns (blocul „Din fișă”) |
| **Amestecarea temelor** (interleaving; Rohrer și Taylor, 2007) | Sesiunile care alternează categorii dau rezultate mai bune pe termen lung decât blocurile de aceeași categorie, chiar dacă par mai grele | Planul de azi **amestecă** categoriile în proporție cu necesarul lor, în loc să trimită la o singură temă |
| **Dificultate dorită** (desirable difficulty; Bjork) | Efortul moderat la reamintire ajută; repetarea a ceea ce știi sigur aduce puțin | Elementele **neajunse la scadență** nu se împing în plan; cele scăzut stăpânite și cele greșite au prioritate |
| **Încărcare cognitivă și obișnuință** | Sesiuni scurte și regulate (10–20 de minute) se mențin mai ușor decât maratoane; o „datorie” uriașă descurajează | Bara arată **efortul în minute** față de un obiectiv zilnic ales de utilizator, iar restanțele mari se **distribuie** pe mai multe zile |

**Pe scurt, de ce nu o normă fixă:** (1) după ce un element a fost repetat la momentul potrivit, încă o repetare în aceeași zi aduce puțin; (2) o normă fixă împinge la supraexersare sau, dacă nu e atinsă, la sentimentul de eșec; (3) necesarul real al unei categorii variază de la o zi la alta, după ce a fost învățat ieri și ce urmează să fie uitat. **Bara trebuie să arate „necesarul de azi”**, calculat din date, nu o țintă arbitrară. Utilizatorul își alege doar **capacitatea** zilnică (cât timp are).

**Limitări de cunoscut:** (a) intervalele actuale (0–1–3–7–14–30) sunt standard, nu optimizate pe fiecare persoană; (b) estimarea minutelor depinde de viteza utilizatorului; (c) „stăpânit” în aplicație (cutia 4–5) înseamnă răspunsuri corecte consecutive, nu retenție măsurată pe termen foarte lung; (d) cercetarea din tabel vine din experimente, nu din studii pe această aplicație: după lansare, rezultatul se măsoară (secțiunea 10).

## 3. Ce există acum

- **Repetarea spațiată (regula „A”):** răspuns corect → cutia crește (0 → 5), răspuns greșit → cutia revine la 0; scadența = ultima încercare + 0 / 1 / 3 / 7 / 14 / 30 de zile. Stările: nou, în învățare (cutiile 0–1), consolidare (2–3), stăpânit (4–5).
- **„Repetiția de azi”** (pagina principală): amestecă toate temele, mai întâi construcțiile scadente (cele cu cutie mai mică primele), apoi cele noi.
- **Per temă:** bara cu stările (noi / învățare / consolidare / stăpânit) și textul „X de repetat · Y noi · Z stăpânite”; selecția „Puncte slabe” (greșite, cutie ≤ 2).
- **Timp:** timpul activ pe sesiune, „azi” și „săptămâna aceasta”, media pe întrebare.
- **XP (liga):** 10 la o întrebare nouă, **15 la una scadentă**, 5 la o reluare înainte de scadență; deci recomandarea „repetă întâi ce e scadent” este și cea care aduce mai mult XP.
- **Lipsește:** o vedere a necesarului pe categorii, o prioritizare după slăbiciune, un obiectiv zilnic, un plan care amestecă categoriile după necesar, o ordine recomandată a temelor noi și o prognoză a zilelor următoare.

## 4. Conceptul

**„Călătoria ta”** are patru părți, în ordinea valorii:

1. **Planul de azi:** o sesiune recomandată, cu cât să faci (întrebări și minute) și un buton „Începe planul de azi”.
2. **Necesarul pe categorii:** pentru fiecare categorie, o **bară de necesar** (secțiunea 6), ordonată după prioritate, cu motivul recomandării („12 scadente, 3 restante de peste o săptămână”).
3. **Ce urmează:** următoarea categorie nouă recomandată, în ordinea nivelurilor (A1–A2 → A2 → A2–B1 → B1), după ce cele curente sunt suficient de consolidate.
4. **Prognoza:** câte repetări vin în următoarele 7 zile, ca să nu apară surprize.

## 5. Definiții și formule (propunere, de confirmat)

- **Scadent acum** (`due`): elemente cu `due ≤ acum` (ca „de repetat acum”).
- **Restant:** scadent de mai mult de 1 zi. Se arată separat: sunt cele mai expuse uitării.
- **Slab:** cel puțin o greșeală și cutia ≤ 2 (ca selecția „Puncte slabe”).
- **Capacitate zilnică C:** aleasă de utilizator ca minute (10 / 15 / 20 / 30; implicit **15**) și convertită în întrebări cu **timpul mediu pe întrebare** al utilizatorului, calculat din sesiunile recente (implicit 20 s, minimum 8 s, maximum 60 s). C în întrebări = capacitate în secunde / timp mediu.
- **Necesarul categoriei (necesar):** `restante + scadente` (scadentele care nu sunt restante). Elementele **slabe** sunt un subset al lor, marcat separat; nu se numără de două ori.
- **Minute estimate** ale categoriei: `necesar × timp mediu pe întrebare`, rotunjit.
- **Prioritatea categoriei:** 1. cu restanțe, în ordinea restanței celei mai vechi; 2. cu cele mai multe elemente slabe scadente; 3. cu cele mai multe scadente; 4. rest. La egalitate, nivelul mai mic primul.
- **Planul de azi** (la ≤ C întrebări): (a) scadente, **restantele întâi**, apoi cutia cea mai mică; **amestecate** între categorii cu cel mult 40% dintr-o singură categorie, dacă mai există altele cu necesar; (b) dacă rămâne loc, **întrebări noi** din categoria recomandată, cel mult 30% din C (implicit); (c) restul rămâne ca „rămase pentru mâine”. După absențe lungi, planul nu depășește C într-o singură sesiune; restanțele se distribuie pe zile („Recuperare: ~3 zile”).

## 6. Bara de necesar pe categorie

- **Ce arată:** o bară orizontală **segmentată**: *restante* (accent de avertizare), *scadente azi* (accent principal), *slabe* marcate cu un indicator; lățimea totală este necesarul față de **capacitatea C** (bara plină = necesarul categoriei egalează sau depășește jumătate din C, pentru ca 3–4 categorii să încapă într-un ecran; de decis la D4).
- **Text lângă bară:** „**12 scadente** · 3 restante · ~4 min”. Culoarea nu poartă singură informația (text și indicatori pentru daltonism).
- **Stări:** „La zi” (necesar 0, cu data următoarei repetări), „De repetat azi”, „Restanțe”, „Nouă” (neîncepută, cu invitația „Începe”).
- **Nu e o normă:** o bară goală înseamnă „nimic de repetat azi”, nu „nu ai exersat azi”; categoria La zi nu cere nimic. Textul de explicație: „Bara arată cât e scadent azi, nu cât ai de făcut obligatoriu.”
- **Acțiune:** apăsarea unei bare pornește o sesiune pe acea categorie, doar cu elementele scadente.

## 7. Cerințe funcționale

| ID | Cerință | Prioritate |
|---|---|---|
| LJ-1 | Pe pagina principală, un card „Călătoria ta” cu planul de azi: întrebări și minute estimate, butonul „Începe planul de azi” | M |
| LJ-2 | Lista categoriilor cu bara de necesar (secțiunea 6), ordonată după prioritate; primele 5, cu „Vezi toate” | M |
| LJ-3 | Fiecare categorie arată motivul recomandării în cuvinte (de ce e sus) | M |
| LJ-4 | Capacitatea zilnică în minute, aleasă de utilizator; implicit 15; stocată local și, pentru conturi, în profil | M |
| LJ-5 | Planul amestecă categoriile (interleaving) cu plafonul de 40% pe categorie | M |
| LJ-6 | Întrebările noi se adaugă în plan doar după cele scadente, cu plafonul de 30% | M |
| LJ-7 | Timpul mediu pe întrebare se calculează din sesiunile utilizatorului (implicit 20 s) | S |
| LJ-8 | Recomandarea categoriei noi următoare, în ordinea nivelurilor, când cele curente au ≥ 60% din elemente în consolidare sau stăpânite (prag de decis, D5) | S |
| LJ-9 | Prognoza următoarelor 7 zile (număr de scadențe pe zi) | S |
| LJ-10 | „Rămase pentru mâine” și „Recuperare” după absențe, fără mesaje de vinovăție | S |
| LJ-11 | Planul, barele și prognoza se calculează în aplicație din `progress` și istoric; fără modificări de server în prima versiune | M |
| LJ-12 | Accesibilitate: text alternativ cu cifrele, contrast, funcționare la 375 px și în aplicația iPhone | M |
| LJ-13 | Remindere zilnice prin notificări locale în aplicația iPhone, cu numărul scadentelor și minutele estimate (secțiunea 7a; se leagă de IOS-3.2) | S |
| LJ-14 | Rezumat în e-mailul săptămânal: „ce ai de repetat săptămâna viitoare” | C |
| LJ-15 | Setări de remindere în „Datele mele”: activ / oprit, ora, zilele, pauză (7 / 14 / 30 de zile), notificare de test | S |
| LJ-16 | Reminderul se anulează dacă azi ai exersat și se omite când nu e nimic scadent; adaptare la ignorare (secțiunea 7a, regula 5) | S |
| LJ-17 | Atingerea notificării deschide direct „Planul tău de azi” | S |
| LJ-18 | E-mail zilnic cu consimțământ, opțional, fără a-l activa implicit (secțiunea 7a) | C |

M = obligatoriu pentru prima versiune, S = recomandat, C = opțional.

## 7a. Remindere zilnice legate de progres (adăugat 2026-11-03)

**Cerere:** „un set de remindere zilnice legat de progres. Ce îmi recomanzi?”

### Canale: ce recomand și ce nu

| Canal | Verdict | Motiv |
|---|---|---|
| **Cardul „Planul tău de azi”** la deschiderea aplicației | **Da, baza** | Fără permisiuni; arată exact ce ar spune un reminder |
| **Notificare locală în aplicația iPhone** | **Da, primul reminder real** | Se programează pe telefon: fără server, fără date trimise la terți, funcționează offline. Nu cere contul Apple plătit (spre deosebire de notificările push); de verificat la prima instalare prin cablu |
| **E-mail zilnic** | **Opțional, mai târziu, doar cu acord** | Risc de oboseală și de dezabonare; infrastructura există (Brevo, cron), dar e-mailul săptămânal al ligii rămâne canalul principal pe e-mail |
| **Notificare în browser (web)** | **Nu acum** | Pe iPhone, Safari o permite doar pentru aplicații adăugate pe ecranul de start; pe desktop cere browserul deschis; valoare mică |
| **Notificare push de pe server (APNs)** | **Nu acum** | Cere contul Apple Developer plătit și nu aduce nimic în plus pentru reminderele zilnice, care se pot programa local |

### Reguli de proiectare

1. **Permisiunea se cere la momentul valorii:** după a doua sesiune terminată, cu un ecran care explică ce vei primi („Un reminder pe zi, la ora aleasă, cu ce e scadent”). iOS întreabă o singură dată; dacă refuzi, nu mai poate fi cerută din aplicație.
2. **Un singur reminder pe zi,** la ora aleasă de utilizator. Ora propusă este **ora ta obișnuită de exersare** (mediana orelor sesiunilor din ultimele 14 zile), altfel 19:00. Un reminder legat de un moment fix din zi este mai ușor de transformat în obicei decât unul vag.
3. **Doar când are sens:** reminderul de azi se anulează dacă ai exersat deja; se omite când nu e nimic scadent.
4. **Conținut concret și neutru, fără vinovăție:** „Planul de azi: ~12 întrebări, ~4 min. Cel mai urgent: Verbe cu prepoziții.” După o pauză lungă: „Ai ~40 de întrebări scadente. Începem cu 15 minute?” Fără amenințări cu pierderea seriei și fără „ți-e dor de noi”.
5. **Adaptare la ignorare:** după 3 remindere neatinse la rând, trecerea la o dată la 2 zile; după alte 3, o dată pe săptămână; revenirea la zilnic după prima sesiune. Persoana nu e hărțuită, iar permisiunea nu se pierde.
6. **Control complet:** în „Datele mele” → „Remindere”: activ / oprit, ora, zilele, pauză de 7 / 14 / 30 de zile, notificare de test. Categorii: **Plan zilnic** (implicit pornit după acord), **Liga** (implicit oprit), **Repere** (de exemplu „100 de întrebări stăpânite”; implicit oprit).
7. **O atingere deschide direct planul de azi.**
8. **Text compus pe telefon:** nicio dată de progres nu pleacă la terți.

### Cum se programează (propunere tehnică)

- Plugin `@capacitor/local-notifications` (permisiune, programare, anulare). La fiecare deschidere a aplicației și după fiecare sesiune, se anulează notificările programate și se programează cele **7 zile următoare** la ora aleasă (iOS acceptă maximum 64 de notificări locale programate).
- Textul fiecărei zile vine din **prognoza scadențelor** (versiune minimă a lui LJ-9): elementele deja scadente plus cele care ajung la scadență până în acea zi, plafonate la capacitatea zilnică. Zilele cu 0 scadente se sar.
- Textul se calculează **la programare, nu la afișare**: pe iOS o notificare locală nu își poate schimba conținutul fără ca aplicația să ruleze. De aceea cifrele se rotunjesc și apar cu „~”.
- Dacă aplicația nu se deschide 7 zile, reminderele se opresc după a 7-a zi, cu un singur mesaj blând la final („Reia de unde ai rămas”). În instalarea prin cablu cu semnare gratuită, aplicația oricum expiră după 7 zile.
- Setările se păstrează local; în faza 2, în profil (sincronizate între dispozitive).
- **E-mail zilnic (faza 4, opțional):** o funcție Edge ca cea săptămânală, doar pentru cei cu acord, o dată pe zi, doar dacă există scadente și nu ai exersat, cu link de dezabonare și oprire după 3 zile fără deschidere; se respectă limitele zilnice ale furnizorului de e-mail.

### Cum măsurăm

Rata de activare a permisiunii, rata de atingere a notificării, sesiuni începute în 60 de minute de la reminder, rata de dezactivare, zile active pe săptămână. **Criteriu de oprire:** dacă peste 10% dezactivează remindere în prima săptămână, frecvența implicită se reduce.

### Criterii de acceptare (remindere)

1. După a doua sesiune terminată apare ecranul explicativ, apoi cererea de permisiune a sistemului.
2. Pe iPhone apare o notificare de test în 5 secunde din „Datele mele”.
3. Cu reminderul activ, se programează cel mult un reminder pe zi, la ora aleasă, pentru următoarele 7 zile; zilele fără scadente nu au reminder.
4. După o sesiune terminată azi, reminderul de azi nu mai apare; mâine rămâne programat.
5. Atingerea notificării deschide „Planul tău de azi”.
6. Oprirea sau pauza anulează toate notificările programate.
7. După 3 remindere neatinse, frecvența scade conform regulii 5.

## 8. Interfață (schiță)

- **Pagina principală:** cardul „Repetiția de azi” existent este înlocuit de „Călătoria ta”, cu planul de azi sus și lista categoriilor dedesubt; „Repetiția de azi” vechi rămâne ca „Sesiune liberă” într-un loc mai discret. Pe iPhone: bare pe toată lățimea, text mare, buton „Începe planul de azi” fix sub plan, fără defilare orizontală.
- **Pagina unei teme:** o mică bară de necesar și textul „X scadente · ~Y min”, plus „Repetă ce e scadent”.
- **„Cum se calculează progresul”:** se adaugă o secțiune „Cum se calculează planul de azi” cu formulele din secțiunea 5, în limbaj simplu.
- **Prima utilizare / cont nou:** fără date, nu există scadente; cardul recomandă primele teme din nivelul A1–A2 și o sesiune scurtă de 10 întrebări.

## 9. Decizii deschise, cu recomandare

| # | Întrebare | Recomandare |
|---|---|---|
| D1 | Ce arată bara: **necesar** (scadente + restante) sau **retenția estimată** (cât de probabil mai știi azi)? | **Necesar.** Se explică ușor, se calculează din date existente; retenția estimată cere un model de uitare pe care nu îl putem valida acum |
| D2 | Capacitatea zilnică: minute sau număr de întrebări? | **Minute** (15 implicit), convertite în întrebări; o persoană înțelege „15 minute” mai ușor |
| D3 | Cât din plan poate fi conținut nou? | **Cel mult 30%**, doar dacă scadentele nu umplu capacitatea |
| D4 | Ce înseamnă „bara plină” | Necesar ≥ 50% din capacitatea zilnică; cifrele rămân vizibile oricum |
| D5 | Când se recomandă o categorie nouă? | Când cele deschise au ≥ 60% din elemente în consolidare sau stăpânite; fără blocarea celorlalte |
| D6 | Cum se tratează restanțele după absențe? | Plafon pe sesiune la C și distribuire pe zile; mesaj neutru (fără „ai restanțe de X zile”) |
| D7 | Se leagă planul de XP? | Da, doar informativ: „Elementele scadente aduc 15 XP în loc de 10”; fără bonus nou |
| D8 | Obiectivul zilnic se stochează pe server (profil)? | **Faza 2**, pentru sincronizare între dispozitive; local în faza 1 |
| D9 | „Călătoria” include și o hartă pe niveluri (A1 → B1) cu etape și jaloane? | **Faza 3**; fără blocare, doar recomandare |
| D10 | Nume în aplicație: „Călătoria ta”, „Planul tău” sau „Ce repeți azi”? | „**Planul tău de azi**” pentru card și „**Călătoria ta**” pentru pagina cu harta și prognoza, ca să nu promitem o hartă din prima zi |
| D11 | Primul canal de remindere | **Decis (2026-11-03):** **Notificări locale în aplicația iPhone**, apoi cardul din aplicație; e-mailul zilnic doar opțional |
| D12 | Ora implicită a reminderului | **Decis (2026-11-03):** **Ora obișnuită de exersare** din ultimele 14 zile, altfel 19:00 |
| D13 | Când se cere permisiunea | **Decis (2026-11-03):** **După a doua sesiune terminată**, cu ecran explicativ înainte |
| D14 | Adaptare la ignorare | **Decis (2026-11-03):** **Da**: 3 neatinse → la 2 zile → săptămânal; revine zilnic după o sesiune |
| D15 | Liga în remindere | **Decis (2026-11-03):** **Categorie separată**, implicit oprită |
| D16 | E-mail zilnic | **Decis (2026-11-03):** **Nu în prima versiune;** opțional în faza 4, doar cu consimțământ |

## 10. Faze propuse

| Faza | Conținut | Rezultat |
|---|---|---|
| 1 | LJ-1, LJ-2, LJ-3, LJ-4 (local), LJ-5, LJ-6, LJ-11, LJ-12 | Planul de azi și barele de necesar pe categorii, calculate local |
| 2 | LJ-7, LJ-8, LJ-10, D8 (obiectivul în profil, cu migrare în `supabase/schema.sql`) | Minute estimate pe baza vitezei tale, recomandarea categoriei noi, recuperare după absențe, obiectiv sincronizat |
| 3 | LJ-9, harta pe niveluri (D9) | Prognoza pe 7 zile și parcursul pe niveluri |
| 2b | LJ-13, LJ-15, LJ-16, LJ-17 (cu prognoza minimă din LJ-9) | Remindere zilnice prin notificări locale în aplicația iPhone |
| 4 | LJ-14, LJ-18 | Rezumat în e-mailul săptămânal și e-mail zilnic opțional, cu consimțământ |

**Cum măsurăm dacă ajută (după lansare):** (1) ponderea răspunsurilor corecte la elementele scadente (calibrare); (2) zile active pe săptămână; (3) cât din plan se termină; (4) restanțele medii pe utilizator; (5) retenția la 14 și la 30 de zile pe elementele din cutiile 3–5; compararea cu perioada de dinainte, cu grija utilizatorilor puțini.

## 11. Riscuri

| Risc | Impact | Reducere |
|---|---|---|
| Numărul mare de restanțe descurajează | Abandon | Plafon pe sesiune, mesaje neutre, „Recuperare: ~3 zile”, bară cu text, nu cu roșu agresiv |
| Estimarea minutelor greșită | Încredere scăzută | Valori implicite prudente, calcul din istoricul propriu, afișare cu „~” |
| Planul concurează cu „Repetiția de azi” și cu temele alese liber | Confuzie | „Sesiune liberă” păstrată; plan clar etichetat |
| Ordinea temelor noi nu se potrivește tuturor | Nemulțumire | Recomandare, nu blocare; utilizatorul poate alege orice temă |
| Intervalele standard nu se potrivesc tuturor | Retenție mai slabă la unii | Măsurăm; faza ulterioară poate ajusta intervalele pe utilizator |
| Suprapunere cu XP-ul ligii (stimulează volum) | Supraexersare | Planul pune un plafon de capacitate; XP-ul rămâne separat |
| Oboseala de notificări | Dezactivare sau refuzul permisiunii (iOS nu o mai cere) | Un singur reminder pe zi, adaptare la ignorare, ton neutru, cerere la momentul valorii, control complet |
| Textul notificării calculat la programare poate fi depășit | Cifre nepotrivite | Rotunjire cu „~”, reprogramare la fiecare deschidere și după fiecare sesiune |
| Aplicația cu semnare gratuită expiră după 7 zile | Reminderele se opresc cu aplicația | Notat în documentație; dispare cu un cont plătit sau la reinstalare |

## 12. Criterii de acceptare (faza 1)

1. Pe pagina principală apare „Planul tău de azi” cu numărul de întrebări și minutele estimate, iar butonul „Începe planul de azi” pornește o sesiune cu exact acele întrebări, amestecate între categorii.
2. Pentru fiecare categorie cu necesar > 0 apare o bară cu cifre și text; categoriile fără necesar apar ca „La zi”.
3. Ordinea categoriilor respectă prioritatea din secțiunea 5; un test automat (pe date de test) o verifică.
4. Fără date (cont nou), cardul recomandă primele teme și nu afișează bare goale ca erori.
5. Capacitatea zilnică se poate schimba și se păstrează la repornire.
6. Nicio modificare de server în faza 1; rezultatele sunt aceleași la reîncărcare.
7. 375 px și aplicația iPhone: fără defilare orizontală; contrast și text alternativ verificate.

## 13. Faza 1: stare implementare (2026-11-03)

**Confirmare:** utilizatorul a spus „Da, începe faza 1” după ce a văzut recomandările D1–D16; D1–D10 sunt deci aplicate așa cum sunt scrise în secțiunea 9.

**Ce s-a făcut** (LJ-1, LJ-2, LJ-3, LJ-4 local, LJ-5, LJ-6, LJ-11, LJ-12 parțial):

- **Cardul „Planul tău de azi”** pe pagina principală, înaintea cardului vechi, care se numește acum **„Sesiune liberă”** („Amestec din toate temele”; butonul „Începe sesiunea liberă”). Titlul arată întrebările și minutele („~47 de întrebări · ~15 min”), sub el motivul („47 scadente (12 restante). Încă 30 scadente rămân pentru mâine.”), apoi selectorul **Timp pe zi** (10 / 15 / 20 / 30 de minute, implicit 15; păstrat local în `deutsch-lj-cap-v1`, separat pe cont) și butonul **Începe planul de azi**.
- **Lista „Ce repeți, în ordinea priorității”:** primele 5 categorii, cu „Vezi toate cele 15 categorii”. Fiecare rând: titlu, nivelul, o bară segmentată (restante în portocaliu, scadente în verde; bara plină când necesarul egalează jumătate din capacitatea zilnică în întrebări), și textul „**12 scadente** · 12 restante · 6 slabe · ~4 min”, „**La zi** · următoarea repetare mâine” sau „**Nouă** · N întrebări · începe →”. Bara are `aria-hidden`, iar butonul are o etichetă cu cifrele.
- **Acțiuni:** un rând cu scadente pornește o sesiune doar cu scadentele acelei teme (cel mult cât încape în capacitate, restantele întâi); „La zi” și „Nouă” deschid pagina temei.
- **Planul** (funcția `ljPlan`): scadentele, **restantele întâi** (cea mai veche prima), apoi cutia cea mai mică; cel mult **40%** dintr-o categorie cât timp mai există altele cu scadente (dacă rămâne loc după ce celelalte s-au epuizat, plafonul nu se mai aplică); apoi cel mult **30%** întrebări noi, din **prima categorie începută care mai are întrebări noi**, altfel din prima categorie în ordinea nivelurilor; planul final se amestecă. Capacitatea în întrebări = timp pe zi / timp mediu pe întrebare (mediana din ultimele 10 sesiuni cu durată, între 8 și 60 s, implicit 20 s).
- **Priorități** (funcția `ljRank`): categorii cu restanțe (cea mai veche restanță prima) → cu scadente (mai multe slabe, apoi mai multe scadente) → la zi (următoarea repetare cea mai apropiată) → noi; la egalitate, ordinea nivelurilor.
- **Ghidul „Cum se calculează”** are acum și blocul „Cum se calculează planul de azi” (scadent, restant, slabă, timp pe zi, ordinea, întrebări noi, rămase pentru mâine, priorități), deschis din cardul planului.
- **Fără server:** totul se calculează în aplicație din `progress` și istoric; fără modificări în Supabase.

**Verificat în browser:** 21 de asertări pe date sintetice (cont nou, 100 de scadente într-o categorie și 3 în alta, trei categorii cu plafonul de 40%, restanțele care intră toate, totul la zi, ordinea priorităților, timpul mediu cu limitele 8–60 s) trec; interfața: schimbarea capacității (se păstrează), „Vezi toate”, un rând de necesar care pornește sesiunea corectă (toate întrebările din tema respectivă și scadente), „La zi” care deschide tema, „Începe planul de azi” cu un amestec de categorii și cel mult capacitatea, cont nou și „Ești la zi”; link spre ghid; la 375 px fără defilare orizontală.

**Diferențe față de text / alegeri făcute:** (1) categoria nouă din plan nu aplică încă pragul de 60% din LJ-8, ci „prima începută cu întrebări noi” (pragul vine în faza 2); (2) la o capacitate mare și puține scadente, planul conține doar 30% întrebări noi, restul se face din „Sesiunea liberă”; (3) în plan, la valori egale ale cutiei și scadenței, ordinea între categorii urmează ordinea nivelurilor; cu date reale scadențele diferă, deci amestecul rezultă din ele și din plafonul de 40%.

**Neverificat:** pe iPhone real (aplicația nativă primește modificarea prin actualizarea automată, la a doua pornire după publicare); cu un cont conectat și date reale; efectul asupra obiceiurilor (măsurătorile din secțiunea 10 se fac după câteva săptămâni de utilizare).

**Rămâne pentru fazele următoare:** minute estimate pe categorie cu viteza proprie la nivel de categorie, pragul pentru categoria nouă, „Recuperare” după absențe, obiectivul în profil (faza 2); prognoza pe 7 zile și harta pe niveluri (faza 3); remindere (faza 2b); e-mailuri (faza 4).

### Aranjarea paginii principale (modificat 2026-11-03, la cererea utilizatorului)

- **Coloana din stânga** (ce faci acum): cardul de recapitulare săptămânală (luni, când există), „Planul tău de azi” și „Sesiune liberă”.
- **Coloana din dreapta** (cum stai): **„Progresul tău”** (cifrele), **„Liga ta”** (mutată din stânga, deasupra timpului), apoi un card cu **„Timp de exersare”**, „Sesiuni recente” și, la sfârșit, butoanele Exportă / Importă / Resetează cu nota despre salvare.
- **Pe telefon** (o singură coloană), ordinea este: recapitulare, planul, sesiunea liberă, progres, ligă, timp și sesiuni, butoane. Fără defilare orizontală.
- **Motiv:** după adăugarea planului, coloana din stânga s-a lungit, iar liga ajungea sub marginea ecranului; în dreapta se vede toată, lângă informațiile de același fel (XP, timp, sesiuni).
- **Tehnic:** elementele își păstrează identificatorii (`leagueCard`, `progressStats`, `timeStats`, `history`, `exportP` etc.); cardul din dreapta a fost împărțit în două (`progressCard` și cardul cu timpul), iar coloana are clasa `rightcol`. Codul ligii nu s-a schimbat.

## 14. Faza 2: stare implementare (2026-11-03)

**Ce s-a făcut** (LJ-7, LJ-8, LJ-10, D8, plus legenda cerută după feedback):

- **Obiectivul zilnic în profil (D8):** coloana nouă `profiles.daily_minutes` (smallint, null sau 10 / 15 / 20 / 30), migrarea `profiles_daily_minutes` aplicată în Supabase și scrisă în `supabase/schema.sql`, secțiunea 14; utilizatorii o pot scrie doar pe ea (drepturi pe coloană; `role` rămâne protejat). În cont, valoarea din profil are prioritate și se sincronizează între dispozitive; fără cont rămâne locală. La prima autentificare, dacă profilul nu are valoare, dar există una aleasă local (alta decât 15), se trimite în profil.
- **Stabilitate și „Ce urmează” (LJ-8, D5):** o categorie începută este **stabilă** când cel puțin **60% din întrebările începute** sunt în consolidare sau stăpânite (treapta ≥ 2), după cel puțin 5 întrebări începute (sau toate, dacă are mai puține). Clarificare față de textul inițial: se numără întrebările **începute**, nu toate întrebările categoriei, altfel o categorie de 500 de substantive n-ar deveni niciodată stabilă. Recomandările: la început, prima categorie; cât timp există categorii începute nestabile, **„De consolidat”** (cea mai puțin stabilă); când toate cele începute sunt stabile, **„Ce urmează”** (următoarea categorie neînceput, în ordinea nivelurilor). Fără blocare: orice temă se poate deschide oricând.
- **Întrebările noi din plan:** vin din categoria recomandată când e „start” sau „open”; în starea „consolidate” rămân din prima categorie începută care mai are întrebări noi (regula din faza 1).
- **Viteza pe categorie:** minutele fiecărei categorii folosesc mediana vitezei din sesiunile ei (cel puțin 2), altfel media generală; planul se **umple după timp** (fiecare întrebare costă timpul categoriei ei), cu capacitatea în întrebări rămasă pentru plafonul de 40% și 30%.
- **Recuperare (LJ-10, D6):** dacă ultima sesiune a fost acum 3 zile sau mai mult și există scadente, planul începe cu „Bine ai revenit! Începem cu o parte din ce s-a adunat”; când restul nu încape, cardul spune „în ritmul de azi, tot ce e scadent acum se termină în ~N zile”, fără formule de vinovăție.
- **Legenda** „Scadentă / Restantă / Slabă” sub lista de categorii, și explicații noi în ghidul „Cum se calculează”.

**Verificat:** 25 de asertări pe date sintetice trec (cont nou, nestabil → consolidate, 70% stabil → open cu întrebări noi din categoria recomandată, pragul de exact 60%, minimul de 5 întrebări, toate stabile → fără recomandare, cea mai puțin stabilă prima, bugetul de timp cu viteze diferite, viteza pe categorie, „Bine ai revenit”, estimarea în zile, vizibilitatea blocurilor „Ce urmează” și „De consolidat”, butonul care deschide categoria); 7 asertări pentru sincronizarea obiectivului (scriere în profil, prioritatea profilului, migrarea de la local, ignorarea valorilor invalide); în baza de date, într-o tranzacție anulată: scrierea valorii 20, respingerea valorii 25, upsert-ul din aplicație și protecția coloanei `role`; la 375 px fără defilare orizontală.

**Neverificat:** cu contul real (sincronizarea obiectivului între browser și iPhone), pe iPhone; efectul asupra obiceiurilor (măsurătorile din secțiunea 10).

**Rămâne:** faza 2b (remindere locale în aplicația iPhone), faza 3 (prognoza pe 7 zile și harta pe niveluri), faza 4 (e-mail).

