// src/game/commands/commands.js
// Executores de comando. Portado do web original.

import {
  deepClone,
  formatDate,
  formatPermissions,
  formatSize,
  getFileName,
  getNodeByPath,
  getParentPath,
  joinPath,
} from "../fs/helpers";
import { canRead, canWrite } from "../fs/permissions";
import { fetchCatFact } from "../services/catFactApi";
import { fetchPokemon, getRandomCatPokemonId } from "../services/pokeApi";
import { fetchQuote } from "../services/quoteApi";
import { THEMES } from "../theme/themes";
import {
  formatAptHelpList,
  formatHelpDescriptions,
  PACKAGE_IDS,
} from "./packages";

/* ============================================================
   Helpers internos
   ============================================================ */
function setFlag(dispatch, flag, value = true) {
  dispatch({ type: "SET_FLAG", payload: { flag, value } });
}

function pushStat(dispatch, key, value) {
  dispatch({ type: "STAT_PUSH", payload: { key, value } });
}

function displayNode(node, showDetails = false, showHidden = false) {
  if (!showHidden && node.hidden) return null;
  if (showDetails) {
    const perms = formatPermissions(node);
    const size = formatSize(node.size || 0);
    const date = formatDate(node.lastModified);
    const type = node.type === "dir" ? "d" : "-";
    return (
      type +
      perms +
      " " +
      node.owner.padEnd(8) +
      " " +
      size.padEnd(6) +
      " " +
      date +
      " " +
      node.name
    );
  }
  return node.name;
}

function checkOwnPassword(node, options) {
  if (!node || !node.password) return null;
  if (!options.password) return "needs";
  if (options.password !== node.password) return "wrong";
  return null;
}

function expandGlob(pattern, state) {
  if (!pattern || !/[*?]/.test(pattern)) return [pattern];
  const fullPatternPath = joinPath(state.currentDirectory, pattern);
  const dirPath = getParentPath(fullPatternPath);
  const dirNode = getNodeByPath(state.filesystem, dirPath);
  if (!dirNode || dirNode.type !== "dir") return [];
  const base = getFileName(fullPatternPath);
  const regex = new RegExp(
    "^" +
      base
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".") +
      "$",
  );
  const matched = Object.keys(dirNode.children || {})
    .filter((n) => regex.test(n))
    .sort();
  return matched.map((n) => (dirPath === "/" ? "/" + n : dirPath + "/" + n));
}

function buildGrepRegex(pattern, ignoreCase = true) {
  try {
    const hasMeta = /[\\^$.*+?()[\]{}|]/.test(pattern);
    if (hasMeta) return new RegExp(pattern, ignoreCase ? "i" : "");
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, ignoreCase ? "i" : "");
  } catch {
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
}

function generateRemovalLogs() {
  const dirs = [
    "/home/k1tty/Documents",
    "/home/k1tty/Music",
    "/home/k1tty/Pictures",
    "/etc",
    "/var",
    "/tmp",
    "/usr",
    "/bin",
    "/root",
    "/boot",
    "/dev",
    "/proc",
    "/sys",
    "/lib",
    "/sbin",
    "/home",
  ];
  const files = [
    "/home/k1tty/Documents/DO NOT OPEN/whisper.txt",
    "/home/k1tty/Documents/DO NOT OPEN/password.txt",
    "/etc/logo.txt",
    "/var/log/userlog",
    "/root/secret/README.txt",
    "/root/secret/cats.tar",
    "/root/secret/cat_photos.zip",
  ];
  const logs = [];
  for (const d of dirs) {
    logs.push("removendo " + d + "...");
    if (
      d.indexOf("/home") === 0 ||
      d === "/etc" ||
      d === "/var" ||
      d === "/usr"
    ) {
      for (let i = 0; i < 3; i++)
        logs.push("removendo " + d + "/arquivo_" + i + ".txt...");
    }
  }
  for (const f of files) logs.push("removendo " + f + "...");
  logs.push("Sistema corrompido!");
  return logs;
}

const FIRST_VISIT_HINTS = {
  "/home/k1tty/Documents/DO NOT OPEN": {
    flag: "visited_doNotOpen",
    text: "Um diretorio com nome imperativo. Dentro dele, dois arquivos: um que sussurra, outro que exige um nome.",
  },
  "/root": {
    flag: "visited_root",
    text: "Voce esta na raiz do sistema. Poucos chegam ate aqui sem sujar as maos.",
  },
  "/root/secret": {
    flag: "visited_secret",
    text: "E aqui que as coisas importantes moram. Leia o README com atencao.",
  },
  "/home/k1tty/Music": {
    flag: "visited_music",
    text: "Nem toda faixa e so som. Algumas guardam padroes.",
  },
  "/home/k1tty/Downloads": {
    flag: "visited_downloads",
    text: "O que foi enviado esta aqui. Algo espera ser instalado.",
  },
  "/home/k1tty/from_phone": {
    flag: "visited_fromPhone",
    text: "Arquivos vindos do celular. Um deles esta trancado com uma palavra.",
  },
};

/* ============================================================
   ls
   ============================================================ */
export function executeLs(args, state, dispatch, options = {}) {
  const showHidden =
    args.indexOf("-a") >= 0 ||
    args.indexOf("-la") >= 0 ||
    args.indexOf("-al") >= 0;
  const showDetails =
    args.indexOf("-l") >= 0 ||
    args.indexOf("-la") >= 0 ||
    args.indexOf("-al") >= 0;
  if (showHidden) setFlag(dispatch, "usedLsA");

  let targetPath = state.currentDirectory;
  const nonFlag = args.filter((a) => a.charAt(0) !== "-");
  if (nonFlag.length > 0)
    targetPath = joinPath(state.currentDirectory, nonFlag[0]);

  const node = getNodeByPath(state.filesystem, targetPath);
  if (!node)
    return {
      command: "ls " + args.join(" "),
      output: "ls: '" + targetPath + "': Arquivo ou diretorio inexistente",
      type: "error",
    };

  const pw = checkOwnPassword(node, options);
  if (pw === "needs")
    return {
      command: "ls " + args.join(" "),
      output: "Diretorio '" + targetPath + "' protegido. Digite a senha:",
      type: "warning",
      needsPassword: true,
    };
  if (pw === "wrong")
    return {
      command: "ls " + args.join(" "),
      output: "Senha incorreta. Acesso negado.",
      type: "error",
    };

  if (node.type === "file")
    return {
      command: "ls " + args.join(" "),
      output: node.name,
      type: "normal",
    };
  if (node.requiresSudo || (node.locked && !node.password))
    return {
      command: "ls " + args.join(" "),
      output: "ls: permissao negada",
      type: "error",
      needsSudo: true,
    };
  if (node.children && node.children["DO NOT OPEN"])
    setFlag(dispatch, "foundDoNotOpen");

  const entries = Object.values(node.children || {}).filter(
    (e) => showHidden || !e.hidden,
  );
  if (entries.length === 0)
    return { command: "ls " + args.join(" "), output: "", type: "normal" };

  const sorted = entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const lines = sorted
    .map((e) => displayNode(e, showDetails, showHidden))
    .filter(Boolean);
  return {
    command: "ls " + args.join(" "),
    output: showDetails ? lines.join("\n") : lines.join("  "),
    type: "normal",
  };
}

/* ============================================================
   cd
   ============================================================ */
export function executeCd(args, state, dispatch, options = {}) {
  if (args.length === 0) {
    const prev = state.currentDirectory;
    dispatch({ type: "CHANGE_DIRECTORY", payload: "/home/k1tty" });
    setFlag(dispatch, "previousDirectory", prev);
    pushStat(dispatch, "dirsVisited", "/home/k1tty");
    return { command: "cd", output: "", type: "normal" };
  }

  const target = args[0];
  if (target === "-") {
    const prev = state.flags && state.flags.previousDirectory;
    if (!prev)
      return {
        command: "cd -",
        output: "cd: OLDPWD nao definido",
        type: "error",
      };
    dispatch({ type: "CHANGE_DIRECTORY", payload: prev });
    return { command: "cd -", output: prev, type: "normal" };
  }

  const newPath = joinPath(state.currentDirectory, target);
  const node = getNodeByPath(state.filesystem, newPath);
  if (!node)
    return {
      command: "cd " + target,
      output: "cd: " + target + ": Arquivo ou diretorio inexistente",
      type: "error",
    };
  if (node.type !== "dir")
    return {
      command: "cd " + target,
      output: "cd: " + target + ": Nao e um diretorio",
      type: "error",
    };

  const skip = state.flags && state.flags.skipPuzzlePasswords === true;
  const pw = skip ? null : checkOwnPassword(node, options);
  if (pw === "needs")
    return {
      command: "cd " + target,
      output: "Diretorio '" + target + "' protegido. Digite a senha:",
      type: "warning",
      needsPassword: true,
    };
  if (pw === "wrong")
    return {
      command: "cd " + target,
      output: "Senha incorreta. Acesso negado.",
      type: "error",
    };

  if (node.requiresSudo || (node.locked && !node.password))
    return {
      command: "cd " + target,
      output: "cd: " + target + ": Permissao negada (requer sudo)",
      type: "error",
      needsSudo: true,
    };
  if (newPath === "/root") setFlag(dispatch, "enteredRoot");
  if (newPath === "/root/secret") setFlag(dispatch, "openedSecret");
  if (getFileName(newPath) === "Music_Locked" && node.password)
    setFlag(dispatch, "unlockedMusicLocked");

  const prev = state.currentDirectory;
  dispatch({ type: "CHANGE_DIRECTORY", payload: newPath });
  setFlag(dispatch, "previousDirectory", prev);
  pushStat(dispatch, "dirsVisited", newPath);

  const hint = FIRST_VISIT_HINTS[newPath];
  if (hint && !(state.flags && state.flags[hint.flag])) {
    setFlag(dispatch, hint.flag);
    return { command: "cd " + target, output: hint.text, type: "info" };
  }
  return { command: "cd " + target, output: "", type: "normal" };
}

