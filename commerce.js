// Carrinho persistido no navegador; catálogo prioriza a API (MongoDB) e mantém os itens locais para demonstração.
(function(){
 const KEY='dfc_carrinho';
 window.formatarBRL=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 window.lerCarrinho=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
 window.salvarCarrinho=itens=>localStorage.setItem(KEY,JSON.stringify(itens));
 window.adicionarCarrinho=produto=>{const itens=lerCarrinho();const id=String(produto.id||produto._id||produto.nome);const atual=itens.find(i=>String(i.id)===id);if(atual)atual.quantidade++;else itens.push({id,nome:produto.nome,preco:Number(produto.preco),imagem:produto.imagem||produto.img||'',quantidade:1});salvarCarrinho(itens);};
 window.apiUrl=caminho=>{const base=(window.APP_CONFIG||{}).API_BASE_URL||'';return base.replace(/\/$/,'')+caminho;};
 window.buscarProdutos=async()=>{try{const r=await fetch(apiUrl('/api/produtos'));if(!r.ok)throw Error('API indisponível');const data=await r.json();return Array.isArray(data)?data:(data.produtos||[]);}catch(e){return null;}};
 window.buscarComprasRecentes=async()=>{try{const r=await fetch(apiUrl('/api/compras/recentes'));if(!r.ok)throw Error('Não foi possível consultar as compras.');return await r.json();}catch(e){return null;}};
})();
