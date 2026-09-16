// src/game/viewers/NvimEditor.tsx
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
import {
  deepClone,
  getFileName,
  getNodeByPath,
  getParentPath,
} from "../fs/helpers";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

export default function NvimEditor() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState(null);
  const [msg, setMsg] = useState("INSERT");

  useEffect(() => {
    const target =
      (state.flags && state.flags.nvimFile) || "/home/k1tty/novo_arquivo.txt";
    setFilePath(target);
    const node = getNodeByPath(state.filesystem, target);
    setContent(node ? node.content || "" : "");
  }, [state.flags && state.flags.nvimFile, state.filesystem]);

  const handleSave = () => {
    if (!filePath) return;
    const newFs = deepClone(state.filesystem);
    const node = getNodeByPath(newFs, filePath);

    if (node) {
      node.content = content;
      node.size = content.length;
      node.lastModified = new Date().toISOString();
    } else {
      const parentPath = getParentPath(filePath);
      const name = getFileName(filePath);
      const parent = getNodeByPath(newFs, parentPath);
      if (parent && parent.type === "dir") {
        parent.children[name] = {
          name,
          type: "file",
          content,
          permissions: "rw-r--r--",
          owner: "k1tty",
          hidden: false,
          locked: false,
          password: null,
          size: content.length,
          lastModified: new Date().toISOString(),
          userCreated: true,
        };
      }
    }

    dispatch({ type: "UPDATE_FILESYSTEM", payload: newFs });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 1 });
    dispatch({
      type: "SET_FLAG",
      payload: { flag: "wroteFile", value: true },
    });

    if (filePath === "/etc/logo.txt") {
      dispatch({
        type: "SET_FLAG",
        payload: { flag: "changedLogo", value: true },
      });
    }

    setMsg("SAVED");
    setTimeout(() => setMsg("INSERT"), 1000);
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.statusBar}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            flex: 1,
          }}
        >
          <Emoji size={11}>{"\u{1F4C4}"}</Emoji>
          <Text style={styles.statusText} numberOfLines={1}>
            {filePath || "novo"}
          </Text>
        </View>
        <Text style={styles.statusText}>{msg}</Text>
      </View>
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
      <View style={styles.statusBar}>
        <Text style={styles.hintText}>
          {"toque em salvar  .  Ctrl+S no web"}
        </Text>
        <Text style={styles.hintText}>{content.length + "B"}</Text>
      </View>
      <View style={{ padding: 6 }}>
        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    statusBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: t.colors.bgHeader,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      gap: 8,
    },
    statusText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 10,
    },
    hintText: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
    },
    editorWrap: { flex: 1, backgroundColor: t.colors.bgDeep },
    editor: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 12,
      padding: 10,
      minHeight: 200,
      textAlignVertical: "top",
    },
    saveBtn: {
      borderWidth: 1,
      borderColor: t.colors.command,
      borderRadius: 3,
      paddingVertical: 8,
      alignItems: "center",
    },
    saveText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "bold",
    },
  });
}
