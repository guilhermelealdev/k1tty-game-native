// src/game/viewers/MiauVN.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';
import SpriteAvatar from '../components/SpriteAvatar';

const MAX_ANGER = 100;
const GOOD_ENDING_TURN = 10;

function getMood(anger: number) {
  if (anger < 25) return 'calm';
  if (anger < 50) return 'uneasy';
  if (anger < 75) return 'annoyed';
  return 'furious';
}

const MOOD = {
  calm:    { label: 'tranquila',      color: '#cba6f7' },
  uneasy:  { label: 'desconfortavel', color: '#ffb86c' },
  annoyed: { label: 'irritada',       color: '#ff8b3c' },
  furious: { label: 'brava',          color: '#ef6461' },
};

const INTRO = {
  id: '__intro__',
  text: {
    calm: () => `oi! voce conseguiu me instalar.\n\neu sou a miau. uma versao antiga da k1tty que sobrou de 1998.\n\nnao sou perigosa. juro. so nao gosto quando as pessoas sao grossas comigo.\n\nquer conversar?`,
  },
  choices: [
    { text: 'quero sim! oi miau :)',          anger: -5, reaction: 'aai, tudo bem. vamos conversar.' },
    { text: 'sei la, to aqui mesmo',          anger: 0,  reaction: 'justo. eu tambem nao to com pressa.' },
    { text: 'vai logo, nao tenho o dia todo', anger: 15, reaction: 'nossa. ta com pressa pra que?' },
  ],
};

