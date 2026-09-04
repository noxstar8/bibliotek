# Bokdetaljsiden — `/boker/[id]`

Ideer for siden som viser én tittel, rangert etter hvor mye de er verdt.
Se [`CLAUDE.md`](CLAUDE.md) for hvordan promptene er ment å brukes.

## Tanken bak

Siden er katalogens beskrivelse av en tittel — og samtidig stedet der låneren
faktisk gjør noe: låner, reserverer, sier fra seg plassen i køen. Beskrivelsen
er godt ivaretatt; **handlingen er det ikke.** Trykker du på en knapp her, blir
du kastet videre til en annen skjerm uten at noen har sagt hva som skjedde.

En handling som ikke kvitterer for seg, ber brukeren om å ta det på tro. Å la
siden svare på det du nettopp gjorde er den ene tanken ideene under er varianter
av.

## Oversikt

| # | Idé | Verdi | Jobb | Status |
| --- | --- | --- | --- | --- |
| 1 | [Bekreft lånet med leveringsfristen](#1-bekreft-lånet-med-leveringsfristen) | Høy | Liten | |

---

## 1. Bekreft lånet med leveringsfristen

Fristen er den ene opplysningen et lån gir låneren, og den eneste de kan gjøre
noe galt hvis de ikke har den. I dag sier siden på forhånd at lånet «løper i 28
dager» — men i det øyeblikket lånet er registrert, blir du sendt videre uten at
noen har nevnt en dato. 28 dager er et regnestykke; **17. mai** er en frist.

At du havner et helt annet sted gjør det verre: du rakk ikke å se at noe gikk
bra, og må lete etter raden din i en liste for å finne ut når boken skal
tilbake.

```
Låner jeg en bok på /boker/[id], blir jeg sendt rett videre til /mine-laan uten
at noen har sagt at lånet gikk i orden — og uten å nevne når boken skal leveres
tilbake. Datoen er det viktigste jeg får ut av et lån, og i dag må jeg lete den
opp selv.

Gi meg en tydelig bekreftelse på at lånet er registrert, med selve
innleveringsdatoen i klartekst. Den skal komme umiddelbart etter at jeg har
lånt, uten at jeg må lete etter den, og den skal si hvilken tittel det gjelder.

Det samme gjelder de andre handlingene på siden: reserverer jeg en bok eller
sier fra meg en reservasjon, skal jeg få vite at det gikk i orden. En handling
som feiler forklarer seg allerede; en som lykkes skal gjøre det samme.
```

---

## Flere ideer, kortere

Ikke forkastet, men de bærer mindre enn seksjonene over. Hver linje kan brukes
som en prompt som den er.

```
Vis køen på /boker/[id] med et tall jeg kan forholde meg til: står jeg som
nummer tre, si omtrent når det er min tur ut fra når eksemplarene forfaller.
```

```
Har jeg denne boken ute på lån, skal /boker/[id] si det — med min egen frist —
i stedet for bare å la være å tilby knappen.
```
