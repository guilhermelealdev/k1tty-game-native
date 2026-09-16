// src/game/commands/parser.js
// Parse + despacho de comandos. Centraliza a logica que o TerminalScreen
// e o TutorialWindow usam pra executar comandos.

import {
  executeAchievements,
  executeAdmin,
  executeApt,
  executeCat,
  executeCatFact,
  executeCd,
  executeClear,
  executeConnect,
  executeCowsay,
  executeDate,
  executeEcho,
  executeFastfetch,
  executeFind,
  executeGrep,
  executeHelp,
  executeHistory,
  executeHowleft,
  executeK1ttyRecursive,
  executeLog,
  executeLs,
  executeMeta,
  executeMiauVn,
  executeMkdir,
  executeMv,
  executeNotes,
  executeNvim,
  executePing,
  executePokemon,
  executePwd,
  executeQuote,
  executeReboot,
  executeRm,
  executeSnapshot,
  executeSudo,
  executeSwitchOS,
  executeThemes,
  executeTouch,
  executeUntar,
  executeUnzip,
  executeVictory,
  executeVisualNovel,
  executeWeb,
  executeWhatnow,
  executeWhoami,
} from "./commands";
import { PACKAGES_WITH_WINDOW } from "./packages";

/* ============================================================
   parseCommand
   ============================================================ */
export function parseCommand(input) {
  const parts = [];
  let current = "";
  let quoteChar = null;
  let isEscaping = false;

  for (const char of input.trim()) {
    if (isEscaping) {
      current += char;
      isEscaping = false;
      continue;
    }
    if (char === "\\") {
      isEscaping = true;
      continue;
    }
    if (quoteChar) {
      if (char === quoteChar) quoteChar = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quoteChar = char;
      continue;
    }
    if (char === " ") {
      if (current) {
        parts.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) parts.push(current);
  return { command: parts[0], args: parts.slice(1) };
}

/* ============================================================
   BASE_COMMANDS
   ============================================================ */
export const BASE_COMMANDS = new Set([
  "ls", "cd", "cat", "touch", "mkdir", "rm", "mv", "find", "grep",
  "pwd", "echo", "clear", "history",
  "whoami", "date", "help", "--help",
  "sudo", "reboot", "snapshot", "notes", "log",
  "howleft", "whatnow", "meta", "themes", "theme",
  "ping", "connect",
  "nvim",
  "fastfetch", "cowsay",
  "web", "achievements",
  "admin",
  "victory", "switchos",
]);

/* ============================================================
   COMMAND_PACKAGE_MAP
   ============================================================ */
export const COMMAND_PACKAGE_MAP = {
  matrix: "matrix",
  btop: "btop",
  lens: "lens",
  mp3player: "mp3player",
  audioview: "audioview",
  bonsai: "bonsai",
  catrun: "catrun",
  kitty: "kitty",
  meow: "meow",
  ram: "ram",
  opsec: "opsec",
  bluetooth: "bluetooth",
  whoisthis: "whoisthis",
  kittens: "kittens",
  k1tty: "k1tty",
  unzip: "unzip",
  untar: "untar",
  catfact: "catfact",
  quote: "quote",
  pokemon: "pokemon",
  "miau-vn": "miau-vn",
  tutorial: "tutorial",
  "apt-cli": "apt-cli",
};

/* ============================================================
   Mapa de executores
   ============================================================ */
/** @type {Record<string, Function>} */
const COMMANDS = {
  ls: executeLs,
  cd: executeCd,
  cat: executeCat,
  touch: executeTouch,
  mkdir: executeMkdir,
  rm: executeRm,
  mv: executeMv,
  find: executeFind,
  grep: executeGrep,
  pwd: executePwd,
  echo: executeEcho,
  history: executeHistory,
  date: executeDate,
  whoami: executeWhoami,
  help: executeHelp,
  "--help": executeHelp,
  fastfetch: executeFastfetch,
  cowsay: executeCowsay,
  whatnow: executeWhatnow,
  howleft: executeHowleft,
  notes: executeNotes,
  log: executeLog,
  snapshot: executeSnapshot,
  reboot: executeReboot,
  apt: executeApt,
  ping: executePing,
  connect: executeConnect,
  nvim: executeNvim,
  sudo: executeSudo,
  admin: executeAdmin,
  meta: executeMeta,
  victory: executeVictory,
  switchos: executeSwitchOS,
  themes: executeThemes,
  theme: executeThemes,
  web: executeWeb,
  achievements: executeAchievements,
  "miau-vn": executeMiauVn,
  unzip: executeUnzip,
  untar: executeUntar,
  catfact: executeCatFact,
  quote: executeQuote,
  pokemon: executePokemon,
  vn: executeVisualNovel,
  k1ttyRecursive: executeK1ttyRecursive,
  clear: executeClear,
};

/* ============================================================
   executeCommand
   ============================================================ */
export function executeCommand(input, state, dispatch, options = {}) {
  const parsed = parseCommand(input);
  const command = parsed.command;
  const args = parsed.args;

  if (!command) return null;

  if (command === "clear") {
    return executeClear(args, state, dispatch, options);
  }

  if (!BASE_COMMANDS.has(command)) {
    const requiredPkg = COMMAND_PACKAGE_MAP[command];
    if (requiredPkg && state.installedPackages.indexOf(requiredPkg) < 0) {
      return {
        command: input,
        output:
          "Comando nao encontrado: " +
          command +
          ".\nInstale com: sudo apt install " +
          requiredPkg,
        type: "error",
      };
    }
  }

  const pkg = PACKAGES_WITH_WINDOW.find((p) => p.id === command);
  if (pkg && state.installedPackages.indexOf(pkg.id) >= 0) {
    dispatch({ type: "OPEN_WINDOW", payload: pkg.openWindow });
    return {
      command,
      output: "Abrindo " + pkg.label + "...",
      type: "success",
    };
  }

  const executor = COMMANDS[command];
  if (!executor) {
    return {
      command: input,
      output: "Comando nao encontrado: " + command + ". Digite 'help'.",
      type: "error",
    };
  }

  try {
    return executor(args, state, dispatch, options);
  } catch (err) {
    return {
      command: input,
      output: "erro: " + (err && err.message ? err.message : String(err)),
      type: "error",
    };
  }
}