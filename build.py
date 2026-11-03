#!/usr/bin/env python3
"""Construiește deutsch.html (un singur fișier, funcționează offline) din:

  content/*.json      o temă pe fișier (aici adaugi și corectezi întrebările)
  src/template.html   structura paginii
  src/style.css       stilurile
  src/app.js          motorul (teste, repetare spațiată, progres, cont și sincronizare)
  config.json         (opțional) url și cheia publică Supabase; fără el aplicația rămâne locală

Rulare:   python3 build.py          validează conținutul și scrie deutsch.html
          python3 build.py --check  doar validează

Fiecare întrebare trebuie să aibă traducere (ro) și explicație (explain) în română;
validarea se oprește dacă lipsesc.
"""
import glob
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.abspath(__file__))
MODES = {"choice", "write", "both"}
ID_RE = re.compile(r"^[a-z0-9_-]+$")
BAD_DIACRITICS = "şţŞŢ"  # cu sedilă; în română se folosesc ș ț (virgulă dedesubt)


LEVELS = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6}
# Liga: multiplicatorul de XP după nivelul temei (vezi „weekly league requirements.md”, secțiunea 10).
LEVEL_XP = {"A1": 1.0, "A1–A2": 1.0, "A2": 1.25, "A2–B1": 1.5, "B1": 2.0, "B1–B2": 2.5, "B2": 3.0}


def xp_multiplier(topic):
    """Valoarea din câmpul opțional „xpMultiplier” sau, altfel, cea din tabelul LEVEL_XP."""
    return topic["xpMultiplier"] if "xpMultiplier" in topic else LEVEL_XP[topic["level"]]


def level_key(level):
    """Ordinea temelor: nivelul cel mai mic, apoi cel mai mare (A1–A2 înaintea lui A2), apoi câmpul order."""
    found = [LEVELS[x] for x in re.findall(r"[ABC][12]", str(level))]
    return (min(found), max(found)) if found else (99, 99)


def canon(s):
    s = s.strip().lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    s = re.sub(r"[.,!?;:„“”\"]", "", s)
    return re.sub(r"\s+", " ", s)


GUIDE_HIGHLIGHT = {"prep-article", "adjective", "prep", "conj", "partizip"}
PERSONS = {"ich", "du", "er", "wir", "ihr", "sie"}
GENDERS = {"m", "n", "f", "pl"}


class GuideMarks(HTMLParser):
    """Adună din guideHtml marcajele folosite de blocul „Din fișă” din test:
    data-prep (prepoziții), data-cell (celulele tabelelor, cu textul lor, pe tipul de tabel data-t)
    rândurile tabelelor de conjugare (tr data-row), cu celulele lor pe persoane, verbele din tabelele de tipare
    (span data-v, pe rândul lor) și paragrafele data-ge (poziția lui ge-) și data-aux (haben / sein)."""

    def __init__(self):
        super().__init__()
        self.preps, self.cells, self.rows, self.verbs, self.ge, self.aux = set(), {}, {}, {}, set(), set()
        self._table, self._row, self._cell, self._verb = "", None, None, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "table":
            self._table = a.get("data-t", "")
        if tag == "tr":
            self._row = a.get("data-row")
        if "data-prep" in a:
            self.preps.add(a["data-prep"])
        if "data-ge" in a:
            self.ge.add(a["data-ge"])
        if "data-aux" in a:
            self.aux.add(a["data-aux"])
        if tag == "span" and "data-v" in a and self._row is not None:
            self._verb = (self._table, self._row, a["data-v"])
            self.verbs.setdefault((self._table, self._row), {})[a["data-v"]] = ""
        if tag == "td" and "data-cell" in a:
            if self._row is not None:
                self._cell = (self._table, self._row, a["data-cell"])
                self.rows.setdefault((self._table, self._row), {})[a["data-cell"]] = ""
            else:
                self._cell = (self._table, a["data-cell"])
                self.cells[self._cell] = ""

    def handle_endtag(self, tag):
        if tag == "span":
            self._verb = None
        if tag == "td":
            self._cell = None
        if tag == "tr":
            self._row = None

    def handle_data(self, data):
        if self._verb is not None:
            self.verbs[self._verb[:2]][self._verb[2]] += data
        c = self._cell
        if c is None:
            return
        if len(c) == 3:
            self.rows[(c[0], c[1])][c[2]] += data
        else:
            self.cells[c] += data


