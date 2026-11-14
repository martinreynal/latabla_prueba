#!/bin/bash
# Exploración temporal: páginas de resultados del Torneo Regional (TDI) en ascensodelinterior.com.ar.
set -u
mkdir -p explorar-adi/res
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
B=https://ascensodelinterior.com.ar
curl -sL -A "$UA" "$B/tdi/resultados/" -o explorar-adi/res/indice.html
grep -oE 'href="[^"]*tdi/resultados/[0-9]+/[^"]*"' explorar-adi/res/indice.html | sed 's/href="//;s/"$//' | sort -u > explorar-adi/res/links.txt
echo "https://ascensodelinterior.com.ar/tdi/resultados/219/torneo-regional-2026---tercera-ronda-(ida-y-vuelta)/" >> explorar-adi/res/links.txt
sort -u explorar-adi/res/links.txt | grep -i "2026" > explorar-adi/res/links26.txt
cat explorar-adi/res/links26.txt
while read -r u; do
  case "$u" in http*) url="$u";; *) url="$B$u";; esac
  n=$(echo "$u" | grep -oE 'resultados/[0-9]+' | cut -d/ -f2)
  curl -sL -A "$UA" "$url" -o "explorar-adi/res/r-$n.html"; sleep 0.7
done < explorar-adi/res/links26.txt
ls -la explorar-adi/res
