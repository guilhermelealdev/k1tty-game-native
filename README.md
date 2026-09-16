# k1tty-native

Port mobile do jogo k1tty (originalmente web em React + Vite) para React Native + Expo.

Simulador de terminal em que voce explora um sistema Linux ficticio, resolve enigmas, instala pacotes, enfrenta finais multiplos e descobre easter eggs.

---

## Como rodar

### Pre-requisitos

- Node.js 18+
- Expo Go instalado no celular

### Instalacao

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\run-all.ps1
npx expo start --clear
```

Escaneia o QR code com Expo Go, ou aperta a (Android) / w (web).

---

## Comandos do jogo

### Base
ls, cd, cat, pwd, whoami, date, clear, help

### Arquivos
touch, mkdir, rm, mv, find, grep

### Rede
ping, connect

### Sistema
sudo, apt install, apt remove, apt help

### Guia
whatnow, howleft

### Extras
notes, log, fastfetch, cowsay, snapshot, reboot

### API externa (precisa de WiFi)
catfact, quote, pokemon

### Visual novels
miau-vn, vn

### Temas
themes, theme <id>

### Admin
admin (senha: Penny)

---

## Enigmas

1. Senha do sudo em DO NOT OPEN/password.txt - pede username k1tty.
2. Senha WiFi em .notes.txt (ls -a para ver).
3. TOKEN pelas iniciais dos 5 .meow recebidos via Bluetooth.
4. m30w em ~/Music/.meow_index ou no anexo do topico [7] do forum.
5. cats.tar precisa estar em ~/Backup com password.txt contendo m30w.

---

## Estrutura do projeto

src/
  app/              rotas Expo Router
  game/
    commands/       parser + executores + packages
    components/     FloatingWindow, TerminalLine, etc.
    data/           achievements
    fs/             filesystem virtual
    hooks/          useAchievements, useTypewriter
    screens/        SaveSelect, Terminal
    services/       APIs + audio + haptics
    state/          GameContext + storage
    theme/          32 temas
    viewers/        29 janelas

---

## Save / Load

3 slots persistentes em AsyncStorage.
Toque = carrega. Segure = apaga. Autosave a cada 30s.

---

## Assets opcionais

O jogo funciona sem eles (fallback ASCII). Para ativar audio e sprites:

1. Copie do projeto web:
   public/sounds/*.mp3  ->  assets/sounds/
   public/music/*.mp3   ->  assets/music/
   public/pictures/*    ->  assets/images/

2. Mude ASSETS_READY de false para true em 7 arquivos:
   - services/uiSounds.ts
   - services/unlockableAudio.ts
   - viewers/MP3Player.tsx
   - components/BootScreen.tsx
   - components/PreloadScreen.tsx
   - components/AchievementToast.tsx
   - viewers/MeowViewer.tsx

3. npx expo start --clear

O SpriteAvatar e OpsecViewer detectam assets automaticamente.

---

## Tecnologias

- Expo SDK 51 + Expo Router
- React Native 0.74
- AsyncStorage para persistencia
- expo-av para audio
- expo-haptics para feedback tatil
- expo-linear-gradient para efeitos visuais

Sem canvas, sem Web Audio API, sem localStorage.
