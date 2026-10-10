#!/usr/bin/env python3
"""
Izvlaci raspored obrasca GPD-1051 (Godisnja prijava poreza na dohodak)
iz sluzbenog PDF-a Porezne uprave i pise ga u src/gpd-raspored.js.

Isti postupak kao alati/izvuci-ams.py: PDF nije skeniran nego nosi pravi
tekst i vektore, pa se iz njega vade tacne koordinate, velicine, rezovi
fontova i boje ploha. Razlika je da GPD ima DVIJE stranice A4 uspravno,
pa se svaka izvlaci posebno.

Uz crte i natpise, skripta nadje i polja u koja program upisuje:
  - za svaki red obrasca (8 ... 32) celiju za iznos, po broju reda;
  - nizove kucica (JMB, porezna godina, broj racuna za povrat).
Polja se ne zadaju rukom nego se traze po natpisima iz samog PDF-a.

Trazi PyMuPDF:      pip install pymupdf
Pokretanje:         python alati/izvuci-gpd.py
"""

import collections
import io
import json
import os
import sys
import urllib.request

PDF_URL = ("https://www.pufbih.ba/v1/public/upload/obrasci/"
           "a9d63-94b8a-obrazac_gpd_1051_ver1__bos_web2.pdf")

IZLAZ = os.path.join(os.path.dirname(__file__), "..", "src", "gpd-raspored.js")

# Tanji od ovoga je linija, deblji je ploha.
PRAG_LINIJE = 1.7


