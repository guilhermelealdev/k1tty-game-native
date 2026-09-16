// src/game/fs/initialData.js
// Portado do web com o mesmo conteudo narrativo.

export function generateSudoPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let r = 'Sudo';
  for (let i = 0; i < 6; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
  r += Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return r;
}

const MEOW_INDEX_CONTENT = [
  '=== .meow_index ===',
  'Um manifesto felino, escrito por alguem que ainda acredita.',
  '',
  '[I]',
  'MEOW meow MEOW meow ME0W',
  'meow MEOW meow MEOW meow',
  'MEOW meow MEOW meow MEOW',
  'meow MEOW meow MEOW meow',
  '',
  '[II]',
  'MEOW meow MEOW meow MEOW',
  'meow MEOW meow m30w meow',
  'MEOW meow MEOW meow MEOW',
  'meow MEOW meow MEOW meow',
  '',
  '[III]',
  'MEOW meow M30W meow MEOW',
  'meow MEOW meow MEOW meow',
  'MEOW meow MEOW meow MEOW',
  'meow MEOW meow MEOW meow',
  '',
  '[IV]',
  'MEOW meow MEOW meow MEOW',
  'meow MEOW meow MEOW meow',
  'MEOW m3ow MEOW meow MEOW',
  'meow MEOW meow MEOW meow',
  '',
  '----------',
  'entre todos os iguais, apenas um e exatamente o que voce procura.',
].join('\n');

const WHISPER_CONTENT = [
  'whisper.txt',
  '-------------',
  '',
  'O guardiao deste arquivo nao responde a nomes.',
  'Ele responde ao nome da casa.',
  '',
  'A casa nao e "home". A casa nao e "user".',
  'A casa e quem mora aqui.',
  'A casa e k1tty.',
  '',
  'Isto nao e um enigma.',
  'E um espelho.',
].join('\n');

const README_SECRET = [
  'README - leia antes de qualquer coisa',
  '-------------------------------------',
  'por k1tty',
  '',
  'Eu guardei minhas fotos de gatos neste cofre, mas o processo',
  'de compactacao corrompeu o indice do arquivo.',
  '',
  'Se voce esta lendo isto, e porque conseguiu chegar ate aqui -',
  'o que significa que passou por tudo o que eu preparei.',
  '',
  'Ha dois arquivos protegidos neste cofre:',
  '',
  '  1. cats.tar - o backup antigo, quando as coisas ainda funcionavam.',
  '',
  '     O comando de extracao exige TRES coisas ao mesmo tempo:',
  '       a) que o cats.tar esteja dentro de uma pasta chamada "Backup"',
  '       b) que exista um arquivo "password.txt" na MESMA pasta',
  '       c) que o conteudo do "password.txt" seja a senha correta',
  '',
  '     Dica: use "nvim password.txt" e salve com Ctrl+S.',
  '',
  '  2. cat_photos.zip - o pacote final, com o indice corrompido.',
  '     A senha e a mesma coisa que voce procurou o jogo inteiro.',
  '',
  'Boa sorte.',
  '- k1tty',
].join('\n');

const NOTES_CONTENT = [
  'Notas pessoais de k1tty:',
  '-------------------------',
  '',
  '- Lembrar de pagar a conta de internet',
  "- WiFi: k1tty's home",
  '- Senha do WiFi: meow12345',
  '- Comprar racao para o gato',
  '- Nao esquecer a senha do sudo (esta em Documents/DO NOT OPEN)',
  '- Investigar aquela pasta estranha no /root',
  '',
  'Outras coisas:',
  '- Meu celular tem musicas antigas que eu queria passar pro PC.',
  '  Vou tentar via bluetooth algum dia.',
  '- Tem um arquivo estranho em ~/Music chamado .meow_index.',
  '  Nao sei quem colocou la. Nao consigo parar de olhar.',
  '- Guardei um .deb em ~/Downloads. Talvez seja util.',
  '- Fiz um backup antigo (cats.tar) e escondi dentro do cofre',
  '  do /root/secret. Nao lembro a senha do arquivo. Alguma',
  '  coisa com gato.',
  '',
  'Fim das notas.',
].join('\n');

