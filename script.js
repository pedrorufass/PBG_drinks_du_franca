/* Menu do celular e setas do carrossel do cardápio. Sem dependências. */
(function () {
  var nav = document.querySelector(".nav");
  var btn = document.querySelector("[data-menu-btn]");
  if (nav && btn) {
    var fechar = function () {
      nav.classList.remove("aberto");
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", function () {
      var aberto = nav.classList.toggle("aberto");
      btn.setAttribute("aria-expanded", String(aberto));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest(".nav-links a")) fechar();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") fechar();
    });
  }

  var lista = document.querySelector("[data-cards]");
  var setas = document.querySelector("[data-setas]");
  if (!lista || !setas) return;
  var anterior = setas.querySelector("[data-prev]");
  var proximo = setas.querySelector("[data-next]");

  function passo() {
    var card = lista.querySelector(".card");
    if (!card) return 300;
    var gap = parseFloat(getComputedStyle(lista).columnGap) || 16;
    var largura = card.getBoundingClientRect().width + gap;
    var visiveis = Math.max(1, Math.floor(lista.clientWidth / largura));
    return largura * visiveis;
  }
  function atualizar() {
    var rola = lista.scrollWidth > lista.clientWidth + 4;
    setas.hidden = !rola;
    anterior.disabled = lista.scrollLeft <= 2;
    proximo.disabled = lista.scrollLeft + lista.clientWidth >= lista.scrollWidth - 2;
  }

  anterior.addEventListener("click", function () { lista.scrollBy({ left: -passo(), behavior: "smooth" }); });
  proximo.addEventListener("click", function () { lista.scrollBy({ left: passo(), behavior: "smooth" }); });
  lista.addEventListener("scroll", atualizar, { passive: true });
  window.addEventListener("resize", atualizar);
  window.addEventListener("load", atualizar);
  atualizar();
})();
