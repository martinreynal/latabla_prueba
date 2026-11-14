#!/bin/bash
# Exploración temporal: qué ligas de ESPN tienen scoreboard y cómo vienen.
mkdir -p explorar-espn
for d in 20261114 20261115; do
for l in arg.1 arg.2 arg.3 arg.4 arg.5 arg.copa arg.supercopa arg.trofeo conmebol.libertadores conmebol.sudamericana conmebol.recopa fifa.friendly fifa.worldq.conmebol; do
  code=$(curl -s -o "explorar-espn/$l-$d.json" -w '%{http_code}' "https://site.api.espn.com/apis/site/v2/sports/soccer/$l/scoreboard?dates=$d")
  n=$(python3 -c "import json;d=json.load(open('explorar-espn/$l-$d.json'));print(len(d.get('events',[])), d.get('leagues',[{}])[0].get('name','?'))" 2>/dev/null)
  echo "$d $l $code $n"
done; done | tee explorar-espn/resumen.txt
# Muestra de un evento
python3 - <<'PY'
import json,glob
for f in sorted(glob.glob('explorar-espn/*.json')):
    d=json.load(open(f))
    if d.get('events'):
        e=d['events'][0]; c=e['competitions'][0]
        print(f, json.dumps({'date':e['date'],'name':e['name'],'status':e['status'],'venue':c.get('venue',{}).get('fullName'),
          'comp':[{'ha':x['homeAway'],'score':x.get('score'),'team':{k:x['team'].get(k) for k in ('id','displayName','shortDisplayName','abbreviation','logo')}} for x in c['competitors']]}, ensure_ascii=False)[:1500])
        break
PY
