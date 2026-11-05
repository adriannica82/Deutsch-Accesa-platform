# Raportarea greșelilor din întrebări · cerințe și flux de verificare

**Status:** implementat și verificat (2026-11-05).

## 1. Cererea utilizatorului (cuvintele lui, 2026-11-05)

„Aș dori să am pe fiecare răspuns posibilitatea să reclam greșeala gramaticală. Toate aceste greșeli trebuie logate în baza de date unde poți să-ți solicit să faci verificări.”

## 2. Ce face

- **După fiecare răspuns** (feedback imediat) și **la fiecare întrebare din recapitulări** (rezultatele unui test, mod examen, „Sesiuni recente”) apare linkul **„Raportează o greșeală”**. Se deschide un formular mic:
  - **Ce nu e în regulă?** (obligatoriu, una din 5): *Greșeală gramaticală sau de limbă (germană)* (implicit), *Traducerea în română*, *Răspuns corect greșit sau ambiguu*, *Explicația*, *Altceva*.
  - **Detalii** (opțional, până la 600 de caractere): „ce ar trebui să fie corect?”.
  - Butonul **„Trimite raportul”**; apoi apare „✓ Raport trimis. Mulțumesc! Îl voi verifica.”, iar întrebarea rămâne marcată „Ai raportat deja” (pe acest dispozitiv).
- **Doar în cont:** în versiunea locală (fără cont) linkul nu apare, pentru că rapoartele merg în baza de date.
- **Offline:** raportul intră în aceeași coadă de trimitere ca răspunsurile și pleacă la revenirea rețelei.
- **Nu deranjează testul:** Enter și cifrele nu sunt interceptate în câmpurile formularului; formularul stă într-un `details`, închis până la apăsare.

## 3. Ce se salvează (tabela `content_reports`, Supabase)

| Coloană | Conținut |
|---|---|
| `id`, `created_at` | identificator și momentul raportului |
| `user_id` | cine a raportat (se leagă de `auth.users`, deci poți afla e-mailul) |
| `topic_id`, `item_id` | întrebarea raportată (de ex. `vocabular-b1` și `v1-der-beruf`) |
| `category` | `grammar`, `translation`, `answer`, `explanation`, `other` |
| `comment` | detaliile scrise de utilizator |
| `given` | răspunsul dat de utilizator la acea întrebare |
| `snapshot` | **copia întrebării** la momentul raportului: propoziția, răspunsul, variantele acceptate, traducerea, explicația, eticheta, sensul, variantele de răspuns, tema |
| `app_version` | versiunea aplicației (data din `version.json`) |
| `status` | `new` (implicit), `confirmed`, `fixed`, `rejected`, `duplicate` |
| `resolution`, `resolved_at` | ce s-a hotărât și când (scrise de mine la verificare) |

**Securitate:** fiecare utilizator poate **adăuga** rapoarte (doar în numele lui) și **vedea doar rapoartele lui**; nu poate modifica, șterge sau scrie starea. Limită: **50 de rapoarte pe zi** pe utilizator (declanșator în baza de date). Copia întrebării are cel mult 8 KB. Schema: `supabase/schema.sql`, secțiunea 15.

## 4. Cum le verificăm (fluxul tău cu mine)

1. **Îmi ceri:** „verifică rapoartele noi”.
2. **Eu citesc** rapoartele cu starea `new`, cu e-mailul celui care a raportat, categoria, comentariul, ce a răspuns și copia întrebării.
3. **Pentru fiecare raport** compar cu conținutul curent din `content/*.json` și hotărăsc:
   - **`fixed`:** am corectat în conținut (propoziție, traducere, explicație, variante, sinonime acceptate); rulez `build.py`, public și scriu în `resolution` ce am schimbat;
   - **`rejected`:** conținutul e corect; scriu motivul (de exemplu regula gramaticală), ca să îl poți spune celui care a raportat;
   - **`confirmed`:** problema e reală, dar cere o decizie de-a ta (de exemplu două variante corecte, de ales);
   - **`duplicate`:** același lucru ca un alt raport.
4. **Îți dau un rezumat:** ce am corectat, ce am respins și de ce, ce așteaptă decizia ta. Modificările de conținut ajung pe iPhone prin actualizarea automată.

**Interogarea de bază** (o rulez eu; o poți rula și tu în Supabase, la SQL):

```sql
select r.created_at, u.email, r.topic_id, r.item_id, r.category, r.comment, r.given, r.snapshot
from public.content_reports r join auth.users u on u.id = r.user_id
where r.status = 'new' order by r.created_at;
```

## 5. Verificat

- **Baza de date** (în tranzacții anulate, cu rolul utilizatorului): inserarea validă merge; utilizatorul vede doar rândurile lui; categoria invalidă, copia peste 8 KB, scrierea statusului la inserare, modificarea, ștergerea și inserarea pentru alt utilizator sunt respinse; a 51-a inserare într-o zi este respinsă.
- **Aplicația** (în browser, cu cont simulat): linkul nu apare fără cont; apare după răspuns, închis; 5 categorii (prima bifată); Enter în câmpul de text nu avansează; trimiterea pune în coadă exact un rând cu tema, întrebarea, categoria, comentariul, răspunsul dat și copia întrebării, fără `user_id` / `status`; confirmarea înlocuiește formularul; întrebarea apare „raportată”; în recapitularea de la mod examen fiecare răspuns are formular, iar trimiterea merge pentru cel ales; coada acceptă tipul nou (POST la `/rest/v1/content_reports`; 500 → reîncercare, 400 → renunțare); la 375 px formularul încape, fără defilare orizontală.
- **Neverificat:** cu un cont real (trimiterea efectivă și rândul apărut în baza de date), pe iPhone.

## 6. Extinderi posibile

- Un ecran în panoul de administrare, cu rapoartele, filtre după stare și temă, și butoane pentru stare.
- Răspuns către utilizator („am corectat, mulțumesc”) în aplicație sau pe e-mail.
- Raportarea cuvintelor din „Fișa de recapitulare” (nu doar din test).
- Contor al rapoartelor pe întrebare, ca să apară primele cele raportate de mai mulți.
