features backlog:

feature 1: in zona "progresul tau" exportul se va face in md file.

- **Status:** implementat (2026-10-28, commit `bba0e3e`)
- **Ce face acum:** butonul **Exportă (.md)** descarcă `progres-deutsch-AAAA-LL-ZZ.md`, un raport Markdown cu: rezumat (câte întrebări sunt noi / în învățare / consolidare / stăpânite și câte sunt de repetat), tabel pe teme, sesiuni recente, puncte slabe (până la 50) și, la final, blocul „Date pentru import”.
- **Import:** butonul **Importă** citește noul fișier `.md` (extrage blocul `json` de la sfârșit) și, pentru compatibilitate, fișierele `.json` exportate înainte. În cont, importul combină progresul (rămâne varianta cea mai recentă); fără cont, îl înlocuiește.
- **Observație:** blocul „Date pentru import” nu trebuie modificat; fără el, fișierul rămâne un raport de citit, dar nu mai poate fi importat.
- **Fișiere modificate:** `src/app.js` (funcțiile `exportMarkdown` și `parseImport`), `src/template.html` (eticheta butonului și tipurile de fișier acceptate), `README.md`; regenerat `deutsch.html`.
- **Verificare:** exportul conține toate secțiunile; datele revin identice la import (cutii, scadențe, sesiuni) atât prin funcție, cât și prin butonul „Importă” cu un fișier `.md`; fișierul `.json` vechi se importă în continuare; un fișier invalid dă mesajul de eroare.
