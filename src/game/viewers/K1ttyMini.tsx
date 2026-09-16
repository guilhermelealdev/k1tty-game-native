// src/game/viewers/K1ttyMini.tsx
// Terminal recursivo minimo - k1tty dentro de k1tty.
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';

const FS: any = {
  name: '/', type: 'dir', children: {
    home: { type: 'dir', children: {
      mini: { type: 'dir', children: {
        'readme.txt': { type: 'file', content: 'Bem-vindo ao k1tty mini!\nDigite k1tty para ir mais fundo.' },
        'segredo.txt': { type: 'file', content: 'Este e um arquivo secreto do mini.' },
      }},
    }},
    etc: { type: 'dir', children: { 'logo.txt': { type: 'file', content: 'k1tty mini' } } },
    tmp: { type: 'dir', children: {} },
  },
};

function getNode(path: string) {
  const parts = path.split('/').filter(p => p);
  let cur = FS;
  for (const p of parts) {
    if (!cur.children || !cur.children[p]) return null;
    cur = cur.children[p];
  }
  return cur;
}

export default function K1ttyMini() {
  const { dispatch } = useGame();
  const { theme } = useTheme();
  const [cwd, setCwd] = useState('/home/mini');
  const [history, setHistory] = useState<any[]>([{ cmd: '', out: 'Bem-vindo ao k1tty mini!\nDigite help.' }]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const add = useCallback((cmd: string, out: string) => {
    setHistory(prev => [...prev, { cmd, out }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  const run = useCallback((line: string) => {
    const parts = line.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === 'help') add(line, 'ls, cd, cat, whoami, clear, k1tty');
    else if (cmd === 'ls') {
      const node = getNode(cwd);
      if (!node) { add(line, 'ls: diretorio invalido'); return; }
      add(line, Object.keys(node.children || {}).join('  ') || '(vazio)');
    }
    else if (cmd === 'cd') {
      const target = args[0] || '/home/mini';
      const next = target === '..' ? cwd.substring(0, cwd.lastIndexOf('/')) || '/' : (cwd === '/' ? '/' + target : cwd + '/' + target);
      const node = getNode(next);
      if (!node || node.type !== 'dir') { add(line, 'cd: diretorio invalido'); return; }
      setCwd(next);
      add(line, '');
    }
    else if (cmd === 'cat') {
      if (!args[0]) { add(line, 'uso: cat <arquivo>'); return; }
      const node = getNode(cwd + '/' + args[0]);
      if (!node || node.type !== 'file') { add(line, 'cat: arquivo inexistente'); return; }
      add(line, node.content);
    }
    else if (cmd === 'whoami') add(line, 'mini');
    else if (cmd === 'clear') setHistory([]);
    else if (cmd === 'k1tty') {
      add(line, 'Abrindo outro k1tty...');
      dispatch({ type: 'OPEN_WINDOW', payload: 'k1tty' });
    }
    else add(line, 'Comando nao encontrado: ' + cmd);
  }, [cwd, dispatch, add]);

  const submit = () => {
    if (!input.trim()) return;
    const l = input;
    setInput('');
    run(l);
  };

  const prompt = 'k1tty@mini:' + (cwd === '/home/mini' ? '~' : cwd) + '$';
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 8 }}>
        {history.map((h, i) => (
          <View key={i} style={{ marginBottom: 4 }}>
            {h.cmd ? (
              <Text style={styles.prompt}>{prompt + ' ' + h.cmd}</Text>
            ) : null}
            {h.out ? <Text style={styles.out}>{h.out}</Text> : null}
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputBar}>
        <Text style={styles.prompt}>{prompt}</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bgDeep },
    prompt: { color: t.colors.command, fontFamily: 'monospace', fontSize: 10 },
    out: { color: t.colors.text, fontFamily: 'monospace', fontSize: 10, lineHeight: 14 },
    inputBar: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderTopWidth: 1, borderTopColor: t.colors.border,
      paddingHorizontal: 8, paddingVertical: 6,
    },
    input: {
      flex: 1, color: t.colors.command, fontFamily: 'monospace', fontSize: 11,
    },
  });
}