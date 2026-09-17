import { omoguciPovlacenje } from './drag.js';
import { omoguciPromjenuVelicine } from './resize.js';
import * as traka from './traka.js';

/**
 * Mini XP prozor - jedna komponenta za sve dijaloge.
 *
 * Namjerno koristi postojece klase iz styles.css (.modal-overlay,
 * .titlebar, .titletext, .ico, .winbtns, .close) da izgleda potpuno isto
 * kao glavni prozor. Novo je samo .xp-prozor i njegovo tijelo.
 */

/** Otvoreni prozori, redom - Escape zatvara samo najgornji. */
const stog = [];

/**
 * Najvisi dodijeljeni sloj. styles.css daje .modal-overlay z-index 100,
 * pa se odatle broji dalje.
 */
let vrhSloja = 100;

/**
 * Podigni prozor iznad svih ostalih. Zove se na svaki pritisak unutar
 * prozora, kao u pravom prozorskom sistemu.
 */
export function podigniNaVrh(element) {
  vrhSloja += 1;
  element.style.zIndex = String(vrhSloja);
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !stog.length) return;
  const gornji = stog[stog.length - 1];
  if (gornji.odbaciv === false) return;   // neodbaciv prozor Escape ne dira
  gornji.zatvori();
});

/**
 * @param {Object} cfg
 * @param {string} cfg.naslov       tekst u titlebaru
 * @param {string} [cfg.sadrzaj]    HTML tijela
 * @param {number|string} [cfg.sirina] npr. 300 ili '90%'
 * @param {Array}  [cfg.dugmad]     [{ tekst, naKlik, primarno }]
 * @param {boolean}[cfg.centrirano] centriraj tekst u tijelu (kao "O programu")
 * @param {string} [cfg.klasa]      dodatna klasa na prozoru
 * @param {Function}[cfg.naZatvaranje]
 * @returns {{element, tijelo, otvori, zatvori, jeOtvoren}}
 */