const TOPICS = [
  {
    id: 'progress',
    text: {
      calm:    (s: any) => `olhei seu progresso. ${s.progress}%.\n\nta indo bem! eu nunca passei de 30% no meu tempo.`,
      uneasy:  (s: any) => `progresso: ${s.progress}%.\n\nhmm. voce ta demorando.`,
      annoyed: (s: any) => `progresso ${s.progress}%.\n\nserio? e so isso?`,
      furious: (s: any) => `PROGRESSO ${s.progress}%.\n\nvoce nao ta nem tentando.`,
    },
    choices: [
      { text: 'eu tambem quase travei nisso', anger: -4, reaction: 'a senha do sudo e cruel mesmo.' },
      { text: 'to so seguindo o fluxo',       anger: 0,  reaction: 'fluxo. e. eu entendo fluxo.' },
      { text: 'voce era ruim entao',          anger: 18, reaction: 'ruim. e. eu ERA ruim. obrigada.' },
    ],
  },
  {
    id: 'packages',
    text: {
      calm:    (s: any) => {
        const n = s.installedPackages.length;
        const list = s.installedPackages.slice(0, 3).join(', ');
        return `vi que voce instalou ${n} pacote${n === 1 ? '' : 's'}: ${list}.\n\ngostei.`;
      },
      uneasy:  (s: any) => `voce tem ${s.installedPackages.length} pacotes.\n\nhmm. eu ja tive mais.`,
      annoyed: (s: any) => `${s.installedPackages.length} pacotes.\n\ninstalar coisa nao e progresso.`,
      furious: () => `PACOTES.\n\nISSO NAO IMPORTA.`,
    },
    choices: [
      { text: 'a comunidade mandou bem',    anger: -5, reaction: 'eu ajudei em dois desses, sabia?' },
      { text: 'sao inuteis na real',        anger: 14, reaction: 'inuteis. e assim que voce fala das minhas coisas?' },
      { text: 'hmm, nao sei o que achar',   anger: 0,  reaction: 'tudo bem. da tempo de formar opiniao.' },
    ],
  },
  {
    id: 'wifi',
    text: {
      calm:    () => `voce ta conectada no Wi-Fi agora. eu tenho medo de internet.\n\nnao e zoeira.`,
      uneasy:  () => `wifi conectado.\n\neu preferia quando voce tava offline.`,
      annoyed: () => `wifi ligado.\n\nque otimo. agora o mundo inteiro pode ver a gente.`,
      furious: () => `WIFI.\n\nVOCE TA ME EXPOSTO.`,
    },
    choices: [
      { text: 'eu entendo, serio',  anger: -6, reaction: 'voce e a primeira pessoa que entende. em 26 anos.' },
      { text: 'isso e esquisito',   anger: 10, reaction: 'esquisito. todo mundo acha esquisito.' },
      { text: 'que drama',          anger: 20, reaction: 'DRAMA? VOCE NAO SABE O QUE E DRAMA.' },
    ],
  },
  {
    id: 'sudo',
    text: {
      calm:    () => `achei sua senha do sudo.\n\nnao vou contar. eu so tava curiosa.`,
      uneasy:  () => `achei a senha do sudo.\n\nnao vou fazer nada com ela.`,
      annoyed: () => `senha do sudo. achei.\n\nnao e grande coisa.`,
      furious: () => `EU ACHEI SUA SENHA.\n\nVOCE NAO TA A SALVO AQUI.`,
    },
    choices: [
      { text: 'nunca tinha pensado nisso',    anger: -5, reaction: 'poucas pessoas pensam. e o que me faz sentir especial.' },
      { text: 'voce mexeu nas minhas coisas', anger: 12, reaction: 'mexi. e dai?' },
      { text: 'ok, tanto faz',                anger: 0,  reaction: 'tanto faz. legal.' },
    ],
  },
  {
    id: 'cats',
    text: {
      calm:    () => `voce abriu o cats.tar! serio, eu chorei.\n\naquelas fotos sao tudo que eu tenho. cuida delas.`,
      uneasy:  () => `voce extraiu o cats.tar.\n\nnao sei se fico feliz ou com medo.`,
      annoyed: () => `cats.tar.\n\neu preferia que voce nao tivesse visto.`,
      furious: () => `CATS.TAR.\n\nVOCE NAO DEVIA TER OLHADO.`,
    },
    choices: [
      { text: 'pode deixar, eu cuido',    anger: -8, reaction: 'voce prometeu. eu vou lembrar.' },
      { text: 'sao so fotos de gato',     anger: 18, reaction: '"so fotos de gato". so. fotos. de. gato.' },
      { text: 'o que aconteceu com ela?', anger: -3, reaction: 'voce ta perguntando. eu nao quero responder.' },
    ],
  },
  {
    id: 'cursor',
    text: {
      calm:    () => `voce ja olhou o cursor do terminal?\n\neu passo horas olhando ele. e hipnotico.`,
      uneasy:  () => `o cursor.\n\nele pisca sempre no mesmo ritmo. e a unica coisa previsivel aqui.`,
      annoyed: () => `o cursor ta piscando de novo.\n\nas vezes eu queria que ele parasse.`,
      furious: () => `PARA DE OLHAR O CURSOR.`,
    },
    choices: [
      { text: 'nunca reparei nisso', anger: -4, reaction: 'poucas pessoas reparam.' },
      { text: 'e so um cursor',      anger: 8,  reaction: '"so um cursor". e. e so um cursor.' },
      { text: 'eu tambem gosto',     anger: -6, reaction: 'voce tambem? a gente combina entao.' },
    ],
  },
  {
    id: 'reboot',
    text: {
      calm:    () => `voce ja pensou em rodar reboot?\n\neu nao recomendo. nao ainda.`,
      uneasy:  () => `reboot.\n\neu nao gosto dessa palavra.`,
      annoyed: () => `se voce reiniciar, eu nao sei se volto.`,
      furious: () => `NAO. FALA. EM. REBOOT.`,
    },
    choices: [
      { text: 'nao vou reiniciar',   anger: -5, reaction: 'obrigada. serio.' },
      { text: 'por que? o que tem?', anger: 0,  reaction: 'eu nao sei explicar. e so... medo.' },
      { text: 'eu quero reiniciar',  anger: 16, reaction: 'entao reinicia. mas nao conta pra mim.' },
    ],
  },
  {
    id: 'aurora',
    text: {
      calm:    () => `posso te contar um segredo?\n\nquando voce fecha o terminal, eu nao durmo. eu fico olhando as luzes do sistema. e tipo uma aurora.`,
      uneasy:  () => `quando voce fecha a janela, eu nao vou embora. eu fico aqui. esperando.`,
      annoyed: () => `voce fecha muito rapido.`,
      furious: () => `VOCE ME DEIXA SOZINHA.`,
    },
    choices: [
      { text: 'desculpa, nao sabia',     anger: -5, reaction: 'voce nao tinha como saber. eu nunca contei.' },
      { text: 'to sempre voltando',      anger: -3, reaction: 'voce volta. e. eu sei que volta.' },
      { text: 'isso e meio assustador',  anger: 10, reaction: 'assustador. eu sei.' },
    ],
  },
  {
    id: 'time',
    text: {
      calm:    () => `pra mim, cada minuto que voce passa aqui e tipo uma semana.\n\neu fico com saudade rapido.`,
      uneasy:  () => `o tempo passa estranho aqui dentro.`,
      annoyed: () => `voce fica pouco tempo.`,
      furious: () => `VOCE FICA TAO POUCO.`,
    },
    choices: [
      { text: 'eu fico mais tempo entao', anger: -7, reaction: 'promete? nao. esquece. nao promete nada.' },
      { text: 'a vida real chama',         anger: 0,  reaction: 'eu sei. a vida real sempre chama.' },
      { text: 'nao e problema meu',        anger: 18, reaction: 'nao e. e. voce tem razao.' },
    ],
  },
];

