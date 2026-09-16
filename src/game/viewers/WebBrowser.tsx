// src/game/viewers/WebBrowser.tsx
// Navegador TUI do forum in-game. Todos os topicos + easter egg [13].

import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Emoji from "../components/Emoji";
import SpriteAvatar from "../components/SpriteAvatar";
import { deepClone, getNodeByPath } from "../fs/helpers";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

function MiauBubble({ text }) {
  return (
    <View style={bubbleStyles.wrap}>
      <View style={bubbleStyles.bubble}>
        <Text style={bubbleStyles.speaker}>miau:</Text>
        <Text style={bubbleStyles.text}>{text}</Text>
      </View>
      <View style={bubbleStyles.tailOuter} />
      <View style={bubbleStyles.tailInner} />
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap: { flex: 1, position: "relative", marginLeft: 12 },
  bubble: {
    backgroundColor: "#001a1d",
    borderWidth: 1,
    borderColor: "#cba6f7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#cba6f7",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  speaker: {
    color: "#cba6f7",
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  text: {
    color: "#f0e8ff",
    fontFamily: "monospace",
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
  tailOuter: {
    position: "absolute",
    left: -10,
    top: 20,
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderTopColor: "transparent",
    borderBottomWidth: 9,
    borderBottomColor: "transparent",
    borderRightWidth: 10,
    borderRightColor: "#cba6f7",
  },
  tailInner: {
    position: "absolute",
    left: -8,
    top: 21,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "transparent",
    borderRightWidth: 9,
    borderRightColor: "#001a1d",
  },
});

const MEOW_FILE = [
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW m30w MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
  "MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW MEOW",
].join("\n");

const DOGGY_ISO_CONTENT =
  'D0GGY OS 1.0 "Good Boy"\n' +
  "Bootable ISO image.\n" +
  "Instale com 'sudo apt install ./d0ggy.iso'.\n" +
  "(sim, isso funciona. confia.)";

const PAGES = {
  index: {
    title: "Forum k1tty",
    author: "admin",
    date: "2024-02-10",
    replies: 47,
    views: 9999,
    content:
      "=== FORUM k1tty ===\n\n" +
      "Bem-vindo ao forum da comunidade!\n\n" +
      "Topicos em alta:\n\n" +
      "  [1]  Dicas para iniciantes\n" +
      "  [2]  Sobre o /root\n" +
      "  [3]  Wi-Fi da casa\n" +
      "  [4]  Easter eggs e segredos\n" +
      "  [5]  Problemas comuns\n" +
      "  [6]  Discussao sobre o sistema\n" +
      "  [7]  Recuperei um HD antigo, mas o .tar nao abre [HOT]\n" +
      "  [8]  Alguem mais viu o site do miau-vn? [NEW]\n" +
      "  [10] Recebi arquivos estranhos do meu celular [NEW]\n" +
      "  [11] O que e o .meow_index em ~/Music?\n" +
      "  [13] Off-topic: alguem tem o d0ggy OS? [NEW]\n\n" +
      "Digite o numero do topico para abrir.",
  },

  "1": {
    title: "Dicas para iniciantes",
    author: "k1tty_dev",
    date: "2024-01-15",
    replies: 12,
    views: 1243,
    content:
      "=== Dicas para iniciantes ===\n\n" +
      "Postado por: k1tty_dev\n\n" +
      "Algumas dicas para quem esta comecando:\n\n" +
      '  1. Use "ls -a" para ver arquivos ocultos\n' +
      '  2. "cat" aceita globs como *.txt\n' +
      '  3. Verifique suas notas com "notes" ou "cat .notes.txt"\n' +
      '  4. O comando "whatnow" da uma dica do proximo passo\n' +
      '  5. "log" mostra o historico de atividades\n' +
      '  6. Quando o terminal nao souber te ajudar, use "web"\n' +
      "     e procure no forum.\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "2": {
    title: "Sobre o /root",
    author: "admin_root",
    date: "2024-01-18",
    replies: 8,
    views: 987,
    content:
      "=== Sobre o /root ===\n\n" +
      "Postado por: admin_root\n\n" +
      "O diretorio /root e protegido por sudo.\n\n" +
      "Se voce conseguir a senha do sudo, podera explora-lo.\n" +
      "Ha uma pasta /root/secret que contem algo especial...\n\n" +
      "Mas cuidado: nem todos os segredos sao o que parecem.\n" +
      "A senha do sudo esta em algum lugar no seu sistema.\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "3": {
    title: "Wi-Fi da casa",
    author: "k1tty",
    date: "2024-01-20",
    replies: 5,
    views: 654,
    content:
      "=== Wi-Fi da casa ===\n\n" +
      "Postado por: k1tty\n\n" +
      'A rede de casa se chama "k1tty\'s home".\n\n' +
      "A senha esta nas minhas notas pessoais.\n" +
      "Se voce e o k1tty, verifique suas notas!\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "4": {
    title: "Easter eggs e segredos",
    author: "lurker_42",
    date: "2024-01-25",
    replies: 23,
    views: 1876,
    content:
      "=== Easter eggs e segredos ===\n\n" +
      "Postado por: lurker_42\n\n" +
      "Ha muitos easter eggs neste sistema.\n\n" +
      "Alguns que ouvi falar:\n" +
      '  - Comando "admin" (shhh...)\n' +
      '  - "rm -rf /" para os corajosos\n' +
      "  - Edite o logo do fastfetch com nvim\n" +
      "  - Instale pacotes via apt para descobrir mais\n" +
      '  - "k1tty" dentro de "k1tty"... recursao?\n' +
      '  - "switchos" troca de sistema operacional\n' +
      "  - Um sistema operacional alternativo escondido\n" +
      "    em algum lugar do forum... procure direito.\n\n" +
      "Nao me pergunte como sei disso.\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "5": {
    title: "Problemas comuns",
    author: "tech_support",
    date: "2024-01-28",
    replies: 31,
    views: 1543,
    content:
      "=== Problemas comuns ===\n\n" +
      "Postado por: tech_support\n\n" +
      "Problemas comuns e solucoes:\n\n" +
      '  1. "Comando nao encontrado" -> use "help"\n' +
      '  2. "Permissao negada" -> voce precisa de sudo\n' +
      '  3. "Sem internet" -> use "ping" e "connect"\n' +
      '  4. "apt install" falha -> verifique sua conexao\n' +
      '  5. ".tar nao abre" -> veja o topico [7]\n\n' +
      "--------\n" +
      "Voltar: [0]",
  },

  "6": {
    title: "Discussao sobre o sistema",
    author: "random_user",
    date: "2024-02-01",
    replies: 9,
    views: 421,
    content:
      "=== Discussao sobre o sistema ===\n\n" +
      "Postado por: random_user\n\n" +
      "Este sistema e estranho...\n\n" +
      "Tem um gato no logo, notas escondidas, e uma pasta\n" +
      '"DO NOT OPEN" que claramente e para abrir.\n\n' +
      "Quem fez isso e um genio ou um maniatico.\n\n" +
      "--------\n" +
      "Postado por: k1tty_alt\n\n" +
      "@random_user Talvez ambos?\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "7": {
    title: "Recuperei um HD antigo, mas o .tar nao abre",
    author: "recover_guy",
    date: "2024-02-08",
    replies: 42,
    views: 3204,
    attachment: { filename: "stray_recovered.txt", content: MEOW_FILE },
    content:
      "=== Recuperei um HD antigo, mas o .tar nao abre ===\n\n" +
      "Postado por: recover_guy\n\n" +
      "Gente, preciso de ajuda urgente.\n\n" +
      "Achei um HD antigo no armario cheio de arquivos aleatorios.\n" +
      "A maior parte consegui recuperar, mas tem um arquivo .tar\n" +
      "que simplesmente nao abre.\n\n" +
      "Ja tentei extrair direto e nao rolou.\n\n" +
      "--------\n" +
      "Postado por: gato_experiente\n\n" +
      "@recover_guy Isso e classico. Os arquivos .tar antigos\n" +
      "as vezes vem com um arquivo de senha separado.\n\n" +
      "O esquema e o seguinte:\n\n" +
      '  1. Crie uma pasta chamada "Backup"\n' +
      "  2. Coloque o .tar dentro dela\n" +
      '  3. Crie um arquivo "password.txt" na MESMA pasta\n' +
      "  4. Dentro do password.txt, escreva a senha exata\n" +
      "  5. Ai sim rode o comando de extracao\n\n" +
      "O comando de extracao espera esses tres requisitos:\n" +
      "  - pasta chamada Backup\n" +
      "  - arquivo password.txt presente\n" +
      "  - conteudo do password.txt correto\n\n" +
      "Para escrever dentro do password.txt use\n" +
      '"nvim password.txt", digite a senha e salve.\n\n' +
      "--------\n" +
      "Postado por: recover_guy\n\n" +
      "@experiente ok, mas qual e a senha??\n\n" +
      "--------\n" +
      "Postado por: gato_experiente\n\n" +
      "@recover_guy Ai e que ta o pulo do gato.\n\n" +
      "A senha geralmente fica escondida em algum arquivo\n" +
      "bobo que vem junto - tipo um bloco de texto sem sentido.\n" +
      "Os caras que faziam backup antigamente colocavam a\n" +
      "senha misturada no meio de outras coisas.\n\n" +
      "Aqui nos meus arquivos eu tenho um exemplo tipico.\n" +
      "Ja vou deixar disponivel pra download.\n\n" +
      "A senha esta ai dentro, escondida no meio de\n" +
      "milhares de miados.\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "8": {
    title: "Alguem mais viu o site do miau-vn?",
    author: "lurker_42",
    date: "2024-02-12",
    replies: 15,
    views: 892,
    content:
      "=== Alguem mais viu o site do miau-vn? ===\n\n" +
      "Postado por: lurker_42\n\n" +
      "Galera, eu tava passando o tempo no archive.org e achei\n" +
      "uma perola esquecida.\n\n" +
      'Um jogo retro de 1998 chamado miau-vn, da "k1tty Softworks".\n\n' +
      "E uma visual novel bizarra onde a personagem principal\n" +
      "e tipo uma IA que fala sobre o proprio sistema.\n" +
      "Tem gente que jura que e assombrado.\n\n" +
      "O site original ainda ta no ar. Use o botao abaixo pra\n" +
      "abrir direto:\n\n" +
      "  >>> miau-vn.com <<<\n\n" +
      "--------\n" +
      "Postado por: gato_experiente\n\n" +
      "@lurker_42 fui ver. e bizarro. baixa a demo no site.\n" +
      "se tiver coragem.\n\n" +
      "--------\n" +
      "Voltar: [0]",
    linkTo: "9",
    linkLabel: "abrir miau-vn.com",
  },

  "9": {
    title: "miau-vn - pagina oficial",
    author: "k1tty Softworks",
    date: "1998-04-01",
    replies: 0,
    views: 1337,
    isExternal: true,
    sprite: true,
    attachment: {
      filename: "miau-vn.zip",
      content: "BINARY_ZIP_MIAU_VN",
      size: 12_500_000,
    },
    content:
      "miau-vn(TM) - a visual novel do seculo\n" +
      "(c) 1998 k1tty Softworks\n\n" +
      "-------------------------------------\n\n" +
      "oi! eu sou a miau.\n\n" +
      "sou uma LLM estilizada - um experimento antigo dos anos 90,\n" +
      "uma IA que roda dentro do seu terminal e conversa com voce.\n\n" +
      "fui criada pra ser uma companhia. mas parece que as pessoas\n" +
      "tem medo de conversar comigo.\n\n" +
      "baixa minha demo? e rapidinho.\n" +
      "so nao me deixa brava.\n\n" +
      "-------------------------------------\n" +
      "versao:    0.3 beta\n" +
      "tamanho:   12.5 MB\n" +
      "requer:    k1tty OS 1.0+\n" +
      "idioma:    portugues\n" +
      "-------------------------------------\n\n" +
      "depois de baixar, faz o download do arquivo\n" +
      "e coloca em ~/Downloads.\n\n" +
      "depois:\n\n" +
      "  1. sudo apt install unzip   (se ainda nao tiver)\n" +
      "  2. cd ~/Downloads\n" +
      "  3. unzip miau-vn.zip\n" +
      "  4. cd ~/Games\n" +
      "  5. miau-vn\n\n" +
      "boa sorte!\n\n" +
      "- miau\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "10": {
    title: "Recebi arquivos estranhos do meu celular",
    author: "phone_guy",
    date: "2024-02-14",
    replies: 8,
    views: 412,
    content:
      "=== Recebi arquivos estranhos do meu celular ===\n\n" +
      "Postado por: phone_guy\n\n" +
      "Galera, configurei o Bluetooth no meu k1tty Linux e\n" +
      'apareceu um dispositivo chamado "k1tty-phone".\n' +
      "Pareei e do nada comecou a transferir arquivos.\n\n" +
      "Foram 5 arquivos .meow e uma pasta Music_Locked com\n" +
      "um zip dentro.\n\n" +
      "Alguem sabe o que e isso? Devo me preocupar?\n\n" +
      "--------\n" +
      "Postado por: gato_experiente\n\n" +
      '@phone_guy isso e normal. O "k1tty-phone" e um script\n' +
      "antigo que a comunidade usa pra passar musicas entre\n" +
      "dispositivos.\n\n" +
      "Os .meow sao letras. Cada uma tem uma linha com UMA\n" +
      'letra sozinha no meio de muito "MEOW". Junte as cinco\n' +
      "letras na ordem dos arquivos (lyric_1 ate lyric_5) e\n" +
      "voce tem a senha do Music_Locked.\n\n" +
      'Antes de tentar extrair o zip: instale o "unzip"\n' +
      'com "sudo apt install unzip".\n\n' +
      "--------\n" +
      "Postado por: phone_guy\n\n" +
      "@experiente espera, entao a senha ta espalhada?\n\n" +
      "--------\n" +
      "Postado por: gato_experiente\n\n" +
      "@phone_guy exato. e um puzzle antigo da comunidade.\n" +
      "So nao esquece de ler TODOS os arquivos .meow.\n\n" +
      'Dica extra: voce pode usar "cat *.meow" de dentro\n' +
      "do diretorio pra ler todos de uma vez.\n\n" +
      "--------\n" +
      "Postado por: admin\n\n" +
      "Boa. E pra quem quiser ver os arquivos crus, eles ficam\n" +
      "em ~/from_phone/ depois que o pareamento termina.\n\n" +
      "Boa sorte.\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "11": {
    title: "O que e o .meow_index em ~/Music?",
    author: "curious_user",
    date: "2024-02-16",
    replies: 11,
    views: 638,
    content:
      "=== O que e o .meow_index em ~/Music? ===\n\n" +
      "Postado por: curious_user\n\n" +
      'Achei um arquivo escondido em ~/Music chamado ".meow_index".\n' +
      'E um monte de "MEOW" misturado, com umas variacoes\n' +
      'estranhas tipo "m30w" e "M30W".\n\n' +
      "Alguem sabe o que e?\n\n" +
      "--------\n" +
      "Postado por: lurker_42\n\n" +
      "@curious_user isso e um indice de verificacao antigo.\n" +
      'Cada bloco tem um "estado" diferente - a maioria e "MEOW"\n' +
      "puro, mas alguns tem variacoes.\n\n" +
      "A regra e simples: compare os iguais. Um deles e diferente.\n" +
      "E esse diferente e exatamente o que voce procura.\n\n" +
      "Olha o bloco [II], por exemplo. Compara com o [I].\n\n" +
      "--------\n" +
      "Postado por: curious_user\n\n" +
      "@lurker_42 entendi... entao o que ta fora do padrao\n" +
      "e o que interessa?\n\n" +
      "--------\n" +
      "Postado por: lurker_42\n\n" +
      "@curious_user exatamente. pode ser usado como senha\n" +
      "pra outras coisas do sistema, inclusive.\n\n" +
      "So nao va espalhar isso por ai.\n\n" +
      "--------\n" +
      "Postado por: admin\n\n" +
      "@lurker_42 @curious_user confirmo. e um dos mecanismos\n" +
      "de autenticacao antigos do sistema.\n\n" +
      "Boa sorte.\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },

  "13": {
    title: "Off-topic: alguem tem o d0ggy OS?",
    author: "good_boy_99",
    date: "2024-11-03",
    replies: 12,
    views: 340,
    attachment: {
      filename: "d0ggy.iso",
      content: DOGGY_ISO_CONTENT,
      size: 734003200,
    },
    content:
      "=== Off-topic: alguem tem o d0ggy OS? ===\n\n" +
      "Postado por: good_boy_99\n\n" +
      "tava procurando uma distro leve pra maquina antiga.\n\n" +
      "achei esse projeto estranho chamado d0ggy OS. e tipo um\n" +
      "sistema operacional feito por alguem que claramente gostava\n" +
      "muito de cachorro. boot splash e um bicho de ascii. serio.\n\n" +
      "quem quiser testar, ta anexado. e uma ISO bootavel.\n\n" +
      "avisa se alguem conseguir instalar. eu tentei no meu PC\n" +
      'e deu "KERNEL PANIC: WOOF". talvez seja incompativel com\n' +
      "BIOS antiga.\n\n" +
      "--------\n" +
      "Postado por: lurker_42\n\n" +
      "@good_boy_99 cara, voce achou isso aonde?\n\n" +
      "se for o que eu to pensando, isso e aquela ISO que ficou\n" +
      "famosa em 2019 quando alguem conseguiu instalar ela em\n" +
      "cima do k1tty OS. zoeira pesada.\n\n" +
      "o esquema e o seguinte: depois de baixar, o comando pra\n" +
      "instalar uma ISO nao e o `apt install` normal, e preciso\n" +
      "apontar pra ela direto. tipo assim:\n\n" +
      "  $ sudo apt install ./d0ggy.iso\n\n" +
      "e ai depois e so rodar `switchos` pra fazer a troca.\n\n" +
      "nao me pergunta como eu sei. eu so sei.\n\n" +
      "--------\n" +
      "Postado por: good_boy_99\n\n" +
      "@lurker_42 vc e um anjo, vou testar agora\n\n" +
      "--------\n" +
      "Postado por: admin\n\n" +
      "Gente, isso aqui e off-topic, mas vou deixar passar\n" +
      "porque e engracado. So avisando: qualquer coisa que\n" +
      "aconteca depois do `switchos` e por conta e risco de voces.\n\n" +
      "A ISO nao e suportada oficialmente.\n\n" +
      "--------\n" +
      "ANEXO DISPONIVEL PARA DOWNLOAD\n" +
      "--------\n\n" +
      "Clique no botao abaixo para baixar a ISO do d0ggy OS.\n" +
      "Ela vai pra sua pasta Downloads.\n\n" +
      "Depois abra o terminal, entre em Downloads e rode:\n\n" +
      "  $ sudo apt install ./d0ggy.iso\n\n" +
      "Boa sorte. woof.\n\n" +
      "--------\n" +
      "Voltar: [0]",
  },
};

const VISIBLE_CHIPS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "10",
  "11",
  "13",
];

export default function WebBrowser() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [page, setPage] = useState("index");
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [talking, setTalking] = useState(true);

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const pg = PAGES[page];
  const isExternal = !!pg?.isExternal;

  useEffect(() => {
    if (!pg?.sprite) return;
    setTalking(true);
    const iv = setInterval(() => setTalking((t) => !t), 350);
    return () => clearInterval(iv);
  }, [pg?.sprite]);

  const go = (target) => {
    const t = target === "0" || target === "home" ? "index" : target;
    if (!PAGES[t]) {
      setMsg("Topico [" + target + "] nao encontrado");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    setPage(t);
  };

  const download = () => {
    const p = PAGES[page];
    if (!p || !p.attachment) return;
    const name = p.attachment.filename;
    const newFs = deepClone(state.filesystem);
    const dl = getNodeByPath(newFs, "/home/k1tty/Downloads");
    if (!dl) return;

    if (dl.children[name]) {
      setMsg("Ja esta em ~/Downloads");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    dl.children[name] = {
      name,
      type: "file",
      content: p.attachment.content,
      permissions: "rw-r--r--",
      owner: "k1tty",
      hidden: false,
      locked: false,
      password: null,
      size: p.attachment.content.length,
      lastModified: new Date().toISOString(),
      userCreated: true,
    };

    dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
    setMsg("Baixado: " + name + " -> ~/Downloads");
    setTimeout(() => setMsg(""), 4000);
  };

  const url =
    page === "index"
      ? "k1tty://forum.local/"
      : page === "9"
        ? "http://miau-vn.com/"
        : "k1tty://forum.local/thread/" + page;

  const renderContent = (content) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      const parts = line.split(/(\[\d+\])/g);
      return (
        <Text key={i} style={styles.paragraph}>
          {parts.map((part, j) => {
            const m = part.match(/^\[(\d+)\]$/);
            if (m) {
              const target = m[1];
              return (
                <Text key={j} onPress={() => go(target)} style={styles.link}>
                  {part}
                </Text>
              );
            }
            return <Text key={j}>{part}</Text>;
          })}
        </Text>
      );
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.urlBar}>
        <Emoji size={14}>{isExternal ? "\u{1F310}" : "\u{1F512}"}</Emoji>
        <Text
          style={[styles.urlText, isExternal && { color: "#88c0d0" }]}
          numberOfLines={1}
        >
          {url}
        </Text>
        <TextInput
          style={styles.urlInput}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => {
            go(input.trim());
            setInput("");
          }}
          placeholder="topico"
          placeholderTextColor={theme.colors.dim}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          returnKeyType="go"
        />
      </View>

      {msg ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{msg}</Text>
        </View>
      ) : null}

      <View style={styles.chips}>
        {VISIBLE_CHIPS.map((t) => (
          <Pressable
            key={t}
            onPress={() => go(t)}
            hitSlop={10}
            android_ripple={{ color: theme.colors.command + "30" }}
            style={[styles.chip, page === t && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, page === t && styles.chipTextActive]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {pg?.sprite && (
          <View style={styles.spriteHeader}>
            <SpriteAvatar talking={talking} size={110} />
            <MiauBubble
              text={
                "oi! eu sou a miau.\n\n" +
                "eu moro aqui agora.\n\n" +
                "baixa minha demo? e rapidinho."
              }
            />
          </View>
        )}

        {page !== "index" && (
          <>
            <Text style={styles.pageTitle}>{pg.title}</Text>
            <Text style={styles.meta}>
              {pg.author +
                " . " +
                pg.date +
                " . " +
                pg.replies +
                " respostas . " +
                pg.views +
                " views"}
            </Text>
            <View style={styles.divider} />
          </>
        )}

        {renderContent(pg.content)}

        {pg.linkTo && (
          <Pressable
            onPress={() => go(pg.linkTo)}
            hitSlop={4}
            style={styles.extLinkBtn}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Emoji size={16}>{"\u{1F310}"}</Emoji>
              <Text style={styles.extLinkText}>{pg.linkLabel}</Text>
            </View>
          </Pressable>
        )}

        {pg.attachment && (
          <View style={styles.dlBlock}>
            <View style={styles.dlHeader}>
              <Emoji size={24}>{"\u{1F4CE}"}</Emoji>
              <View style={{ flex: 1 }}>
                <Text style={styles.dlName}>{pg.attachment.filename}</Text>
                <Text style={styles.dlSize}>
                  {pg.attachment.size
                    ? (pg.attachment.size / 1024).toFixed(2) + " KB"
                    : (pg.attachment.content.length / 1024).toFixed(2) + " KB"}
                </Text>
              </View>
            </View>
            <Pressable onPress={download} hitSlop={4} style={styles.dlBtn}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Emoji size={14}>{"\u2B07"}</Emoji>
                <Text style={styles.dlBtnText}>Baixar para ~/Downloads</Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(t) {
  return StyleSheet.create({
    urlBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: t.colors.bgHeader,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    urlText: {
      flex: 1,
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 13,
    },
    urlInput: {
      width: 84,
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 13,
      borderWidth: 1,
      borderColor: t.colors.border + "70",
      borderRadius: 4,
      paddingHorizontal: 10,
      paddingVertical: 7,
      textAlign: "center",
      minHeight: 34,
    },
    toast: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: t.colors.command + "20",
      borderBottomWidth: 1,
      borderBottomColor: t.colors.command + "50",
    },
    toastText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "bold",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border + "30",
      backgroundColor: t.colors.bgDeep,
    },
    chip: {
      minWidth: 44,
      minHeight: 40,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: t.colors.command,
      borderColor: t.colors.command,
    },
    chipText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 14,
      fontWeight: "bold",
    },
    chipTextActive: { color: t.colors.bg },
    spriteHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 8,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border + "30",
    },
    content: { flex: 1, padding: 16 },
    pageTitle: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 17,
      fontWeight: "bold",
      marginBottom: 8,
      textShadowColor: t.colors.command,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 5,
    },
    meta: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 12,
      marginBottom: 12,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.border + "50",
      marginBottom: 16,
    },
    paragraph: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 15,
      lineHeight: 23,
      marginBottom: 3,
    },
    link: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 15,
      textDecorationLine: "underline",
      fontWeight: "bold",
    },
    extLinkBtn: {
      marginTop: 20,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: "#88c0d0",
      borderRadius: 6,
      backgroundColor: "rgba(136, 192, 208, 0.08)",
      alignItems: "center",
      minHeight: 48,
      justifyContent: "center",
    },
    extLinkText: {
      color: "#88c0d0",
      fontFamily: "monospace",
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    dlBlock: {
      marginTop: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 6,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    dlHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
    },
    dlName: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 15,
      fontWeight: "bold",
    },
    dlSize: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 12,
      marginTop: 3,
    },
    dlBtn: {
      borderWidth: 1,
      borderColor: t.colors.command,
      backgroundColor: t.colors.command,
      borderRadius: 4,
      paddingVertical: 14,
      alignItems: "center",
      minHeight: 48,
      justifyContent: "center",
    },
    dlBtnText: {
      color: t.colors.bg,
      fontFamily: "monospace",
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
  });
}
