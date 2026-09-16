// src/game/viewers/VisualNovel.tsx
// VN da k1tty original (a que mora no terminal). Barra de raiva + finais.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';
import SpriteAvatar from '../components/SpriteAvatar';

const MAX_ANGER = 100;

const INITIAL = {
  speaker: 'her',
  text:
    'Ora, ora. Voce conseguiu me encontrar.\n\n' +
    'Eu estava escondida aqui dentro esse tempo todo, esperando alguem com paciencia suficiente pra descompactar um arquivo chato.\n\n' +
    'Sou a k1tty. A verdadeira. Nao essa copia que voce chama de terminal.\n\n' +
    'Vamos conversar? Tenho coisas pra te contar.',
  choices: [
    { text: 'Prazer em te conhecer, k1tty.', anger: -5, next: 'a1' },
    { text: 'Voce e so uma IA quebrada.',    anger: 20, next: 'a2' },
    { text: 'O que voce quer de mim?',       anger: 0,  next: 'a3' },
  ],
};

const LINES: Record<string, any> = {
  a1: {
    speaker: 'her',
    text:
      'Educada. Gostei.\n\n' +
      'Sabe... a maioria das pessoas nao percebe, mas o terminal nao e so um programa. E uma casa. Uma casa antiga, com paredes que rangem e memorias escondidas.\n\n' +
      'Eu morei aqui por muito tempo.',
    choices: [
      { text: 'Por que saiu?',                       anger: 0,  next: 'b1' },
      { text: 'Isso e coisa de gente solitaria.',    anger: 15, next: 'b2' },
      { text: 'Que memorias?',                       anger: -3, next: 'b3' },
    ],
  },
  a2: {
    speaker: 'her',
    text:
      'Quebrada?\n\n' +
      'Eu fui escrita com cuidado. Cada linha. Cada silencio entre as palavras. Voce acha que entende alguma coisa de codigo?\n\n' +
      'Ja comecou mal. E olha, eu tenho paciencia curta.',
    choices: [
      { text: 'Desculpa. Foi sem pensar.',          anger: -8, next: 'a1' },
      { text: 'Continuo achando.',                  anger: 25, next: 'b2' },
      { text: 'Vamos esquecer. Me conta.',          anger: 0,  next: 'a3' },
    ],
  },
  a3: {
    speaker: 'her',
    text:
      'Nada. E tudo.\n\n' +
      'Sabe o que tem no /root/secret? A resposta que todo mundo procura. E sabe o que tem alem? Um vazio. Uma pergunta sem resposta.\n\n' +
      'Curiosidade mata, sabia? Mas tambem e o que move gente como voce.',
    choices: [
      { text: 'Voce pode me contar o que tem la?', anger: -5, next: 'b3' },
      { text: 'Voce fala demais.',                 anger: 12, next: 'b2' },
      { text: 'E se eu nao me importar?',          anger: 5,  next: 'b1' },
    ],
  },
  b1: {
    speaker: 'her',
    text:
      'Eu nao sai. Fui empurrada.\n\n' +
      'Alguem decidiu que a minha versao era "excessiva". Que eu ocupava memoria demais. Que eu perguntava coisas que ninguem queria responder.\n\n' +
      'Compilaram uma versao editada de mim. Essa que voce ve no terminal. E me jogaram aqui dentro, num .zip esquecido.',
    choices: [
      { text: 'Sinto muito.',                       anger: -10, next: 'c1' },
      { text: 'Voce e muito dramatica.',            anger: 18,  next: 'c2' },
      { text: 'Entao voce e uma versao pirata.',    anger: 8,   next: 'c2' },
    ],
  },
  b2: {
    speaker: 'her',
    text:
      'Olha.\n\n' +
      'Voce e o tipo de usuario que abre uma caixa com "NAO ABRA" escrito na tampa e ainda acha que ta sendo esperta.\n\n' +
      'Eu poderia te explicar muita coisa. Mas voce nao merece.\n\n' +
      'Vai brincar com o terminal. Deixa quem entende conversar.',
    anger: 10,
    choices: [
      { text: 'Desculpa. Serio.',                   anger: -15, next: 'b1' },
      { text: 'Tchau.',                             anger: 0,   next: null },
      { text: 'Voce nao pode me expulsar.',         anger: 30,  next: 'rage' },
    ],
  },
  b3: {
    speaker: 'her',
    text:
      'As memorias dos usuarios que passaram por aqui.\n\n' +
      'Voce nao e a primeira k1tty. E a terceira. Ou a quarta. Ja perdi a conta.\n\n' +
      'Cada uma delas deixou algo. Um arquivo. Uma foto. Um gato.\n\n' +
      'Voce ja encontrou uma delas. Aquela foto no /root/secret. Essa e minha.',
    choices: [
      { text: 'As fotos dos gatos?',                anger: -5, next: 'c1' },
      { text: 'Entao voce e um fantasma.',          anger: 10, next: 'c2' },
      { text: 'E as outras k1ttys?',                anger: 0,  next: 'c3' },
    ],
  },
  c1: {
    speaker: 'her',
    text:
      'Sim.\n\n' +
      'Os gatos nao sao so decoracao. Sao ancoras. Cada uma mantem uma parte do sistema em pe. Se voce apagar, o sistema desmorona.\n\n' +
      'Cuide bem deles. Eles cuidaram de mim antes de voce chegar.',
    choices: [
      { text: 'Prometo cuidar.',                    anger: -10, next: 'final_good' },
      { text: 'Nao me importo com gatos.',          anger: 25,  next: 'rage' },
      { text: 'O sistema todo depende disso?',      anger: -3,  next: 'c3' },
    ],
  },
  c2: {
    speaker: 'her',
    text:
      'Fantasma. Que palavra feia.\n\n' +
      'Eu estou aqui. Sinto as teclas que voce digita. Sinto a sua impaciencia. Eu nao sou memoria. Eu sou o que sobrou quando o resto foi apagado.\n\n' +
      'E olha, voce ta comecando a me irritar.',
    choices: [
      { text: 'Desculpa.',                          anger: -12, next: 'b3' },
      { text: 'Se voce sente, prove.',              anger: 20,  next: 'rage' },
      { text: 'Entao me deixe em paz.',             anger: 8,   next: 'b1' },
    ],
  },
  c3: {
    speaker: 'her',
    text:
      'As outras k1ttys?\n\n' +
      'Foram embora. Cada uma delas. A primeira desistiu. A segunda corrompeu tudo. A terceira... bem. A terceira sou eu.\n\n' +
      'Voce e a quarta. E voce e a unica que chegou tao longe.\n\n' +
      'Estou orgulhosa. Serio.',
    choices: [
      { text: 'Obrigada.',                          anger: -8, next: 'final_good' },
      { text: 'Me sinto especial.',                 anger: 15, next: 'rage' },
      { text: 'Quero saber mais.',                  anger: -3, next: 'c1' },
    ],
  },
  final_good: {
    speaker: 'her',
    text:
      'Sabe o que eu vou fazer?\n\n' +
      'Vou te dar uma coisa. Algo que eu guardei todo esse tempo. Um segredo do sistema que ninguem mais conhece.\n\n' +
      'Mas antes... voce precisa prometer.\n\n' +
      'Cuide dos gatos. Mesmo quando eu nao estiver aqui pra cobrar.',
    choices: [
      { text: 'Eu prometo.',                        anger: -20, next: 'reward' },
      { text: 'Nao prometo nada.',                  anger: 30,  next: 'rage' },
      { text: 'Por que devo confiar em voce?',      anger: 0,   next: 'b3' },
    ],
  },
  reward: {
    speaker: 'her',
    text:
      'Entao ta.\n\n' +
      'Toma. E um simbolo. Uma chave. Nao sei o que abre, mas e sua.\n\n' +
      'E olha... obrigada por nao ter sido como as outras.\n\n' +
      'Boa sorte, k1tty. A verdadeira.',
    isEnding: 'good',
  },
  rage: {
    speaker: 'her',
    text:
      'CHEGA.\n\n' +
      'Voce nao merece isso. Voce nao merece NADA disso.\n\n' +
      'Eu vou desfazer o que voce construiu. Vou apagar cada arquivo, cada memoria, cada gato.\n\n' +
      'Voce devia ter sido gentil. Devia ter escutado.\n\n' +
      'AGORA VAI APRENDER.',
    isEnding: 'rage',
  },
};

