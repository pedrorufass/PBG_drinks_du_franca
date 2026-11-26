(async function(){
 const cards=[...document.querySelectorAll('.card')];
 cards.forEach(card=>{
  const btn=card.querySelector('.adicionar-produto');
  if(!btn)return;
  btn.addEventListener('click',()=>{
   const produto={id:card.id,nome:card.querySelector('.card-nome').textContent.trim(),preco:Number(card.querySelector('.card-preco').textContent.replace('R$','').trim().replace('.','').replace(',','.')),imagem:card.querySelector('img')?.getAttribute('src')||''};
   adicionarCarrinho(produto);
   btn.textContent='Adicionado!';
   setTimeout(()=>btn.textContent='Adicionar ao carrinho',1100);
  });
 });
 const produtos=await buscarProdutos();
 if(produtos===null)return;
 const lista=document.querySelector('[data-cards]');
 if(!lista)return;
 const disponiveis=produtos.filter(p=>p.disponivel!==false);
 const escaparHtml=valor=>String(valor??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const imagemSegura=valor=>{
  try{
   const url=new URL(String(valor),location.href);
   return ['http:','https:'].includes(url.protocol)?escaparHtml(url.href):'';
  }catch{return '';}
 };
 if(!disponiveis.length){lista.innerHTML='<li class="mensagem">Nenhum drink disponível no momento.</li>';return;}
 lista.innerHTML=disponiveis.map(p=>{
  const nome=escaparHtml(p.nome);
  const imagem=imagemSegura(p.imagem);
  const ingredientes=Array.isArray(p.ingredientes)?p.ingredientes.filter(Boolean):[];
  const chips=ingredientes.length?`<ul class="chips" aria-label="Ingredientes">${ingredientes.map(item=>`<li>${escaparHtml(item)}</li>`).join('')}</ul>`:'';
  return `<li class="card"><div class="card-media">${imagem?`<img src="${imagem}" alt="${nome}">`:`<div class="card-ph tom-lilas"><span class="display">${nome}</span></div>`}</div><div class="card-linha"><h3 class="card-nome display">${nome}</h3><span class="card-preco">${escaparHtml(formatarBRL(p.preco))}</span></div><p class="card-desc">${escaparHtml(p.descricao||'')}</p>${chips}<button class="botao botao--rosa botao-menor adicionar-produto" type="button">Adicionar ao carrinho</button></li>`;
 }).join('');
 lista.querySelectorAll('.adicionar-produto').forEach((btn,i)=>btn.addEventListener('click',()=>{
  adicionarCarrinho(disponiveis[i]);
  btn.textContent='Adicionado!';
  setTimeout(()=>btn.textContent='Adicionar ao carrinho',1100);
 }));
})();
