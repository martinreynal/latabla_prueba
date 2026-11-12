const $ = (id) => document.getElementById(id);
chrome.storage.local.get(['url', 'token']).then(({ url, token }) => { $('url').value = url || ''; $('token').value = token || ''; });
$('guardar').onclick = async () => {
  const url = $('url').value.trim().replace(/\/$/, '');
  const token = $('token').value.trim();
  const msg = $('msg');
  msg.hidden = false;
  if (!/^https:\/\//.test(url) || !token) { msg.className = 'aviso error'; msg.textContent = 'Completá una dirección https y el token.'; return; }
  await chrome.storage.local.set({ url, token });
  try {
    const r = await fetch(`${url}/api/equipos`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(r.status === 401 ? 'El token no coincide con el de Vercel' : `Error ${r.status}`);
    msg.className = 'aviso ok'; msg.textContent = 'Guardado y conectado con Latabla.';
  } catch (e) { msg.className = 'aviso error'; msg.textContent = `Guardado, pero no pude conectar: ${e.message}`; }
};
