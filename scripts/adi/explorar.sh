#!/bin/bash
# Exploración temporal: baja las imágenes de las tablas de la primera ronda del Regional Amateur.
set -u
mkdir -p explorar-adi/img
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
grep -oE 'https://i\.imgur\.com/[A-Za-z0-9]+\.(jpeg|jpg|png)' explorar-adi/tabla-5.html | awk '!v[$0]++' > explorar-adi/imagenes.txt
n=0
for r in norte litoral-norte litoral-sur centro cuyo pampeana-norte pampeana-sur patagonia; do
  n=$((n+1)); u=$(sed -n "${n}p" explorar-adi/imagenes.txt)
  curl -sL -A "$UA" -e "https://www.ascensodelinterior.com.ar/" "$u" -o "explorar-adi/img/$n-$r.jpg"
  file "explorar-adi/img/$n-$r.jpg"
done
