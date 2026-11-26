(async function(){
 const lista=document.getElementById('compras-lista');
 if(!lista||typeof buscarComprasRecentes!=='function')return;
 const compras=await buscarComprasRecentes();
 if(compras===null){lista.innerHTML='<p class="compras-vazio">Histórico disponível quando a API estiver conectada.</p>';return;}
 if(!compras.length){lista.innerHTML='<p class="compras-vazio">Ainda não há compras registradas.</p>';return;}
 const esc=valor=>String(valor??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 lista.innerHTML=compras.map((compra,index)=>{
  const data=new Date(compra.criadoEm);
  const dataTexto=Number.isNaN(data.getTime())?'Data indisponível':data.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  const resumo=(compra.itens||[]).map(item=>`${Number(item.quantidade)||1}x ${esc(item.nome)}`).join(', ');
  return `<article class="compra-item"><div class="compra-info"><strong>Pedido #${index+1}</strong><span>${esc(dataTexto)}</span><p>${resumo}</p></div><strong class="compra-total">${formatarBRL(compra.total)}</strong></article>`;
 }).join('');
})();