def check_guide_highlight(t, it, marks, where, err):
    """Fiecare întrebare dintr-o temă cu guideHighlight trebuie să aibă celula/prepoziția ei în fișă."""
    kind = t["guideHighlight"]
    if kind == "prep":
        if it.get("answer") not in marks.preps:
            err(where, f"prepoziția „{it.get('answer')}” nu este marcată (data-prep) în fișa temei")
        return
    if kind == "conj":
        pers = it.get("pers")
        if pers is None:
            return  # întrebarea nu are persoană (de ex. alege infinitivul): fără bloc
        if pers not in PERSONS:
            err(where, f"„pers” trebuie să fie unul din {sorted(PERSONS)}")
            return
        by_group = [(k, c) for k, c in marks.rows.items() if k[1] == it.get("group")]
        if by_group:
            (table, _), cells = by_group[0]
            if table == "pattern":
                if pers not in cells:
                    err(where, f"tabelul „{table}” nu are coloana „{pers}”")
                return
        else:
            by_group = [(k, c) for k, c in marks.rows.items() if k[0] != "pattern" and canon(c.get(pers, "")) == canon(it["answer"])]
            if len(by_group) != 1:
                err(where, f"răspunsul „{it['answer']}” la persoana „{pers}” trebuie să apară în exact un rând al fișei (apare în {len(by_group)})")
                return
            cells = by_group[0][1]
        if canon(cells.get(pers, "")) != canon(it["answer"]):
            err(where, f"persoana „{pers}” duce la „{cells.get(pers, '').strip()}”, dar răspunsul este „{it['answer']}”")
        return
    if kind == "partizip":
        vk = it.get("key") or it.get("id")
        pat = it.get("pat")
        rows = {r: v for (tb, r), v in marks.verbs.items() if tb == "pat"}
        if pat not in rows:
            err(where, f"„pat” (rândul din tabelul de tipare) trebuie să fie unul din {sorted(rows)}")
            return
        where_v = [r for r, v in rows.items() if vk in v]
        if where_v != [pat]:
            err(where, f"verbul „{vk}” trebuie să apară în exact un rând al tabelului, cel din „pat” ({pat}); apare în {where_v}")
            return
        text = rows[pat][vk].split()
        participle = it["answer"].split()[-1]
        if it["answer"] not in ("haben", "sein") and (not text or canon(text[-1]) != canon(participle)):
            err(where, f"fișa dă pentru „{vk}” participiul „{text[-1] if text else ''}”, dar răspunsul se termină în „{participle}”")
        aux = it.get("aux")
        if marks.aux:
            if aux not in marks.aux:
                err(where, f"„aux” (haben / sein) lipsește sau nu are paragraf data-aux în fișă; fișa are {sorted(marks.aux)}")
            elif ("ist" in text) != (aux == "sein"):
                err(where, f"„aux” este {aux}, dar în fișă verbul „{vk}” {'are' if 'ist' in text else 'nu are'} „ist”")
            if it["answer"] in ("haben", "sein") and it["answer"] != aux:
                err(where, f"răspunsul „{it['answer']}” nu se potrivește cu „aux” ({aux})")
        if marks.ge and it.get("ge") not in marks.ge:
            err(where, f"„ge” trebuie să fie unul din {sorted(marks.ge)}")
        pers = it.get("pers")
        if pers is not None:
            conj = marks.rows.get(("conj", aux))
            if pers not in PERSONS or not conj:
                err(where, f"„pers” trebuie să fie unul din {sorted(PERSONS)}, iar fișa trebuie să aibă tabelul de conjugare pentru {aux}")
            elif canon(conj.get(pers, "")) != canon(it["answer"].split()[0]):
                err(where, f"persoana „{pers}” duce la „{conj.get(pers, '').strip()}”, dar răspunsul începe cu „{it['answer'].split()[0]}”")
        return
    if kind == "prep-article":
        if not any(w.lower() in marks.preps for w in it.get("label", "").split()):
            err(where, "nicio prepoziție din „label” nu este marcată (data-prep) în fișa temei")
        gen = it.get("gen")
        case = {"Akkusativ": "akk", "Dativ": "dat"}.get(it.get("extra"))
        if gen not in GENDERS or not case:
            err(where, "„gen” (m, n, f, pl) și „extra” (Akkusativ/Dativ) sunt obligatorii pentru evidențierea din fișă")
            return
        text = marks.cells.get(("", f"{case}-{gen}"))
        if text is None:
            err(where, f"fișa nu are celula {case}-{gen}")
        elif canon(text).split(" ")[0] != canon(it["answer"]):
            err(where, f"„gen” {gen} duce la celula „{text.strip()}”, dar răspunsul este „{it['answer']}”")
        return
    # adjective
    art, case, gen = it.get("art"), it.get("caz"), it.get("gen")
    if art not in ("def", "ndef", "non") or case not in ("nom", "akk", "dat") or gen not in GENDERS:
        err(where, "„art” (def/ndef/non), „caz” (nom/akk/dat) și „gen” (m, n, f, pl) sunt obligatorii pentru evidențierea din fișă")
        return
    text = marks.cells.get((art, f"{case}-{gen}"))
    if text is None:
        err(where, f"fișa nu are celula {art} {case}-{gen}")
    elif not canon(it["answer"]).endswith(canon(text).lstrip("-")):
        err(where, f"celula {art} {case}-{gen} are terminația „{text.strip()}”, dar răspunsul este „{it['answer']}”")