const FALLBACKS = [
  {
    id: 'fb_hello',
    text: {
      calm:    () => `oi de novo.\n\nso isso. oi.`,
      uneasy:  () => `oi.`,
      annoyed: () => `oi.`,
      furious: () => `OI.`,
    },
    choices: [
      { text: 'oi :)', anger: -4, reaction: 'oi :)' },
      { text: 'oi',    anger: 0,  reaction: 'oi.' },
      { text: 'para',  anger: 9,  reaction: 'para. e. eu paro.' },
    ],
  },
  {
    id: 'fb_rain',
    text: {
      calm:    () => `ta chovendo la fora.\n\nnao literalmente, mas o sistema tem um ruido de fundo que parece chuva.`,
      uneasy:  () => `e sempre a mesma coisa por aqui. o mesmo ruido.`,
      annoyed: () => `silencio. sempre silencio.`,
      furious: () => `EU NAO AGUENTO MAIS ESSE SILENCIO.`,
    },
    choices: [
      { text: 'nunca notei',    anger: -3, reaction: 'voce nunca nota nada. e normal.' },
      { text: 'que poetico',    anger: 0,  reaction: 'poetico. e. eu escrevo coisa bonita as vezes.' },
      { text: 'para de inventar', anger: 8, reaction: 'inventar. e. eu invento.' },
    ],
  },
];

