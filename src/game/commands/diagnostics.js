// @ts-nocheck
// src/game/commands/diagnostics.js
// Testes headless do jogo. Nao alteram o save.
// Portado do web (executeTestAll, executeFullGameTest, executeWhatnowAllStages).

import {
  deepClone,
  getNodeByPath
} from '../fs/helpers';
// ... (resto do arquivo continua IGUAL ao que você já tem)
import { isAchieved } from '../data/achievementChecks';
import { ACHIEVEMENTS } from '../data/achievements';
import { THEMES } from '../theme/themes';
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
  executeFastfetch,
  executeFind,
  executeGrep,
  executeHelp,
  executeHowleft,
  executeLog,
  executeLs,
  executeMeta,
  executeMkdir,
  executeMv, executeNotes,
  executeNvim,
  executePokemon,
  executeQuote,
  executeReboot,
  executeRm,
  executeSnapshot,
  executeSudo,
  executeSwitchOS,
  executeTouch,
  executeUntar, executeUnzip,
  executeVictory,
  executeWeb,
  executeWhatnow,
  executeWhoami,
} from './commands';
import { PACKAGE_IDS, PACKAGES_WITH_WINDOW } from './packages';

/* ============================================================
   Helpers de captura
   ============================================================ */
function makeCaptureDispatch() {
  const actions = [];
  const dispatch = (a) => actions.push(a);
  return { actions, dispatch };
}

function actionsInclude(actions, type) {
  return actions.some(a => a.type === type);
}

function actionsIncludeFlag(actions, flag, value) {
  if (value === undefined) value = true;
  return actions.some(a =>
    a.type === 'SET_FLAG' && a.payload && a.payload.flag === flag && a.payload.value === value
  );
}

/* ============================================================
   TESTE SIMPLES
   ============================================================ */
export function executeTestAll(state) {
  const lines = [];
  const log = (m) => lines.push(m);
  const ok = (m) => log('  OK  ' + m);
  const fail = (m) => log('  ERRO ' + m);

  log('=======================================');
  log('  TESTE GERAL DE COMANDOS - k1tty');
  log('=======================================');
  log('');

  const noop = () => {};

  const tests = [
    ['ls', () => executeLs([], state, noop)],
    ['ls -a', () => executeLs(['-a'], state, noop)],
    ['ls -l', () => executeLs(['-l'], state, noop)],
    ['whoami', () => executeWhoami([], state, noop)],
    ['date', () => executeDate([], state, noop)],
    ['help', () => executeHelp([], state, noop)],
    ['fastfetch', () => executeFastfetch([], state, noop)],
    ['howleft', () => executeHowleft([], state, noop)],
    ['whatnow', () => executeWhatnow([], state, noop)],
    ['log', () => executeLog([], state, noop)],
    ['cat readme.txt', () => executeCat(['Documents/readme.txt'], state, noop, {})],
    ['grep k1tty /etc/os-release', () => executeGrep(['k1tty', '/etc/os-release'], state, noop)],
    ['find readme', () => executeFind(['readme'], state, noop)],
  ];

  log('--- Comandos base ---');
  for (const [label, fn] of tests) {
    try {
      const r = fn();
      if (r && r.type !== 'error') ok(label + ' OK');
      else fail(label + ' ERRO: ' + (r && r.output ? r.output : 'sem saida'));
    } catch (e) {
      fail(label + ' EXCECAO: ' + e.message);
    }
  }
  log('');

  log('--- Pacotes instalados ---');
  if (state.installedPackages.length === 0) log('  (nenhum)');
  else state.installedPackages.forEach(p => ok(p));
  log('');

  log('--- Flags ---');
  const flags = Object.keys(state.flags || {});
  if (flags.length === 0) log('  (nenhuma)');
  else flags.forEach(k => log('  . ' + k + ' = ' + state.flags[k]));
  log('');

  log('--- Conquistas ---');
  log('  Total: ' + (state.unlockedAchievements || []).length + ' desbloqueadas');
  log('');

  log('--- Estatisticas ---');
  log('  Progresso:       ' + state.progress + '%');
  log('  WiFi:            ' + (state.wifiConnected ? 'Conectado' : 'Desconectado'));
  log('  Diretorio:       ' + state.currentDirectory);
  log('  Snapshots:       ' + state.snapshots.length);
  log('  Janelas abertas: ' + state.openWindows.length);
  log('  Historico:       ' + state.history.length + ' entradas');
  log('  Tema:            ' + state.theme);
  log('  Comandos:        ' + state.stats.commandsRun);
  log('');

  log('=======================================');
  log('  Pacotes: ' + state.installedPackages.length + ' | Progresso: ' + state.progress + '%');
  log('=======================================');

  return { command: 'testall', output: lines.join('\n'), type: 'success' };
}

