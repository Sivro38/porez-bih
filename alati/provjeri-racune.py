#!/usr/bin/env python3
"""
Poredi racune i sifre opcina iz src/kantoni.json sa Pravilnikom o nacinu
uplate, pripadnosti i raspodjele javnih prihoda u FBiH, kakav je danas
na stranici Porezne uprave.

Zasto: od izmjene 48/26 Pravilnik sam kaze (tacke 11.2.1 do 11.2.4) da
se izmjene racuna objavljuju u januaru, aprilu, julu i oktobru. Stranica
"Uplatni racuni" kasni za Pravilnikom. Na racunima se salju tudje pare,
pa promjenu treba vidjeti prije nego sto neko uplati na stari racun.

Sta radi:
  1. Kroz API Porezne (api/regulations) nadje Pravilnik i spisak izmjena.
  2. Svaku izmjenu noviju od "zadnjaIzmjena" iz kantoni.json procita i
     izvuce parove "stari racun -> novi racun". Nova izmjena je uvijek
     PROMJENA: covjek je mora procitati, cak i kad nijedan nas racun nije
     u njoj, i onda upisati njen broj u "zadnjaIzmjena".
  3. Skine preciscen tekst i provjeri da je svaki nas racun i dalje u
     njemu, i da je tabela sifri (12.2) ista, kanton po kanton.

Izlaz (kod):
  0  ISTO          sve se slaze, nista ne treba raditi
  1  PROMJENA      nesto se razlikuje; izvjestaj kaze sta i gdje
  2  NEPREPOZNATO  nije moglo proci do kraja (mreza, PDF, API izmijenjen)

Program sam NISTA ne mijenja. Izvor istine je radni repo, a svaki novi
racun mora potvrditi covjek prije nego dodje na uplatnicu.

Trazi PyMuPDF:   pip install pymupdf
Pokretanje:      python alati/provjeri-racune.py [--izvjestaj put.md] [--podaci put.json]
"""

import hashlib
import json
import os
import re
import sys
import time
import urllib.request

KORIJEN = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
PODACI = os.path.join(KORIJEN, 'src', 'kantoni.json')
API = 'https://pufbih.ba/api/regulations'
NAZIV = 'PRAVILNIK O NAČINU UPLATE, PRIPADNOSTI I RASPODJELE JAVNIH PRIHODA'

ISTO, PROMJENA, NEPREPOZNATO = 0, 1, 2

# Racun u Pravilniku: 3-3-7-3 ili 3-3-8-2, ponekad sa razmakom iza crtice
RACUN = re.compile(r'\d{3}\s*-\s*\d{3}\s*-\s*\d{7}\s*-\s*\d{3}|\d{3}\s*-\s*\d{3}\s*-\s*\d{8}\s*-\s*\d{2}')
ZAMJENA = re.compile(r'"(' + RACUN.pattern + r')"\s*zamjenjuje se brojem:?\s*"(' + RACUN.pattern + r')"')

# Tabela 12.2, zaglavlja kantona redom kako stoje u Pravilniku. Ako se
# ijedno promijeni, tabela se ne cita i izlaz je NEPREPOZNATO — bolje to
# nego pogresno svrstane sifre.
ZAGLAVLJA = [
    ('UNSKO-SANSKI KANTON', 'usk'),
    ('POSAVSKI KANTON', 'pos'),
    ('TUZLANSKI KANTON', 'tk'),
    ('ZENIČKO-DOBOJSKI KANTON', 'zdk'),
    ('BOSANSKO-PODRINJSKI KANTON', 'bpk'),
    ('SREDNJOBOSANSKI KANTON', 'sbk'),
    ('HERCEGOVAČKO-NERETVANSKI KANTON', 'hnk'),
    ('ZAPADNO-HERCEGOVAČKI KANTON', 'zhk'),
    ('KANTON SARAJEVO', 'ks'),
    ('KANTON 10', 'k10'),
]


def dohvati(url, pokusaja=3, timeout=120):
    """Mreza Porezne zna zastati; tri pokusaja prije nego se odustane."""
    z = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (provjera racuna, porez-bih)'})
    for i in range(pokusaja):
        try:
            with urllib.request.urlopen(z, timeout=timeout) as o:
                return o.read()
        except Exception:  # noqa: BLE001
            if i == pokusaja - 1:
                raise
            time.sleep(20 * (i + 1))


def cifre(s):
    return re.sub(r'\D', '', s)


def sn_kljuc(sn):
    """'48/26' -> (2026, 48), za poredjenje koja je izmjena novija."""
    m = re.match(r'\s*(\d+)\s*/\s*(\d\d)\b', sn or '')
    return (2000 + int(m.group(2)), int(m.group(1))) if m else (0, 0)


