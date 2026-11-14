#!/bin/bash
# Exploración temporal: notas del Torneo Regional (rondas eliminatorias) en ascensodelinterior.com.ar.
set -u
mkdir -p explorar-adi/notas explorar-adi/img
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
B=https://www.ascensodelinterior.com.ar
: > explorar-adi/links.txt
for p in "" "/2" "/3" "/4" "/5" "/6" "/7" "/8"; do
  curl -sL -A "$UA" "$B/etiquetas/321/torneo-regional$p" -o explorar-adi/et.html
  grep -oE 'href="/noticias/[0-9]+/[^"]+"' explorar-adi/et.html | sed 's/href="//;s/"$//;s#/$##' >> explorar-adi/links.txt
  sleep 1
done
sort -u explorar-adi/links.txt | grep -iE 'ronda|final|regin|regional' > explorar-adi/rondas.txt
wc -l explorar-adi/rondas.txt
while read -r u; do
  f="explorar-adi/notas/$(basename "$u" | cut -c1-90).html"
  curl -sL -A "$UA" "$B$u/" -o "$f"; sleep 0.7
done < explorar-adi/rondas.txt
# Imágenes del cuerpo de las notas (si las hay)
grep -ohE 'https://i\.imgur\.com/[A-Za-z0-9]+\.(jpeg|jpg|png)' explorar-adi/notas/*.html | sort -u > explorar-adi/imgs.txt
wc -l explorar-adi/imgs.txt
