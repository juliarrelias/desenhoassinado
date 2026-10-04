// Client ID do Google é público: pode ficar no repositório.
const GOOGLE_CLIENT_ID = "COLE_AQUI_SEU_CLIENT_ID.apps.googleusercontent.com";

let idToken = null;

const form = document.getElementById("form");
const inputNumero = document.getElementById("numero");
const erroEl = document.getElementById("erro");
const resultado = document.getElementById("resultado");
const baixar = document.getElementById("baixar");
const usuario = document.getElementById("usuario");

function mostrarErro(msg) {
  erroEl.textContent = msg;
  resultado.innerHTML = "";
  baixar.hidden = true;
}

function onGoogleCredential(resp) {
  idToken = resp.credential;
  erroEl.textContent = "";
  usuario.textContent = "Login realizado com o Google.";
}

window.addEventListener("load", () => {
  const iniciar = () => {
    if (!window.google || !google.accounts) return setTimeout(iniciar, 100);
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onGoogleCredential,
    });
    google.accounts.id.renderButton(document.getElementById("botao-google"), {
      theme: "outline",
      size: "large",
    });
  };
  iniciar();
});

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  erroEl.textContent = "";

  if (!idToken) {
    return mostrarErro("Faça login com o Google antes de gerar o desenho.");
  }

  let resp;
  try {
    resp = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ numero: Number(inputNumero.value) }),
    });
  } catch {
    return mostrarErro("Falha de rede ao chamar o servidor.");
  }

  if (resp.status === 400) {
    return mostrarErro("Erro 400: o número deve ser um inteiro entre 1 e 100.");
  }
  if (resp.status === 401) {
    idToken = null;
    usuario.textContent = "";
    return mostrarErro("Erro 401: login inválido ou expirado. Entre com o Google novamente.");
  }
  if (!resp.ok) {
    return mostrarErro("Erro inesperado (" + resp.status + ").");
  }

  const svg = await resp.text();
  resultado.innerHTML = svg; // SVG gerado pelo nosso servidor (e-mail já escapado)

  const blob = new Blob([svg], { type: "image/svg+xml" });
  baixar.href = URL.createObjectURL(blob);
  baixar.hidden = false;
});