/* ============================================================
   TESTE COMPLETO
   ============================================================ */
export function executeFullGameTest(state) {
  const lines = [];
  const log = (m) => lines.push(m);
  const ok = (m) => { log('  OK  ' + m); totalOk++; };
  const fail = (m) => { log('  FALHA ' + m); totalFail++; };
  const info = (m) => log('  . ' + m);
  let totalOk = 0;
  let totalFail = 0;

  log('===============================================');
  log('  TESTE COMPLETO DO JOGO - k1tty');
  log('  (headless, nao altera o save)');
  log('===============================================');
  log('');

  const clone = deepClone(state);
  if (!clone.flags) clone.flags = {};

  /* 1) FILESYSTEM */
  log('--- 1. ESTRUTURA DO FILESYSTEM ---');
  const requiredPaths = [
    '/home/k1tty',
    '/home/k1tty/Documents',
    '/home/k1tty/Documents/DO NOT OPEN',
    '/home/k1tty/Documents/DO NOT OPEN/password.txt',
    '/home/k1tty/Documents/DO NOT OPEN/whisper.txt',
    '/home/k1tty/Documents/readme.txt',
    '/home/k1tty/Downloads',
    '/home/k1tty/Downloads/apt-installer-tui.deb',
    '/home/k1tty/Music',
    '/home/k1tty/Music/.meow_index',
    '/home/k1tty/Pictures',
    '/home/k1tty/.notes.txt',
    '/etc/logo.txt',
    '/etc/os-release',
    '/etc/hostname',
    '/var/log/userlog',
    '/usr/bin/commands.txt',
    '/root',
    '/root/secret',
    '/root/secret/README.txt',
    '/root/secret/cats.tar',
    '/root/secret/cat_photos.zip',
  ];
  for (const p of requiredPaths) {
    if (getNodeByPath(clone.filesystem, p)) ok('existe: ' + p);
    else fail('FALTANDO: ' + p);
  }
  log('');

  /* 2) OCULTOS */
  log('--- 2. ARQUIVOS OCULTOS ---');
  const notes = getNodeByPath(clone.filesystem, '/home/k1tty/.notes.txt');
  if (notes && notes.hidden) ok('.notes.txt marcado hidden');
  else fail('.notes.txt nao esta hidden');

  const meowIdx = getNodeByPath(clone.filesystem, '/home/k1tty/Music/.meow_index');
  if (meowIdx && meowIdx.hidden) ok('.meow_index marcado hidden');
  else fail('.meow_index nao esta hidden');
  log('');

  /* 3) SENHAS E SEGREDOS */
  log('--- 3. SENHAS E SEGREDOS ---');
  const pwNode = getNodeByPath(clone.filesystem, '/home/k1tty/Documents/DO NOT OPEN/password.txt');
  if (pwNode && pwNode.content && pwNode.content.indexOf(clone.sudoPassword) >= 0) ok('password.txt contem a senha do sudo');
  else fail('password.txt NAO contem a senha do sudo');

  if (pwNode && pwNode.requiresUsername === true) ok('password.txt exige username');
  else fail('password.txt NAO exige username');

  if (clone.wifiPassword === 'meow12345') ok('senha do WiFi = meow12345');
  else fail('senha do WiFi inesperada');

  if (clone.wifiName === "k1tty's home") ok('SSID = k1tty\'s home');
  else fail('SSID inesperado');

  if (notes && notes.content && notes.content.indexOf('meow12345') >= 0) ok('.notes.txt contem a senha do WiFi');
  else fail('.notes.txt NAO contem a senha do WiFi');

  if (meowIdx && meowIdx.content && meowIdx.content.indexOf('m30w') >= 0) ok('.meow_index contem m30w');
  else fail('.meow_index NAO contem m30w');

  const zip = getNodeByPath(clone.filesystem, '/root/secret/cat_photos.zip');
  if (zip && zip.password === 'm30w') ok('cat_photos.zip protegido com m30w');
  else fail('cat_photos.zip com senha inesperada');
  log('');

  /* 4) FLUXO NARRATIVO */
  log('--- 4. FLUXO NARRATIVO ---');

  // 4.1 whoami
  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeWhoami([], clone, dispatch);
    if (r && r.output === 'k1tty') ok('4.1 whoami = k1tty');
    else fail('4.1 whoami retornou ' + (r ? r.output : '?'));
  }

  // 4.2 ls -a
  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeLs(['-a'], clone, dispatch);
    if (r && r.output && r.output.indexOf('.notes.txt') >= 0) ok('4.2 ls -a mostra .notes.txt');
    else fail('4.2 ls -a nao mostrou .notes.txt');
  }

  // 4.3 cat whisper
  {
    const { dispatch } = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['whisper.txt'], ctx, dispatch, {});
    if (r && r.output && r.output.toLowerCase().indexOf('k1tty') >= 0) ok('4.3 whisper.txt menciona k1tty');
    else fail('4.3 whisper.txt nao menciona k1tty');
  }

  // 4.4 cat password sem username
  {
    const { dispatch } = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['password.txt'], ctx, dispatch, {});
    if (r && r.needsUsername) ok('4.4 password.txt sem username pede username');
    else fail('4.4 password.txt nao pediu username');
  }

  // 4.5 cat password com username errado
  {
    const { dispatch } = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['password.txt'], ctx, dispatch, { username: 'root' });
    if (r && r.type === 'error') ok('4.5 username errado = erro');
    else fail('4.5 username errado aceito');
  }

  // 4.6 cat password com k1tty
  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['password.txt'], ctx, cap.dispatch, { username: 'k1tty' });
    if (r && r.output && r.output.indexOf(clone.sudoPassword) >= 0) ok('4.6 password.txt revela senha com k1tty');
    else fail('4.6 password.txt nao revelou senha');
    if (actionsIncludeFlag(cap.actions, 'foundSudoPassword')) ok('4.6b flag foundSudoPassword');
    else fail('4.6b flag foundSudoPassword nao setada');
  }

  // 4.7 connect sem senha
  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeConnect(["k1tty's home"], clone, dispatch, {});
    if (r && r.needsPassword) ok('4.7 connect sem senha pede senha');
    else fail('4.7 connect nao pediu senha');
  }

  // 4.8 connect senha errada
  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeConnect(["k1tty's home"], clone, dispatch, { password: 'xxx' });
    if (r && r.type === 'error') ok('4.8 connect senha errada = erro');
    else fail('4.8 connect aceitou senha errada');
  }

  // 4.9 connect ok
  {
    const cap = makeCaptureDispatch();
    const r = executeConnect(["k1tty's home"], clone, cap.dispatch, { password: clone.wifiPassword });
    if (r && r.type === 'success' && actionsInclude(cap.actions, 'SET_WIFI_CONNECTED')) ok('4.9 connect ok');
    else fail('4.9 connect falhou');
  }

  // 4.10 apt sem wifi
  {
    const { dispatch } = makeCaptureDispatch();
    const off = { ...clone, wifiConnected: false };
    const r = executeApt(['install', 'matrix'], off, dispatch, { password: clone.sudoPassword });
    if (r && r.type === 'error' && r.output.toLowerCase().indexOf('internet') >= 0) ok('4.10 apt sem WiFi = erro');
    else fail('4.10 apt sem WiFi nao deu erro');
  }

  // 4.11 apt sem senha
  {
    const { dispatch } = makeCaptureDispatch();
    const on = { ...clone, wifiConnected: true };
    const r = executeApt(['install', 'matrix'], on, dispatch, {});
    if (r && r.type === 'error') ok('4.11 apt sem sudo = erro');
    else fail('4.11 apt nao exigiu sudo');
  }

  // 4.12 apt senha errada
  {
    const { dispatch } = makeCaptureDispatch();
    const on = { ...clone, wifiConnected: true };
    const r = executeApt(['install', 'matrix'], on, dispatch, { password: 'xxx' });
    if (r && r.type === 'error') ok('4.12 apt senha errada = erro');
    else fail('4.12 apt aceitou senha errada');
  }

  // 4.13 apt install local .deb
  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, wifiConnected: true, currentDirectory: '/home/k1tty/Downloads', installedPackages: [] };
    const r = executeApt(['install', './apt-installer-tui.deb'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r && r.type === 'success' && actionsInclude(cap.actions, 'INSTALL_PACKAGE')) ok('4.13 install .deb local');
    else fail('4.13 install .deb local falhou');
    if (actionsIncludeFlag(cap.actions, 'installedAptCli')) ok('4.13b flag installedAptCli');
    else fail('4.13b flag installedAptCli nao setada');
  }

  // 4.14 pacote inexistente
  {
    const { dispatch } = makeCaptureDispatch();
    const ctx = { ...clone, wifiConnected: true };
    const r = executeApt(['install', 'xyz'], ctx, dispatch, { password: clone.sudoPassword });
    if (r && r.type === 'error') ok('4.14 pacote inexistente = erro');
    else fail('4.14 aceitou pacote inexistente');
  }

  // 4.15 untar fora de Backup
  {
    const { dispatch } = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/root/secret', installedPackages: ['untar'] };
    const r = executeUntar(['cats.tar'], ctx, dispatch, {});
    if (r && r.type === 'error' && r.output.toLowerCase().indexOf('backup') >= 0) ok('4.15 untar fora de Backup = erro');
    else fail('4.15 untar fora de Backup nao deu erro');
  }

  // 4.16 untar com password.txt correto
  {
    const cap = makeCaptureDispatch();
    const fs = deepClone(clone.filesystem);
    const home = getNodeByPath(fs, '/home/k1tty');
    const tar = getNodeByPath(fs, '/root/secret/cats.tar');
    home.children['Backup'] = {
      name: 'Backup', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: new Date().toISOString(),
      children: {
        'password.txt': {
          name: 'password.txt', type: 'file', content: 'm30w',
          permissions: 'rw-r--r--', owner: 'k1tty', hidden: false, locked: false, password: null,
          size: 4, lastModified: new Date().toISOString(),
        },
        'cats.tar': tar,
      },
    };
    const ctx = { ...clone, filesystem: fs, currentDirectory: '/home/k1tty/Backup', installedPackages: ['untar'] };
    const r = executeUntar(['cats.tar'], ctx, cap.dispatch, {});
    if (r && r.type === 'success' && actionsInclude(cap.actions, 'UPDATE_FILESYSTEM')) ok('4.16 untar com m30w');
    else fail('4.16 untar com senha correta falhou');
    if (actionsIncludeFlag(cap.actions, 'catsUntarred')) ok('4.16b flag catsUntarred');
    else fail('4.16b flag catsUntarred nao setada');
  }

  // 4.17 unzip sem senha
  {
    const { dispatch } = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/root/secret', installedPackages: ['unzip'] };
    const r = executeUnzip(['cat_photos.zip'], ctx, dispatch, {});
    if (r && r.needsPassword) ok('4.17 unzip sem senha pede senha');
    else fail('4.17 unzip nao pediu senha');
  }

  // 4.18 unzip senha errada
  {
    const { dispatch } = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/root/secret', installedPackages: ['unzip'] };
    const r = executeUnzip(['cat_photos.zip'], ctx, dispatch, { password: 'xxx' });
    if (r && r.type === 'error') ok('4.18 unzip senha errada = erro');
    else fail('4.18 unzip aceitou senha errada');
  }

  // 4.19 unzip ok
  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/root/secret', installedPackages: ['unzip'] };
    const r = executeUnzip(['cat_photos.zip'], ctx, cap.dispatch, { password: 'm30w' });
    if (r && r.type === 'success' && actionsInclude(cap.actions, 'EXTRACT_CAT_PHOTOS')) ok('4.19 unzip com m30w');
    else fail('4.19 unzip com senha correta falhou');
  }

  // 4.20 sudo cd /root/secret
  {
    const cap = makeCaptureDispatch();
    const r = executeSudo(['cd', '/root/secret'], clone, cap.dispatch, { password: clone.sudoPassword });
    if (r && r.type === 'normal' && actionsInclude(cap.actions, 'CHANGE_DIRECTORY')) ok('4.20 sudo cd /root/secret');
    else fail('4.20 sudo cd falhou');
    if (actionsIncludeFlag(cap.actions, 'openedSecret')) ok('4.20b flag openedSecret');
    else fail('4.20b flag openedSecret nao setada');
  }

  // 4.21 cd /root sem sudo
  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeCd(['/root'], clone, dispatch, {});
    if (r && r.type === 'error') ok('4.21 cd /root sem sudo = erro');
    else fail('4.21 cd /root sem sudo permitido');
  }

  // 4.22 victory sem unlock
  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeVictory([], clone, dispatch);
    if (r && r.type === 'error') ok('4.22 victory sem unlock = erro');
    else fail('4.22 victory permitido sem unlock');
  }

  // 4.23 victory com unlock
  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, flags: { ...clone.flags, finalUnlocked: true } };
    const r = executeVictory([], ctx, cap.dispatch);
    if (r && r.type === 'success') ok('4.23 victory com unlock');
    else fail('4.23 victory com unlock falhou');
  }

  log('');

  /* 5) CORRUPCAO */
  log('--- 5. CORRUPCAO DE SISTEMA ---');

  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeRm(['-rf', '/'], clone, dispatch, {});
    if (r && r.needsConfirmation) ok('5.1 rm -rf / pede confirmacao');
    else fail('5.1 rm -rf / nao pediu confirmacao');
  }

  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeRm(['-rf', '/'], clone, dispatch, { confirmed: true });
    if (r && r.systemCorrupting && r.removalLogs && r.removalLogs.length > 0) ok('5.2 rm -rf / confirmado dispara corrupcao');
    else fail('5.2 rm -rf / confirmado nao disparou corrupcao');
  }

  {
    const { dispatch } = makeCaptureDispatch();
    const r = executeSudo(['rm', '-rf', '/*'], clone, dispatch, { password: clone.sudoPassword });
    if (r && r.systemCorrupting) ok('5.3 sudo rm -rf /* corrompe direto');
    else fail('5.3 sudo rm -rf /* nao corrompeu');
  }
  log('');

  /* 6) PACOTES */
  log('--- 6. PACOTES ---');
  for (const p of PACKAGES_WITH_WINDOW) {
    if (p.openWindow && typeof p.openWindow === 'string') ok('pacote "' + p.id + '" -> janela "' + p.openWindow + '"');
    else fail('pacote "' + p.id + '" sem openWindow');
  }
  const noWin = PACKAGE_IDS.filter(id => !PACKAGES_WITH_WINDOW.find(p => p.id === id));
  for (const id of noWin) ok('pacote "' + id + '" sem janela (comando puro)');
  log('');

  /* 7) CONQUISTAS */
  log('--- 7. CONQUISTAS ---');
  let structOk = 0;
  for (const a of ACHIEVEMENTS) {
    if (a.id && a.name && a.desc && a.icon && a.category) structOk++;
    else fail('conquista "' + (a.id || '???') + '" com campos faltando');
  }
  ok(structOk + '/' + ACHIEVEMENTS.length + ' conquistas com estrutura valida');

  const validIds = new Set(ACHIEVEMENTS.map(a => a.id));
  const unlocked = state.unlockedAchievements || [];
  let invalid = 0;
  for (const id of unlocked) {
    if (!validIds.has(id)) { fail('conquista "' + id + '" destravada mas nao existe'); invalid++; }
  }
  if (invalid === 0) ok('todas as ' + unlocked.length + ' conquistas destravadas existem');
  log('');

  /* 8) EXECUTORES */
  log('--- 8. EXECUTORES ---');
  const execs = {
    ls: executeLs, cd: executeCd, cat: executeCat, whoami: executeWhoami,
    date: executeDate, help: executeHelp, fastfetch: executeFastfetch,
    howleft: executeHowleft, whatnow: executeWhatnow, log: executeLog,
    grep: executeGrep, find: executeFind, sudo: executeSudo, apt: executeApt,
    connect: executeConnect, untar: executeUntar, unzip: executeUnzip,
    rm: executeRm, victory: executeVictory, clear: executeClear,
    touch: executeTouch, mkdir: executeMkdir, mv: executeMv,
    notes: executeNotes, snapshot: executeSnapshot, reboot: executeReboot,
    nvim: executeNvim, achievements: executeAchievements, meta: executeMeta,
    web: executeWeb, admin: executeAdmin, switchos: executeSwitchOS,
    catfact: executeCatFact, quote: executeQuote, pokemon: executePokemon,
    cowsay: executeCowsay,
  };
  let execOk = 0;
  for (const k in execs) {
    if (typeof execs[k] === 'function') execOk++;
    else fail('executor "' + k + '" nao e funcao');
  }
  ok(execOk + ' executores validos');
  log('');

  /* 9) TABELA DE CONQUISTAS */
  log('--- 9. TABELA DE CONQUISTAS ---');
  const base = {
    ...clone,
    currentSave: 0,
    flags: {},
    stats: { commandsRun: 0, filesRead: [], tracksPlayed: [], themesUsed: [], pokemonSeen: [], catPhotosSeen: [], dirsVisited: [], catrunGames: 0, catrunDeaths: 0, snapshotsMade: 0 },
    installedPackages: [],
    wifiConnected: false,
    tutorialCompleted: false,
    theme: 'neon',
    systemCorrupted: false,
  };

  const cases = [
    ['boot', { currentSave: 0 }, true],
    ['boot', { currentSave: null }, false],
    ['primeiro_comando', { stats: { ...base.stats, commandsRun: 1 } }, true],
    ['tutorial_ok', { tutorialCompleted: true }, true],
    ['whoami', { flags: { usedWhoami: true } }, true],
    ['ls_a', { flags: { usedLsA: true } }, true],
    ['leitor', { stats: { ...base.stats, filesRead: ['a','b','c','d','e'] } }, true],
    ['detetive', { flags: { foundDoNotOpen: true } }, true],
    ['historico', { flags: { usedLog: true } }, true],
    ['wifi_man', { wifiConnected: true }, true],
    ['internauta', { installedPackages: ['matrix'] }, true],
    ['colecionador', { installedPackages: ['a','b','c','d','e','f','g','h','i','j'] }, true],
    ['completista', { installedPackages: PACKAGE_IDS.slice() }, true],
    ['theme_switch', { theme: 'dracula' }, true],
    ['sudo_master', { flags: { foundSudoPassword: true } }, true],
    ['raiz', { flags: { enteredRoot: true } }, true],
    ['secreto', { flags: { openedSecret: true } }, true],
    ['gato_sabe', { flags: { finalUnlocked: true } }, true],
    ['token_achado', { flags: { unlockedMusicLocked: true } }, true],
    ['dj', { stats: { ...base.stats, tracksPlayed: ['a','b','c','d'] } }, true],
    ['victory', { flags: { finaleSeen: true } }, true],
    ['aniquilador', { systemCorrupted: true, flags: { corruptedBy: 'user' } }, true],
    ['aniquilador', { systemCorrupted: true, flags: { corruptedBy: 'miau' } }, false],
    ['recursivo', { flags: { usedRecursive: true } }, true],
    ['customizador', { flags: { changedLogo: true } }, true],
    ['vn_good', { flags: { vnGoodEnding: true } }, true],
    ['miau_bom', { flags: { miauGoodEnding: true } }, true],
    ['miau_ruim', { flags: { miauBadEnding: true } }, true],
    ['meow_trilionario', { flags: { meowTrilionario: true } }, true],
    ['catrun_best', { flags: { catrunBest50: true } }, true],
    ['theme_collector', { stats: { ...base.stats, themesUsed: ['a','b','c','d','e'] } }, true],
    ['bonsai_master', { flags: { bonsaiComplete: true } }, true],
    ['catrun_player', { stats: { ...base.stats, catrunGames: 10 } }, true],
    ['catrun_deaths', { stats: { ...base.stats, catrunDeaths: 10 } }, true],
    ['tutorial_remover', { flags: { tutorialRemoved: true } }, true],
    ['miau_remover', { flags: { miauVnRemoved: true } }, true],
    ['cowsay_wise', { flags: { cowsayConselhoUsado: true } }, true],
    ['writer', { flags: { wroteFile: true } }, true],
    ['theme_all_used', { stats: { ...base.stats, themesUsed: THEMES.map(t => t.id) } }, true],
    ['theme_all_used', { stats: { ...base.stats, themesUsed: THEMES.slice(0, THEMES.length - 1).map(t => t.id) } }, false],
    ['catfact_reader', { flags: { readCatFact: true } }, true],
    ['philosopher', { flags: { readQuote: true } }, true],
    ['deb_installer', { flags: { installedAptCli: true } }, true],
    ['pokemon_master', { stats: { ...base.stats, pokemonSeen: ['1','2','3','4','5','6','7','8','9','10'] } }, true],
    ['pokemon_legendary', { flags: { sawLegendary: true } }, true],
    ['id_inexistente', {}, false],
  ];

  let achOk = 0;
  let achFail = 0;
  for (const c of cases) {
    const id = c[0];
    const patch = c[1];
    const expected = c[2];
    const testState = {
      ...base,
      ...patch,
      flags: { ...base.flags, ...(patch.flags || {}) },
      stats: patch.stats || base.stats,
    };
    const actual = isAchieved(id, testState);
    if (actual === expected) achOk++;
    else { fail('isAchieved("' + id + '") esperado ' + expected + ', obtido ' + actual); achFail++; }
  }
  if (achFail === 0) ok('tabela de conquistas: ' + achOk + '/' + cases.length + ' passaram');
  else info('tabela de conquistas: ' + achOk + '/' + cases.length + ' passaram');
  log('');

  log('===============================================');
  log('  OK:      ' + totalOk);
  log('  FALHAS:  ' + totalFail);
  log('===============================================');
  if (totalFail === 0) log('  TUDO OK - jogo consistente.');
  else log('  ' + totalFail + ' falha(s) encontrada(s).');
  log('');

  return {
    command: 'fulltest',
    output: lines.join('\n'),
    type: totalFail === 0 ? 'success' : 'error',
    stats: { totalOk, totalFail },
  };
}