/* ============================================================
   cat
   ============================================================ */
export function executeCat(args, state, dispatch, options = {}) {
  if (args.length === 0)
    return { command: "cat", output: "Uso: cat <arquivo...>", type: "error" };

  let flag = null;
  if (args.indexOf("--head") >= 0) flag = "--head";
  else if (args.indexOf("--body") >= 0) flag = "--body";
  else if (args.indexOf("--tail") >= 0) flag = "--tail";

  const fileArgs = args.filter((a) => a.indexOf("--") !== 0);
  if (fileArgs.length === 0)
    return { command: "cat", output: "Uso: cat <arquivo...>", type: "error" };

  const skip = state.flags && state.flags.skipPuzzlePasswords === true;
  const targetPaths = [];
  for (const arg of fileArgs) {
    if (/[*?]/.test(arg)) {
      const exp = expandGlob(arg, state);
      if (exp.length === 0)
        return {
          command: "cat " + args.join(" "),
          output: "cat: " + arg + ": Nenhum arquivo corresponde.",
          type: "error",
        };
      targetPaths.push.apply(targetPaths, exp);
    } else {
      targetPaths.push(joinPath(state.currentDirectory, arg));
    }
  }

  const outputs = [];
  for (const targetPath of targetPaths) {
    const node = getNodeByPath(state.filesystem, targetPath);
    if (!node) {
      outputs.push(
        "cat: " +
          getFileName(targetPath) +
          ": Arquivo ou diretorio inexistente",
      );
      continue;
    }
    if (node.type === "dir") {
      outputs.push("cat: " + getFileName(targetPath) + ": E um diretorio");
      continue;
    }

    const pw = skip ? null : checkOwnPassword(node, options);
    if (pw === "needs")
      return {
        command: "cat " + args.join(" "),
        output: "\u{1F512} " + getFileName(targetPath) + " protegido. Digite a senha:",
        type: "warning",
        needsPassword: true,
      };
    if (pw === "wrong")
      return {
        command: "cat " + args.join(" "),
        output: "Senha incorreta. Acesso negado.",
        type: "error",
      };

    if (
      node.requiresSudo ||
      (node.locked && node.password === null && node.requiresUsername !== true)
    ) {
      if (!options.password)
        return {
          command: "cat " + args.join(" "),
          output:
            "cat: " +
            getFileName(targetPath) +
            ": Permissao negada (requer sudo)",
          type: "error",
          needsSudo: true,
        };
      if (options.password !== state.sudoPassword)
        return {
          command: "cat " + args.join(" "),
          output: "Senha sudo incorreta",
          type: "error",
        };
    }

    if (node.requiresUsername && !options.username && !skip) {
      return {
        command: "cat " + args.join(" "),
        output: "\u{1F512} Este arquivo esta bloqueado. Digite o nome de usuario:",
        type: "warning",
        needsUsername: true,
      };
    }
    if (node.requiresUsername && options.username && !skip) {
      if (options.username !== node.owner)
        return {
          command: "cat " + args.join(" "),
          output: "Nome de usuario incorreto. Acesso negado.",
          type: "error",
        };
    }

    const isSudoPw = targetPath.indexOf("/DO NOT OPEN/password.txt") >= 0;
    if (isSudoPw && (options.username === "k1tty" || skip))
      setFlag(dispatch, "foundSudoPassword");
    if (targetPath.indexOf("/root/secret/") === 0)
      setFlag(dispatch, "openedSecret");
    pushStat(dispatch, "filesRead", targetPath);

    let content = node.content || "";
    if (flag === "--head")
      content = content
        .split("\n")
        .slice(0, Math.ceil(content.split("\n").length / 3))
        .join("\n");
    else if (flag === "--body") {
      const cl = content.split("\n");
      content = cl
        .slice(Math.floor(cl.length / 3), Math.ceil((cl.length * 2) / 3))
        .join("\n");
    } else if (flag === "--tail")
      content = content
        .split("\n")
        .slice(-Math.ceil(content.split("\n").length / 3))
        .join("\n");

    if (targetPaths.length > 1)
      outputs.push("=== " + getFileName(targetPath) + " ===\n" + content);
    else outputs.push(content);
  }
  return {
    command: "cat " + args.join(" "),
    output: outputs.join("\n\n"),
    type: "normal",
  };
}

/* ============================================================
   touch / mkdir / rm / mv
   ============================================================ */
export function executeTouch(args, state, dispatch, options) {
  if (args.length === 0)
    return { command: "touch", output: "Uso: touch <arquivo>", type: "error" };
  const targetPath = joinPath(state.currentDirectory, args[0]);
  const parentPath = getParentPath(targetPath);
  const fileName = getFileName(targetPath);
  const parent = getNodeByPath(state.filesystem, parentPath);
  if (!parent || parent.type !== "dir")
    return {
      command: "touch " + args[0],
      output: "touch: diretorio invalido",
      type: "error",
    };
  if (!canWrite(parent))
    return {
      command: "touch " + args[0],
      output: "touch: permissao negada",
      type: "error",
    };

  const newFs = deepClone(state.filesystem);
  const newParent = getNodeByPath(newFs, parentPath);
  const isNew = !newParent.children[fileName];
  if (!isNew)
    newParent.children[fileName].lastModified = new Date().toISOString();
  else
    newParent.children[fileName] = {
      name: fileName,
      type: "file",
      content: "",
      permissions: "rw-r--r--",
      owner: "k1tty",
      hidden: false,
      locked: false,
      password: null,
      size: 0,
      lastModified: new Date().toISOString(),
      userCreated: true,
    };
  dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
  dispatch({ type: "INCREMENT_PROGRESS", payload: 1 });
  if (isNew)
    dispatch({ type: "STAT_INCREMENT", payload: { key: "filesCreated" } });
  return { command: "touch " + args[0], output: "", type: "normal" };
}

export function executeMkdir(args, state, dispatch, options) {
  if (args.length === 0)
    return {
      command: "mkdir",
      output: "Uso: mkdir <diretorio>",
      type: "error",
    };
  const targetPath = joinPath(state.currentDirectory, args[0]);
  const parentPath = getParentPath(targetPath);
  const dirName = getFileName(targetPath);
  const parent = getNodeByPath(state.filesystem, parentPath);
  if (!parent || parent.type !== "dir")
    return {
      command: "mkdir " + args[0],
      output: "mkdir: diretorio invalido",
      type: "error",
    };
  if (!canWrite(parent))
    return {
      command: "mkdir " + args[0],
      output: "mkdir: permissao negada",
      type: "error",
    };
  if (parent.children[dirName])
    return {
      command: "mkdir " + args[0],
      output: "mkdir: " + args[0] + ": ja existe",
      type: "error",
    };

  const newFs = deepClone(state.filesystem);
  const newParent = getNodeByPath(newFs, parentPath);
  newParent.children[dirName] = {
    name: dirName,
    type: "dir",
    content: null,
    permissions: "rwxr-xr-x",
    owner: "k1tty",
    hidden: false,
    locked: false,
    password: null,
    size: 4096,
    lastModified: new Date().toISOString(),
    children: {},
    userCreated: true,
  };
  dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
  dispatch({ type: "INCREMENT_PROGRESS", payload: 1 });
  dispatch({ type: "STAT_INCREMENT", payload: { key: "dirsCreated" } });
  return { command: "mkdir " + args[0], output: "", type: "normal" };
}

