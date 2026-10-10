#!/usr/bin/env python3
"""
Izvlaci raspored obrasca AMS-1035 iz sluzbenog PDF-a Porezne uprave i
pise ga u src/ams-raspored.js.

Zasto ovako, a ne rukom: prvi put je obrazac crtan po fotografiji i bio
je pogresan u poravnanju, podebljanjima i strukturi. PDF nije skeniran
nego nosi pravi tekst i vektore, pa se iz njega vade tacne koordinate,
velicine i rezovi fontova.

Trazi PyMuPDF:      pip install pymupdf
Pokretanje:         python alati/izvuci-ams.py

PDF se skida sa adrese ispod (registar obrazaca PUFBiH, sifra AMS-1035).
"""

import io
import json
import os
import sys
import urllib.request

PDF_URL = ("https://www.pufbih.ba/v1/public/upload/obrasci/"
           "b839c-obrazac-ams_bos_web.pdf")

IZLAZ = os.path.join(os.path.dirname(__file__), "..", "src", "ams-raspored.js")

# Sve se mjeri od gornjeg lijevog ugla okvira obrasca, ne od ivice papira.
X0, Y0 = 35.9, 36.0

# Tanji od ovoga je linija, deblji je kutija.
PRAG_LINIJE = 1.7


def skini():
    zahtjev = urllib.request.Request(PDF_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(zahtjev, timeout=90) as o:
        return o.read()


def main():
    try:
        import fitz
    except ImportError:
        sys.exit("Treba PyMuPDF:  pip install pymupdf")

    print("skidam", PDF_URL)
    doc = fitz.open(stream=skini(), filetype="pdf")
    st = doc[0]
    print(f"stranica: {st.rect.width:.1f} x {st.rect.height:.1f} pt")

    # ---- tekst ----
    tekst = []
    for blok in st.get_text("dict")["blocks"]:
        for lin in blok.get("lines", []):
            for sp in lin["spans"]:
                t = sp["text"].strip()
                if not t:
                    continue
                x0, y0, x1, y1 = sp["bbox"]
                font = sp["font"]
                tekst.append({
                    "t": t,
                    "x": round(x0 - X0, 1),
                    "y": round(y0 - Y0, 1),
                    "w": round(x1 - x0, 1),
                    "v": round(sp["size"], 2),
                    "f": "arial" if "Arial" in font else "calibri",
                    "b": "Bold" in font,
                    "i": "Italic" in font,
                })

    # ---- vektori ----
    # Obrazac je crtan iskljucivo ispunjenim pravougaonicima; tanki su
    # crte, debeli su plohe. BOJA SE MORA CITATI: osam ploha (dvije gore
    # desno i sest u zaglavlju tabele) su svijetlosive, ne crne. Bez toga
    # zaglavlje Dijela 3 ispadne kao crna traka preko pola obrasca.
    def uboji(f):
        if not f:
            return None
        r, g, b = (max(0, min(255, round(v * 255))) for v in f[:3])
        if (r, g, b) == (0, 0, 0):
            return None                      # crna je zadana, ne pise se
        return "#%02x%02x%02x" % (r, g, b)

    linije, kutije = [], []
    for c in st.get_drawings():
        boja = uboji(c.get("fill"))
        for stavka in c["items"]:
            if stavka[0] != "re":
                continue
            q = stavka[1]
            x, y = round(q.x0 - X0, 1), round(q.y0 - Y0, 1)
            w, h = round(q.x1 - q.x0, 1), round(q.y1 - q.y0, 1)
            zapis = [x, y, w, h] + ([boja] if boja else [])
            (linije if (w <= PRAG_LINIJE or h <= PRAG_LINIJE) else kutije).append(zapis)

    # I linije i kutije ulaze u mjeru: donja ivica okvira je debela
    # 2,3pt pa je razvrstana u kutije, a bez nje bi obrazac ispao niz
    # i posljednja crta bi se odsjekla.
    svi = linije + kutije
    sirina = max(l[0] + l[2] for l in svi)
    visina = max(l[1] + l[3] for l in svi)

    # ---- nizovi kucica ----
    # Kucica je uspravna crtica; one na istom y i iste visine cine niz.
    # Ime niza se uzima po najblizem natpisu iznad, da se ne pogadja.
    import collections
    usprav = [l for l in linije if l[2] <= PRAG_LINIJE and l[3] > 2]
    po_redu = collections.defaultdict(list)
    for x, y, w, h in usprav:
        po_redu[(y, h)].append(x)

    IMENA = [("JMBG", "jmbg"), ("Period", "period"), ("Datum isplate", "datum")]
    kucice = {}
    for (y, h), xs in po_redu.items():
        xs = sorted(xs)
        if len(xs) < 4 or h > 40:
            continue
        # Natpis mora biti iznad niza I nad njim — bez vodoravnog uslova
        # se za JMBG uhvati "1) Ime i prezime", koji je slucajno blizi
        # po visini a stoji na drugom kraju obrasca.
        natpisi = [t for t in tekst
                   if 0 < y - t["y"] < 30 and xs[0] - 60 <= t["x"] <= xs[-1]]
        if not natpisi:
            continue
        natpis = min(natpisi, key=lambda t: y - t["y"])["t"]
        kljuc = next((k for frag, k in IMENA if frag in natpis), None)
        if not kljuc:
            continue
        # Kucica je razmak izmedju dvije susjedne crtice, ali samo ako je
        # tolik koliki je i kod ostalih. Uzima se NAJCESCI razmak, ne
        # najmanji: izmedju grupa cifara stoji veci razmak, a uz same
        # crtice znaju stajati i sitni tragovi od po par desetina.
        koraci = [round(xs[i + 1] - xs[i], 1) for i in range(len(xs) - 1)]
        krupni = [k for k in koraci if k > 3]
        if not krupni:
            continue
        korak = collections.Counter(krupni).most_common(1)[0][0]
        celije = [round(xs[i], 1) for i in range(len(xs) - 1)
                  if abs(koraci[i] - korak) < 0.8]
        kucice[kljuc] = {"y": y, "h": h, "w": korak, "x": celije}

    # ---- tabela Dijela 3 ----
    # Kolone: uspravne crtice koje idu kroz cijelu tabelu.
    visoke = [l for l in usprav if l[3] > 100]
    ivice = sorted({round(l[0], 1) for l in visoke} | {0.0, round(sirina, 1)})
    vrh = min(l[1] for l in visoke)
    dno = max(l[1] + l[3] for l in visoke)
    # Redovi: vodoravne crtice preko cijele sirine, unutar tabele.
    pruge = sorted({round(l[1], 1) for l in linije
                    if l[3] <= PRAG_LINIJE and l[2] > sirina * 0.9
                    and vrh - 3 <= l[1] <= dno + 3})
    tabela = {
        "kolone": [[ivice[i], round(ivice[i + 1] - ivice[i], 1)]
                   for i in range(len(ivice) - 1)],
        "pruge": pruge,
    }

    print(f"tekstova: {len(tekst)}  linija: {len(linije)}  kutija: {len(kutije)}")
    print(f"okvir: {sirina:.1f} x {visina:.1f} pt")

    zaglavlje = (
        "/*\n"
        " * OVAJ FAJL JE GENERISAN — ne mijenjaj ga rukom.\n"
        " *\n"
        " * Raspored obrasca AMS-1035, izvucen iz sluzbenog PDF-a Porezne\n"
        " * uprave FBiH. Ponovo se pravi sa:\n"
        " *\n"
        " *     python alati/izvuci-ams.py\n"
        " *\n"
        " * Izvor: " + PDF_URL + "\n"
        " *\n"
        " * Koordinate su u pt, od gornjeg lijevog ugla okvira obrasca.\n"
        " * Program ih crta 1pt = 1px, pa su i brojevi i raspored isti kao\n"
        " * na papiru.\n"
        " *\n"
        " * t = tekst, x/y = polozaj, w = sirina, v = velicina fonta,\n"
        " * f = porodica (arial/calibri), b = podebljano, i = kurziv.\n"
        " */\n\n")

    with io.open(os.path.abspath(IZLAZ), "w", encoding="utf-8", newline="\n") as f:
        f.write(zaglavlje)
        f.write("export const OKVIR = %s;\n\n" % json.dumps(
            {"sirina": round(sirina, 1), "visina": round(visina, 1)}, ensure_ascii=False))
        f.write("/** Sve nacrtane linije i okviri: [x, y, sirina, visina]. */\n")
        f.write("export const LINIJE = [\n")
        for l in sorted(linije, key=lambda l: (l[1], l[0])):
            f.write("  %s,\n" % json.dumps(l))
        f.write("];\n\n")
        f.write("/** Kutije deblje od linije (okviri kolona i sl.). */\n")
        f.write("export const KUTIJE = [\n")
        for k in sorted(kutije, key=lambda k: (k[1], k[0])):
            f.write("  %s,\n" % json.dumps(k))
        f.write("];\n\n")
        f.write("/** Odstampani tekst obrasca — natpisi koji se ne mijenjaju. */\n")
        f.write("export const TEKST = [\n")
        for t in sorted(tekst, key=lambda t: (t["y"], t["x"])):
            f.write("  %s,\n" % json.dumps(t, ensure_ascii=False))
        f.write("];\n\n")
        f.write("/**\n"
                " * Nizovi kucica za cifre. `x` je lijeva ivica svake kucice,\n"
                " * `w` sirina, `y`/`h` zajednicki red. Imena su odredjena po\n"
                " * natpisu iznad niza, ne rukom.\n"
                " */\n")
        f.write("export const KUCICE = %s;\n\n" % json.dumps(kucice, ensure_ascii=False, indent=1))
        f.write("/**\n"
                " * Tabela Dijela 3: `kolone` su [x, sirina], `pruge` su y svake\n"
                " * vodoravne crte — prva je vrh zaglavlja, zadnja dno tabele.\n"
                " */\n")
        f.write("export const TABELA = %s;\n" % json.dumps(tabela, ensure_ascii=False, indent=1))

    print("upisano u", os.path.normpath(os.path.abspath(IZLAZ)))


if __name__ == "__main__":
    main()
