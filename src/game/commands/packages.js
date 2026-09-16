// src/game/commands/packages.js
// Catalogo de pacotes instalaveis via `sudo apt install`.
// `web` e `achievements` NAO entram aqui: sao comandos base.

export const PACKAGES = [
  // ---- jogos / entretenimento (abrem janela) ----
  { id: "matrix",    label: "Chuva de caracteres Matrix",     openWindow: "matrix" },
  { id: "mp3player", label: "Player de musica TUI",           openWindow: "mp3player" },
  { id: "lens",      label: "Visualizador de imagens",        openWindow: "lens" },
  { id: "bonsai",    label: "Arvore ASCII colorida",          openWindow: "bonsai" },
  { id: "audioview", label: "Visualizador de audio",          openWindow: "audioview" },
  { id: "opsec",     label: "Exibe foto especial",            openWindow: "opsec" },
  { id: "meow",      label: "k1tty Clicker",                  openWindow: "meow" },
  { id: "catrun",    label: "Mini jogo do gatinho",           openWindow: "catrun" },
  { id: "btop",      label: "Monitor de sistema",             openWindow: "btop" },
  { id: "ram",       label: "Instalador de RAM",              openWindow: "ram" },
  { id: "tutorial",  label: "Assistente local miau",          openWindow: "tutorial" },
  { id: "k1tty",     label: "Abre o proprio jogo",            openWindow: "k1tty" },
  { id: "kitty",     label: "Foto aleatoria de gato (API)",   openWindow: "kitty" },
  { id: "bluetooth", label: "Lista dispositivos",             openWindow: "bluetooth" },
  { id: "whoisthis", label: "Detalhes de arquivo",            openWindow: "whoisthis" },
  { id: "kittens",   label: "Gerenciador de temas",           openWindow: "kittens" },
  { id: "apt-cli",   label: "Gerenciador grafico de pacotes", openWindow: "apt-cli", local: true },

  // ---- pacotes com comando puro ----
  { id: "unzip",     label: "Extrai arquivos .zip",           noWindow: true },
  { id: "untar",     label: "Extrai arquivos .tar",           noWindow: true },

  // ---- VN da miau (instalado via unzip, nao via apt install direto) ----
  { id: "miau-vn",   label: "Visual novel da miau",           noWindow: true },

  // ---- APIs externas ----
  { id: "catfact",   label: "Fato sobre gatos",               noWindow: true },
  { id: "quote",     label: "Frase filosofica",               noWindow: true },
  { id: "pokemon",   label: "Pokedex (pokeapi.co)",           noWindow: true },
];

export const PACKAGE_IDS = PACKAGES.map((p) => p.id);

export const PACKAGES_WITH_WINDOW = PACKAGES.filter((p) => p.openWindow);

export const PACKAGE_BY_ID = Object.fromEntries(
  PACKAGES.map((p) => [p.id, p]),
);

export function formatAptHelpList() {
  return PACKAGES.map((p) => p.id.padEnd(12) + " " + p.label).join("\n");
}

export function formatHelpDescriptions() {
  const map = {};
  for (const p of PACKAGES) {
    map[p.id] = p.id + (p.noWindow ? " <arquivo>" : "") + " - " + p.label;
  }
  return map;
}