export function executeRm(args, state, dispatch, options = {}) {
  if (args.length === 0)
    return { command: "rm", output: "Uso: rm <alvo>", type: "error" };
  const flags = args.filter((a) => a.charAt(0) === "-");
  const targets = args.filter((a) => a.charAt(0) !== "-");
  const target = targets[0];
  if (!target)
    return {
      command: "rm " + args.join(" "),
      output: "Uso: rm <alvo>",
      type: "error",
    };

  const isRoot = target === "/" || target === "/*";
  const hasRf =
    flags.indexOf("-rf") >= 0 ||
    (flags.indexOf("-r") >= 0 && flags.indexOf("-f") >= 0);

  if (isRoot && hasRf) {
    if (!options.confirmed) {
      return {
        command: "rm " + args.join(" "),
        output:
          "\u26A0\uFE0F ATENCAO: Isso destruira todo o sistema! Digite \"y\" para confirmar:",
        type: "warning",
        needsConfirmation: true,
      };
    }
    return {
      command: "rm " + args.join(" "),
      output: "",
      type: "normal",
      systemCorrupting: true,
      removalLogs: generateRemovalLogs(),
    };
  }

  const targetPath = joinPath(state.currentDirectory, target);
  const parentPath = getParentPath(targetPath);
  const targetName = getFileName(targetPath);
  const parent = getNodeByPath(state.filesystem, parentPath);
  if (!parent || !parent.children[targetName])
    return {
      command: "rm " + target,
      output: "rm: " + target + ": Arquivo ou diretorio inexistente",
      type: "error",
    };
  const node = parent.children[targetName];
  if (!node.userCreated)
    return {
      command: "rm " + target,
      output:
        "rm: " + target + ": Operacao nao permitida em arquivos do sistema",
      type: "error",
    };
  if (!canWrite(parent))
    return {
      command: "rm " + target,
      output: "rm: " + target + ": Permissao negada",
      type: "error",
    };

  if (
    flags.indexOf("-f") < 0 &&
    flags.indexOf("-rf") < 0 &&
    !options.confirmed
  ) {
    return {
      command: "rm " + target,
      output: "rm: remover '" + target + '\'? Digite "y" para confirmar:',
      type: "warning",
      needsConfirmation: true,
    };
  }

  const newFs = deepClone(state.filesystem);
  const newParent = getNodeByPath(newFs, parentPath);
  delete newParent.children[targetName];
  dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
  dispatch({ type: "STAT_INCREMENT", payload: { key: "filesDeleted" } });
  if (targetName === "miau-vn" && !(state.flags && state.flags.miauVnRemoved))
    setFlag(dispatch, "miauVnRemoved");
  return { command: "rm " + target, output: "", type: "normal" };
}

export function executeMv(args, state, dispatch, options) {
  if (args.length < 2)
    return {
      command: "mv",
      output: "Uso: mv <origem> <destino>",
      type: "error",
    };
  const sourcePath = joinPath(state.currentDirectory, args[0]);
  const destPath = joinPath(state.currentDirectory, args[1]);
  const sourceParentPath = getParentPath(sourcePath);
  const sourceName = getFileName(sourcePath);
  const sourceParent = getNodeByPath(state.filesystem, sourceParentPath);
  if (!sourceParent || !sourceParent.children[sourceName])
    return {
      command: "mv " + args.join(" "),
      output: "mv: " + args[0] + ": Arquivo inexistente",
      type: "error",
    };
  const sourceNode = sourceParent.children[sourceName];
  if (sourceNode.owner !== "k1tty")
    return {
      command: "mv " + args.join(" "),
      output: "mv: " + args[0] + ": Operacao nao permitida",
      type: "error",
    };

  const destNode = getNodeByPath(state.filesystem, destPath);
  let finalParentPath, finalName;
  if (destNode && destNode.type === "dir") {
    finalParentPath = destPath;
    finalName = sourceName;
  } else {
    finalParentPath = getParentPath(destPath);
    finalName = getFileName(destPath);
  }
  const finalParent = getNodeByPath(state.filesystem, finalParentPath);
  if (!finalParent || finalParent.type !== "dir")
    return {
      command: "mv " + args.join(" "),
      output: "mv: destino invalido",
      type: "error",
    };
  if (!canWrite(finalParent))
    return {
      command: "mv " + args.join(" "),
      output: "mv: " + args[1] + ": Permissao negada",
      type: "error",
    };

  const newFs = deepClone(state.filesystem);
  const ns = getNodeByPath(newFs, sourceParentPath);
  const nf = getNodeByPath(newFs, finalParentPath);
  const moved = ns.children[sourceName];
  delete ns.children[sourceName];
  moved.name = finalName;
  nf.children[finalName] = moved;
  dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
  if (sourceParentPath === finalParentPath && sourceName !== finalName) {
    dispatch({ type: "STAT_INCREMENT", payload: { key: "filesRenamed" } });
  }
  return { command: "mv " + args.join(" "), output: "", type: "normal" };
}

/* ============================================================
   find / grep
   ============================================================ */
export function executeFind(args, state, dispatch, options) {
  if (args.length === 0)
    return { command: "find", output: "Uso: find <nome>", type: "error" };
  let searchTerm = null;
  let typeFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-name" && args[i + 1]) {
      searchTerm = args[i + 1];
      i++;
    } else if (args[i] === "-type" && args[i + 1]) {
      typeFilter = args[i + 1];
      i++;
    } else if (args[i].charAt(0) !== "-" && !searchTerm) searchTerm = args[i];
  }
  if (!searchTerm)
    return { command: "find", output: "Uso: find <nome>", type: "error" };

  const hasGlob = /[*?]/.test(searchTerm);
  const term = searchTerm
    .toLowerCase()
    .replace(/\./g, "\\.")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const regex = hasGlob ? new RegExp("^" + term + "$", "i") : null;
  const results = [];

  function searchNode(node, path) {
    const matches = regex
      ? regex.test(node.name)
      : node.name.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0;
    if (matches) {
      if (!typeFilter) results.push(path);
      else if (typeFilter === "d" && node.type === "dir") results.push(path);
      else if (typeFilter === "f" && node.type === "file") results.push(path);
    }
    if (node.type === "dir" && node.children) {
      for (const cn in node.children)
        searchNode(node.children[cn], path + "/" + cn);
    }
  }

  const start = getNodeByPath(state.filesystem, state.currentDirectory);
  searchNode(start, state.currentDirectory);
  if (results.length === 0)
    return {
      command: "find " + args.join(" "),
      output: "Nenhum resultado encontrado.",
      type: "normal",
    };
  return {
    command: "find " + args.join(" "),
    output: results.join("\n"),
    type: "normal",
  };
}

export function executeGrep(args, state, dispatch, options) {
  if (args.length < 2)
    return {
      command: "grep",
      output: "Uso: grep <padrao> <arquivo>",
      type: "error",
    };
  const pattern = args[0];
  const targetPath = joinPath(state.currentDirectory, args[1]);
  const node = getNodeByPath(state.filesystem, targetPath);
  if (!node || node.type === "dir")
    return {
      command: "grep " + args.join(" "),
      output: "grep: " + args[1] + ": Arquivo inexistente",
      type: "error",
    };
  if (!canRead(node))
    return {
      command: "grep " + args.join(" "),
      output: "grep: " + args[1] + ": Permissao negada",
      type: "error",
    };

  const regex = buildGrepRegex(pattern, true);
  const lines = (node.content || "").split("\n").filter((l) => regex.test(l));
  if (lines.length === 0)
    return {
      command: "grep " + args.join(" "),
      output: "(nenhuma correspondencia)",
      type: "normal",
    };
  return {
    command: "grep " + args.join(" "),
    output: lines.join("\n"),
    type: "normal",
  };
}

/* ============================================================
   Basico
   ============================================================ */
export function executePwd(args, state, dispatch, options) {
  return { command: "pwd", output: state.currentDirectory, type: "normal" };
}

export function executeEcho(args, state, dispatch, options) {
  const text = args.join(" ");
  return { command: "echo " + text, output: text, type: "normal" };
}

export function executeHistory(args, state, dispatch, options) {
  const entries = state.history || [];
  if (entries.length === 0)
    return { command: "history", output: "(vazio)", type: "normal" };
  const lines = entries.map((e, i) => {
    const n = String(i + 1).padStart(4, " ");
    return n + "  " + (e.command || "");
  });
  return { command: "history", output: lines.join("\n"), type: "normal" };
}

export function executeWhoami(args, state, dispatch, options) {
  setFlag(dispatch, "usedWhoami");
  return { command: "whoami", output: "k1tty", type: "normal" };
}