export function napraviProzor(cfg) {
  const {
    naslov, sadrzaj = '', sirina = 300, dugmad = [],
    centrirano = false, klasa = '', klasaPodloge = '', naZatvaranje = null,
    pozicija = 'centar', modalno = true,
    // odbaciv:false = nema ✕, Escape i klik pored ne zatvaraju.
    // Prozor se tada moze zatvoriti samo svojim dugmetom.
    odbaciv = true,
    animacija = false,
    // Modalni prozor se ne minimizira — dok stoji, ionako blokira rad.
    // Nemodalni dobija dugme `_` i mjesto na donjoj traci.
    minimizirati = !modalno,
    ikona = '',
    nazivNaTraci = null,
    // Promjena velicine se ukljucuje samo tamo gdje ima smisla —
    // kratke potvrde i unosi ostaju fiksni.
    promjenjivo = false,
    najmanjaSirina, najmanjaVisina,
    // zove se poslije svake promjene velicine — npr. da prozor
    // prilagodi skalu sadrzaja
    onPromjenaVelicine = null,
  } = cfg;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay'
    + (pozicija !== 'centar' ? ' bocno-' + pozicija : '')
    + (modalno ? '' : ' bez-podloge')
    // Prozor koji se mora potvrditi zaista mora zaustaviti sve ostalo —
    // vidi .modal-overlay.blokirajuca u prozor.css.
    + (modalno && !odbaciv ? ' blokirajuca' : '')
    + (klasaPodloge ? ' ' + klasaPodloge : '');

  const prozor = document.createElement('div');
  prozor.className = 'xp-prozor ' + (pozicija !== 'centar' ? 'bocni ' : '') + klasa;
  prozor.style.width = typeof sirina === 'number' ? sirina + 'px' : sirina;

  const titlebar = document.createElement('div');
  titlebar.className = 'titlebar';
  const dugmad_trake =
    (minimizirati ? '<span data-minimiziraj title="Minimiziraj">_</span>' : '') +
    (odbaciv ? '<span class="close" data-zatvori title="Zatvori">✕</span>' : '');
  titlebar.innerHTML =
    '<div class="titletext"><span class="ico"></span></div>' +
    (dugmad_trake ? '<div class="winbtns">' + dugmad_trake + '</div>' : '');
  titlebar.querySelector('.titletext').append(naslov);

  const tijelo = document.createElement('div');
  tijelo.className = 'xp-prozor-body' + (centrirano ? ' centrirano' : '');
  tijelo.innerHTML = sadrzaj;

  prozor.append(titlebar, tijelo);

  if (dugmad.length) {
    const podnozje = document.createElement('div');
    podnozje.className = 'xp-prozor-akcije';
    dugmad.forEach(d => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xp-btn' + (d.primarno ? ' primarno' : '');
      b.textContent = d.tekst;
      b.addEventListener('click', () => {
        if (d.naKlik) d.naKlik(api);
        else api.zatvori();
      });
      podnozje.append(b);
    });
    prozor.append(podnozje);
  }

  overlay.append(prozor);
  document.body.append(overlay);

  // prozor se moze povlaciti za titlebar, isto kao glavni
  const povlacenje = omoguciPovlacenje(prozor, titlebar);

  if (promjenjivo) {
    omoguciPromjenuVelicine(prozor, {
      pomjeriZa: povlacenje.pomjeriZa,
      najmanjaSirina,
      najmanjaVisina,
      onPromjena: onPromjenaVelicine,
    });
  }

  // Klik bilo gdje u prozoru ga podize iznad ostalih. Faza hvatanja je
  // bitna: hvatista za promjenu velicine zaustavljaju sirenje dogadjaja.
  overlay.addEventListener('pointerdown', () => {
    podigniNaVrh(overlay);
    traka.postaviAktivni(api);
  }, true);

  // "Otvoren" i "vidljiv" nisu isto: minimiziran prozor je i dalje otvoren
  // i stoji na donjoj traci, samo se ne vidi.
  let otvoren = false;
  let minimiziran = false;
  const osvjeziVidljivost = () => {
    overlay.classList.toggle('show', otvoren && !minimiziran);
    traka.osvjezi();
  };

  const api = {
    element: prozor,
    tijelo,
    jeOtvoren: () => otvoren,
    jeMinimiziran: () => minimiziran,
    /** Pomjeri prozor, uz ista ogranicenja kao vuca. */
    pomjeriZa: (dx, dy) => povlacenje.pomjeriZa(dx, dy),
    /**
     * Vrati visinu na onu koju trazi sadrzaj i vrati prozor u vidno polje.
     * Koristi se kad se sadrzaj bitno promijeni, da ne ostane visak
     * praznog prostora niti da prozor iskoci iznad vrha ekrana.
     */
    uklopi() {
      prozor.style.height = '';
      povlacenje.pomjeriZa(0, 0);
      return api;
    },
    modalno,
    odbaciv,
    /** Skloni prozor s ekrana, ali ga ostavi na donjoj traci. */
    minimiziraj() {
      if (!otvoren || minimiziran) return api;
      minimiziran = true;
      osvjeziVidljivost();
      return api;
    },
    /** Vrati minimiziran prozor i dovedi ga sprijeda. */
    vrati() {
      if (!otvoren) return api.otvori();
      minimiziran = false;
      osvjeziVidljivost();
      podigniNaVrh(overlay);
      traka.postaviAktivni(api);
      return api;
    },
    otvori() {
      if (otvoren && !minimiziran) return api;
      const bioZatvoren = !otvoren;
      otvoren = true;
      minimiziran = false;
      osvjeziVidljivost();
      podigniNaVrh(overlay);
      traka.postaviAktivni(api);
      // Nemodalni prozor ne ide u stog — Escape se tice samo dijaloga
      // koji blokiraju rad, a ovaj namjerno ne blokira nista.
      if (modalno && bioZatvoren) stog.push(api);

      // Animacija otvaranja se preskace ako je prozor vec povucen —
      // i ona i povlacenje koriste transform, pa bi mu resetovala poziciju.
      if (animacija && !prozor.style.transform) {
        prozor.classList.remove('xp-otvara-se');
        void prozor.offsetWidth;            // restartuj animaciju
        prozor.classList.add('xp-otvara-se');
        prozor.addEventListener('animationend',
          () => prozor.classList.remove('xp-otvara-se'), { once: true });
      }
      return api;
    },
    zatvori() {
      if (!otvoren) return api;
      otvoren = false;
      minimiziran = false;
      osvjeziVidljivost();
      const i = stog.indexOf(api);
      if (i !== -1) stog.splice(i, 1);
      if (naZatvaranje) naZatvaranje();
      return api;
    },
    prebaci() {
      return api.jeOtvoren() ? api.zatvori() : api.otvori();
    },
    /** Skini prozor iz DOM-a. Za prolazne dijaloge, da se ne gomilaju. */
    unisti() {
      api.zatvori();
      overlay.remove();
    },
  };

  const dugmeX = titlebar.querySelector('[data-zatvori]');
  if (dugmeX) dugmeX.addEventListener('click', api.zatvori);

  const dugmeMin = titlebar.querySelector('[data-minimiziraj]');
  if (dugmeMin) dugmeMin.addEventListener('click', e => { e.stopPropagation(); api.minimiziraj(); });

  if (minimizirati) traka.prijavi(nazivNaTraci || naslov, api, ikona);

  // Klik na tamnu podlogu zatvara samo modalni prozor koji se smije
  // odbaciti. Nemodalni podloge ni nema — klik pored ide na stranicu ispod.
  if (modalno && odbaciv) {
    overlay.addEventListener('click', e => { if (e.target === overlay) api.zatvori(); });
  }

  return api;
}

