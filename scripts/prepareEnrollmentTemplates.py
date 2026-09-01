# -*- coding: utf-8 -*-
import os, re, shutil, zipfile, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC = r"C:\Users\NIKITA\Desktop\Шаблоны"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "templates", "documents")
OUT = os.path.normpath(OUT)

PAIRS = [
    ("18+/Договор оказания услуг 18+.xlsx",          "enroll_contract_adult.xlsx"),
    ("18-/Договор оказании услуг 18-.xlsx",          "enroll_contract_minor.xlsx"),
    ("18+/Заявление о зачислении на курс 18+.xlsx",  "enroll_statement_adult.xlsx"),
    ("18-/Заявление о зачислении на курс 18-.xlsx",  "enroll_statement_minor.xlsx"),
    ("18+/Индивидуальный план 18+.xlsx",             "enroll_plan_adult.xlsx"),
    ("18-/Индивидуальный план 18-.xlsx",             "enroll_plan_minor.xlsx"),
]

TOKEN = re.compile(r'\$\{([A-Za-z0-9_]+)\}')
SPLIT = re.compile(r'\$\{?[A-Za-z0-9_]*</t>')

os.makedirs(OUT, exist_ok=True)
all_tokens = {}
bad = []

for src_rel, dst_name in PAIRS:
    src = os.path.join(SRC, src_rel.replace("/", os.sep))
    dst = os.path.join(OUT, dst_name)
    shutil.copy(src, dst)

    found = set()
    with zipfile.ZipFile(dst) as z:
        for name in z.namelist():
            if not name.endswith(".xml"):
                continue
            xml = z.read(name).decode("utf-8", "replace")
            for m in TOKEN.finditer(xml):
                found.add(m.group(1))
            for m in SPLIT.finditer(xml):
                frag = m.group(0)
                if not frag.startswith("$</t>") or True:
                    bad.append((dst_name, name, frag))

    print("%-28s <- %s" % (dst_name, os.path.basename(src)))
    print("    tokens: %s" % ", ".join(sorted(found)))
    for t in found:
        all_tokens.setdefault(t, []).append(dst_name)

print("\n=== token inventory across all 6 templates ===")
for t in sorted(all_tokens):
    print("  %-28s %s" % (t, ", ".join(all_tokens[t])))

print("\n=== split-token suspects (must be empty) ===")
if not bad:
    print("  none - every token is a single intact XML text node")
for b in bad:
    print("  %s | %s | %r" % b)