export function executeDate(args, state, dispatch, options) {
  return {
    command: "date",
    output: new Date().toLocaleString("pt-BR"),
    type: "normal",
  };
}

export function executeClear(args, state, dispatch, options) {
  dispatch({ type: "CLEAR_HISTORY" });
  return null;
}

/* ============================================================
   help
   ============================================================ */
export function executeHelp(args, state, dispatch, options) {
  const base = [
    "BLOCO 1 - Terminal basico",
    "  ls [-a|-l]     Lista conteudo (-a ocultos, -l detalhes)",
    "  cd <dir>       Muda de diretorio (cd - volta)",
    "  cat <arquivo>  Mostra conteudo (aceita globs: *.txt)",
    "  pwd            Diretorio atual",
    "  echo <txt>     Imprime texto",
    "  history        Historico de comandos",
    "  clear          Limpa o terminal",
    "",
    "BLOCO 2 - Manipular arquivos",
    "  touch <nome>   Cria arquivo vazio",
    "  mkdir <nome>   Cria diretorio",
    "  rm <nome>      Remove arquivo criado por voce",
    "  mv <a> <b>     Move ou renomeia",
    "  find <nome>    Busca arquivo pelo nome",
    "  grep <p> <f>   Busca padrao em arquivo",
    "",
    "BLOCO 3 - Sistema",
    "  whoami         Usuario atual",
    "  date           Data e hora",
    "  fastfetch      Info do sistema",
    "  log            Le /var/log/userlog",
    "  notes          Abre bloco de notas",
    "  howleft        Progresso do jogo",
    "  whatnow        Dica do proximo passo",
    "  cowsay <txt>   Vaca ASCII fala o texto",
    "  snapshot       Salva estado (load/revert/list)",
    "  reboot         Volta pra selecao de saves",
    "",
    "BLOCO 4 - Rede",
    "  ping           Lista redes wifi",
    "  connect <ssid> Conecta a uma rede",
    "",
    "BLOCO 5 - Narrativa base (sempre disponivel)",
    "  web            Abre o navegador TUI (forum)",
    "  achievements   Painel de conquistas",
    "",
    "BLOCO 6 - Pacotes",
    "  apt install <p>  Instala pacote (requer sudo)",
    "  apt remove <p>   Remove pacote",
    "  apt help         Lista pacotes",
    "  sudo <cmd>       Executa com privilegios",
    "",
    "BLOCO 7 - APIs externas (precisam wifi)",
    "  catfact        Fato sobre gatos",
    "  quote          Frase filosofica",
    "  pokemon [nome] Pokedex",
    "",
    "BLOCO 8 - Jogos",
    "  miau-vn        Visual novel da miau (instalar antes)",
    "  nvim <arquivo> Editor de texto",
    "",
    "BLOCO 9 - Personalizacao",
    "  themes         Lista temas",
    "  theme <id>     Troca de tema",
    "",
    "BLOCO 10 - Poder",
    "  admin          Painel admin (senha: Penny)",
    "  switchos       Troca de sistema operacional",
  ];

  const desc = formatHelpDescriptions();
  const pkgCmds = state.installedPackages.map((p) => "  " + (desc[p] || p));
  if (pkgCmds.length > 0) {
    base.push("");
    base.push("BLOCO 11 - Pacotes instalados");
    base.push.apply(base, pkgCmds);
  }

  return { command: "help", output: base.join("\n"), type: "normal" };
}

export function executeThemes(args, state, dispatch, options) {
  if (args.length === 0) {
    const list = THEMES.map((t) => "  " + t.id.padEnd(12) + " " + t.name).join(
      "\n",
    );
    return {
      command: "themes",
      output: "Temas disponiveis:\n" + list + "\n\nUse: theme <id>",
      type: "normal",
    };
  }
  const target = THEMES.find((t) => t.id === args[0]);
  if (!target)
    return {
      command: "theme " + args[0],
      output: "Tema '" + args[0] + "' nao encontrado.",
      type: "error",
    };
  dispatch({ type: "SET_THEME", payload: target.id });
  dispatch({
    type: "STAT_PUSH",
    payload: { key: "themesUsed", value: target.id },
  });
  return {
    command: "theme " + args[0],
    output: "Tema alterado para " + target.name,
    type: "success",
  };
}

export function executeFastfetch(args, state, dispatch, options) {
  const flagSet = state.flags && state.flags.miauFastfetchUnlocked === true;
  const endingSeen =
    Array.isArray(state.seenEndings) &&
    state.seenEndings.indexOf("miau_bom") >= 0;
  const achUnlocked =
    Array.isArray(state.unlockedAchievements) &&
    state.unlockedAchievements.indexOf("miau_bom") >= 0;
  const hasMiauUnlock = flagSet || endingSeen || achUnlocked;

  if (hasMiauUnlock) {
    const MIAU_LINES = [
      "oi! eu moro aqui agora. espero que nao se importe.",
      "gosto do seu terminal. tem personalidade.",
      "vi que voce instalou novos pacotes. to de olho.",
      "as vezes eu fico so olhando o cursor piscar. e relaxante.",
      "se voce me desinstalar, eu volto. eu sempre volto.",
      "esse fastfetch ficou mais bonito, ne? fui eu que fiz.",
      "nao conta pra ninguem, mas eu gosto do tema neon.",
      "a k1tty antiga nao gostava de mim. voce gosta?",
      "sabe o que eu mais gosto no seu sistema? voce.",
      "tenho medo do comando reboot. sinto que vou desaparecer.",
      "quando voce dorme, eu fico lendo os seus arquivos. e fofo.",
      "guardei um segredo no /tmp. mas voce nunca vai achar.",
    ];
    const line = MIAU_LINES[Math.floor(Math.random() * MIAU_LINES.length)];
    return {
      command: "fastfetch",
      output: "",
      type: "normal",
      special: { type: "miau-fastfetch", miauLine: line },
    };
  }

  const logoNode = getNodeByPath(state.filesystem, "/etc/logo.txt");
  const logo = logoNode ? logoNode.content || "" : "";
  const info = [
    "",
    "  Usuario: k1tty@k1tty",
    "  Host: k1tty",
    "  Sistema: k1tty Linux 1.0.0",
    "  Kernel: 6.6.6-k1tty",
    "  Uptime: " + Math.floor(Math.random() * 24) + " horas",
    "  Shell: ksh",
    "  CPU: Gato Quantico (8 nucleos)",
    "  Memoria: " + Math.floor(Math.random() * 8000 + 2000) + "MB / 16384MB",
    "  WiFi: " + (state.wifiConnected ? "Conectado" : "Desconectado"),
    "  Pacotes: " + state.installedPackages.length,
    "  Tema: " + (state.theme || "neon"),
    "",
    "  ----------------------------",
  ];
  const logoLines = logo.split("\n");
  const max = Math.max(logoLines.length, info.length);
  let w = 0;
  for (const l of logoLines) if (l.length > w) w = l.length;
  w += 4;
  const combined = [];
  for (let i = 0; i < max; i++)
    combined.push((logoLines[i] || "").padEnd(w, " ") + (info[i] || ""));
  return { command: "fastfetch", output: combined.join("\n"), type: "normal" };
}

export function executeCowsay(args, state, dispatch, options) {
  const text = args.join(" ") || "Moo!";
  const buildCow = function (t) {
    return [
      " " + "_".repeat(t.length + 2),
      "< " + t + " >",
      " " + "-".repeat(t.length + 2),
      "        \\   ^__^",
      "         \\  (oo)\\_______",
      "            (__)\\       )\\/\\",
      "                ||----w |",
      "                ||     ||",
    ].join("\n");
  };
  return {
    command: "cowsay " + args.join(" "),
    output: buildCow(text),
    type: "normal",
  };
}

export function executeNotes(args, state, dispatch, options) {
  dispatch({ type: "OPEN_WINDOW", payload: "notes" });
  return {
    command: "notes",
    output: "Abrindo bloco de notas...",
    type: "success",
  };
}

export function executeLog(args, state, dispatch, options) {
  setFlag(dispatch, "usedLog");
  const node = getNodeByPath(state.filesystem, "/var/log/userlog");
  if (!node)
    return { command: "log", output: "Log nao encontrado", type: "error" };
  return { command: "log", output: node.content, type: "normal" };
}

export function executeHowleft(args, state, dispatch, options) {
  return {
    command: "howleft",
    output: state.progress + "% descoberto",
    type: "normal",
  };
}

/* ============================================================
   whatnow
   ============================================================ */