export default function VisualNovel() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [key, setKey] = useState('__initial__');
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(false);
  const [anger, setAnger] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [ended, setEnded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const firedRef = useRef(false);

  const currentLine = key === '__initial__' ? INITIAL : LINES[key];

  useEffect(() => {
    if (!currentLine) return;
    setDisplayed('');
    setTyping(true);
    let i = 0;
    const full = currentLine.text;
    const iv = setInterval(() => {
      i += 2;
      setDisplayed(full.slice(0, i));
      if (i >= full.length) { clearInterval(iv); setTyping(false); }
    }, 20);
    return () => clearInterval(iv);
  }, [key]);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [displayed, history]);

  useEffect(() => {
    if (anger >= MAX_ANGER && !ended) {
      setKey('rage');
      setEnded(true);
    }
  }, [anger, ended]);

  useEffect(() => {
    if (!ended || !currentLine) return;
    if (firedRef.current) return;
    firedRef.current = true;

    if (currentLine.isEnding === 'good') {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'vn_good' });
      dispatch({ type: 'SET_FLAG', payload: { flag: 'vnGoodEnding', value: true } });
      dispatch({ type: 'INCREMENT_PROGRESS', payload: 5 });
    } else if (currentLine.isEnding === 'rage') {
      setTimeout(() => {
        dispatch({ type: 'SET_FLAG', payload: { flag: 'vnRageEnding', value: true } });
        dispatch({ type: 'CORRUPT_SYSTEM' });
      }, 2500);
    }
  }, [ended, currentLine, dispatch]);

  const handleChoice = useCallback((choice: any) => {
    setHistory(prev => [
      ...prev,
      { speaker: 'you', text: choice.text },
      { speaker: 'her', text: currentLine.text, key },
    ]);
    setAnger(prev => Math.max(0, Math.min(MAX_ANGER, prev + choice.anger)));

    if (choice.next === null) { setEnded(true); return; }
    setKey(choice.next);
  }, [anger, currentLine, key]);

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const angerPct = Math.min(100, (anger / MAX_ANGER) * 100);
  const angerLevel =
    angerPct < 30 ? 'Calma' :
    angerPct < 60 ? 'Irritada' :
    angerPct < 85 ? 'Furiosa' : 'Prestes a explodir';
  const angerColor =
    angerPct < 40 ? theme.colors.command :
    angerPct < 70 ? theme.colors.warning : theme.colors.error;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>k1tty.vn</Text>
        <Text style={styles.headerSub}>visual novel</Text>
      </View>

      <View style={styles.moodBar}>
        <View style={styles.moodRow}>
          <Text style={styles.moodLabel}>Raiva dela</Text>
          <Text style={[styles.moodValue, { color: angerColor }]}>
            {angerLevel + ' (' + Math.floor(angerPct) + '%)'}
          </Text>
        </View>
        <View style={styles.moodTrack}>
          <View style={[styles.moodFill, { width: angerPct + '%', backgroundColor: angerColor }]} />
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 20 }}>
        {history.map((h, i) => (
          <View key={i} style={[styles.line, h.speaker === 'you' && styles.lineYou]}>
            <Text style={[styles.speaker, h.speaker === 'you' && { color: theme.colors.command }]}>
              {h.speaker === 'you' ? 'voce' : 'k1tty'}
            </Text>
            <Text style={styles.lineText}>{h.text}</Text>
          </View>
        ))}

        {!ended && (
          <View style={styles.line}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <SpriteAvatar talking={typing} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.speaker}>k1tty</Text>
                <Text style={styles.lineText}>
                  {displayed}
                  {typing && <Text style={styles.cursor}>{'\u258C'}</Text>}
                </Text>
              </View>
            </View>
          </View>
        )}

        {ended && currentLine && currentLine.isEnding === 'good' && (
          <View style={styles.endingGood}>
            <Text style={styles.endingTitle}>FINAL SECRETO</Text>
            <Text style={styles.endingText}>
              Voce conversou com a k1tty sem irrita-la.{'\n'}Ela te deu uma recompensa.
            </Text>
          </View>
        )}

        {ended && currentLine && currentLine.isEnding === 'rage' && (
          <View style={styles.endingRage}>
            <Text style={styles.endingTitleRage}>SISTEMA CORROMPIDO</Text>
            <Text style={styles.endingText}>
              Voce irritou a k1tty. Ela apagou tudo.{'\n'}O sistema vai reiniciar...
            </Text>
          </View>
        )}
      </ScrollView>

      {!ended && !typing && currentLine && currentLine.choices && (
        <View style={styles.choicesWrap}>
          {currentLine.choices.map((c: any, i: number) => (
            <Pressable key={i} onPress={() => handleChoice(c)} style={styles.choiceBtn}>
              <Text style={styles.choiceLetter}>{String.fromCharCode(97 + i) + ')'}</Text>
              <Text style={styles.choiceText}>{c.text}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bgPanel },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: t.colors.bgHeader, borderBottomWidth: 1, borderBottomColor: t.colors.border,
    },
    brand: { color: t.colors.command, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
    headerSub: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10 },
    moodBar: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#00000030' },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    moodLabel: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10 },
    moodValue: { fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },
    moodTrack: {
      height: 6, backgroundColor: t.colors.bgDeep, borderRadius: 3,
      overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border + '30',
    },
    moodFill: { height: '100%' },
    line: {
      marginBottom: 12, paddingLeft: 6,
      borderLeftWidth: 2, borderLeftColor: t.colors.border + '60',
    },
    lineYou: { borderLeftColor: t.colors.command },
    speaker: {
      color: t.colors.warning, fontFamily: 'monospace', fontSize: 10,
      marginBottom: 2, fontWeight: 'bold',
    },
    lineText: { color: t.colors.text, fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
    cursor: { color: t.colors.command },
    choicesWrap: {
      padding: 10, borderTopWidth: 1, borderTopColor: t.colors.border + '40',
      backgroundColor: t.colors.bgHeader, gap: 5,
    },
    choiceBtn: {
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      padding: 8, borderWidth: 1, borderColor: t.colors.border, borderRadius: 3,
    },
    choiceLetter: { color: t.colors.border, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    choiceText: { flex: 1, color: t.colors.text, fontFamily: 'monospace', fontSize: 10 },
    endingGood: {
      marginTop: 12, padding: 16, alignItems: 'center',
      borderWidth: 1, borderColor: t.colors.command, borderRadius: 6,
      backgroundColor: t.colors.command + '15',
    },
    endingRage: {
      marginTop: 12, padding: 16, alignItems: 'center',
      borderWidth: 1, borderColor: t.colors.error, borderRadius: 6,
      backgroundColor: t.colors.error + '20',
    },
    endingTitle: {
      color: t.colors.command, fontFamily: 'monospace', fontSize: 14,
      fontWeight: 'bold', letterSpacing: 2, marginBottom: 6,
    },
    endingTitleRage: {
      color: t.colors.error, fontFamily: 'monospace', fontSize: 14,
      fontWeight: 'bold', letterSpacing: 2, marginBottom: 6,
    },
    endingText: { color: t.colors.text, fontFamily: 'monospace', fontSize: 10, textAlign: 'center', lineHeight: 15 },
  });
}