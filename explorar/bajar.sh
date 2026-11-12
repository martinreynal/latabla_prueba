#!/bin/bash
# 2.ª pasada: listado completo de la temporada, categoría juveniles y todas las notas de Proyección/juveniles.
set -u
mkdir -p explorar/html2
UA="Mozilla/5.0 (compatible; LatablaBot/0.1; +https://latabla-prueba.vercel.app)"
for p in $(seq 1 160); do
  curl -sL -A "$UA" "https://www.afa.com.ar/es/posts/?s=Noticias&page=$p" -o "explorar/html2/lista-$p.html"; sleep 0.5
done
for p in $(seq 1 25); do
  curl -sL -A "$UA" "https://www.afa.com.ar/es/posts/?s=F%C3%BAtbol%20Juvenil&page=$p" -o "explorar/html2/juv-$p.html"; sleep 0.5
done
grep -oh 'href="https://www.afa.com.ar/es/posts/[^"?]*"' explorar/html2/*.html | sort -u | sed 's/href="//;s/"$//' > explorar/links2.txt
wc -l explorar/links2.txt
grep -iE 'proyecc|royeccion|reserva|juvenil|inferior|primera-b|primera-c|promocional|resultad' explorar/links2.txt | grep -v categories > explorar/elegidos2.txt
wc -l explorar/elegidos2.txt
mkdir -p explorar/notas
while read -r u; do
  f="explorar/notas/$(basename "$u").html"
  [ -s "$f" ] || { curl -sL -A "$UA" "$u" -o "$f"; sleep 0.5; }
done < explorar/elegidos2.txt
rm -f explorar/html2/lista-*.html
du -sh explorar/notas
