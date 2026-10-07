import re, glob, sys
d = 'dist-preview'
h = open(d + '/index.html').read()
css = open(glob.glob(d + '/assets/*.css')[0]).read()
js = open(glob.glob(d + '/assets/*.js')[0]).read()
h = re.sub(r'<link rel="icon"[^>]*>\s*', '', h)
h = re.sub(r'<link rel="stylesheet" crossorigin href="/assets/[^"]+">', lambda m: '<style>' + css + '</style>', h)
h = re.sub(r'<script type="module" crossorigin src="/assets/[^"]+"></script>', lambda m: '<script type="module">' + js.replace('</script', '<\\/script') + '</script>', h)
assert '/assets/' not in h
open(sys.argv[1], 'w').write(h)