def validate(topics):
    errors, warnings = [], []
    ids = set()

    def err(t, msg):
        errors.append(f"[{t}] {msg}")

    for t in topics:
        tid = t.get("id", "?")
        for k in ("id", "title", "level", "summary", "answerNoun", "instruction"):
            if not isinstance(t.get(k), str) or not t[k].strip():
                err(tid, f"lipsește câmpul „{k}”")
        if tid in ids:
            err(tid, "id de temă duplicat")
        ids.add(tid)
        if t.get("level") not in LEVEL_XP and "xpMultiplier" not in t:
            err(tid, f"nivelul „{t.get('level')}” nu are multiplicator XP; folosește unul din {list(LEVEL_XP)} sau adaugă „xpMultiplier”")
        if "xpMultiplier" in t and not (isinstance(t["xpMultiplier"], (int, float)) and not isinstance(t["xpMultiplier"], bool) and 0.5 <= t["xpMultiplier"] <= 5):
            err(tid, "„xpMultiplier” trebuie să fie un număr între 0,5 și 5")
        if not re.findall(r"[ABC][12]", str(t.get("level", ""))):
            err(tid, "„level” trebuie să conțină un nivel (A1, A2, B1, B2…), ex. \"A2–B1\"")
        if not isinstance(t.get("order"), int):
            err(tid, "„order” trebuie să fie număr întreg")
        if not (isinstance(t.get("unit"), list) and len(t["unit"]) == 2):
            err(tid, "„unit” trebuie să fie [singular, plural], ex. [\"construcție\", \"construcții\"]")
        modes = t.get("modes") or []
        if not modes or not set(modes) <= MODES:
            err(tid, f"„modes” trebuie să conțină doar {sorted(MODES)}")
        extra = t.get("extra")
        if "both" in modes and not (extra and extra.get("label") and len(extra.get("options", [])) >= 2):
            err(tid, "modul „both” cere „extra”: {label, options[≥2]}")
        groups = t.get("groups")
        if groups and not t.get("groupLabel"):
            err(tid, "„groups” cere și „groupLabel”")
        if t.get("guideHtml") and not t.get("guideTitle"):
            err(tid, "„guideHtml” cere și „guideTitle”")
        items = t.get("items") or []
        if not items:
            err(tid, "nu are întrebări")
        seen = set()
        pool = t.get("pool") or []
        marks = None
        if t.get("guideHighlight") is not None:
            if t["guideHighlight"] not in GUIDE_HIGHLIGHT:
                err(tid, f"„guideHighlight” trebuie să fie unul din {sorted(GUIDE_HIGHLIGHT)}")
            elif not t.get("guideHtml"):
                err(tid, "„guideHighlight” cere o fișă („guideHtml”)")
            else:
                marks = GuideMarks()
                marks.feed(t["guideHtml"])
        for it in items:
            iid = it.get("id", "?")
            where = f"{tid}/{iid}"
            if not ID_RE.match(str(iid)):
                err(where, "id invalid (doar a-z, 0-9, _ și -)")
            if iid in seen:
                err(where, "id duplicat în temă")
            seen.add(iid)
            for k in ("prompt", "ro", "answer", "explain"):
                if not isinstance(it.get(k), str) or not it[k].strip():
                    err(where, f"lipsește „{k}” (traducerea și explicația în română sunt obligatorii)")
            if it.get("prompt", "").count("___") != 1:
                err(where, "„prompt” trebuie să conțină exact un gol: ___")
            alts = it.get("alt", [])
            answers = {canon(it.get("answer", "")), *(canon(a) for a in alts)}
            if groups and it.get("group") not in groups:
                err(where, f"group „{it.get('group')}” nu este în „groups”")
            if extra and it.get("extra") not in (extra.get("options") or []):
                err(where, f"extra „{it.get('extra')}” nu este în extra.options")
            opts = it.get("options")
            if opts is not None:
                if canon(it.get("answer", "")) not in {canon(o) for o in opts}:
                    err(where, "„options” trebuie să conțină răspunsul")
                if len({canon(o) for o in opts}) != len(opts):
                    err(where, "„options” are valori duplicate")
                if answers & {canon(o) for o in opts if canon(o) != canon(it['answer'])}:
                    err(where, "o variantă acceptată („alt”) apare ca opțiune greșită")
            elif "choice" in modes:
                if len({canon(p) for p in pool} - answers) < 2:
                    err(where, "modul cu alegere cere „pool” cu cel puțin 2 variante greșite sau „options” pe întrebare")
            if marks is not None:
                check_guide_highlight(t, it, marks, where, err)
            if bool(it.get("ex")) != bool(it.get("exRo")):
                err(where, "„ex” (propoziție germană) și „exRo” (traducerea ei) merg împreună")
            if t.get("requireExample") and not it.get("ex"):
                err(where, "tema cere o propoziție-exemplu: lipsește „ex” și „exRo”")
            for k in ("ro", "exRo", "explain", "gloss", "hint"):
                if any(c in str(it.get(k, "")) for c in BAD_DIACRITICS):
                    warnings.append(f"[{where}] „{k}” folosește ş/ţ cu sedilă; în română se scrie ș/ț")
    return errors, warnings