def skini():
    zahtjev = urllib.request.Request(PDF_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(zahtjev, timeout=90) as o:
        return o.read()


def uboji(f):
    if not f:
        return None
    r, g, b = (max(0, min(255, round(v * 255))) for v in f[:3])
    if (r, g, b) == (0, 0, 0):
        return None                      # crna je zadana, ne pise se
    return "#%02x%02x%02x" % (r, g, b)


def stranica(st):
    tekst = []
    for blok in st.get_text("dict")["blocks"]:
        for lin in blok.get("lines", []):
            for sp in lin["spans"]:
                t = sp["text"].strip()
                if not t:
                    continue
                x0, y0, x1, y1 = sp["bbox"]
                # Rez se ne cita iz imena fonta: u ovom PDF-u se svaki font
                # zove samo "Arial", a podebljano i kurziv nose zastavice
                # (16 = podebljano, 2 = kurziv).
                zastavice = sp["flags"]
                tekst.append({
                    "t": t, "x": round(x0, 1), "y": round(y0, 1),
                    "w": round(x1 - x0, 1), "h": round(y1 - y0, 1),
                    "v": round(sp["size"], 2),
                    "b": bool(zastavice & 16), "i": bool(zastavice & 2),
                })

    # Vektori: ispunjeni pravougaonici (crte i plohe) i, za svaki slucaj,
    # obicne crte ("l"), koje se pretvaraju u tanke pravougaonike.
    linije, kutije = [], []
    for c in st.get_drawings():
        boja = uboji(c.get("fill")) if c.get("fill") else None
        sirina_poteza = c.get("width") or 0.5
        for stavka in c["items"]:
            if stavka[0] == "re":
                q = stavka[1]
                if c.get("fill") is None and c.get("color") is not None:
                    # samo obrub pravougaonika: cetiri tanke crte
                    w = max(0.5, round(sirina_poteza, 1))
                    for x, y, ww, hh in ((q.x0, q.y0, q.x1 - q.x0, w), (q.x0, q.y1 - w, q.x1 - q.x0, w),
                                         (q.x0, q.y0, w, q.y1 - q.y0), (q.x1 - w, q.y0, w, q.y1 - q.y0)):
                        linije.append([round(x, 1), round(y, 1), round(ww, 1), round(hh, 1)])
                    continue
                x, y = round(q.x0, 1), round(q.y0, 1)
                w, h = round(q.x1 - q.x0, 1), round(q.y1 - q.y0, 1)
                zapis = [x, y, w, h] + ([boja] if boja else [])
                (linije if (w <= PRAG_LINIJE or h <= PRAG_LINIJE) else kutije).append(zapis)
            elif stavka[0] == "l":
                p1, p2 = stavka[1], stavka[2]
                w = max(0.5, round(sirina_poteza, 1))
                x, y = round(min(p1.x, p2.x), 1), round(min(p1.y, p2.y), 1)
                ww = round(abs(p2.x - p1.x), 1) or w
                hh = round(abs(p2.y - p1.y), 1) or w
                linije.append([x, y, ww, hh])
    return tekst, linije, kutije


def kucice(linije, y_od, y_do, x_od=0, x_do=9999):
    """Niz kucica: parovi uspravnih crtica iste visine u datom pojasu.
    Vraca lijeve ivice kucica i zajednicki y, sirinu i visinu."""
    usp = sorted((l for l in linije if l[2] <= PRAG_LINIJE and 6 < l[3] < 20
                  and y_od <= l[1] <= y_do and x_od <= l[0] <= x_do), key=lambda l: l[0])
    xs = [l[0] for l in usp]
    if len(xs) < 2:
        return None
    # ivice idu u parovima: lijeva i desna ivica svake kucice
    lijeve = xs[0::2]
    sirina = round(xs[1] - xs[0], 1)
    return {"x": lijeve, "y": usp[0][1], "w": sirina, "h": usp[0][3]}


def kvadratic(linije, x_desno, y_od, y_do):
    """Kucica za oznaku (oko 9pt) cija je desna ivica tik lijevo od x_desno."""
    vod = [l for l in linije if 8 <= l[2] <= 10 and l[3] <= 1 and y_od <= l[1] <= y_do
           and x_desno - 15 <= l[0] + l[2] <= x_desno]
    if not vod:
        return None
    gore = min(vod, key=lambda l: l[1])
    return {"x": gore[0], "y": gore[1], "w": gore[2], "h": gore[2]}


def nadji(tekst, pocetak):
    return next(t for t in tekst if t["t"].startswith(pocetak))


def polja(stranice, doc):
    """Polja u koja program upisuje, nadjena po natpisima iz samog PDF-a."""
    s1, s2 = stranice

    def redovi(s, brojevi, kolone):
        out = {}
        for t in s["tekst"]:
            if t["t"].isdigit() and int(t["t"]) in brojevi and t["x"] < 100:
                out[t["t"]] = {"y": round(t["y"] + t["h"] / 2, 1), **kolone}
        return out

    def desna_ivica(s):
        # unutrasnja ivica desnog okvira: uspravni komadi okvira desno od 540pt
        return min(k[0] for k in s["kutije"] + s["linije"] if k[2] <= 3.5 and k[3] > 10 and k[0] > 540)

    d1, d2 = desna_ivica(s1), desna_ivica(s2)

    # Zaglavlje: "za period od |_|_|_|_| do |_|_|_|_|". Kucice su tu crtice
    # u tekstu, pa se mjesto svake cifre cita iz polozaja samih znakova "_".
    crtice = []
    for blok in doc[0].get_text("rawdict")["blocks"]:
        for lin in blok.get("lines", []):
            for sp in lin["spans"]:
                if abs(sp["bbox"][1] - nadji(s1["tekst"], "za period od")["y"]) > 1:
                    continue
                for c in sp["chars"]:
                    if c["c"] == "_":
                        crtice.append(round((c["bbox"][0] + c["bbox"][2]) / 2, 1))
    crtice.sort()
    zaglavlje = nadji(s1["tekst"], "za period od")

    p = {
        "period": {"od": crtice[:4], "do": crtice[4:8], "y": zaglavlje["y"], "v": zaglavlje["v"]},
        "jmb": kucice(s1["linije"], 140, 150, 100, 320),
        "godina": kucice(s1["linije"], 168, 176, 480, 530),
        "kontaktKucica": kvadratic(s1["linije"], nadji(s1["tekst"], "Označite ovu")["x"], 140, 150),
        "ime": {"x": 62, "y": nadji(s1["tekst"], "2) Prezime i ime")["y"] + 11},
        "adresa": {"x": 62, "y": nadji(s1["tekst"], "3) Adresa")["y"] + 10},
        "telefon": {"x": round(nadji(s1["tekst"], "6) Telefon")["x"] + 44, 1), "y": nadji(s1["tekst"], "6) Telefon")["y"] - 1},
        "email": {"x": round(nadji(s1["tekst"], "7) e-mail")["x"] + 41, 1), "y": nadji(s1["tekst"], "7) e-mail")["y"] - 1},
        # Dio 2: kolone c (gubitak) i d (dobit), ivice iz uspravnih crta tabele
        "redovi": {
            **redovi(s1, range(8, 18), {"c": [388.3, 469.3], "d": [469.3, d1]}),
            **redovi(s1, range(18, 22), {"c": [494.3, d1]}),
        },
    }
    p2 = {
        "ime": {"x": 62, "y": nadji(s2["tekst"], "Prezime i ime")["y"] + 11},
        "jmb": kucice(s2["linije"], 100, 108, 170, 390),
        "godina": kucice(s2["linije"], 100, 108, 480, 530),
        "redovi": redovi(s2, range(22, 32), {"c": [453.0, d2]}),
        "kucicaA": kvadratic(s2["linije"], nadji(s2["tekst"], "a. Iskoristite")["x"], 355, 368),
        "kucicaB": kvadratic(s2["linije"], nadji(s2["tekst"], "b. Prijavljujem")["x"], 368, 380),
        "racun": {"x": 345, "y": nadji(s2["tekst"], "Ako je označena")["y"] + 4},
        "potpis": {"x": 62, "y": nadji(s2["tekst"], "Potpis poreznog")["y"] + 12},
        "datum": {"x": 426, "y": nadji(s2["tekst"], "Datum")["y"] + 12},
    }

    # Provjera da je nadjeno sve: tacno 13 kucica za JMB, 2 za godinu,
    # svaki red obrasca, i osam mjesta za cifre perioda.
    assert len(p["jmb"]["x"]) == 13 and len(p2["jmb"]["x"]) == 13, "JMB nije 13 kucica"
    assert len(p["godina"]["x"]) == 2 and len(p2["godina"]["x"]) == 2, "godina nije 2 kucice"
    assert len(crtice) == 8, "period nema 8 crtica: %s" % crtice
    assert sorted(map(int, p["redovi"])) == list(range(8, 22)), sorted(p["redovi"])
    assert sorted(map(int, p2["redovi"])) == list(range(22, 32)), sorted(p2["redovi"])
    assert p2["kucicaA"] and p2["kucicaB"], "nema kucica a/b u redu 32"
    return [p, p2]


def main():
    try:
        import fitz
    except ImportError:
        sys.exit("Treba PyMuPDF:  pip install pymupdf")

    print("skidam", PDF_URL)
    doc = fitz.open(stream=skini(), filetype="pdf")
    stranice = []
    for i, st in enumerate(doc):
        tekst, linije, kutije = stranica(st)
        print(f"stranica {i + 1}: {st.rect.width:.1f} x {st.rect.height:.1f} pt, "
              f"tekstova {len(tekst)}, linija {len(linije)}, ploha {len(kutije)}")
        stranice.append({
            "sirina": round(st.rect.width, 1), "visina": round(st.rect.height, 1),
            "tekst": sorted(tekst, key=lambda t: (t["y"], t["x"])),
            "linije": sorted(linije, key=lambda l: (l[1], l[0])),
            "kutije": sorted(kutije, key=lambda k: (k[1], k[0])),
        })

    zaglavlje = (
        "/*\n"
        " * OVAJ FAJL JE GENERISAN — ne mijenjaj ga rukom.\n"
        " *\n"
        " * Raspored obrasca GPD-1051 (Godisnja prijava poreza na dohodak),\n"
        " * izvucen iz sluzbenog PDF-a Porezne uprave FBiH. Ponovo se pravi sa:\n"
        " *\n"
        " *     python alati/izvuci-gpd.py\n"
        " *\n"
        " * Izvor: " + PDF_URL + "\n"
        " *\n"
        " * Koordinate su u pt, od gornjeg lijevog ugla STRANICE (A4 uspravno).\n"
        " * Program ih crta 1pt = 1px, pa je raspored isti kao na papiru.\n"
        " *\n"
        " * t = tekst, x/y = polozaj, w/h = velicina, v = velicina fonta,\n"
        " * b = podebljano, i = kurziv (font je svuda Arial). Linije i plohe\n"
        " * su [x, y, sirina, visina, boja?] — bez boje je crno.\n"
        " */\n\n")

    with io.open(os.path.abspath(IZLAZ), "w", encoding="utf-8", newline="\n") as f:
        f.write(zaglavlje)
        f.write("export const STRANICE = [\n")
        for s in stranice:
            f.write("  {\n")
            f.write('    sirina: %s, visina: %s,\n' % (s["sirina"], s["visina"]))
            f.write("    linije: [\n")
            for l in s["linije"]:
                f.write("      %s,\n" % json.dumps(l))
            f.write("    ],\n    kutije: [\n")
            for k in s["kutije"]:
                f.write("      %s,\n" % json.dumps(k))
            f.write("    ],\n    tekst: [\n")
            for t in s["tekst"]:
                f.write("      %s,\n" % json.dumps(t, ensure_ascii=False))
            f.write("    ],\n  },\n")
        f.write("];\n\n")
        f.write("/**\n"
                " * Polja u koja program upisuje, po stranicama. Nadjena po natpisima\n"
                " * i crtama iz PDF-a, ne rucno. `redovi` su po broju reda obrasca:\n"
                " * `y` je sredina reda, a `c`/`d` su [lijevo, desno] ivice kolona.\n"
                " * Nizovi kucica: `x` su lijeve ivice, `w`/`h` velicina jedne.\n"
                " */\n")
        f.write("export const POLJA = %s;\n" % json.dumps(polja(stranice, doc), ensure_ascii=False, indent=1))

    print("upisano u", os.path.normpath(os.path.abspath(IZLAZ)))


if __name__ == "__main__":
    main()