def tekst_pdf(sadrzaj):
    import fitz
    doc = fitz.open(stream=sadrzaj, filetype='pdf')
    return re.sub(r'\s+', ' ', ' '.join(p.get_text() for p in doc))


def pravilnik_iz_api():
    sadrzaj = dohvati(API)
    try:
        spisak = json.loads(sadrzaj)
    except ValueError:
        raise RuntimeError('API Porezne uprave nije vratio JSON. Početak odgovora: %r'
                           % sadrzaj[:80].decode('utf-8', 'replace')) from None
    for kat in spisak:
        for g in kat.get('pravilnici') or []:
            m = g.get('main') or {}
            if (m.get('name') or '').strip().upper().startswith(NAZIV):
                return m, g.get('dopune') or []
    return None, []


def sifre_iz_pravilnika(tekst):
    """Tabela 12.2 -> {kljuc kantona: {sifra: naziv}}, ili None."""
    pocetak = tekst.find('12.2. Šifre općina')
    if pocetak < 0:
        return None
    kraj = tekst.find('12.3.', pocetak)
    s = tekst[pocetak:kraj if kraj > 0 else pocetak + 8000]
    granice, od = [], 0
    for naslov, kljuc in ZAGLAVLJA:
        i = s.find(naslov + ' ', od)
        if i < 0:
            return None
        granice.append((i, i + len(naslov), kljuc))
        od = i + len(naslov)
    tabela = {}
    for n, (_, j, kljuc) in enumerate(granice):
        dio = s[j:granice[n + 1][0]] if n + 1 < len(granice) else s[j:]
        tabela[kljuc] = {m.group(2): m.group(1).strip()
                         for m in re.finditer(r'(\D+?) (\d{3})(?= |$)', dio)}
    return tabela


