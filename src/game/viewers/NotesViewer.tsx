// src/game/viewers/NotesViewer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useGame } from '../state/GameContext';
import { useTheme } from '../theme/ThemeContext';
import { getNodeByPath, deepClone } from '../fs/helpers';

const PATH = '/home/k1tty/.notes.txt';

export default function NotesViewer() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const node = getNodeByPath(state.filesystem, PATH);
    setContent(node ? node.content || '' : '');
  }, [state.filesystem]);

  const handleSave = () => {
    const newFs = deepClone(state.filesystem);
    const node = getNodeByPath(newFs, PATH);
    if (node) {
      node.content = content;
      node.size = content.length;
      node.lastModified = new Date().toISOString();
    }
    dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFs });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 2 });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.editorWrap}>
        <TextInput
          style={styles.editor}
          value={content}
          onChangeText={setContent}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholderTextColor={theme.colors.dim}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Pressable onPress={handleSave} style={styles.btn}>
          <Text style={styles.btnText}>salvar</Text>
        </Pressable>
        <Text style={styles.info}>
          {saved ? '\u2713 salvo' : '~/.notes.txt'}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    editorWrap: { flex: 1, backgroundColor: t.colors.bgDeep, borderRadius: 3 },
    editor: {
      color: t.colors.text, fontFamily: 'monospace', fontSize: 12,
      padding: 10, minHeight: 180, textAlignVertical: 'top',
    },
    footer: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 8,
    },
    btn: {
      borderWidth: 1, borderColor: t.colors.border, borderRadius: 3,
      paddingHorizontal: 14, paddingVertical: 5,
    },
    btnText: { color: t.colors.command, fontFamily: 'monospace', fontSize: 11 },
    info: { color: t.colors.dim, fontFamily: 'monospace', fontSize: 10 },
  });
}