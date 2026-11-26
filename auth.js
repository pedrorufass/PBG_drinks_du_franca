// Supabase Auth compartilhado pelas páginas. A biblioteca é carregada via CDN.
(function(){
  const cfg=window.APP_CONFIG||{};
  const configurado=cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('SEU-PROJETO') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('SUA_CHAVE');
  if(configurado && window.supabase) window.authClient=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  window.exigirLogin=async function(destino='login.html'){
    if(!window.authClient){ if(location.pathname.endsWith('admin.html')) location.href='admin-login.html'; return null; }
    const {data,error}=await window.authClient.auth.getSession();
    if(error||!data.session){ location.href=destino; return null; }
    return data.session;
  };
})();
