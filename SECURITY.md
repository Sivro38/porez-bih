# Sigurnost

## Šta ovaj program jeste

Statična stranica bez servera. Nema naloga, baze, kolačića ni analitike.
Sve što upišeš — ime, JMBG, broj računa — stoji u `localStorage` tvog
browsera i nikad ga ne napušta.

To znači da klasičnih rupa ovdje nema: nema prijave koja se zaobilazi,
nema baze iz koje se nešto izvlači, nema API-ja.

## Šta bi bila rupa

- **Ubacivanje koda** — kad bi se nešto što korisnik upiše (ime, adresa,
  svrha) izvršilo kao HTML ili JavaScript.
- **Curenje podataka** — kad bi bilo šta otišlo na mrežu. Provjeri sam:
  otvori alatke za razvoj, karticu Network, i koristi program. Poslije
  učitavanja tu ne smije biti ničega.
- **Pogrešan iznos ili račun** na uplatnici ili obrascu. Novac ode na
  krivo mjesto — za mene je to sigurnosna stvar, ne obična greška.
- **Ranjiva zavisnost** koja stigne do korisnika u gotovom buildu.

## Kako prijaviti

**Ne otvaraj javni issue** za nešto što se može zloupotrijebiti.

Idi na karticu **Security** ovog repozitorija → **Report a vulnerability**.
To je privatna prijava, vidim je samo ja. Ako ti to ne radi, piši mi na
[LinkedInu](https://www.linkedin.com/in/eminsivro/).

Napiši šta si našao, kako se ponavlja i na kojem browseru. Odgovoriću
kad stignem — ovo je projekat iz slobodnog vremena, nemam dežurstvo.

Kad popravim, u objavi ću te navesti ako to želiš.

## Zavisnosti

`npm audit` prijavljuje nekoliko rupa u Viteu i esbuildu. Sve su u
**razvojnom serveru** — onom koji radi dok pišeš kod. U ono što korisnik
otvori na stranici ne ulazi ništa od toga: build daje obične statične
datoteke, Vitea u njima nema.

Vite je prikovan na 5 jer novije verzije traže Node 20 ili 22, a ovo je
pisano na Node 18. Peta linija se više ne krpi, pa te prijave zatvara
tek prelazak na noviji Vite, kad mašina dobije noviji Node.

Dok ti razvojni server radi, ne drži otvorene nepoznate stranice u istom
browseru. Tako se te rupe jedino i koriste.

## Koja verzija se održava

Zadnja na `main`. Starije se ne krpe — stranica je statična, osvježi je
i imaš novu.
