# Licence korištenih biblioteka

Ovaj program je pod [GPL-3.0-or-later](LICENSE). Uz njega se isporučuje i
tuđi rad, svaki pod svojom licencom. Sve su spojive sa GPL-3.0.

Ovaj popis postoji zato što minifikacija iz nekih paketa ukloni njihovo
obavještenje o autorskim pravima, a MIT i Apache-2.0 traže da ono prati
distribuciju. Zato stoji ovdje, uz isporučene datoteke.

---

## jsPDF 4.2.1 — MIT

https://github.com/parallax/jsPDF

```
Copyright
(c) 2010-2025 James Hall, https://github.com/MrRio/jsPDF
(c) 2015-2025 yWorks GmbH, https://www.yworks.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

---

## jspdf-autotable 5.0.8 — MIT

https://github.com/simonbengtsson/jsPDF-AutoTable

```
Copyright (c) 2014 Simon Bengtsson, https://github.com/simonbengtsson/jspdf-autotable

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## SheetJS (xlsx) 0.20.3 — Apache-2.0

https://sheetjs.com/ · https://git.sheetjs.com/sheetjs/sheetjs

Licencirano pod Apache License, Version 2.0. Puni tekst licence:
http://www.apache.org/licenses/LICENSE-2.0

```
Copyright (C) 2012-present SheetJS LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## DejaVu Sans — Bitstream Vera Fonts Copyright / Arev Fonts Copyright

https://dejavu-fonts.github.io/

Font se ugrađuje u PDF izvoz (`src/fontovi/DejaVuSans.ttf`) jer ugrađeni
jsPDF fontovi koriste WinAnsi kodiranje koje nema naša slova č, ć, đ.

```
Fonts are (c) Bitstream (see below). DejaVu changes are in public domain.
Glyphs imported from Arev fonts are (c) Tavmjong Bah (see below).

Bitstream Vera Fonts Copyright
------------------------------
Copyright (c) 2003 by Bitstream, Inc. All Rights Reserved. Bitstream Vera
is a trademark of Bitstream, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of the fonts accompanying this license ("Fonts") and associated documentation
files (the "Font Software"), to reproduce and distribute the Font Software,
including without limitation the rights to use, copy, merge, publish,
distribute, and/or sell copies of the Font Software, and to permit persons to
whom the Font Software is furnished to do so, subject to the following
conditions:

The above copyright and trademark notices and this permission notice shall be
included in all copies of one or more of the Font Software typefaces.

Arev Fonts Copyright
--------------------
Copyright (c) 2006 by Tavmjong Bah. All Rights Reserved.
```

Puni tekst oba obavještenja: https://dejavu-fonts.github.io/License.html

---

## Alati za razvoj

Vite (MIT) se koristi samo pri gradnji i ne isporučuje se u `dist/`.
