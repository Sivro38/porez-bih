#!/usr/bin/env python3
"""
Pravi favikone iz ikone Kalkulacija u src/ikone.js.

Favikona i ikona na radnoj povrsini moraju biti ista slika. Zato se ne
crtaju odvojeno: ova skripta uzme SVG iz ikone.js i od njega napravi

  src/slike/favicon-16.png     kartica browsera   (iz KALKULACIJA_16)
  src/slike/favicon-32.png     kartica na ekranu visoke gustine
  src/slike/favicon-180.png    apple-touch-icon (iOS ga trazi kao PNG)

Za 16px se uzima KALKULACIJA_16: isti kalkulator nacrtan piksel po
piksel, jer se velika ikona na 16px razmaze u mrlju (izmjereno: tipke
se ne razaznaju). Iz istog razloga nema SVG favikone — browser bi je u
kartici umanjio na istih 16px.

PNG se crta u Edgeu ili Chromeu bez prozora (headless), u tacnoj velicini,
pa ga crta isti rasterizator koji crta i stranicu.

Trazi Pillow (pip install pillow) i Edge ili Chrome.
Pokretanje:   python alati/favikone.py
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile

KORIJEN = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
IKONE = os.path.join(KORIJEN, 'src', 'ikone.js')
SLIKE = os.path.join(KORIJEN, 'src', 'slike')

# Kvadrat oko kalkulatora i njegove sjenke, unutar viewBox-a 0 0 48 48.
# Bez ovoga bi kalkulator zauzeo samo pola ikone.
OKVIR = '1 1 46 46'

BROWSERI = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'msedge', 'google-chrome', 'chromium', 'chrome',
]


def ikona(ime, okvir=None):
    izvor = open(IKONE, encoding='utf-8').read()
    m = re.search(r'export const ' + ime + r' = `(.*?)`;', izvor, re.S)
    if not m:
        sys.exit(ime + ' nije nadjena u src/ikone.js')
    svg = m.group(1).strip()
    if okvir:
        svg = re.sub(r'viewBox="[^"]*"', 'viewBox="%s"' % okvir, svg, count=1)
    # Velicina se postavlja samo na korijenski <svg>, nikad na elemente u njemu.
    return re.sub(r'<svg([^>]*?)\swidth="\d+"\sheight="\d+"', lambda m: '<svg' + m.group(1), svg, count=1)


def browser():
    for b in BROWSERI:
        put = b if os.path.isabs(b) else shutil.which(b)
        if put and os.path.exists(put):
            return put
    sys.exit('Treba Edge ili Chrome za crtanje PNG favikona.')


def nacrtaj(svg, velicina, podloga, izlaz, exe, tmp):
    # SVG u tacnoj velicini, gore lijevo; ostatak prozora se poslije odsijece.
    html = os.path.join(tmp, 'f%d.html' % velicina)
    svg_n = svg.replace('<svg ', '<svg width="%d" height="%d" ' % (velicina, velicina), 1)
    with open(html, 'w', encoding='utf-8') as f:
        f.write('<!doctype html><html><head><meta charset="utf-8"><style>'
                'html,body{margin:0;padding:0;background:%s}svg{display:block}'
                '</style></head><body>%s</body></html>' % (podloga or 'transparent', svg_n))
    slika = os.path.join(tmp, 'f%d.png' % velicina)
    subprocess.run([exe, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                    '--force-device-scale-factor=1', '--default-background-color=00000000',
                    '--window-size=400,400', '--screenshot=' + slika,
                    'file:///' + html.replace('\\', '/')],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    from PIL import Image
    Image.open(slika).convert('RGBA').crop((0, 0, velicina, velicina)).save(izlaz, optimize=True)


def main():
    try:
        import PIL  # noqa: F401
    except ImportError:
        sys.exit('Treba Pillow:  pip install pillow')

    velika = ikona('KALKULACIJA', OKVIR)
    mala = ikona('KALKULACIJA_16')
    exe = browser()
    with tempfile.TemporaryDirectory() as tmp:
        # iOS ne trpi providnost na apple-touch-icon (pozadinu zna obojiti
        # crno), pa 180 dobija bijelu podlogu; kartice ostaju providne.
        for velicina, svg, podloga in ((16, mala, None), (32, velika, None), (180, velika, '#ffffff')):
            izlaz = os.path.join(SLIKE, 'favicon-%d.png' % velicina)
            nacrtaj(svg, velicina, podloga, izlaz, exe, tmp)
            print('upisano', os.path.relpath(izlaz, KORIJEN))


if __name__ == '__main__':
    main()