/**
 * Mali dijalog za unos teksta. Zamjena za window.prompt(), da i on
 * izgleda kao XP prozor.
 * @returns {Promise<string|null>} null ako je otkazano
 */
export function pitajZaTekst({ naslov, poruka, zadano = '', potvrdi = 'U redu' }) {
  return new Promise(resolve => {
    let rijeseno = false;
    const zavrsi = v => { if (!rijeseno) { rijeseno = true; resolve(v); } };

    const p = napraviProzor({
      naslov,
      sirina: 340,
      sadrzaj:
        '<div style="margin-bottom:8px;">' + poruka + '</div>' +
        '<input type="text" class="xp-unos" value="">',
      dugmad: [
        { tekst: 'Otkaži', naKlik: w => { zavrsi(null); w.zatvori(); } },
        { tekst: potvrdi, primarno: true, naKlik: w => {
          zavrsi(w.tijelo.querySelector('.xp-unos').value.trim());
          w.zatvori();
        } },
      ],
      naZatvaranje: () => { zavrsi(null); setTimeout(() => p.unisti(), 0); },
    });

    const unos = p.tijelo.querySelector('.xp-unos');
    unos.value = zadano;
    unos.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      zavrsi(unos.value.trim());
      p.zatvori();
    });

    p.otvori();
    unos.focus();
    unos.select();
  });
}

/**
 * Potvrda da/ne.
 * @returns {Promise<boolean>}
 */
export function pitajZaPotvrdu({ naslov, poruka, potvrdi = 'U redu' }) {
  return new Promise(resolve => {
    let rijeseno = false;
    const zavrsi = v => { if (!rijeseno) { rijeseno = true; resolve(v); } };

    const p = napraviProzor({
      naslov,
      sirina: 340,
      sadrzaj: '<div>' + poruka + '</div>',
      dugmad: [
        { tekst: 'Otkaži', naKlik: w => { zavrsi(false); w.zatvori(); } },
        { tekst: potvrdi, primarno: true, naKlik: w => { zavrsi(true); w.zatvori(); } },
      ],
      naZatvaranje: () => { zavrsi(false); setTimeout(() => p.unisti(), 0); },
    });
    p.otvori();
  });
}

/**
 * Mali dijalog sa vise ponudjenih radnji.
 * @param {Object} cfg
 * @param {Array<{kljuc: string, tekst: string, primarno?: boolean}>} cfg.izbori
 * @returns {Promise<string|null>} kljuc izabrane radnje, ili null
 */
export function pitajZaIzbor({ naslov, poruka, izbori }) {
  return new Promise(resolve => {
    let rijeseno = false;
    const zavrsi = v => { if (!rijeseno) { rijeseno = true; resolve(v); } };

    const p = napraviProzor({
      naslov,
      sirina: 340,
      sadrzaj: '<div class="xp-izbor-poruka">' + poruka + '</div>'
        + '<div class="xp-izbor-lista">'
        + izbori.map(i => '<button type="button" class="xp-btn xp-izbor-stavka'
            + (i.primarno ? ' primarno' : '') + '" data-izbor="' + i.kljuc + '">'
            + i.tekst + '</button>').join('')
        + '</div>',
      dugmad: [{ tekst: 'Otkaži', naKlik: w => { zavrsi(null); w.zatvori(); } }],
      naZatvaranje: () => { zavrsi(null); setTimeout(() => p.unisti(), 0); },
    });

    p.tijelo.addEventListener('click', e => {
      const b = e.target.closest('[data-izbor]');
      if (!b) return;
      zavrsi(b.dataset.izbor);
      p.zatvori();
    });

    p.otvori();
  });
}
