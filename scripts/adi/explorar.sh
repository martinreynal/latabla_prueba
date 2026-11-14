#!/bin/bash
# Exploración temporal de ascensodelinterior.com.ar: baja la página de tablas y lo que referencia.
set -u
mkdir -p explorar-adi
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
B=https://www.ascensodelinterior.com.ar
curl -sL -A "$UA" -D explorar-adi/headers.txt "$B/tabla-de-posiciones/5/torneo-federal-c/" -o explorar-adi/tabla-5.html
curl -sL -A "$UA" "$B/robots.txt" -o explorar-adi/robots.txt
curl -sL -A "$UA" "$B/" -o explorar-adi/home.html
grep -oE '(src|href)="[^"]+\.js[^"]*"' explorar-adi/tabla-5.html | sed 's/.*="//;s/"$//' | head -20 > explorar-adi/scripts.txt
grep -oE "https?://[^\"' ]*(api|json|ajax)[^\"' ]*" explorar-adi/tabla-5.html | sort -u > explorar-adi/apis.txt
grep -oE 'href="[^"]*tabla-de-posiciones[^"]*"' explorar-adi/*.html | sort -u > explorar-adi/links-tablas.txt
ls -la explorar-adi; wc -c explorar-adi/*.html
