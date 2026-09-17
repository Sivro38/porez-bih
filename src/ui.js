/** Menubar, status traka i "O programu" modal. */

export function poveziMenije() {
  const stavke = document.querySelectorAll('.menu-item');
  const zatvoriSve = () => {
    stavke.forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.ima-podmeni.otvoren')
      .forEach(m => m.classList.remove('otvoren'));
  };

  stavke.forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('.dropdown')) return; // opciju obradjuje njen handler
      const bioOtvoren = item.classList.contains('open');
      zatvoriSve();
      if (!bioOtvoren) item.classList.add('open');
      e.stopPropagation();
    });
  });

  // Oba handlera (ovaj i onaj u main.js) sjede na document-u, a
  // stopPropagation ne zaustavlja listenere na istom cvoru - zato se
  // roditelj podmenija mora izuzeti ovdje, inace bi klik na njega
  // zatvorio cijeli meni prije nego se podmeni stigne vidjeti.
  document.addEventListener('click', e => {
    const opt = e.target.closest('.dropdown .opt');
    if (opt && opt.classList.contains('ima-podmeni')) return;
    zatvoriSve();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') zatvoriSve(); });

  return zatvoriSve;
}

export function napraviStatus() {
  const el = document.getElementById('status-msg');
  let timer;
  return function setStatus(poruka) {
    el.textContent = poruka;
    clearTimeout(timer);
    timer = setTimeout(() => { el.textContent = 'Spremno'; }, 2200);
  };
}

/* Dijalozi se sada prave kroz napraviProzor() iz prozor.js. */

/** Prebaci kvacicu u meniju i vrati novo stanje. */
export function toggleKvacica(id) {
  const el = document.getElementById(id);
  const bilo = el.textContent.trim() === '✓';
  el.textContent = bilo ? ' ' : '✓';
  return !bilo;
}
