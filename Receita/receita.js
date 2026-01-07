// ano automático
document.getElementById("year").textContent = new Date().getFullYear();

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