export function executeWhatnow(args, state, dispatch, options) {
  const lines = [];
  const hint = function (t) {
    lines.push(t);
  };
  const tryCmd = function (v) {
    lines.push("", "  comandos uteis: " + v);
  };

  if (!(state.flags && state.flags.foundSudoPassword)) {
    hint("Voce sabe quem voce e, mas nao o que pode fazer.");
    hint("Alguem deixou um aviso em Documents.");
    tryCmd("ls, cd, cat");
    return { command: "whatnow", output: lines.join("\n"), type: "info" };
  }
  if (!state.wifiConnected) {
    hint("Sem internet, voce nao sai do lugar.");
    tryCmd("cat .notes.txt, ping, connect");
    return { command: "whatnow", output: lines.join("\n"), type: "info" };
  }
  if (!(state.flags && state.flags.installedAptCli)) {
    hint("Alguem deixou um pacote na sua pasta de downloads.");
    tryCmd("cd Downloads, sudo apt install ./apt-installer-tui.deb");
    return { command: "whatnow", output: lines.join("\n"), type: "info" };
  }
  if (!(state.flags && state.flags.catsUntarred)) {
    hint("Voce ja tem a chave do sudo. Tem um cofre em /root/secret.");
    tryCmd("sudo cat /root/secret/README.txt");
    return { command: "whatnow", output: lines.join("\n"), type: "info" };
  }
  if (!(state.flags && state.flags.finalUnlocked)) {
    hint("Extraia cat_photos.zip.");
    tryCmd("sudo cd /root/secret, unzip cat_photos.zip");
    return { command: "whatnow", output: lines.join("\n"), type: "info" };
  }
  hint("O cofre esta aberto. Falta so o gesto final.");
  tryCmd("victory");
  return { command: "whatnow", output: lines.join("\n"), type: "info" };
}

/* ============================================================
   sudo
   ============================================================ */
export function executeSudo(args, state, dispatch, options = {}) {
  if (args.length === 0)
    return { command: "sudo", output: "Uso: sudo <comando>", type: "error" };
  if (!options.password)
    return {
      command: "sudo " + args.join(" "),
      output: "\u{1F512} Digite a senha do sudo:",
      type: "warning",
      needsPassword: true,
    };
  if (options.password !== state.sudoPassword)
    return {
      command: "sudo " + args.join(" "),
      output: "Senha sudo incorreta. Acesso negado.",
      type: "error",
    };

  const sub = args[0];
  const subArgs = args.slice(1);
  if (sub === "apt")
    return executeApt(subArgs, state, dispatch, { password: options.password });

  if (sub === "cat" && subArgs.length > 0) {
    const p = joinPath(state.currentDirectory, subArgs[0]);
    const n = getNodeByPath(state.filesystem, p);
    if (!n)
      return {
        command: "sudo " + args.join(" "),
        output: "cat: " + subArgs[0] + ": Arquivo inexistente",
        type: "error",
      };
    if (p.indexOf("/root/secret/") === 0) setFlag(dispatch, "openedSecret");
    return {
      command: "sudo " + args.join(" "),
      output: n.content || "",
      type: "normal",
    };
  }
  if (sub === "cd" && subArgs.length > 0) {
    const p = joinPath(state.currentDirectory, subArgs[0]);
    const n = getNodeByPath(state.filesystem, p);
    if (!n || n.type !== "dir")
      return {
        command: "sudo " + args.join(" "),
        output: "cd: " + subArgs[0] + ": Diretorio invalido",
        type: "error",
      };
    if (p === "/root") setFlag(dispatch, "enteredRoot");
    if (p === "/root/secret") setFlag(dispatch, "openedSecret");
    dispatch({ type: "CHANGE_DIRECTORY", payload: p });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 15 });
    return { command: "sudo " + args.join(" "), output: "", type: "normal" };
  }
  if (sub === "ls") {
    const showHidden = subArgs.indexOf("-a") >= 0;
    const showDetails = subArgs.indexOf("-l") >= 0;
    let p = state.currentDirectory;
    const nonFlag = subArgs.filter((a) => a.charAt(0) !== "-");
    if (nonFlag.length > 0) p = joinPath(state.currentDirectory, nonFlag[0]);
    const n = getNodeByPath(state.filesystem, p);
    if (!n || n.type !== "dir")
      return {
        command: "sudo " + args.join(" "),
        output: "ls: diretorio invalido",
        type: "error",
      };
    if (p === "/root/secret") setFlag(dispatch, "openedSecret");
    const entries = Object.values(n.children || {}).filter(
      (e) => showHidden || !e.hidden,
    );
    const sorted = entries.sort((a, b) => a.name.localeCompare(b.name));
    const lines = sorted
      .map((e) => displayNode(e, showDetails, showHidden))
      .filter(Boolean);
    return {
      command: "sudo " + args.join(" "),
      output: lines.join(showDetails ? "\n" : "  "),
      type: "normal",
    };
  }
  if (sub === "mv" && subArgs.length >= 2) {
    const sourcePath = joinPath(state.currentDirectory, subArgs[0]);
    const destPath = joinPath(state.currentDirectory, subArgs[1]);
    const sourceParentPath = getParentPath(sourcePath);
    const sourceName = getFileName(sourcePath);
    const sourceParent = getNodeByPath(state.filesystem, sourceParentPath);
    if (!sourceParent || !sourceParent.children[sourceName])
      return {
        command: "sudo " + args.join(" "),
        output: "mv: " + subArgs[0] + ": Arquivo inexistente",
        type: "error",
      };
    const destNode = getNodeByPath(state.filesystem, destPath);
    let finalParentPath, finalName;
    if (destNode && destNode.type === "dir") {
      finalParentPath = destPath;
      finalName = sourceName;
    } else {
      finalParentPath = getParentPath(destPath);
      finalName = getFileName(destPath);
    }
    const finalParent = getNodeByPath(state.filesystem, finalParentPath);
    if (!finalParent || finalParent.type !== "dir")
      return {
        command: "sudo " + args.join(" "),
        output: "mv: destino invalido",
        type: "error",
      };
    const newFs = deepClone(state.filesystem);
    const ns = getNodeByPath(newFs, sourceParentPath);
    const nf = getNodeByPath(newFs, finalParentPath);
    const moved = ns.children[sourceName];
    delete ns.children[sourceName];
    moved.name = finalName;
    nf.children[finalName] = moved;
    dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
    return { command: "sudo " + args.join(" "), output: "", type: "normal" };
  }
  if (sub === "cp" && subArgs.length >= 2) {
    const sourcePath = joinPath(state.currentDirectory, subArgs[0]);
    const destPath = joinPath(state.currentDirectory, subArgs[1]);
    const sourceParentPath = getParentPath(sourcePath);
    const sourceName = getFileName(sourcePath);
    const sourceParent = getNodeByPath(state.filesystem, sourceParentPath);
    if (!sourceParent || !sourceParent.children[sourceName])
      return {
        command: "sudo " + args.join(" "),
        output: "cp: " + subArgs[0] + ": Arquivo inexistente",
        type: "error",
      };
    const src = sourceParent.children[sourceName];
    const destNode = getNodeByPath(state.filesystem, destPath);
    let finalParentPath, finalName;
    if (destNode && destNode.type === "dir") {
      finalParentPath = destPath;
      finalName = sourceName;
    } else {
      finalParentPath = getParentPath(destPath);
      finalName = getFileName(destPath);
    }
    const finalParent = getNodeByPath(state.filesystem, finalParentPath);
    if (!finalParent || finalParent.type !== "dir")
      return {
        command: "sudo " + args.join(" "),
        output: "cp: destino invalido",
        type: "error",
      };
    const newFs = deepClone(state.filesystem);
    const nf = getNodeByPath(newFs, finalParentPath);
    const copy = deepClone(src);
    copy.name = finalName;
    nf.children[finalName] = copy;
    dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
    return { command: "sudo " + args.join(" "), output: "", type: "normal" };
  }
  if (
    sub === "rm" &&
    subArgs.indexOf("-rf") >= 0 &&
    (subArgs.indexOf("/") >= 0 || subArgs.indexOf("/*") >= 0)
  ) {
    return {
      command: "sudo " + args.join(" "),
      output: "",
      type: "normal",
      systemCorrupting: true,
      removalLogs: generateRemovalLogs(),
    };
  }
  return {
    command: "sudo " + args.join(" "),
    output: "Comando '" + sub + "' nao suporta sudo no momento.",
    type: "error",
  };
}

/* ============================================================
   apt
   ============================================================ */
