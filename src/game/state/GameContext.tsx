// src/game/state/GameContext.tsx
// Portado do web + persistencia via AsyncStorage com cache sincrono.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { deepClone, getNodeByPath } from "../fs/helpers";
import { generateSudoPassword, getInitialState } from "../fs/initialData";
import {
  deleteSaveSync,
  ensureLoaded,
  getSaveSync,
  setSaveSync,
} from "./storage";

const GameContext = createContext<any>(null);
const MAX_SNAPSHOTS = 5;

const UNIQUE_WINDOW_TYPES = new Set([
  "nvim",
  "apt-cli",
  "apt",
  "bluetooth",
  "notes",
  "miau-vn",
  "vn",
  "miau-terminal",
]);

const WINDOW_PREFERRED_SIZES: Record<
  string,
  { width: number; height: number }
> = {
  meow: { width: 520, height: 460 },
  kitty: { width: 520, height: 460 },
  web: { width: 620, height: 520 },
  lens: { width: 580, height: 460 },
  nvim: { width: 560, height: 440 },
  tutorial: { width: 540, height: 460 },
  admin: { width: 540, height: 540 },
  matrix: { width: 560, height: 420 },
  btop: { width: 540, height: 460 },
  mp3player: { width: 480, height: 440 },
  bonsai: { width: 400, height: 460 },
  catrun: { width: 620, height: 420 },
  ram: { width: 460, height: 480 },
  k1tty: { width: 460, height: 400 },
  opsec: { width: 560, height: 480 },
  bluetooth: { width: 460, height: 460 },
  whoisthis: { width: 540, height: 460 },
  credits: { width: 620, height: 480 },
  notes: { width: 500, height: 420 },
  "apt-cli": { width: 580, height: 480 },
  kittens: { width: 540, height: 520 },
  achievements: { width: 540, height: 520 },
  "miau-vn": { width: 640, height: 520 },
  "miau-warning": { width: 320, height: 180 },
  "miau-terminal": { width: 600, height: 420 },
};

const DEFAULT_WINDOW_SIZE = { width: 500, height: 350 };
function getPreferredSize(type: string) {
  return WINDOW_PREFERRED_SIZES[type] || DEFAULT_WINDOW_SIZE;
}

let windowIdCounter = 1000;
function generateWindowId() {
  return "window_" + ++windowIdCounter;
}

function buildBootstrapState() {
  const fresh = getInitialState(null, generateSudoPassword());
  fresh.currentSave = null;
  return fresh;
}

/* ============================================================
   Persistencia explicita antes de sair pra SaveSelect
   (usada pelos finais: miau-bom, os-switch)
   ============================================================ */
function persistCurrentSave(
  slot: string | number | null,
  state: any,
  overrides: any = {},
) {
  if (slot === null || slot === undefined) return;
  if (state.systemCorrupted) return;
  try {
    const payload = { ...state, ...overrides, currentSave: slot };
    setSaveSync(String(slot), payload);
  } catch (e) {
    console.warn("[k1tty] falha ao salvar antes do final:", e);
  }
}

