// src/game/viewers/registry.ts

import AchievementsViewer from "./AchievementsViewer";
import AdminPanel from "./AdminPanel";
import AptCliViewer from "./AptCliViewer";
import AudioViewer from "./AudioViewer";
import BluetoothViewer from "./BluetoothViewer";
import BonsaiViewer from "./BonsaiViewer";
import BtopViewer from "./BtopViewer";
import CatRun from "./CatRun";
import CreditsViewer from "./CreditsViewer";
import K1ttyMini from "./K1ttyMini";
import K1ttyRecursive from "./K1ttyRecursive";
import KittensViewer from "./KittensViewer";
import KittyViewer from "./KittyViewer";
import LensViewer from "./LensViewer";
import MatrixViewer from "./MatrixViewer";
import MeowViewer from "./MeowViewer";
import MiauTerminal from "./MiauTerminal";
import MiauVN from "./MiauVN";
import MiauWarning from "./MiauWarning";
import MP3Player from "./MP3Player";
import NotesViewer from "./NotesViewer";
import NvimEditor from "./NvimEditor";
import OpsecViewer from "./OpsecViewer";
import RamViewer from "./RamViewer";
import TutorialWindow from "./TutorialWindow";
import WebBrowser from "./WebBrowser";
import WhoIsThisViewer from "./WhoIsThisViewer";

export const VIEWER_REGISTRY: Record<string, any> = {
  notes: NotesViewer,
  nvim: NvimEditor,
  achievements: AchievementsViewer,
  matrix: MatrixViewer,
  btop: BtopViewer,
  credits: CreditsViewer,
  kittens: KittensViewer,
  "apt-cli": AptCliViewer,
  admin: AdminPanel,
  web: WebBrowser,
  "miau-vn": MiauVN,
  meow: MeowViewer,
  catrun: CatRun,
  lens: LensViewer,
  kitty: KittyViewer,
  bonsai: BonsaiViewer,
  ram: RamViewer,
  bluetooth: BluetoothViewer,
  whoisthis: WhoIsThisViewer,
  k1tty: K1ttyMini,
  opsec: OpsecViewer,
  mp3player: MP3Player,
  audioview: AudioViewer,
  "miau-warning": MiauWarning,
  "miau-terminal": MiauTerminal,
  "k1tty-recursive": K1ttyRecursive,
  tutorial: TutorialWindow,
};

export const VIEWER_TITLES: Record<string, string> = {
  notes: "Notas",
  nvim: "nvim",
  achievements: "Conquistas",
  matrix: "Matrix",
  btop: "Monitor",
  credits: "Creditos",
  kittens: "kittens",
  "apt-cli": "apt-cli",
  admin: "admin",
  web: "Navegador TUI",
  "miau-vn": "miau-vn",
  meow: "k1tty Clicker",
  catrun: "Cat Run",
  lens: "Imagens",
  kitty: "Gato aleatorio",
  bonsai: "Bonsai",
  ram: "RAM",
  bluetooth: "Bluetooth",
  whoisthis: "Detalhes",
  k1tty: "k1tty mini",
  opsec: "OP SEC",
  mp3player: "MP3 Player",
  audioview: "Audio",
  "miau-warning": "AVISO",
  "miau-terminal": "k1tty",
  "k1tty-recursive": "k1tty recursivo",
  tutorial: "miau - tutorial",
};