def main():
    argumenti = sys.argv[1:]

    def opcija(ime):
        return argumenti[argumenti.index(ime) + 1] if ime in argumenti else None

    izvjestaj_put = opcija('--izvjestaj')
    podaci = json.load(open(opcija('--podaci') or PODACI, encoding='utf-8'))

    redovi = []
    pisi = redovi.append
    nasi = {podaci['federacija']['acc']: 'Federalni zavod zdravstvenog osiguranja (svi kantoni)'}
    for k in podaci['kantoni']:
        nasi[k['budzet']['acc']] = k['naziv'] + ', budžet (porez)'
        nasi[k['zavod']['acc']] = k['naziv'] + ', zavod (zdravstveni doprinos)'
    zadnja = podaci.get('zadnjaIzmjena', '0/00')
    kod = ISTO

    try:
        glavni, dopune = pravilnik_iz_api()
        if not glavni or not glavni.get('bosnianDocument'):
            raise RuntimeError('Pravilnik nije nađen u api/regulations. Možda je API izmijenjen.')

        # 1. Izmjene novije od zadnje koju znamo
        poznate = {sn_kljuc(str(d.get('sn'))) for d in dopune}
        nove = sorted((d for d in dopune if sn_kljuc(str(d.get('sn'))) > sn_kljuc(zadnja)),
                      key=lambda d: sn_kljuc(str(d.get('sn'))))
        for d in nove:
            kod = PROMJENA
            sn = str(d.get('sn')).strip()
            url = d.get('bosnianDocument') or d.get('croatianDocument')
            pisi('## Nova izmjena Pravilnika: SN %s\n\n%s\n' % (sn, url))
            try:
                t = tekst_pdf(dohvati(url))
            except Exception as e:  # noqa: BLE001
                pisi('Izmjena se nije mogla pročitati (%s). Pročitaj je ručno.\n' % e)
                continue
            parovi = ZAMJENA.findall(t)
            for stari, novi in parovi:
                oznaka = nasi.get(cifre(stari))
                if oznaka:
                    pisi('- **NAŠ RAČUN SE MIJENJA.** %s: `%s` → `%s`' % (oznaka, cifre(stari), cifre(novi)))
                else:
                    pisi('- račun koji ne koristimo: `%s` → `%s`' % (cifre(stari), cifre(novi)))
            spomenuti = {cifre(r) for r in RACUN.findall(t)} & set(nasi)
            van_parova = spomenuti - {cifre(s) for s, _ in parovi}
            for acc in sorted(van_parova):
                pisi('- **naš račun se spominje u izmjeni**, ali ne u obliku „zamjenjuje se brojem”: '
                     '%s, `%s`' % (nasi[acc], acc))
            if not parovi:
                pisi('- Nijedna zamjena u obliku „… zamjenjuje se brojem: …” nije nađena. To ne znači '
                     'da računi nisu mijenjani, jer izmjena može biti drugačije napisana.')
            if '12.2' in t:
                pisi('- Izmjena spominje tačku 12.2, a to su šifre općina.')
            pisi('\nKad je pročitana: ažuriraj `src/kantoni.json` ako treba, i upiši `"zadnjaIzmjena": "%s"`.\n' % sn)

        # Precisceni tekst nabraja sve izmjene; ako je tu neka koje nema u
        # spisku izmjena, spisak kasni i korak 1 je nije mogao vidjeti
        u_naslovu = {sn_kljuc(x) for x in re.findall(r'\d+\s*/\s*\d\d\b', glavni.get('sn') or '')}
        bez_teksta = sorted(x for x in u_naslovu - poznate if x > sn_kljuc(zadnja))
        if bez_teksta:
            kod = PROMJENA
            pisi('## Prečišćeni tekst spominje izmjenu koje nema u spisku izmjena\n')
            for godina, broj in bez_teksta:
                pisi('- SN %d/%02d' % (broj, godina % 100))
            pisi('')

        # 2. Svaki nas racun mora biti u preciscenom tekstu
        tekst = tekst_pdf(dohvati(glavni['bosnianDocument']))
        u_tekstu = {cifre(r) for r in RACUN.findall(tekst)}
        if len(u_tekstu) < 50:
            raise RuntimeError('U prečišćenom tekstu je samo %d računa. PDF se ne čita kako treba.' % len(u_tekstu))
        nema = [(acc, opis) for acc, opis in nasi.items() if acc not in u_tekstu]
        if nema:
            kod = PROMJENA
            pisi('## Računi kojih više nema u prečišćenom Pravilniku\n')
            for acc, opis in nema:
                pisi('- %s: `%s`' % (opis, acc))
            pisi('\nIzvor: %s\n' % glavni['bosnianDocument'])

        # 3. Sifre opcina, kanton po kanton
        tabela = sifre_iz_pravilnika(tekst)
        if not tabela or sum(len(v) for v in tabela.values()) != 79:
            raise RuntimeError('Tabela šifri općina (12.2) nije pročitana. Očekivano je 79 šifri u 10 kantona.')
        razlike = []
        for k in podaci['kantoni']:
            nase = {o['sifra']: o.get('pravilnik') or o['naziv'] for o in k['opcine']}
            njihove = tabela.get(k['key'], {})
            for s in sorted(set(nase) - set(njihove)):
                razlike.append('- %s: kod nas je šifra `%s` (%s), a u Pravilniku je u tom kantonu nema'
                               % (k['naziv'], s, nase[s]))
            for s in sorted(set(njihove) - set(nase)):
                razlike.append('- %s: u Pravilniku je šifra `%s` (%s), a kod nas je u tom kantonu nema'
                               % (k['naziv'], s, njihove[s]))
            for s in sorted(set(nase) & set(njihove)):
                if nase[s] != njihove[s]:
                    razlike.append('- %s: šifra `%s` je ista, a naziv se razlikuje: kod nas „%s”, u Pravilniku „%s”'
                                   % (k['naziv'], s, nase[s], njihove[s]))
        if razlike:
            kod = PROMJENA
            pisi('## Šifre općina se razlikuju\n')
            redovi.extend(razlike)
            pisi('')

    except Exception as e:  # noqa: BLE001
        kod = NEPREPOZNATO
        pisi('## Provjera nije prošla\n\n%s: %s\n\nPokreni je ručno: `python alati/provjeri-racune.py`.\n'
             % (type(e).__name__, e))

    zaglavlje = {
        ISTO: 'ISTO. Svih %d računa i 79 šifri općina slaže se sa Pravilnikom. '
              'Zadnja pročitana izmjena je SN %s.' % (len(nasi), zadnja),
        PROMJENA: 'PROMJENA. Nešto se razlikuje od `src/kantoni.json`. Ništa ne mijenjaj dok ne provjeriš '
                  'kod izvora, a onda ažuriraj `kantoni.json` u radnom repou.',
        NEPREPOZNATO: 'NEPREPOZNATO. Provjera nije mogla proći do kraja.',
    }[kod]
    tijelo = '\n'.join(redovi).strip()
    # Otisak sadrzaja: workflow po njemu zna da je isti izvjestaj vec
    # prijavljen, pa ga ne salje ponovo svaki put
    otisak = hashlib.sha256((str(kod) + tijelo).encode('utf-8')).hexdigest()[:16]
    dijelovi = ['# Provjera računa', zaglavlje, tijelo,
                'Pravilnik u API-ju Porezne uprave: ' + API, '<!-- otisak: %s -->' % otisak]
    izvjestaj = '\n\n'.join(d for d in dijelovi if d) + '\n'

    # Windows konzola nije UTF-8, a izvjestaj ima nasa slova
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print(izvjestaj)
    if izvjestaj_put:
        with open(izvjestaj_put, 'w', encoding='utf-8', newline='\n') as f:
            f.write(izvjestaj)
    sys.exit(kod)


if __name__ == '__main__':
    main()