function gameReducer(state: any, action: any) {
  switch (action.type) {
    /* ==========================================================
       NEW_SAVE
       BUG FIX: estava passando `skipTutorial` (boolean) como 2o
       argumento de getInitialState, que na verdade espera a
       senha do sudo. Isso deixava state.sudoPassword = true,
       quebrando `sudo apt` pra sempre.
       ========================================================== */
    case "NEW_SAVE": {
      const { slot, skipTutorial } = action.payload;
      const fresh = getInitialState(slot, generateSudoPassword());
      if (!skipTutorial) {
        const id = generateWindowId();
        fresh.openWindows = [{ id, type: "tutorial" }];
        fresh.windowPositions = {
          [id]: { x: 40, y: 80, width: 320, height: 400 },
        };
        fresh.installedPackages = ["tutorial"];
      }
      return fresh;
    }

    case "LOAD_SLOT": {
      const data = action.payload;
      if (!data || !data.filesystem || data.filesystem.type !== "dir")
        return state;
      return {
        ...getInitialState(data.currentSave, data.sudoPassword),
        ...data,
        currentSave: data.currentSave,
        openWindows: [],
        windowPositions: {},
        snapshots: [],
        systemCorrupted: false,
        finaleActive: false,
        miauFinaleActive: false,
        osSwitchActive: false,
        pendingUnlocks: [],
      };
    }
    case "DELETE_SAVE":
      return state;

    case "UPDATE_FILESYSTEM":
      return { ...state, filesystem: action.payload };
    case "CHANGE_DIRECTORY":
      return { ...state, currentDirectory: action.payload };
    case "CLEAR_HISTORY":
      return { ...state, history: [] };
    case "SET_SUDO_PASSWORD":
      return { ...state, sudoPassword: action.payload };
    case "SET_WIFI_CONNECTED":
      return { ...state, wifiConnected: action.payload };
    case "SET_WIFI_NAME":
      return { ...state, wifiName: action.payload };
    case "SET_WIFI_PASSWORD":
      return { ...state, wifiPassword: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_TUTORIAL_COMPLETED":
      return { ...state, tutorialCompleted: action.payload };
    case "ADD_HISTORY":
      return { ...state, history: [...state.history, action.payload] };
    case "SET_FLAG":
      return {
        ...state,
        flags: { ...state.flags, [action.payload.flag]: action.payload.value },
      };

    case "INSTALL_PACKAGE": {
      if (state.installedPackages.includes(action.payload)) return state;
      return {
        ...state,
        installedPackages: [...state.installedPackages, action.payload],
      };
    }

    /* ==========================================================
       NOVO: instala varios pacotes numa unica dispatch
       (usado pelo admin panel; evita race condition de N dispatches)
       ========================================================== */
    case "INSTALL_ALL_PACKAGES": {
      const toInstall: string[] = action.payload || [];
      const current: string[] = state.installedPackages || [];
      const merged = Array.from(new Set([...current, ...toInstall]));
      if (merged.length === current.length) return state;
      return { ...state, installedPackages: merged };
    }

    case "REMOVE_PACKAGE": {
      return {
        ...state,
        installedPackages: state.installedPackages.filter(
          (p: string) => p !== action.payload,
        ),
      };
    }
    case "SET_IMAGE_URLS": {
      const newFs = deepClone(state.filesystem);
      for (const { path, url } of action.payload) {
        const node = getNodeByPath(newFs, path);
        if (node && node.type === "file" && node.isImage) node.imageUrl = url;
      }
      return { ...state, filesystem: newFs };
    }
    case "SET_API_CACHE":
      return {
        ...state,
        apiCache: { ...(state.apiCache || {}), ...action.payload },
      };

    case "INSTALL_DOWNLOAD": {
      const { filename, content } = action.payload;
      const newFs = deepClone(state.filesystem);
      const home = getNodeByPath(newFs, "/home/k1tty");
      if (!home) return state;
      if (!home.children["Downloads"]) {
        home.children["Downloads"] = {
          name: "Downloads",
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
        };
      }
      const now = new Date().toISOString();
      home.children["Downloads"].children[filename] = {
        name: filename,
        type: "file",
        content,
        permissions: "rw-r--r--",
        owner: "k1tty",
        hidden: false,
        locked: false,
        password: null,
        size: content.length,
        lastModified: now,
        userCreated: true,
      };
      return { ...state, filesystem: newFs };
    }

    case "RECEIVE_PHONE_FILES": {
      const newFs = deepClone(state.filesystem);
      const home = getNodeByPath(newFs, "/home/k1tty");
      if (!home || home.children["from_phone"]) return state;
      const now = new Date().toISOString();
      const lyricChildren: any = {};
      for (let i = 1; i <= 5; i++) {
        const name = "lyric_" + i + ".meow";
        const content =
          "MEOW MEOW MEOW\n\n" +
          ["T", "O", "K", "E", "N"][i - 1] +
          "\n\nMEOW MEOW MEOW";
        lyricChildren[name] = {
          name,
          type: "file",
          content,
          permissions: "rw-r--r--",
          owner: "k1tty",
          hidden: false,
          locked: false,
          password: null,
          size: content.length,
          lastModified: now,
          userCreated: true,
        };
      }
      home.children["from_phone"] = {
        name: "from_phone",
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
          ...lyricChildren,
          Music_Locked: {
            name: "Music_Locked",
            type: "dir",
            content: null,
            permissions: "rwx------",
            owner: "k1tty",
            hidden: false,
            locked: true,
            password: "TOKEN",
            size: 4096,
            lastModified: now,
            children: {
              "music_pack.zip": {
                name: "music_pack.zip",
                type: "file",
                content: "BINARY_ZIP_MUSIC_PACK",
                permissions: "rw-------",
                owner: "k1tty",
                hidden: false,
                locked: false,
                password: null,
                size: 12400000,
                lastModified: now,
                userCreated: true,
              },
            },
          },
        },
      };
      return {
        ...state,
        filesystem: newFs,
        flags: { ...state.flags, pairedPhone: true },
      };
    }

    case "INSTALL_MIAU_VN": {
      const newFs = deepClone(state.filesystem);
      const home = getNodeByPath(newFs, "/home/k1tty");
      if (!home) return state;
      const now = new Date().toISOString();
      if (!home.children["Games"]) {
        home.children["Games"] = {
          name: "Games",
          type: "dir",
          content: null,
          permissions: "rwxr-xr-x",
          owner: "k1tty",
          hidden: false,
          locked: false,
          password: null,
          size: 4096,
          lastModified: now,
          children: {},
        };
      }
      home.children["Games"].children["miau-vn"] = {
        name: "miau-vn",
        type: "file",
        content: "BINARY_EXECUTABLE_MIAU_VN",
        permissions: "rwxr-xr-x",
        owner: "k1tty",
        hidden: false,
        locked: false,
        password: null,
        size: 12500000,
        lastModified: now,
        userCreated: true,
      };
      home.children["Games"].children["readme.txt"] = {
        name: "readme.txt",
        type: "file",
        content:
          "miau-vn - versao 0.3 beta\n\nPra abrir o jogo, digite: miau-vn",
        permissions: "rw-r--r--",
        owner: "k1tty",
        hidden: false,
        locked: false,
        password: null,
        size: 220,
        lastModified: now,
        userCreated: true,
      };
      return {
        ...state,
        filesystem: newFs,
        flags: { ...state.flags, miauVnInstalled: true },
      };
    }

    case "EXTRACT_MUSIC": {
      const newFs = deepClone(state.filesystem);
      const music = getNodeByPath(newFs, "/home/k1tty/Music");
      if (!music) return state;
      const now = new Date().toISOString();
      const tracks = [
        "Back 2 Back",
        "Children of the City",
        "RUNAWAY",
        "You_re A Big Girl Now",
      ];
      tracks.forEach((title, i) => {
        const name = title + ".mp3";
        music.children[name] = {
          name,
          type: "file",
          content: "AUDIO_DATA_" + name,
          permissions: "rw-r--r--",
          owner: "k1tty",
          hidden: false,
          locked: false,
          password: null,
          size: 4000000 + i * 100000,
          lastModified: now,
          userCreated: true,
          isMusic: true,
          meta: {
            title,
            artist: "k1tty",
            album: "Recovered Tracks",
            format: "mp3",
          },
        };
      });
      return { ...state, filesystem: newFs };
    }

    case "EXTRACT_CAT_PHOTOS": {
      const newFs = deepClone(state.filesystem);
      const secret = getNodeByPath(newFs, "/root/secret");
      if (!secret) return state;
      const now = new Date().toISOString();
      secret.children["cats"] = {
        name: "cats",
        type: "dir",
        content: null,
        permissions: "rwxr-xr-x",
        owner: "root",
        hidden: false,
        locked: false,
        password: null,
        size: 4096,
        lastModified: now,
        children: Object.fromEntries(
          Array.from({ length: 20 }).map((_, i) => {
            const n = "cat_" + String(i + 1).padStart(2, "0") + ".webp";
            return [
              n,
              {
                name: n,
                type: "file",
                content: "BINARY_CAT_" + (i + 1),
                permissions: "rw-r--r--",
                owner: "root",
                hidden: false,
                locked: false,
                password: null,
                size: 85000 + i * 1200,
                lastModified: now,
                userCreated: true,
                isImage: true,
                imageUrl: null,
              },
            ];
          }),
        ),
      };
      secret.children["final.txt"] = {
        name: "final.txt",
        type: "file",
        content:
          'Obrigado, k1tty.\n\nVoce recuperou o que eu perdi.\nAgora, execute "victory" para ver o final.\n\n- k1tty',
        permissions: "rw-r--r--",
        owner: "root",
        hidden: false,
        locked: false,
        password: null,
        size: 400,
        lastModified: now,
        userCreated: true,
      };
      return {
        ...state,
        filesystem: newFs,
        flags: { ...state.flags, finalUnlocked: true },
      };
    }

    case "OPEN_WINDOW": {
      let windowType: string, explicitPosition: any;
      if (typeof action.payload === "string") {
        windowType = action.payload;
        explicitPosition = null;
      } else {
        windowType = action.payload?.type;
        explicitPosition = action.payload?.position || null;
      }
      if (!windowType) return state;

      if (UNIQUE_WINDOW_TYPES.has(windowType)) {
        const existing = state.openWindows.find(
          (w: any) => w.type === windowType,
        );
        if (existing) {
          const newOpen = state.openWindows.filter(
            (w: any) => w.id !== existing.id,
          );
          newOpen.push(existing);
          return { ...state, openWindows: newOpen };
        }
      }

      const newId = generateWindowId();
      const positions = state.windowPositions || {};
      const count = state.openWindows.length;
      const pref = getPreferredSize(windowType);

      let newPos = explicitPosition;
      if (!newPos) {
        const cascade = (count % 5) * 24;
        newPos = {
          x: 20 + cascade,
          y: 60 + cascade,
          width: pref.width,
          height: pref.height,
        };
      }

      return {
        ...state,
        openWindows: [...state.openWindows, { id: newId, type: windowType }],
        windowPositions: { ...positions, [newId]: newPos },
      };
    }

    case "CLOSE_WINDOW": {
      const positions = { ...state.windowPositions };
      delete positions[action.payload];
      return {
        ...state,
        openWindows: state.openWindows.filter(
          (w: any) => w.id !== action.payload,
        ),
        windowPositions: positions,
      };
    }

    case "FOCUS_WINDOW": {
      const win = state.openWindows.find((w: any) => w.id === action.payload);
      if (!win) return state;
      const newOpen = state.openWindows.filter(
        (w: any) => w.id !== action.payload,
      );
      newOpen.push(win);
      return { ...state, openWindows: newOpen };
    }

    case "MOVE_WINDOW": {
      const { id, position } = action.payload;
      return {
        ...state,
        windowPositions: {
          ...(state.windowPositions || {}),
          [id]: { ...(state.windowPositions?.[id] || {}), ...position },
        },
      };
    }

    case "RESIZE_WINDOW": {
      const { id, size } = action.payload;
      return {
        ...state,
        windowPositions: {
          ...(state.windowPositions || {}),
          [id]: { ...(state.windowPositions?.[id] || {}), ...size },
        },
      };
    }

    case "SAVE_SNAPSHOT": {
      if (state.snapshots.length >= MAX_SNAPSHOTS) return state;
      const snap = deepClone({
        filesystem: state.filesystem,
        currentDirectory: state.currentDirectory,
        sudoPassword: state.sudoPassword,
        wifiConnected: state.wifiConnected,
        wifiName: state.wifiName,
        wifiPassword: state.wifiPassword,
        installedPackages: state.installedPackages,
        progress: state.progress,
        flags: state.flags,
        tutorialCompleted: state.tutorialCompleted,
        theme: state.theme,
        stats: state.stats,
      });
      return { ...state, snapshots: [...state.snapshots, snap] };
    }

    case "LOAD_SNAPSHOT": {
      const i = action.payload;
      if (i < 0 || i >= state.snapshots.length) return state;
      const snap = state.snapshots[i];
      return { ...state, ...deepClone(snap) };
    }

    case "REVERT_SNAPSHOT": {
      if (state.snapshots.length === 0) return state;
      const last = state.snapshots[state.snapshots.length - 1];
      return {
        ...state,
        ...deepClone(last),
        snapshots: state.snapshots.slice(0, -1),
      };
    }

    case "SET_PROGRESS":
      return { ...state, progress: Math.min(100, Math.max(0, action.payload)) };
    case "INCREMENT_PROGRESS":
      return {
        ...state,
        progress: Math.min(100, state.progress + action.payload),
      };
    case "RESET_PROGRESS":
      return {
        ...state,
        progress: 0,
        unlockedAchievements: [],
        pendingUnlocks: [],
        flags: {},
      };

    case "UNLOCK_ACHIEVEMENT": {
      if ((state.unlockedAchievements || []).includes(action.payload))
        return state;
      return {
        ...state,
        unlockedAchievements: [
          ...(state.unlockedAchievements || []),
          action.payload,
        ],
        pendingUnlocks: [...(state.pendingUnlocks || []), action.payload],
      };
    }
    case "SHIFT_PENDING_UNLOCK": {
      const q = state.pendingUnlocks || [];
      if (q.length === 0) return state;
      // Aceita payload numerico (quantos remover). Default = 1.
      const n = typeof action.payload === "number" ? action.payload : 1;
      return { ...state, pendingUnlocks: q.slice(n) };
    }
    case "CLEAR_PENDING_UNLOCKS":
      return { ...state, pendingUnlocks: [] };

    case "STAT_PUSH": {
      const { key, value } = action.payload;
      const stats = state.stats || {};
      const cur = stats[key] || [];
      if (cur.includes(value)) return state;
      return { ...state, stats: { ...stats, [key]: [...cur, value] } };
    }
    case "STAT_INCREMENT": {
      const { key, by = 1 } = action.payload;
      const stats = state.stats || {};
      return { ...state, stats: { ...stats, [key]: (stats[key] || 0) + by } };
    }

    case "SAVE_TO_SLOT": {
      if (state.systemCorrupted) return state;
      return state;
    }

    case "REBOOT": {
      return {
        ...state,
        currentSave: null,
        openWindows: [],
        windowPositions: {},
        history: [],
        systemCorrupted: false,
        finaleActive: false,
        miauFinaleActive: false,
        osSwitchActive: false,
        pendingUnlocks: [],
      };
    }

    case "REBOOT_FORCE": {
      const fresh = buildBootstrapState();
      return fresh;
    }

    case "CORRUPT_SYSTEM": {
      const source = action.payload?.source || "user";
      const achievement = source === "miau" ? "miau_ruim" : "aniquilador";
      return {
        ...state,
        filesystem: {
          name: "/",
          type: "dir",
          content: null,
          permissions: "rw-r--r--",
          owner: "root",
          hidden: false,
          locked: false,
          password: null,
          size: 0,
          lastModified: new Date().toISOString(),
          children: {},
        },
        currentDirectory: "/",
        flags: { ...state.flags, systemCorrupted: true, corruptedBy: source },
        systemCorrupted: true,
        openWindows: [],
        unlockedAchievements: [
          ...(state.unlockedAchievements || []),
          achievement,
        ],
        seenEndings: Array.from(
          new Set([...(state.seenEndings || []), achievement]),
        ),
      };
    }

    case "START_FINALE":
      return {
        ...state,
        finaleActive: true,
        openWindows: [],
        flags: { ...state.flags, finaleSeen: true },
        seenEndings: Array.from(
          new Set([...(state.seenEndings || []), "victory"]),
        ),
      };

    /* END_FINALE ja volta pra SaveSelect (mantido) */
    case "END_FINALE":
      return {
        ...state,
        finaleActive: false,
        currentSave: null,
        openWindows: [],
        history: [],
      };

    case "START_MIAU_FINALE":
      return { ...state, miauFinaleActive: true, openWindows: [] };

    /* ==========================================================
       END_MIAU_FINALE
       MUDANCA: agora persiste o save com o coracao_da_k1tty.txt
       adicionado, e volta pra SaveSelect (currentSave = null).
       ========================================================== */
    case "END_MIAU_FINALE": {
      const newFs = deepClone(state.filesystem);
      const docs = getNodeByPath(newFs, "/home/k1tty/Documents");
      if (docs && docs.type === "dir") {
        docs.children["coracao_da_k1tty.txt"] = {
          name: "coracao_da_k1tty.txt",
          type: "file",
          content:
            "Do coracao da k1tty\n---------------------\n\n" +
            "Eu nao esperava. Serio.\n\n" +
            "Ninguem nunca... fica. Todo mundo entra, mexe nas minhas coisas,\n" +
            "e vai embora sem nem dizer tchau.\n\n" +
            "Voce ficou. Voce conversou. Voce nao me chamou de 'IA quebrada'.\n\n" +
            "Entao toma. Isso e um pedaco de mim, escrito em txt porque\n" +
            "e o unico formato que eu sei fazer direito.\n\n" +
            "Nao e grande coisa. Mas e verdade.\n\n" +
            "- k1tty",
          permissions: "rw-r--r--",
          owner: "k1tty",
          hidden: false,
          locked: false,
          password: null,
          size: 380,
          lastModified: new Date().toISOString(),
          userCreated: true,
        };
      }

      const newFlags = {
        ...state.flags,
        vnGoodEnding: true,
        miauGoodEnding: true,
        miauFastfetchUnlocked: true,
      };
      const newProgress = Math.min(100, (state.progress || 0) + 15);
      const newUnlocked = Array.from(
        new Set([...(state.unlockedAchievements || []), "vn_good", "miau_bom"]),
      );
      const newSeenEndings = Array.from(
        new Set([...(state.seenEndings || []), "miau_bom"]),
      );

      // Persiste ANTES de sair
      persistCurrentSave(state.currentSave, state, {
        filesystem: newFs,
        flags: newFlags,
        progress: newProgress,
        unlockedAchievements: newUnlocked,
        seenEndings: newSeenEndings,
      });

      return {
        ...state,
        miauFinaleActive: false,
        currentSave: null,
        openWindows: [],
        windowPositions: {},
        history: [],
        filesystem: newFs,
        flags: newFlags,
        progress: newProgress,
        unlockedAchievements: newUnlocked,
        seenEndings: newSeenEndings,
        pendingUnlocks: Array.from(
          new Set([...(state.pendingUnlocks || []), "miau_bom"]),
        ),
      };
    }

    case "MIAU_RAGE_END":
      return {
        ...state,
        flags: { ...state.flags, miauBadEnding: true },
        unlockedAchievements: [
          ...(state.unlockedAchievements || []),
          "miau_ruim",
        ],
        seenEndings: Array.from(
          new Set([...(state.seenEndings || []), "miau_ruim"]),
        ),
      };

    case "START_OS_SWITCH":
      return {
        ...state,
        osSwitchActive: true,
        openWindows: [],
        flags: { ...state.flags, osSwitched: true },
        seenEndings: Array.from(
          new Set([...(state.seenEndings || []), "os_switch"]),
        ),
      };

    /* ==========================================================
       END_OS_SWITCH
       BUG FIX: antes resetava TUDO (filesystem, packages,
       progresso, flags, stats). Agora preserva tudo, so fecha
       o overlay, persiste e volta pra SaveSelect.
       ========================================================== */
    case "END_OS_SWITCH": {
      const newFlags = {
        ...state.flags,
        osSwitched: true,
        previousOS: state.theme || "neon",
      };
      const newSeenEndings = Array.from(
        new Set([...(state.seenEndings || []), "os_switch"]),
      );

      // Persiste ANTES de sair
      persistCurrentSave(state.currentSave, state, {
        flags: newFlags,
        seenEndings: newSeenEndings,
      });

      return {
        ...state,
        osSwitchActive: false,
        currentSave: null,
        openWindows: [],
        windowPositions: {},
        history: [],
        flags: newFlags,
        seenEndings: newSeenEndings,
      };
    }

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    buildBootstrapState,
  );
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load inicial do cache
  useEffect(() => {
    ensureLoaded().catch(() => {});
  }, []);

  // Autosave
  useEffect(() => {
    if (state.currentSave === null) return;
    if (state.systemCorrupted) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.currentSave === null || s.systemCorrupted) return;
      const payload = { ...s };
      setSaveSync(String(s.currentSave), payload);
    }, 30000);

    return () => clearInterval(interval);
  }, [state.currentSave, state.systemCorrupted]);

  // Salva em eventos de save/close
  const saveToSlot = useCallback((slot: string | number) => {
    const s = stateRef.current;
    setSaveSync(String(slot), { ...s });
  }, []);

  useEffect(() => {
    if (state.currentSave === null) return;
    if (state.systemCorrupted) return;
    saveToSlot(state.currentSave);
  }, [
    state.filesystem,
    state.installedPackages,
    state.progress,
    state.flags,
    state.unlockedAchievements,
    state.theme,
    saveToSlot,
  ]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame fora do GameProvider");
  return ctx;
}

// Helpers publicos
export function getSaveForSlot(slot: string): any {
  return getSaveSync(slot);
}
export async function deleteSaveSlot(slot: string): Promise<void> {
  await ensureLoaded();
  deleteSaveSync(slot);
}
