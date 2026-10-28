features backlog:

feature 1: in zona "progresul tau" exportul se va face in md file.

- **Status:** implementat (2026-10-28, commit `bba0e3e`)
- **Ce face acum:** butonul **Exportă (.md)** descarcă `progres-deutsch-AAAA-LL-ZZ.md`, un raport Markdown cu: rezumat (câte întrebări sunt noi / în învățare / consolidare / stăpânite și câte sunt de repetat), tabel pe teme, sesiuni recente, puncte slabe (până la 50) și, la final, blocul „Date pentru import”.
- **Import:** butonul **Importă** citește noul fișier `.md` (extrage blocul `json` de la sfârșit) și, pentru compatibilitate, fișierele `.json` exportate înainte. În cont, importul combină progresul (rămâne varianta cea mai recentă); fără cont, îl înlocuiește.
- **Observație:** blocul „Date pentru import” nu trebuie modificat; fără el, fișierul rămâne un raport de citit, dar nu mai poate fi importat.
- **Fișiere modificate:** `src/app.js` (funcțiile `exportMarkdown` și `parseImport`), `src/template.html` (eticheta butonului și tipurile de fișier acceptate), `README.md`; regenerat `deutsch.html`.
- **Verificare:** exportul conține toate secțiunile; datele revin identice la import (cutii, scadențe, sesiuni) atât prin funcție, cât și prin butonul „Importă” cu un fișier `.md`; fișierul `.json` vechi se importă în continuare; un fișier invalid dă mesajul de eroare.

feature 2: adauga mai multe substantive in lista de "Der, die sau das" specifice pentru nivel A1-A2 pana la 200.

- **Status:** implementat (2026-10-28, commit `d71d968`)
- **Ce s-a schimbat:** tema „Der, die sau das?” (A1–A2) are acum exact **200 de substantive** (înainte 39). Cele 161 noi sunt de nivel A1–A2, fiecare cu articol, plural, traducere și explicație în română.
- **Cum sunt grupate (28 de grupe, filtrul „Regula”):** pe terminații (-ung, -heit/-keit, -schaft, -ion/-tät, -ei/-ik/-in, -ur, -ie/-age/-thek, -e, -chen, -ment/-um, -o/-nis, infinitiv ca substantiv, -ling, -er, -el/-en, Ge-, timp și vreme), cu grupe separate pentru excepții (de ex. `die Mutter`, `das Zimmer`, `die Gabel`, `der Junge`, `das Auge`) și pe teme pentru cuvintele fără regulă (familie, casă, mâncare, natură, oraș, corp și haine, școală și muncă).
- **Modificări față de varianta veche:** cele 3 substantive din grupa „Fără regulă · de memorat” (`das Auto`, `der Käse`, `die Butter`) au fost mutate în grupele tematice; identificatorii întrebărilor nu s-au schimbat, deci progresul salvat rămâne. Ghidul temei și rezumatul au fost actualizate.
- **Fișiere modificate:** `content/artikel-genus.json`; regenerat `deutsch.html`.
- **Verificare:** toate cele 200 de întrebări sunt acceptate în modul „alege” și în modul „scrie”; `build.py` validează conținutul (traduceri și explicații obligatorii); nicio dublură de substantiv în temă.
- **De știut:** genul și pluralul le-am verificat cu atenție, dar o a doua lectură a listei de către un vorbitor nativ sau cu un dicționar este recomandată.

feature 3: adauga o categorie noua "Der, die sau das" cu substantive specifie B1.

- **Status:** implementat (2026-10-28, commit `d71d968`)
- **Ce s-a creat:** tema nouă **„Der, die sau das? (B1)”**, nivel B1, cu **166 de substantive** specifice acestui nivel (cerința nu preciza un număr, așa că am ales un volum apropiat de tema A1–A2). Apare în pagina principală după temele A2–B1, în ordinea nivelurilor.
- **Conținut (16 grupe):** terminații abstracte (-ung, -heit/-keit, -schaft, -ion/-tät, -ik/-ei/-ie, -enz/-anz, -ment/-um/-nis), persoane masculine în -ist/-ent/-ant/-at, -er (persoane și aparate), Ge-, substantive formate din rădăcina unui verb (`der Beitrag`, `der Vertrag`), **substantive compuse** (genul ultimului cuvânt: `der Arbeitsplatz`, `die Steuererklärung`) și vocabular pe teme: media și tehnologie, sănătate și corp, mediu și societate, muncă și bani.
- **Fără suprapuneri:** niciun substantiv din tema B1 nu apare și în tema A1–A2 (verificat automat la generare și în pagină).
- **Fișiere modificate:** `content/artikel-genus-b1.json` (nou); regenerat `deutsch.html`.
- **Verificare:** toate cele 166 de întrebări sunt acceptate în modul „alege” și „scrie”; temele sunt sortate A1–A2, A2, A2–B1, B1.
- **De știut:** dacă vrei alt volum (mai multe sau mai puține substantive) sau alte domenii (de ex. politică, călătorii), spune-mi și completez lista.
