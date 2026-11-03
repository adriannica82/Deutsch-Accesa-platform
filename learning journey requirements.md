# „Călătoria ta de învățare” · recomandări de repetare și bară de efort pe categorie · cerințe

**Status:** definit (2026-11-03), neimplementat. Documentul cere decizii (secțiunea 9) înainte de prima sarcină.

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
| LJ-13 | Reamintire zilnică (notificare locală în aplicația iPhone, IOS-3.2) cu numărul scadentelor | C |
| LJ-14 | Rezumat în e-mailul săptămânal: „ce ai de repetat săptămâna viitoare” | C |

M = obligatoriu pentru prima versiune, S = recomandat, C = opțional.

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

## 10. Faze propuse

| Faza | Conținut | Rezultat |
|---|---|---|
| 1 | LJ-1, LJ-2, LJ-3, LJ-4 (local), LJ-5, LJ-6, LJ-11, LJ-12 | Planul de azi și barele de necesar pe categorii, calculate local |
| 2 | LJ-7, LJ-8, LJ-10, D8 (obiectivul în profil, cu migrare în `supabase/schema.sql`) | Minute estimate pe baza vitezei tale, recomandarea categoriei noi, recuperare după absențe, obiectiv sincronizat |
| 3 | LJ-9, harta pe niveluri (D9) | Prognoza pe 7 zile și parcursul pe niveluri |
| 4 | LJ-13, LJ-14 | Reamintire zilnică în aplicația iPhone și rezumat în e-mailul săptămânal |

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

## 12. Criterii de acceptare (faza 1)

1. Pe pagina principală apare „Planul tău de azi” cu numărul de întrebări și minutele estimate, iar butonul „Începe planul de azi” pornește o sesiune cu exact acele întrebări, amestecate între categorii.
2. Pentru fiecare categorie cu necesar > 0 apare o bară cu cifre și text; categoriile fără necesar apar ca „La zi”.
3. Ordinea categoriilor respectă prioritatea din secțiunea 5; un test automat (pe date de test) o verifică.
4. Fără date (cont nou), cardul recomandă primele teme și nu afișează bare goale ca erori.
5. Capacitatea zilnică se poate schimba și se păstrează la repornire.
6. Nicio modificare de server în faza 1; rezultatele sunt aceleași la reîncărcare.
7. 375 px și aplicația iPhone: fără defilare orizontală; contrast și text alternativ verificate.
