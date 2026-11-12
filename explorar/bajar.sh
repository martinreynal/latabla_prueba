#!/bin/bash
# Baja páginas del listado de noticias de AFA y las notas enlazadas, para analizarlas.
set -u
mkdir -p explorar/html
UA="Mozilla/5.0 (compatible; LatablaBot/0.1; +https://latabla-prueba.vercel.app)"
for p in $(seq 1 40); do
  curl -sL -A "$UA" "https://www.afa.com.ar/es/posts/?s=Noticias&page=$p" -o "explorar/html/lista-$p.html"
  sleep 1
done
grep -oh 'href="https://www.afa.com.ar/es/posts/[^"?]*"' explorar/html/lista-*.html | sort -u | sed 's/href="//;s/"$//' > explorar/links.txt
wc -l explorar/links.txt
grep -iE 'proyeccion|reserva|juvenil|inferior|primera-b|primera-c|promocional|federal|nacional|ascenso|resultados|posiciones|fecha' explorar/links.txt | head -60 > explorar/elegidos.txt
i=0
while read -r u; do
  i=$((i+1)); curl -sL -A "$UA" "$u" -o "explorar/html/nota-$(basename "$u").html"; sleep 1
done < explorar/elegidos.txt
for u in https://www.afa.com.ar/es/ https://www.afa.com.ar/es/pages/ https://www.afa.com.ar/es/sitemap.xml https://www.afa.com.ar/sitemap.xml; do
  curl -sL -A "$UA" "$u" -o "explorar/html/extra-$(echo $u | md5sum | cut -c1-6).html"; done
ls -la explorar/html | head -5; du -sh explorar/html