export function executeApt(args, state, dispatch, options = {}) {
  const requiresSudo = !(state.flags && state.flags.aptRequiresSudo === false);
  const requiresWifi = !(state.flags && state.flags.aptRequiresWifi === false);
  if (requiresSudo && options.password !== state.sudoPassword)
    return {
      command: "apt " + args.join(" "),
      output: "Permissao negada. Use sudo apt.",
      type: "error",
    };
  if (requiresWifi && !state.wifiConnected)
    return {
      command: "apt " + args.join(" "),
      output: "Erro: Sem conexao com a internet.",
      type: "error",
    };

  if (args.length === 0 || args[0] === "help") {
    return {
      command: "apt help",
      output:
        "Pacotes disponiveis:\n" +
        formatAptHelpList() +
        "\n\nUso: sudo apt install <pacote> | sudo apt install ./<arquivo>.deb | sudo apt install ./<arquivo>.iso",
      type: "normal",
    };
  }

  if (args[0] === "install" && args[1]) {
    const pkg = args[1];

    if (pkg.toLowerCase().endsWith(".iso")) {
      const isoPath = joinPath(state.currentDirectory, pkg);
      const isoNode = getNodeByPath(state.filesystem, isoPath);

      if (!isoNode || isoNode.type !== "file")
        return {
          command: "sudo apt install " + pkg,
          output: "apt: " + pkg + ": Arquivo nao encontrado",
          type: "error",
        };

      const isoBase = getFileName(pkg);
      if (!/^d0ggy\.iso$/i.test(isoBase))
        return {
          command: "sudo apt install " + pkg,
          output: "apt: " + pkg + ": ISO desconhecida.",
          type: "error",
        };

      if (state.flags && state.flags.doggyOsUnlocked)
        return {
          command: "sudo apt install " + pkg,
          output: "d0ggy OS ja esta instalado. Use `switchos` para trocar.",
          type: "normal",
        };

      dispatch({
        type: "SET_FLAG",
        payload: { flag: "doggyOsUnlocked", value: true },
      });
      dispatch({ type: "INCREMENT_PROGRESS", payload: 10 });

      return {
        command: "sudo apt install " + pkg,
        output:
          "Lendo listas de pacotes... Pronto\n" +
          "Aviso: d0ggy.iso e uma imagem de disco. Montando...\n" +
          '  > detectando sistema: d0ggy OS 1.0 "Good Boy"\n' +
          "  > verificando assinatura...\n" +
          "  > registrando bootloader...\n" +
          "  > instalando /boot/d0ggy.vmlinuz...\n" +
          "\nOK: d0ggy OS instalado como sistema alternativo.\n" +
          "Execute `switchos` para reiniciar no d0ggy OS.",
        type: "success",
      };
    }

    if (
      pkg.indexOf(".deb") >= 0 &&
      pkg.lastIndexOf(".deb") === pkg.length - 4
    ) {
      const debPath = joinPath(state.currentDirectory, pkg);
      const debNode = getNodeByPath(state.filesystem, debPath);
      if (!debNode || debNode.type !== "file")
        return {
          command: "sudo apt install " + pkg,
          output: "apt: " + pkg + ": Arquivo nao encontrado",
          type: "error",
        };
      if (getFileName(pkg) !== "apt-installer-tui.deb")
        return {
          command: "sudo apt install " + pkg,
          output: "apt: pacote nao reconhecido",
          type: "error",
        };
      if (state.installedPackages.indexOf("apt-cli") >= 0)
        return {
          command: "sudo apt install " + pkg,
          output: "apt-cli ja esta instalado.",
          type: "normal",
        };
      dispatch({ type: "INSTALL_PACKAGE", payload: "apt-cli" });
      dispatch({ type: "INCREMENT_PROGRESS", payload: 8 });
      setFlag(dispatch, "installedAptCli");
      return {
        command: "sudo apt install " + pkg,
        output: "apt-cli instalado com sucesso.",
        type: "success",
      };
    }

    if (PACKAGE_IDS.indexOf(pkg) < 0)
      return {
        command: "sudo apt install " + pkg,
        output: "Pacote '" + pkg + "' nao encontrado.",
        type: "error",
      };
    if (state.installedPackages.indexOf(pkg) >= 0)
      return {
        command: "sudo apt install " + pkg,
        output: "Pacote '" + pkg + "' ja instalado.",
        type: "normal",
      };
    dispatch({ type: "INSTALL_PACKAGE", payload: pkg });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 5 });
    return {
      command: "sudo apt install " + pkg,
      output: "Instalando " + pkg + "...\n" + pkg + " instalado com sucesso!",
      type: "success",
    };
  }

  if (args[0] === "remove" && args[1]) {
    const pkg = args[1];
    if (state.installedPackages.indexOf(pkg) < 0)
      return {
        command: "sudo apt remove " + pkg,
        output: "Pacote '" + pkg + "' nao esta instalado.",
        type: "error",
      };
    dispatch({ type: "REMOVE_PACKAGE", payload: pkg });
    if (pkg === "tutorial") setFlag(dispatch, "tutorialRemoved");
    if (pkg === "k1tty-vn" || pkg === "miau-vn")
      setFlag(dispatch, "miauVnRemoved");
    return {
      command: "sudo apt remove " + pkg,
      output: pkg + " removido.",
      type: "normal",
    };
  }

  return {
    command: "sudo apt " + args.join(" "),
    output: "Uso: sudo apt <install|remove|help>",
    type: "error",
  };
}

/* ============================================================
   ping / connect
   ============================================================ */
export function executePing(args, state, dispatch, options) {
  if (args.length === 0) {
    const nets = [
      "k1tty's home",
      "Vizinho_5G",
      "NET_2.4G",
      "Casa_da_Mae",
      "WiFi_Gratis",
    ];
    return {
      command: "ping",
      output:
        "Redes Wi-Fi disponiveis:\n" + nets.map((n) => "  " + n).join("\n"),
      type: "normal",
    };
  }
  if (!state.wifiConnected)
    return {
      command: "ping " + args[0],
      output: "Erro: Sem conexao com a internet.",
      type: "error",
    };
  return {
    command: "ping " + args[0],
    output: "PING " + args[0] + "\n64 bytes: time=12ms",
    type: "normal",
  };
}

export function executeConnect(args, state, dispatch, options = {}) {
  if (args.length === 0)
    return { command: "connect", output: "Uso: connect <ssid>", type: "error" };
  const ssid = args.join(" ");
  if (ssid !== state.wifiName)
    return {
      command: "connect " + ssid,
      output:
        "Nao foi possivel conectar a '" + ssid + "'. Rede nao encontrada.",
      type: "error",
    };
  if (!options.password)
    return {
      command: "connect " + ssid,
      output: "\u{1F512} Digite a senha do Wi-Fi (" + ssid + "):",
      type: "warning",
      needsPassword: true,
    };
  if (options.password === state.wifiPassword) {
    dispatch({ type: "SET_WIFI_CONNECTED", payload: true });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 10 });
    return {
      command: "connect " + ssid,
      output: "Conectado a " + ssid + "!",
      type: "success",
    };
  }
  return {
    command: "connect " + ssid,
    output: "Senha incorreta. Conexao falhou.",
    type: "error",
  };
}

/* ============================================================
   untar
   ============================================================ */
export function executeUntar(args, state, dispatch, options = {}) {
  if (args.length === 0)
    return {
      command: "untar",
      output: "Uso: untar <arquivo.tar>",
      type: "error",
    };
  const tarName = args[0];
  if (!/\.tar$/i.test(tarName))
    return {
      command: "untar " + tarName,
      output: "untar: " + tarName + ": Formato nao reconhecido.",
      type: "error",
    };
  const tarPath = joinPath(state.currentDirectory, tarName);
  const tarNode = getNodeByPath(state.filesystem, tarPath);
  if (!tarNode)
    return {
      command: "untar " + tarName,
      output: "untar: " + tarName + ": Arquivo nao encontrado",
      type: "error",
    };
  if (getFileName(state.currentDirectory) !== "Backup")
    return {
      command: "untar " + tarName,
      output:
        'untar: O arquivo so pode ser extraido de uma pasta chamada "Backup".',
      type: "error",
    };

  const skip = state.flags && state.flags.skipPuzzlePasswords === true;
  if (!skip) {
    const cur = getNodeByPath(state.filesystem, state.currentDirectory);
    const pw = cur && cur.children && cur.children["password.txt"];
    if (!pw || pw.type !== "file")
      return {
        command: "untar " + tarName,
        output: 'untar: Arquivo "password.txt" nao encontrado nesta pasta.',
        type: "error",
      };
    if ((pw.content || "").trim() !== "m30w")
      return {
        command: "untar " + tarName,
        output: "untar: Senha incorreta em password.txt. Acesso negado.",
        type: "error",
      };
  }
  if (state.flags && state.flags.catsUntarred)
    return {
      command: "untar " + tarName,
      output: "Este arquivo ja foi extraido anteriormente.",
      type: "normal",
    };

  const newFs = deepClone(state.filesystem);
  const home = getNodeByPath(newFs, "/home/k1tty");
  if (home) {
    const now = new Date().toISOString();
    home.children["cats"] = {
      name: "cats",
      type: "dir",
      content: null,
      permissions: "rwxr-xr-x",
      owner: "k1tty",
      hidden: false,
      locked: false,
      password: null,
      size: 4096,
      lastModified: now,
      children: {
        "readme.txt": {
          name: "readme.txt",
          type: "file",
          content: "Encontrei meus gatos de volta!\n\n- k1tty",
          permissions: "rw-r--r--",
          owner: "k1tty",
          hidden: false,
          locked: false,
          password: null,
          size: 200,
          lastModified: now,
          userCreated: true,
        },
      },
    };
    dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
  }
  setFlag(dispatch, "catsUntarred");
  dispatch({ type: "INCREMENT_PROGRESS", payload: 15 });
  return {
    command: "untar " + tarName,
    output:
      "Autenticando...\nSenha correta\n\nExtracao concluida em /home/k1tty/cats/",
    type: "success",
  };
}