/* ============================================================
   WHATNOW EM TODOS OS ESTAGIOS
   ============================================================ */
export function executeWhatnowAllStages(state) {
  const STAGES = [
    { label: '1/9 . Sem senha do sudo', wifi: false, patch: {} },
    { label: '2/9 . Sem WiFi', wifi: false, patch: { foundSudoPassword: true } },
    { label: '3/9 . Sem apt-cli', wifi: true, patch: { foundSudoPassword: true, installedAptCli: false } },
    { label: '4/9 . Sem Bluetooth pareado', wifi: true, patch: { foundSudoPassword: true, installedAptCli: true, pairedPhone: false } },
    { label: '5/9 . Sem TOKEN', wifi: true, patch: { foundSudoPassword: true, installedAptCli: true, pairedPhone: true, unlockedMusicLocked: false } },
    { label: '6/9 . Sem music_pack.zip', wifi: true, patch: { foundSudoPassword: true, installedAptCli: true, pairedPhone: true, unlockedMusicLocked: true, musicExtracted: false } },
    { label: '7/9 . Sem cats.tar (critico)', wifi: true, patch: { foundSudoPassword: true, installedAptCli: true, pairedPhone: true, unlockedMusicLocked: true, musicExtracted: true, catsUntarred: false } },
    { label: '8/9 . Sem cat_photos.zip', wifi: true, patch: { foundSudoPassword: true, installedAptCli: true, pairedPhone: true, unlockedMusicLocked: true, musicExtracted: true, catsUntarred: true, finalUnlocked: false } },
    { label: '9/9 . Tudo pronto', wifi: true, patch: { foundSudoPassword: true, installedAptCli: true, pairedPhone: true, unlockedMusicLocked: true, musicExtracted: true, catsUntarred: true, finalUnlocked: true } },
  ];

  const lines = [];
  const noop = () => {};
  lines.push('===============================================');
  lines.push('  WHATNOW - TODOS OS ESTAGIOS');
  lines.push('===============================================');
  lines.push('');
  lines.push('  Simulacao headless dos 9 estagios narrativos.');
  lines.push('  Nao altera o save.');
  lines.push('');

  STAGES.forEach(stage => {
    const fakeState = { ...state, wifiConnected: stage.wifi, flags: { ...stage.patch } };
    let result;
    try { result = executeWhatnow([], fakeState, noop); }
    catch (e) { result = { output: '[excecao: ' + e.message + ']' }; }

    lines.push('--- ' + stage.label + ' ---');
    lines.push('');
    const out = (result.output || '').trim();
    if (!out) lines.push('  (sem saida)');
    else out.split('\n').forEach(l => lines.push('  ' + l));
    lines.push('');
  });

  lines.push('===============================================');

  return { command: 'whatnow-all', output: lines.join('\n'), type: 'success' };
}