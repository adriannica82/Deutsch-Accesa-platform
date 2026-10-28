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

ROOT = os.path.dirname(os.path.abspath(__file__))
MODES = {"choice", "write", "both"}
ID_RE = re.compile(r"^[a-z0-9_-]+$")
BAD_DIACRITICS = "şţŞŢ"  # cu sedilă; în română se folosesc ș ț (virgulă dedesubt)


def canon(s):
    s = s.strip().lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    s = re.sub(r"[.,!?;:„“”\"]", "", s)
    return re.sub(r"\s+", " ", s)


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
            for k in ("ro", "explain", "gloss", "hint"):
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
    topics.sort(key=lambda t: t["order"])
    for t in topics:
        print(f"  {t['order']:>2}. {t['title']:<32} {t['level']:<7} {len(t['items']):>3} întrebări  ({', '.join(t['modes'])})")
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
    out = os.path.join(ROOT, "deutsch.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Scris: deutsch.html ({os.path.getsize(out) // 1024} KB)")


if __name__ == "__main__":
    main()