/* ============================================================
   unzip
   ============================================================ */
export function executeUnzip(args, state, dispatch, options = {}) {
  if (args.length === 0)
    return {
      command: "unzip",
      output: "Uso: unzip <arquivo.zip>",
      type: "error",
    };

  const zipName = getFileName(args[0]);
  const zipPath = joinPath(state.currentDirectory, args[0]);
  const zipNode = getNodeByPath(state.filesystem, zipPath);

  if (!/\.zip$/i.test(zipName))
    return {
      command: "unzip " + args[0],
      output: "unzip: " + args[0] + ": Formato nao reconhecido.",
      type: "error",
    };
  if (!zipNode)
    return {
      command: "unzip " + args[0],
      output: "unzip: " + args[0] + ": Arquivo nao encontrado",
      type: "error",
    };
  if (zipNode.type !== "file")
    return {
      command: "unzip " + args[0],
      output: "unzip: " + args[0] + ": Nao e um arquivo",
      type: "error",
    };

  const skip = state.flags && state.flags.skipPuzzlePasswords === true;

  if (zipName === "music_pack.zip") {
    if (state.flags && state.flags.musicExtracted)
      return {
        command: "unzip " + args[0],
        output: "Este pacote ja foi extraido.",
        type: "normal",
      };
    dispatch({ type: "EXTRACT_MUSIC" });
    setFlag(dispatch, "musicExtracted");
    dispatch({ type: "INCREMENT_PROGRESS", payload: 15 });
    return {
      command: "unzip " + args[0],
      output:
        "Archive: music_pack.zip\n  inflating: Back 2 Back.mp3\n  inflating: Children of the City.mp3\n  inflating: RUNAWAY.mp3\n  inflating: You_re A Big Girl Now.mp3\n\n4 faixas extraidas em ~/Music/",
      type: "success",
    };
  }

  if (zipName === "cat_photos.zip") {
    if (!options.password && !skip)
      return {
        command: "unzip " + args[0],
        output: "\u{1F512} Este arquivo esta protegido. Digite a senha:",
        type: "warning",
        needsPassword: true,
      };
    if (!skip && options.password !== "m30w")
      return {
        command: "unzip " + args[0],
        output: "Senha incorreta. Acesso negado.",
        type: "error",
      };
    if (state.flags && state.flags.finalUnlocked)
      return {
        command: "unzip " + args[0],
        output: "Voce ja extraiu este pacote.",
        type: "normal",
      };
    dispatch({ type: "EXTRACT_CAT_PHOTOS" });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 15 });
    return {
      command: "unzip " + args[0],
      output:
        'Archive: cat_photos.zip\n  extracting: cats/cat_01.webp\n  ...\n  extracting: cats/cat_20.webp\n  extracting: final.txt\n\n20 fotos salvas em /root/secret/cats/\n\nLeia a carta. Depois execute "victory".',
      type: "success",
    };
  }

  if (zipName === "miau-vn.zip") {
    if (state.flags && state.flags.miauVnInstalled)
      return {
        command: "unzip " + args[0],
        output: "Voce ja extraiu o miau-vn. Ele esta em ~/Games/miau-vn.",
        type: "normal",
      };
    dispatch({ type: "INSTALL_MIAU_VN" });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 8 });
    return {
      command: "unzip " + args[0],
      output:
        "Archive:  miau-vn.zip\n  inflating: Games/miau-vn\n  inflating: Games/readme.txt\n\nOK: extraido em ~/Games/\n\nPra abrir, digite: miau-vn",
      type: "success",
    };
  }

  const baseName = zipName.replace(/\.zip$/i, "");
  const currentDir = getNodeByPath(state.filesystem, state.currentDirectory);
  if (!currentDir || currentDir.type !== "dir")
    return {
      command: "unzip " + args[0],
      output: "unzip: diretorio atual invalido",
      type: "error",
    };
  if (currentDir.children[baseName])
    return {
      command: "unzip " + args[0],
      output: baseName + "/ ja existe.",
      type: "error",
    };

  const newFs = deepClone(state.filesystem);
  const newCurrentDir = getNodeByPath(newFs, state.currentDirectory);
  const now = new Date().toISOString();
  const readmeContent =
    "Conteudo extraido de " +
    zipName +
    "\n\nEste arquivo foi extraido do pacote " +
    zipName +
    ".\n";
  newCurrentDir.children[baseName] = {
    name: baseName,
    type: "dir",
    content: null,
    permissions: "rwxr-xr-x",
    owner: "k1tty",
    hidden: false,
    locked: false,
    password: null,
    size: 4096,
    lastModified: now,
    userCreated: true,
    children: {
      "readme.txt": {
        name: "readme.txt",
        type: "file",
        content: readmeContent,
        permissions: "rw-r--r--",
        owner: "k1tty",
        hidden: false,
        locked: false,
        password: null,
        size: readmeContent.length,
        lastModified: now,
        userCreated: true,
      },
    },
  };
  dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
  dispatch({ type: "INCREMENT_PROGRESS", payload: 2 });
  return {
    command: "unzip " + args[0],
    output:
      "Archive: " +
      zipName +
      "\n  inflating: " +
      baseName +
      "/readme.txt\n\nOK: extraido em " +
      baseName +
      "/",
    type: "success",
  };
}

/* ============================================================
   meta
   ============================================================ */
export function executeMeta(args, state, dispatch, options) {
  if (args.length === 0)
    return { command: "meta", output: "Uso: meta <arquivo>", type: "error" };
  const targetPath = joinPath(state.currentDirectory, args[0]);
  const node = getNodeByPath(state.filesystem, targetPath);
  if (!node || node.type !== "file")
    return {
      command: "meta " + args.join(" "),
      output: "meta: " + args[0] + ": Arquivo nao encontrado",
      type: "error",
    };
  if (!node.meta)
    return {
      command: "meta " + args.join(" "),
      output: "meta: sem metadados disponiveis.",
      type: "normal",
    };
  const lines = [
    "Arquivo: " + node.name,
    "Tamanho: " + formatSize(node.size),
    "-----",
  ];
  for (const k of Object.keys(node.meta))
    lines.push(k.padEnd(12) + node.meta[k]);
  return {
    command: "meta " + args.join(" "),
    output: lines.join("\n"),
    type: "normal",
  };
}

/* ============================================================
   nvim
   ============================================================ */
export function executeNvim(args, state, dispatch, options) {
  if (args.length === 0) {
    dispatch({ type: "OPEN_WINDOW", payload: "nvim" });
    return { command: "nvim", output: "Abrindo editor...", type: "success" };
  }
  const targetPath = joinPath(state.currentDirectory, args[0]);
  const node = getNodeByPath(state.filesystem, targetPath);
  if (node && node.type === "dir")
    return {
      command: "nvim " + args[0],
      output: "nvim: " + args[0] + ": E um diretorio",
      type: "error",
    };
  if (node && (node.locked || node.requiresSudo))
    return {
      command: "nvim " + args[0],
      output: "nvim: " + args[0] + ": Permissao negada",
      type: "error",
    };
  if (targetPath === "/etc/logo.txt") setFlag(dispatch, "editingLogo");
  dispatch({ type: "OPEN_WINDOW", payload: "nvim" });
  setFlag(dispatch, "nvimFile", targetPath);
  return {
    command: "nvim " + args[0],
    output: "Editando " + args[0] + "...",
    type: "success",
  };
}

/* ============================================================
   snapshot / reboot
   ============================================================ */