const COMMANDS_HELP = [
  'Comandos disponiveis:',
  'ls, cd, cat, clear, touch, mkdir, rm, mv, find, grep,',
  'date, whoami, help, fastfetch, cowsay, whatnow, howleft,',
  'notes, log, snapshot, reboot, apt, web, ping, connect,',
  'nvim, sudo, achievements',
  '',
  'Pacotes instalaveis via apt:',
  'matrix, mp3player, lens, bonsai, audioview, opsec, meow,',
  'dinorun, btop, ram, tutorial, untar, unzip, k1tty, kitty,',
  'bluetooth, whoisthis, apt-cli, kittens',
].join('\n');

const USERLOG = [
  '[2024-01-15 10:23:45] k1tty login',
  '[2024-01-15 11:02:12] k1tty executou: ls -la',
  '[2024-01-15 11:05:33] k1tty executou: cat readme.txt',
  '[2024-01-16 09:15:20] k1tty login',
  '[2024-01-16 14:30:01] k1tty tentou acessar /root (negado - sem sudo)',
  '[2024-01-17 08:45:12] k1tty login',
  '[2024-01-17 10:20:55] k1tty executou: ping (procurando redes...)',
  '[2024-01-18 16:40:30] root login',
  '[2024-01-18 17:00:00] root executou: sudo rm -rf /tmp/*',
  '[2024-01-18 17:01:00] root logout',
  '[2024-02-01 09:00:00] k1tty login',
  '[2024-02-01 09:10:15] k1tty executou: find / -name "secret"',
  '[2024-02-01 09:11:00] k1tty logout',
  '[2024-02-05 22:14:33] k1tty login',
  '[2024-02-05 22:15:01] k1tty executou: sudo mv /root/secret/cats.tar Backup/',
  '[2024-02-05 22:15:30] k1tty executou: cd Backup',
  '[2024-02-05 22:16:12] k1tty logout',
].join('\n');

function createFile(name, content, options) {
  options = options || {};
  return {
    name, type: 'file', content: content || '',
    permissions: options.permissions || 'rw-r--r--',
    owner: options.owner || 'k1tty',
    hidden: options.hidden || false,
    locked: options.locked || false,
    password: options.password || null,
    size: (content || '').length,
    lastModified: options.lastModified || new Date().toISOString(),
    requiresUsername: options.requiresUsername || false,
    requiresSudo: options.requiresSudo || false,
  };
}

function createDir(name, options) {
  options = options || {};
  return {
    name, type: 'dir', content: null,
    permissions: options.permissions || 'rwxr-xr-x',
    owner: options.owner || 'k1tty',
    hidden: options.hidden || false,
    locked: options.locked || false,
    password: options.password || null,
    size: 4096,
    lastModified: options.lastModified || new Date().toISOString(),
    children: options.children || {},
    requiresSudo: options.requiresSudo || false,
  };
}

function createImageFile(name, options) {
  options = options || {};
  return createFile(name, 'BINARY_IMAGE_' + name, Object.assign({}, options, {
    isImage: true, imageUrl: null,
    size: options.size || Math.floor(60000 + Math.random() * 50000),
  }));
}