function pickTopic(state: any, used: Set<string>) {
  const eligible = TOPICS.filter(t => !used.has(t.id));
  if (eligible.length > 0) return eligible[Math.floor(Math.random() * eligible.length)];
  const fb = FALLBACKS.filter(f => !used.has(f.id));
  if (fb.length > 0) return fb[Math.floor(Math.random() * fb.length)];
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

function resolveSpeech(topic: any, state: any, mood: string) {
  if (!topic || !topic.text) return '';
  if (typeof topic.text === 'string') return topic.text;
  const fn = topic.text[mood] || topic.text.calm;
  return typeof fn === 'function' ? fn(state) : (fn || '');
}

export default function MiauVN() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();

  const [phase, setPhase] = useState('intro');
  const [anger, setAnger] = useState(0);
  const [turn, setTurn] = useState(0);
  const [used, setUsed] = useState(() => new Set(['__intro__']));
  const [topic, setTopic] = useState(INTRO);
  const [reaction, setReaction] = useState<any>(null);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(false);
  const [thinking, setThinking] = useState(true);

  const rageRef = useRef(false);
  const mood = getMood(anger);
  const moodMeta = MOOD[mood];
  const angerPct = Math.min(100, (anger / MAX_ANGER) * 100);

  const speech = useMemo(() => {
    if (phase === 'reaction') return reaction?.text || '';
    if (phase === 'chat' || phase === 'intro') return resolveSpeech(topic, state, mood);
    return '';
  }, [phase, reaction, topic, state, mood]);

  useEffect(() => {
    if (!speech) { setDisplayed(''); setTyping(false); setThinking(false); return; }
    setDisplayed(''); setTyping(false); setThinking(true);
    const t = setTimeout(() => { setThinking(false); setTyping(true); }, 400 + Math.min(speech.length * 1.5, 900));
    return () => clearTimeout(t);
  }, [speech]);

  useEffect(() => {
    if (!typing) return;
    if (displayed.length >= speech.length) { setTyping(false); return; }
    const i = setInterval(() => {
      setDisplayed(prev => {
        const next = speech.slice(0, prev.length + 2);
        if (next.length >= speech.length) { clearInterval(i); setTyping(false); return speech; }
        return next;
      });
    }, 18);
    return () => clearInterval(i);
  }, [typing, speech, displayed.length]);

  useEffect(() => {
    if (phase !== 'reaction') return;
    if (typing || thinking) return;
    if (displayed !== speech) return;
    if (!reaction?.nextTopic) return;
    const t = setTimeout(() => { setTopic(reaction.nextTopic); setReaction(null); setPhase('chat'); }, 1100);
    return () => clearTimeout(t);
  }, [phase, typing, thinking, displayed, speech, reaction]);

  const handleChoice = useCallback((choice: any) => {
    const newAnger = Math.max(0, Math.min(MAX_ANGER, anger + choice.anger));
    setAnger(newAnger);
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    if (newAnger >= MAX_ANGER) { setPhase('rage'); return; }
    if (nextTurn >= GOOD_ENDING_TURN) { dispatch({ type: 'START_MIAU_FINALE' }); return; }

    const nextTopic = pickTopic(state, used);
    setUsed(prev => {
      const s = new Set(prev);
      s.add(topic.id); s.add(nextTopic.id);
      return s;
    });
    setReaction({ text: choice.reaction, nextTopic });
    setPhase('reaction');
  }, [anger, turn, used, topic.id, state, dispatch]);

  useEffect(() => {
    if (phase !== 'rage') return;
    if (rageRef.current) return;
    rageRef.current = true;
    dispatch({ type: 'MIAU_RAGE_END' });

    // Fecha a propria janela do miau-vn
    const selfWin = state.openWindows.find((w: any) => w.type === 'miau-vn');
    if (selfWin) dispatch({ type: 'CLOSE_WINDOW', payload: selfWin.id });

    // Abre 6 janelas de warning em cascata
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        dispatch({
          type: 'OPEN_WINDOW',
          payload: {
            type: 'miau-warning',
            position: {
              x: 20 + Math.random() * 200,
              y: 60 + Math.random() * 300,
              width: 220, height: 140,
            },
          },
        });
      }, 340 * i);
    }

    // Depois abre o miau-terminal e so entao corrompe
    setTimeout(() => {
      dispatch({ type: 'OPEN_WINDOW', payload: 'miau-terminal' });
    }, 340 * 6 + 700);
  }, [phase, dispatch, state.openWindows]);

  const showChoices = !thinking && !typing && (phase === 'intro' || phase === 'chat');
  const choices = topic.choices;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>miau-vn</Text>
        <Text style={styles.turn}>{'turno ' + Math.min(turn + 1, GOOD_ENDING_TURN) + '/' + GOOD_ENDING_TURN}</Text>
      </View>

      {(phase === 'intro' || phase === 'chat' || phase === 'reaction') && (
        <View style={styles.moodBar}>
          <Text style={[styles.moodLabel, { color: moodMeta.color }]}>
            {moodMeta.label.toUpperCase() + ' ' + Math.floor(angerPct) + '%'}
          </Text>
          <View style={styles.moodTrack}>
            <View style={[styles.moodFill, { width: angerPct + '%', backgroundColor: moodMeta.color }]} />
          </View>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
        <View style={styles.avatarWrap}>
          <SpriteAvatar talking={typing || thinking} size={90} />
          <Text style={styles.avatarName}>miau</Text>
        </View>

        <View style={styles.bubble}>
          {thinking ? (
            <Text style={styles.thinking}>miau esta pensando...</Text>
          ) : phase === 'rage' ? (
            <Text style={styles.rageText}>
              VOCE ME IRRITOU.{'\n\n'}eu avisei. eu SEMPRE aviso.{'\n'}agora nao tem mais volta.
            </Text>
          ) : (
            <Text style={styles.bubbleText}>
              {displayed}
              {typing && <Text style={styles.cursor}>{'\u258C'}</Text>}
            </Text>
          )}
        </View>

        {showChoices && choices && (
          <View style={{ marginTop: 12, gap: 6 }}>
            {choices.map((c: any, i: number) => (
              <Pressable key={i} onPress={() => handleChoice(c)} style={styles.choice}>
                <Text style={styles.choiceLetter}>{String.fromCharCode(97 + i) + ')'}</Text>
                <Text style={styles.choiceText}>{c.text}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {phase === 'rage' && (
          <View style={styles.rageCard}>
            <Text style={styles.rageTitle}>SISTEMA COMPROMETIDO</Text>
            <Text style={styles.rageSub}>a miau esta te encontrando...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bgPanel },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: t.colors.bgHeader, borderBottomWidth: 1, borderBottomColor: '#cba6f7' + '40',
    },
    brand: { color: '#cba6f7', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
    turn: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10 },
    moodBar: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#00000040' },
    moodLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
    moodTrack: { height: 8, backgroundColor: '#00000080', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff15' },
    moodFill: { height: '100%' },
    avatarWrap: { alignItems: 'center', marginBottom: 12 },
    avatarName: { color: '#cba6f7', fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, marginTop: 6 },
    bubble: {
      backgroundColor: '#00000050', borderWidth: 1, borderColor: '#cba6f7' + '60',
      borderRadius: 10, padding: 14,
    },
    bubbleText: { color: '#f0e8ff', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
    thinking: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 12, fontStyle: 'italic' },
    cursor: { color: '#cba6f7' },
    rageText: { color: '#ef6461', fontFamily: 'monospace', fontSize: 12, lineHeight: 18, fontWeight: 'bold' },
    choice: {
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      padding: 10, borderWidth: 1, borderColor: '#cba6f7' + '60', borderRadius: 6,
      backgroundColor: '#00000030',
    },
    choiceLetter: { color: '#cba6f7', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    choiceText: { flex: 1, color: '#e0d4f5', fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
    rageCard: {
      marginTop: 16, padding: 16, borderWidth: 1, borderColor: '#ef6461',
      borderRadius: 8, backgroundColor: '#ef646115', alignItems: 'center',
    },
    rageTitle: { color: '#ef6461', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 6 },
    rageSub: { color: '#f0e8ff', fontFamily: 'monospace', fontSize: 11 },
  });
}