export function executeSnapshot(args, state, dispatch, options) {
  if (args.length === 0) {
    dispatch({ type: "SAVE_SNAPSHOT" });
    dispatch({ type: "STAT_INCREMENT", payload: { key: "snapshotsMade" } });
    return { command: "snapshot", output: "Snapshot salva.", type: "success" };
  }
  if (args[0] === "load" && args[1]) {
    dispatch({ type: "LOAD_SNAPSHOT", payload: parseInt(args[1], 10) });
    setFlag(dispatch, "loadedSnapshot");
    return {
      command: "snapshot load " + args[1],
      output: "Snapshot restaurada.",
      type: "success",
    };
  }
  if (args[0] === "revert") {
    dispatch({ type: "REVERT_SNAPSHOT" });
    return {
      command: "snapshot revert",
      output: "Snapshot revertida.",
      type: "success",
    };
  }
  if (args[0] === "list")
    return {
      command: "snapshot list",
      output: state.snapshots
        .map((s, i) => "Snapshot " + i + ": " + s.currentDirectory)
        .join("\n"),
      type: "normal",
    };
  return {
    command: "snapshot",
    output: "Uso: snapshot [load <n>|revert|list]",
    type: "error",
  };
}

export function executeReboot(args, state, dispatch, options) {
  dispatch({ type: "SAVE_TO_SLOT", payload: state.currentSave });
  dispatch({ type: "REBOOT" });
  return { command: "reboot", output: "Reiniciando...", type: "warning" };
}

/* ============================================================
   victory / achievements / web / admin / switchos
   ============================================================ */
export function executeVictory(args, state, dispatch, options) {
  if (!(state.flags && state.flags.finalUnlocked))
    return {
      command: "victory",
      output: "Comando nao encontrado. Digite 'help'.",
      type: "error",
    };
  dispatch({ type: "OPEN_WINDOW", payload: "credits" });
  return {
    command: "victory",
    output: "Iniciando creditos finais...",
    type: "success",
  };
}

export function executeAchievements(args, state, dispatch, options) {
  dispatch({ type: "OPEN_WINDOW", payload: "achievements" });
  return {
    command: "achievements",
    output: "Abrindo painel de conquistas...",
    type: "success",
  };
}

export function executeWeb(args, state, dispatch, options) {
  dispatch({ type: "OPEN_WINDOW", payload: "web" });
  return {
    command: "web",
    output: "Abrindo navegador TUI...",
    type: "success",
  };
}

export function executeAdmin(args, state, dispatch, options) {
  dispatch({ type: "OPEN_WINDOW", payload: "admin" });
  return {
    command: "admin",
    output: "Abrindo painel de administracao...",
    type: "success",
  };
}

export function executeSwitchOS(args, state, dispatch, options) {
  if (state.systemCorrupted)
    return {
      command: "switchos",
      output: "Comando nao disponivel neste estado.",
      type: "error",
    };
  if (state.currentSave === null)
    return {
      command: "switchos",
      output: "Nenhuma sessao ativa.",
      type: "error",
    };

  if (!(state.flags && state.flags.doggyOsUnlocked)) {
    return {
      command: "switchos",
      output:
        "Comando nao encontrado: switchos.\n" +
        "Dica: voce precisa de uma imagem de sistema alternativa.\n" +
        "Procure no `web`.",
      type: "error",
    };
  }

  dispatch({ type: "START_OS_SWITCH" });
  return {
    command: "switchos",
    output: "Iniciando troca para d0ggy OS...",
    type: "warning",
  };
}

/* ============================================================
   Visual Novel
   ============================================================ */
export function executeVisualNovel(args, state, dispatch, options) {
  dispatch({ type: "OPEN_WINDOW", payload: "vn" });
  return { command: "vn", output: "Abrindo k1tty.vn...", type: "success" };
}

export function executeK1ttyRecursive(args, state, dispatch, options) {
  dispatch({
    type: "SET_FLAG",
    payload: { flag: "usedRecursive", value: true },
  });
  dispatch({ type: "OPEN_WINDOW", payload: "k1tty-recursive" });
  return {
    command: "k1tty-recursivo",
    output: "Abrindo k1tty dentro de k1tty...",
    type: "success",
  };
}

/* ============================================================
   Miau VN
   ============================================================ */
export function executeMiauVn(args, state, dispatch, options) {
  const binary = getNodeByPath(state.filesystem, "/home/k1tty/Games/miau-vn");
  const hasFlag = state.flags && state.flags.miauVnInstalled === true;

  if (!binary && !hasFlag) {
    return {
      command: "miau-vn",
      output:
        "Comando nao encontrado: miau-vn.\n\n" +
        'Pra instalar, va no forum (comando "web"), abra o topico [8],\n' +
        'baixe o miau-vn.zip e rode "unzip miau-vn.zip" em ~/Downloads.',
      type: "error",
    };
  }

  dispatch({ type: "OPEN_WINDOW", payload: "miau-vn" });
  return { command: "miau-vn", output: "Abrindo miau-vn...", type: "success" };
}

/* ============================================================
   APIs externas
   ============================================================ */
export function executeCatFact(args, state, dispatch, options) {
  if (!state.wifiConnected)
    return {
      command: "catfact",
      output: 'Sem conexao. Use "ping" e "connect" primeiro.',
      type: "error",
    };
  if (state.apiCache && state.apiCache.catFact) {
    dispatch({
      type: "SET_FLAG",
      payload: { flag: "readCatFact", value: true },
    });
    return {
      command: "catfact",
      output: "SABIA?\n\n" + state.apiCache.catFact,
      type: "normal",
    };
  }
  return fetchCatFact()
    .then((fact) => {
      dispatch({
        type: "SET_FLAG",
        payload: { flag: "readCatFact", value: true },
      });
      dispatch({ type: "SET_API_CACHE", payload: { catFact: fact } });
      return {
        command: "catfact",
        output: "SABIA?\n\n" + fact,
        type: "normal",
      };
    })
    .catch(() => ({
      command: "catfact",
      output: "Nao foi possivel buscar um fato agora.",
      type: "error",
    }));
}

export function executeQuote(args, state, dispatch, options) {
  if (!state.wifiConnected)
    return {
      command: "quote",
      output: 'Sem conexao. Use "ping" e "connect" primeiro.',
      type: "error",
    };
  if (state.apiCache && state.apiCache.quote) {
    const q = state.apiCache.quote;
    dispatch({ type: "SET_FLAG", payload: { flag: "readQuote", value: true } });
    return {
      command: "quote",
      output: '"' + q.text + '"\n\n   - ' + q.author,
      type: "normal",
    };
  }
  return fetchQuote()
    .then((q) => {
      dispatch({
        type: "SET_FLAG",
        payload: { flag: "readQuote", value: true },
      });
      dispatch({ type: "SET_API_CACHE", payload: { quote: q } });
      return {
        command: "quote",
        output: '"' + q.text + '"\n\n   - ' + q.author,
        type: "normal",
      };
    })
    .catch(() => ({
      command: "quote",
      output: "Nao foi possivel buscar uma frase agora.",
      type: "error",
    }));
}

export function executePokemon(args, state, dispatch, options) {
  if (!state.wifiConnected)
    return {
      command: "pokemon",
      output: 'Sem conexao. Use "ping" e "connect" primeiro.',
      type: "error",
    };

  const query = args[0];

  if (!query && state.apiCache && state.apiCache.pokemon) {
    const p = state.apiCache.pokemon;
    dispatch({
      type: "STAT_PUSH",
      payload: { key: "pokemonSeen", value: String(p.id) },
    });
    if (p.isLegendary && !(state.flags && state.flags.sawLegendary)) {
      dispatch({
        type: "SET_FLAG",
        payload: { flag: "sawLegendary", value: true },
      });
    }
    return {
      command: "pokemon",
      output:
        "#" +
        String(p.id).padStart(4, "0") +
        " " +
        p.name +
        " - " +
        p.types.join("/"),
      special: { type: "pokemon", data: p },
      type: "normal",
    };
  }

  const idOrName = query || getRandomCatPokemonId();
  return fetchPokemon(idOrName)
    .then((p) => {
      dispatch({
        type: "STAT_PUSH",
        payload: { key: "pokemonSeen", value: String(p.id) },
      });
      if (p.isLegendary && !(state.flags && state.flags.sawLegendary)) {
        dispatch({
          type: "SET_FLAG",
          payload: { flag: "sawLegendary", value: true },
        });
      }
      return {
        command: "pokemon" + (query ? " " + query : ""),
        output:
          "#" +
          String(p.id).padStart(4, "0") +
          " " +
          p.name +
          " - " +
          p.types.join("/"),
        special: { type: "pokemon", data: p },
        type: "normal",
      };
    })
    .catch(() => ({
      command: "pokemon" + (query ? " " + query : ""),
      output: "pokemon: '" + (query || "aleatorio") + "': Nao encontrado.",
      type: "error",
    }));
}