export function getInitialFilesystem(sudoPassword) {
  return createDir('/', {
    owner: 'root', permissions: 'rwxr-xr-x',
    children: {
      home: createDir('home', {
        owner: 'root', permissions: 'rwxr-xr-x',
        children: {
          k1tty: createDir('k1tty', {
            owner: 'k1tty', permissions: 'rwxr-xr-x',
            children: {
              Documents: createDir('Documents', {
                owner: 'k1tty',
                children: {
                  'DO NOT OPEN': createDir('DO NOT OPEN', {
                    owner: 'k1tty',
                    children: {
                      'whisper.txt': createFile('whisper.txt', WHISPER_CONTENT, { owner: 'k1tty' }),
                      'password.txt': createFile('password.txt',
                        'A senha do sudo e: ' + sudoPassword + '\n\nNao compartilhe esta informacao.\nDica: o arquivo pede o nome de usuario para abrir.',
                        { locked: true, requiresUsername: true, owner: 'k1tty', permissions: 'rw-------' }),
                    },
                  }),
                  'readme.txt': createFile('readme.txt',
                    'Bem-vindo ao k1tty!\n\nEste e seu sistema pessoal. Explore os diretorios e arquivos para descobrir seus segredos.\n\nAlgumas dicas vagas:\n- Nem tudo esta a vista. Tente "ls -a".\n- O passado deixa rastros em /var/log.\n- A curiosidade e uma virtude, mas cuidado com a destruicao.\n- Quando o terminal nao souber te ajudar, use "web".\n\nBoa sorte, k1tty.',
                    { owner: 'k1tty' }),
                },
              }),
              Downloads: createDir('Downloads', {
                owner: 'k1tty',
                children: {
                  'apt-installer-tui.deb': createFile('apt-installer-tui.deb',
                    'BINARY_DEB_PACKAGE_APT_INSTALLER_TUI',
                    { owner: 'k1tty', size: 245000 }),
                  'checksums.sha256': createFile('checksums.sha256',
                    '# Hashes SHA-256 dos pacotes oficiais do repositorio k1tty\n# Qualquer pacote que nao conste nesta lista deve ser tratado como suspeito.\n\na1f4e2c9d8b7e6f5a4c3b2e1d0f9c8b7a6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1  apt-installer-tui\ne5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4  mp3player-pro\n\n# fim do arquivo',
                    { owner: 'k1tty' }),
                },
              }),
              Music: createDir('Music', {
                owner: 'k1tty',
                children: {
                  '.meow_index': createFile('.meow_index', MEOW_INDEX_CONTENT, { owner: 'k1tty', hidden: true }),
                },
              }),
              Pictures: createDir('Pictures', {
                owner: 'k1tty',
                children: {
                  'cat_photo.jpg': createImageFile('cat_photo.jpg', { owner: 'k1tty' }),
                  'screenshot_terminal.png': createImageFile('screenshot_terminal.png', { owner: 'k1tty' }),
                  'family_picture.jpg': createImageFile('family_picture.jpg', { owner: 'k1tty' }),
                  'wallpaper.png': createImageFile('wallpaper.png', { owner: 'k1tty' }),
                  'old_backup.jpg': createImageFile('old_backup.jpg', { owner: 'k1tty' }),
                },
              }),
              '.notes.txt': createFile('.notes.txt', NOTES_CONTENT, { hidden: true, owner: 'k1tty' }),
            },
          }),
        },
      }),
      etc: createDir('etc', {
        owner: 'root', permissions: 'rwxr-xr-x',
        children: {
          'logo.txt': createFile('logo.txt',
            '   ,-.       _,---._ __  / \\\n  /  )    .-\'       `./ /   \\\n (  (   ,\'            `/    /|\n  \\  `-"             \\\'\\   / |\n   `.              ,  \\ \\ /  |\n    /`.          ,\' -`----Y   |\n   (            ;        |   \'\n   |  ,-.    ,-\'         |  /\n   |  | (   |        k1t | /\n   )  |  \\  `.___________|/\n   `--\'   `--\'',
            { owner: 'root' }),
          hostname: createFile('hostname', 'k1tty', { owner: 'root' }),
          'os-release': createFile('os-release', 'NAME="k1tty Linux"\nVERSION="1.0.0"\nID=k1tty\nPRETTY_NAME="k1tty Linux 1.0.0"', { owner: 'root' }),
        },
      }),
      var: createDir('var', {
        owner: 'root', permissions: 'rwxr-xr-x',
        children: {
          log: createDir('log', {
            owner: 'root',
            children: {
              userlog: createFile('userlog', USERLOG, { owner: 'root' }),
            },
          }),
        },
      }),
      tmp: createDir('tmp', { owner: 'root', permissions: 'rwxrwxrwt' }),
      usr: createDir('usr', {
        owner: 'root',
        children: {
          share: createDir('share', {
            owner: 'root',
            children: {
              wallpapers: createDir('wallpapers', {
                owner: 'root',
                children: {
                  'default_wallpaper.png': createImageFile('default_wallpaper.png', { owner: 'root' }),
                  'k1tty_theme.jpg': createImageFile('k1tty_theme.jpg', { owner: 'root' }),
                },
              }),
              icons: createDir('icons', {
                owner: 'root',
                children: {
                  'cat_icon.png': createImageFile('cat_icon.png', { owner: 'root' }),
                },
              }),
            },
          }),
          bin: createDir('bin', {
            owner: 'root',
            children: {
              'commands.txt': createFile('commands.txt', COMMANDS_HELP, { owner: 'root' }),
            },
          }),
        },
      }),
      root: createDir('root', {
        owner: 'root', permissions: 'rwx------',
        locked: true, requiresSudo: true,
        children: {
          secret: createDir('secret', {
            owner: 'root', permissions: 'rwx------',
            locked: true, requiresSudo: true,
            children: {
              'README.txt': createFile('README.txt', README_SECRET, { owner: 'root' }),
              'cats.tar': createFile('cats.tar', 'BINARY_TAR_CATS_BACKUP', { owner: 'root', size: 4500000 }),
              'cat_photos.zip': createFile('cat_photos.zip', 'BINARY_ZIP_CAT_PHOTOS',
                { owner: 'root', permissions: 'rw-------', locked: true, password: 'm30w', size: 12500000 }),
            },
          }),
        },
      }),
      bin: createDir('bin', {
        owner: 'root',
        children: {
          ls: createFile('ls', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          cd: createFile('cd', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          cat: createFile('cat', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          touch: createFile('touch', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          mkdir: createFile('mkdir', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          rm: createFile('rm', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          mv: createFile('mv', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          find: createFile('find', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          grep: createFile('grep', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          sudo: createFile('sudo', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          apt: createFile('apt', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
          nvim: createFile('nvim', 'BINARY', { owner: 'root', permissions: 'rwxr-xr-x' }),
        },
      }),
    },
  });
}

export function getInitialState(slot, sudoPassword) {
  const pwd = sudoPassword || generateSudoPassword();
  return {
    filesystem: getInitialFilesystem(pwd),
    currentDirectory: '/home/k1tty',
    history: [],
    sudoPassword: pwd,
    wifiConnected: false,
    wifiName: "k1tty's home",
    wifiPassword: 'meow12345',
    installedPackages: [],
    openWindows: [],
    windowPositions: {},
    snapshots: [],
    currentSave: slot,
    progress: 0,
    tutorialCompleted: false,
    flags: {},
    systemCorrupted: false,
    finaleActive: false,
    miauFinaleActive: false,
    osSwitchActive: false,
    theme: 'neon',
    stats: {
      commandsRun: 0,
      filesRead: [],
      tracksPlayed: [],
      catPhotosSeen: [],
      themesUsed: [],
      dirsVisited: [],
      filesCreated: 0,
      dirsCreated: 0,
      filesDeleted: 0,
      filesRenamed: 0,
      catrunGames: 0,
      catrunDeaths: 0,
      snapshotsMade: 0,
      pokemonSeen: [],
    },
    unlockedAchievements: [],
    pendingUnlocks: [],
    seenEndings: [],
    apiCache: {},
  };
}