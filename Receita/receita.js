// ano automático
document.getElementById("year").textContent = new Date().getFullYear();

// copiar receita
document.getElementById("btnCopy").addEventListener("click", () => {
  const text = document.getElementById("recipe-text").innerText;

  navigator.clipboard.writeText(text).then(() => {
    alert("Receita copiada com sucesso!");
  });
});

// compartilhar
document.getElementById("btnShare").addEventListener("click", () => {
  const title = document.getElementById("recipe-title").innerText;
  const text = document.getElementById("recipe-text").innerText;
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({
      title,
      text,
      url
    });
  } else {
    navigator.clipboard.writeText(`${title}\n\n${text}\n\n${url}`);
    alert("Link e receita copiados para compartilhamento!");
  }
});