def main():
    topics = []
    for path in sorted(glob.glob(os.path.join(ROOT, "content", "*.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                topics.append(json.load(f))
        except json.JSONDecodeError as e:
            sys.exit(f"JSON invalid în {os.path.relpath(path, ROOT)}: {e}")
    if not topics:
        sys.exit("Nu există fișiere în content/*.json")
    errors, warnings = validate(topics)
    for w in warnings:
        print("Atenție:", w)
    if errors:
        print("\nConținut invalid:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    topics.sort(key=lambda t: (*level_key(t["level"]), t["order"]))
    for t in topics:
        t["xp"] = xp_multiplier(t)
    os.makedirs(os.path.join(ROOT, "supabase"), exist_ok=True)
    rows = ",\n".join(f"  ('{t['id']}', '{t['level']}', {t['xp']})" for t in sorted(topics, key=lambda t: t["id"]))
    with open(os.path.join(ROOT, "supabase", "topic_levels.sql"), "w", encoding="utf-8") as f:
        f.write("-- Generat de build.py din content/*.json. Rulează-l în Supabase după orice schimbare de nivel sau de temă.\n"
                "insert into public.topic_levels (topic_id, level, multiplier) values\n" + rows + "\n"
                "on conflict (topic_id) do update set level = excluded.level, multiplier = excluded.multiplier;\n")
    for t in topics:
        print(f"  {t['title']:<32} {t['level']:<7} ×{t['xp']:<5} {len(t['items']):>3} întrebări  ({', '.join(t['modes'])})")
    print(f"Total: {sum(len(t['items']) for t in topics)} întrebări în {len(topics)} teme")
    if "--check" in sys.argv:
        return
    read = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()
    config = "null"
    if os.path.exists(os.path.join(ROOT, "config.json")):
        cfg = json.loads(read("config.json"))
        if not str(cfg.get("url", "")).startswith("https://") or not cfg.get("key"):
            sys.exit("config.json trebuie să conțină \"url\" (https://…) și \"key\" (cheia publică Supabase)")
        config = json.dumps({"url": cfg["url"].rstrip("/"), "key": cfg["key"]}, separators=(",", ":")).replace("</", "<\\/")
    print("Cont și sincronizare:", "Supabase (config.json)" if config != "null" else "dezactivate (fără config.json)")
    content = json.dumps({"topics": topics}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/").replace("<!--", "<\\u0021--")
    html = read("src/template.html")
    for marker, value in (("/*__STYLE__*/", read("src/style.css")), ("/*__SCRIPT__*/", read("src/app.js")), ("/*__CONTENT__*/", content), ("/*__CONFIG__*/", config)):
        if html.count(marker) != 1:
            sys.exit(f"Marcajul {marker} trebuie să apară exact o dată în src/template.html")
        html = html.replace(marker, value)
    icon_path = os.path.join(ROOT, "src", "icon.png")
    if os.path.exists(icon_path):
        import base64
        html = html.replace("/*__ICON__*/", "data:image/png;base64," + base64.b64encode(open(icon_path, "rb").read()).decode())
    elif "/*__ICON__*/" in html:
        html = html.replace("/*__ICON__*/", "")
    out = os.path.join(ROOT, "deutsch.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Scris: deutsch.html ({os.path.getsize(out) // 1024} KB)")


if __name__ == "__main__":
    main()
