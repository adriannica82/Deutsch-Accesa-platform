# Deutsch-Accesa-platform

Platformă offline pentru exersarea limbii germane (A1–B1), cu traduceri și explicații în română,
întrebări cu alegere sau scriere, și repetare spațiată. Rezultatul este un singur fișier HTML.

## Structură

| Cale | Rol |
|---|---|
| `content/*.json` | Temele și întrebările (un fișier per temă) |
| `src/template.html`, `src/style.css`, `src/app.js` | Pagina, stilurile și motorul aplicației |
| `build.py` | Validează conținutul și generează `deutsch.html` |
| `deutsch.html` | Aplicația gata de folosit (deschide-l direct în browser) |
| `test_verbe_prepozitii.html` | Prima versiune: testul „Verbe cu prepoziții” |

## Construire

```bash
python3 build.py          # validează și scrie deutsch.html
python3 build.py --check  # doar validează
```

Fiecare întrebare trebuie să aibă traducere (`ro`) și explicație (`explain`) în română; validarea se oprește dacă lipsesc.
Editează conținutul în `content/` și `src/`, nu în `deutsch.html` (fișier generat).
Progresul se salvează în `localStorage`, doar în browserul folosit.
