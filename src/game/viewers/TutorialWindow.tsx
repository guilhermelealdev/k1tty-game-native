// src/game/viewers/TutorialWindow.tsx
// Tutorial da miau - assistente local. Portado do web original.

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { executeCommand } from "../commands/parser";
import SpriteAvatar from "../components/SpriteAvatar";
import { useGame } from "../state/GameContext";
import { useTheme } from "../theme/ThemeContext";

const MODEL_NAME = "miau-2.3b-instruct";
const MODEL_PARAMS = "2.3B";

const BOOT_STEPS = [
  "carregando binario miau...",
  "verificando integridade do modelo...",
  "alocando 2.3B parametros na memoria...",
  "compilando tokens em cache local...",
  "pronto.",
];

const STEPS: any[] = [
  {
    id: "intro",
    prompt: "ola",
    response:
      "miau. Sou a miau, uma assistente local rodando dentro do seu terminal.\n\n" +
      "Nao vou fazer o trabalho por voce. Meu papel e te dar direcoes quando voce estiver perdida - nada alem disso.\n\n" +
      'Vou te mostrar o basico em alguns passos curtos, com pequenas tarefas. Sempre que eu pedir um comando, digite abaixo e aperte Enter. Se quiser pular, e so clicar em "pular tutorial".',
    tip: null,
    nextLabel: "comecar →",
  },
  {
    id: "ls",
    prompt: "por onde começo?",
    response:
      "Todo sistema tem camadas. A primeira que voce ve nunca e a ultima.\n\n" +
      "Comece pelo mais obvio: veja onde voce esta e o que esta ao seu redor.\n\n" +
      'Rode "ls" no campo abaixo.',
    tip: "ls",
    verify: ({ command }: any) => command === "ls",
    nextLabel: "feito →",
  },
  {
    id: "ls-a",
    prompt: "e se houver mais?",
    response:
      "Sempre ha mais.\n\n" +
      "Alguns arquivos preferem nao ser vistos de primeira. Eles comecam com um ponto. Para ve-los, voce precisa pedir especificamente.\n\n" +
      'Tente "ls -a".',
    tip: "ls -a",
    verify: ({ command, args }: any) =>
      command === "ls" &&
      args.some((a: string) => a.replace(/^-+/, "").includes("a")),
    nextLabel: "entendi →",
  },
  {
    id: "cd-cat",
    prompt: "e depois?",
    response:
      "Navegue. Entre em pastas, saia delas, volte pra raiz do seu home.\n\n" +
      "E quando achar algo interessante, nao deixe guardado. Arquivos existem pra serem lidos.\n\n" +
      'Rode "cd Documents" - ou "cat readme.txt" se preferir ler antes de entrar.',
    tip: "cd <pasta>  ·  cat <arquivo>",
    verify: ({ command }: any) => command === "cd" || command === "cat",
    nextLabel: "ok →",
  },
  {
    id: "nvim",
    prompt: "e se eu quiser escrever alguma coisa?",
    response:
      "Ai voce abre o editor.\n\n" +
      '"nvim" e um editor de texto simples que mora numa janela. Digite o nome do arquivo e ele abre. Se o arquivo nao existir, ele cria pra voce.\n\n' +
      'Dentro do editor: "Ctrl+S" salva. "Esc" sai do modo de escrita. "i" volta pra escrita.\n\n' +
      "Tente criar um arquivo qualquer.",
    tip: "nvim teste.txt",
    verify: ({ command }: any) => command === "nvim",
    nextLabel: "bacana →",
  },
  {
    id: "whoami",
    prompt: "quem sou eu aqui?",
    response:
      "Voce e a k1tty. E a dona desta maquina - tecnicamente.\n\n" +
      "Mas existem lugares que mesmo a dona nao acessa sem as credenciais certas. Nao e uma prisao; e so uma fechadura.\n\n" +
      'Rode "whoami" pra confirmar.',
    tip: "whoami",
    verify: ({ command }: any) => command === "whoami",
    nextLabel: "faz sentido →",
  },
  {
    id: "help",
    prompt: "tem uma lista de tudo isso?",
    response:
      'Tem. O "help" mostra o que voce pode usar agora - comandos base e os pacotes que voce instalou.\n\n' +
      "Conforme voce instala mais coisas, essa lista cresce. Vale a pena voltar nele de vez em quando.\n\n" +
      'Rode "help" pra ver.',
    tip: "help",
    verify: ({ command }: any) => command === "help",
    nextLabel: "legal →",
  },
  {
    id: "net",
    prompt: "tem mais alguma coisa pra eu ver?",
    response:
      "Provavelmente. Este sistema tem mais espaco do que aparenta.\n\n" +
      "Uma dica: voce nao tem conexao com o mundo la fora ainda. Isso limita o que voce pode instalar e ver.\n\n" +
      'Rode "ping" - sem argumentos - pra ver as redes disponiveis.',
    tip: "ping",
    verify: ({ command }: any) => command === "ping",
    nextLabel: "anotado →",
  },
  {
    id: "connect",
    prompt: "e como eu me conecto?",
    response:
      'A rede de casa se chama "k1tty\'s home". A senha ta em algum lugar do sistema - voce vai descobrir.\n\n' +
      'Se quiser tentar agora, e so "connect \\"k1tty\'s home\\"". Mas isso fica pra depois. Vamos seguir.',
    tip: 'connect "k1tty\'s home"',
    verify: ({ command }: any) => command === "connect",
    nextLabel: "ok →",
  },
  {
    id: "apt",
    prompt: "como eu consigo mais ferramentas?",
    response:
      "O sistema vem com o essencial. O resto voce instala.\n\n" +
      "Existe um gerenciador de pacotes guardando um monte de coisas inuteis e umas uteis no meio. Algumas delas sao so diversao. Outras abrem portas que voce ainda nem viu.\n\n" +
      'A sintaxe e "sudo apt install <pacote>". Mas isso exige sudo (uma senha) - que e exatamente o que voce vai passar o resto do jogo procurando.\n\n' +
      "Por enquanto, so saiba que existe.",
    tip: "sudo apt install <pacote>",
    nextLabel: "entendi →",
  },
  {
    id: "explore-1",
    prompt: "to perdida. o que eu procuro?",
    response:
      "Nao sei. Isso e o ponto.\n\n" +
      "O que eu posso dizer e isto: sistemas esquecidos guardam rastros. Historicos. Logs. Arquivos que ninguem apaga porque ninguem lembra que estao la.\n\n" +
      'Alguns bons lugares pra olhar: /var/log, arquivos com ponto na frente (ocultos), e "find" ou "grep" quando voce tiver um alvo.',
    tip: "/var/log  ·  find  ·  grep",
    nextLabel: "ok →",
  },
  {
    id: "whatnow",
    prompt: "e se eu travar?",
    response:
      "Tem um comando pra isso. Literalmente.\n\n" +
      'O "whatnow" foi feito pra te dar uma direcao solta quando voce estiver presa. Nao e uma resposta pronta, e um empurrao.\n\n' +
      'Rode "whatnow" agora - ele ja vai te dar o proximo passo real do jogo.',
    tip: "whatnow",
    verify: ({ command }: any) => command === "whatnow",
    nextLabel: "boa →",
  },
  {
    id: "goodbye",
    prompt: "e o que tem no final?",
    response:
      "Nao vou estragar a surpresa.\n\n" +
      "O que eu digo e: o fim nao e um arquivo. E uma sequencia. E o sistema foi desenhado pra que, quando voce chegar la, saiba que chegou.\n\n" +
      "Voce vai perceber.\n\n" +
      "Boa sorte, k1tty.",
    tip: null,
    nextLabel: null,
  },
];

const SKIP_STEP_DELAY_MS = 20000;
const TYPE_SPEED = 12;
const TYPE_CHUNK = 2;

export default function TutorialWindow() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();

  const [bootPhase, setBootPhase] = useState(0);
  const [bootDone, setBootDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(() => {
    const saved = state?.flags?.tutorialStep;
    if (typeof saved === "number" && saved >= 0 && saved < STEPS.length)
      return saved;
    return 0;
  });
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [blink, setBlink] = useState(true);
  const [thinking, setThinking] = useState(false);

  const [miniInput, setMiniInput] = useState("");
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showSkipStep, setShowSkipStep] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const typingRef = useRef<any>(null);
  const miniInputRef = useRef<TextInput>(null);
  const stepStartHistoryLenRef = useRef(0);

  const tutorialWindowId = useMemo(() => {
    const win = (state?.openWindows || []).find(
      (w: any) => w.type === "tutorial",
    );
    return win ? win.id : null;
  }, [state?.openWindows]);

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(t);
  }, []);

  // Boot progress
  useEffect(() => {
    if (bootDone) return;
    if (bootPhase >= BOOT_STEPS.length) {
      const t = setTimeout(() => setBootDone(true), 500);
      return () => clearTimeout(t);
    }
    const delay =
      bootPhase === BOOT_STEPS.length - 1 ? 600 : 350 + Math.random() * 200;
    const t = setTimeout(() => setBootPhase((p) => p + 1), delay);
    return () => clearTimeout(t);
  }, [bootPhase, bootDone]);

  // Inicia thinking ao mudar de step
  useEffect(() => {
    if (!bootDone) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    setTypingText("");
    setIsTyping(false);
    setThinking(true);

    const thinkTime = 500 + Math.min((step.response?.length || 0) * 2, 1200);
    const t = setTimeout(() => {
      setThinking(false);
      setIsTyping(true);
    }, thinkTime);

    return () => clearTimeout(t);
  }, [stepIndex, bootDone]);

  // Typewriter do response
  useEffect(() => {
    if (!isTyping) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    const full = step.response || "";
    if (typingText.length >= full.length) {
      setIsTyping(false);
      return;
    }

    typingRef.current = setInterval(() => {
      setTypingText((prev) => {
        const next = full.slice(0, prev.length + TYPE_CHUNK);
        if (next.length >= full.length) {
          clearInterval(typingRef.current);
          setIsTyping(false);
          return full;
        }
        return next;
      });
    }, TYPE_SPEED);

    return () => clearInterval(typingRef.current);
  }, [isTyping, stepIndex, typingText.length]);

  // Ao mudar de step, reinicia step state
  useEffect(() => {
    if (!bootDone) return;
    stepStartHistoryLenRef.current = state?.history?.length || 0;
    setStepCompleted(false);
    setShowSkipStep(false);
    setMiniInput("");
  }, [stepIndex, bootDone]);

  // Persiste step em flags
  useEffect(() => {
    if (!bootDone) return;
    if (state?.flags?.tutorialStep === stepIndex) return;
    dispatch({
      type: "SET_FLAG",
      payload: { flag: "tutorialStep", value: stepIndex },
    });
  }, [stepIndex, bootDone, dispatch, state?.flags?.tutorialStep]);

  // Verifica se o usuario executou o comando esperado
  useEffect(() => {
    if (!bootDone) return;
    if (stepCompleted) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    if (typeof step.verify !== "function") {
      setStepCompleted(true);
      return;
    }

    const startIdx = stepStartHistoryLenRef.current;
    const newEntries = (state?.history || []).slice(startIdx);

    for (const entry of newEntries) {
      const raw = (entry?.command || "").trim();
      if (!raw) continue;

      const parts = raw.split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);

      try {
        if (step.verify({ command, args, entry, state })) {
          setStepCompleted(true);
          return;
        }
      } catch {}
    }
  }, [state?.history, stepIndex, stepCompleted, bootDone, state]);

  // Botao "preso? pular este passo" aparece apos 20s
  useEffect(() => {
    if (stepCompleted) return;
    if (!bootDone) return;
    const step = STEPS[stepIndex];
    if (!step?.verify) return;

    setShowSkipStep(false);
    const t = setTimeout(() => setShowSkipStep(true), SKIP_STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [stepIndex, stepCompleted, bootDone]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [typingText, thinking, stepIndex, bootPhase, stepCompleted]);

  const closeWindow = useCallback(() => {
    if (tutorialWindowId) {
      dispatch({ type: "CLOSE_WINDOW", payload: tutorialWindowId });
    }
  }, [dispatch, tutorialWindowId]);

  const finalizeTutorial = useCallback(() => {
    dispatch({ type: "SET_TUTORIAL_COMPLETED", payload: true });
    dispatch({ type: "INCREMENT_PROGRESS", payload: 5 });

    if (!(state?.installedPackages || []).includes("tutorial")) {
      dispatch({ type: "INSTALL_PACKAGE", payload: "tutorial" });
    }
  }, [dispatch, state?.installedPackages]);

  const handleNext = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) return;
    setStepIndex((i) => i + 1);
  }, [stepIndex]);

  const handleSkipStep = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) return;
    setStepIndex((i) => i + 1);
  }, [stepIndex]);

  const handleSkipTutorial = useCallback(() => {
    finalizeTutorial();
    closeWindow();
  }, [finalizeTutorial, closeWindow]);

  const handleFinish = useCallback(() => {
    finalizeTutorial();
    closeWindow();
  }, [finalizeTutorial, closeWindow]);

  // Comando digitado pelo mini-terminal
  const handleMiniSubmit = useCallback(() => {
    const input = miniInput.trim();
    if (!input) return;
    setMiniInput("");

    try {
      const result = executeCommand(input, state, dispatch, {});

      if (result && typeof result.then === "function") {
        result
          .then((resolved: any) => {
            if (resolved) {
              dispatch({ type: "ADD_HISTORY", payload: resolved });
            }
          })
          .catch((err: any) => {
            dispatch({
              type: "ADD_HISTORY",
              payload: {
                command: input,
                output: "erro: " + err.message,
                type: "error",
              },
            });
          });
      } else if (result) {
        dispatch({ type: "ADD_HISTORY", payload: result });
      }
    } catch (err: any) {
      dispatch({
        type: "ADD_HISTORY",
        payload: {
          command: input,
          output: "erro: " + err.message,
          type: "error",
        },
      });
    }
  }, [miniInput, state, dispatch]);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const avatarTalking = isTyping || thinking;
  const hasVerify = typeof currentStep?.verify === "function";
  const canAdvance = !hasVerify || stepCompleted;
  const showMiniTerminal = bootDone && hasVerify && !isLastStep;

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>miau · assistente local</Text>
        <Text style={styles.headerMeta}>{MODEL_NAME}</Text>
      </View>

      {/* Corpo */}
      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Boot */}
        {!bootDone && (
          <View>
            <Text style={styles.bootCmd}>
              <Text style={styles.bootPrompt}>$ </Text>miau --session
            </Text>
            {BOOT_STEPS.slice(0, bootPhase).map((line, i) => {
              const isLast = i === BOOT_STEPS.length - 1;
              return (
                <Text
                  key={i}
                  style={[styles.bootLine, isLast && styles.bootLineOk]}
                >
                  <Text
                    style={[
                      styles.bootOk,
                      isLast && { color: theme.colors.command },
                    ]}
                  >
                    [ OK ]
                  </Text>
                  {" " + line}
                </Text>
              );
            })}
            {bootPhase < BOOT_STEPS.length && (
              <Text style={[styles.bootCursor, { opacity: blink ? 1 : 0 }]}>
                █
              </Text>
            )}
          </View>
        )}

        {bootDone && (
          <>
            <View style={styles.sessionLine}>
              <Text style={styles.sessionText}>[sessao iniciada]</Text>
              <Text style={styles.sessionText}>
                {" "}
                · contexto: terminal k1tty
              </Text>
            </View>

            {/* Steps anteriores (histórico) */}
            {STEPS.slice(0, stepIndex).map((step: any) => (
              <View key={step.id} style={{ marginBottom: 16 }}>
                {step.prompt && (
                  <Text style={styles.userLine}>
                    <Text style={styles.userLabel}>{"> voce: "}</Text>
                    {step.prompt}
                  </Text>
                )}
                <View style={styles.stepRow}>
                  <SpriteAvatar talking={false} size={60} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.miauLabel}>miau:</Text>
                    <Text style={styles.miauText}>{step.response}</Text>
                  </View>
                </View>
                {step.tip && (
                  <Text style={styles.tipLine}>
                    {"↳ comando: "}
                    <Text style={styles.tipCmd}>{step.tip}</Text>
                  </Text>
                )}
              </View>
            ))}

            {/* Step atual */}
            {currentStep && (
              <View style={{ marginBottom: 16 }}>
                {currentStep.prompt && (
                  <Text style={styles.userLine}>
                    <Text style={styles.userLabel}>{"> voce: "}</Text>
                    {currentStep.prompt}
                  </Text>
                )}

                <View style={styles.stepRow}>
                  <SpriteAvatar talking={avatarTalking} size={88} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.miauLabel}>miau:</Text>
                    {thinking ? (
                      <Text style={styles.thinking}>pensando...</Text>
                    ) : (
                      <Text style={styles.miauText}>
                        {typingText}
                        {isTyping && (
                          <Text
                            style={[styles.cursor, { opacity: blink ? 1 : 0 }]}
                          >
                            ▌
                          </Text>
                        )}
                      </Text>
                    )}
                  </View>
                </View>

                {!thinking && !isTyping && currentStep.tip && (
                  <Text style={styles.tipLine}>
                    {"↳ comando: "}
                    <Text style={styles.tipCmd}>{currentStep.tip}</Text>
                  </Text>
                )}
              </View>
            )}

            {/* Info do modelo */}
            {!thinking && !isTyping && currentStep && (
              <Text style={styles.modelLine}>
                [{MODEL_PARAMS} params · {Math.round(120 + Math.random() * 300)}
                ms · tokens:{" "}
                {Math.round((currentStep.response?.length || 0) / 4)}]
              </Text>
            )}

            {/* Status do objetivo */}
            {showMiniTerminal && !thinking && !isTyping && (
              <View
                style={[
                  styles.statusBox,
                  stepCompleted && styles.statusBoxDone,
                ]}
              >
                {stepCompleted ? (
                  <Text style={styles.statusDone}>
                    ✓ objetivo concluído — clique em{" "}
                    <Text style={{ fontWeight: "bold" }}>próximo</Text>
                  </Text>
                ) : (
                  <Text style={styles.statusPending}>
                    ▸ aguardando comando:{" "}
                    <Text style={styles.statusCmd}>{currentStep.tip}</Text>
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Mini terminal */}
      {showMiniTerminal && !thinking && !isTyping && (
        <View style={styles.miniWrap}>
          <Text style={styles.miniPrefix}>{stepCompleted ? "✓" : "⟩"}</Text>
          <TextInput
            ref={miniInputRef}
            style={styles.miniInput}
            value={miniInput}
            onChangeText={setMiniInput}
            onSubmitEditing={handleMiniSubmit}
            placeholder={
              stepCompleted
                ? "objetivo cumprido — clique em próximo"
                : "digite: " + (currentStep.tip?.split(" ")[0] || "")
            }
            placeholderTextColor={theme.colors.dim}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            editable={!stepCompleted}
            returnKeyType="go"
            blurOnSubmit={false}
          />
        </View>
      )}

      {/* Footer */}
      {bootDone && (
        <View style={styles.footer}>
          <Pressable
            onPress={handleSkipTutorial}
            disabled={isLastStep}
            style={[styles.skipBtn, isLastStep && { opacity: 0.4 }]}
          >
            <Text
              style={[
                styles.skipText,
                isLastStep && { color: theme.colors.dim },
              ]}
            >
              pular tutorial
            </Text>
          </Pressable>

          <View style={styles.footerRight}>
            <Text
              style={styles.stepInfo}
            >{`${stepIndex + 1}/${STEPS.length}`}</Text>

            {showSkipStep && !canAdvance && (
              <Pressable onPress={handleSkipStep} style={styles.unstuckBtn}>
                <Text style={styles.unstuckText}>preso? pular este passo</Text>
              </Pressable>
            )}

            {currentStep?.nextLabel && !thinking && !isTyping && (
              <Pressable
                onPress={handleNext}
                disabled={!canAdvance}
                style={[styles.nextBtn, !canAdvance && styles.nextBtnDisabled]}
              >
                <Text
                  style={[
                    styles.nextText,
                    !canAdvance && { color: theme.colors.dim },
                  ]}
                >
                  {currentStep.nextLabel}
                </Text>
              </Pressable>
            )}

            {isLastStep && !thinking && !isTyping && (
              <Pressable onPress={handleFinish} style={styles.finishBtn}>
                <Text style={styles.finishText}>fechar</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bgPanel },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: t.colors.bgHeader,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    headerTitle: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    headerMeta: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
    },

    body: { flex: 1 },

    /* Boot */
    bootCmd: {
      color: t.colors.border,
      fontFamily: "monospace",
      fontSize: 11,
      marginBottom: 8,
    },
    bootPrompt: { color: t.colors.command, fontWeight: "bold" },
    bootLine: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 11,
      lineHeight: 16,
    },
    bootLineOk: {
      color: t.colors.command,
      textShadowColor: t.colors.command,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 4,
    },
    bootOk: {
      color: t.colors.border,
      fontWeight: "bold",
    },
    bootCursor: {
      color: t.colors.command,
      fontSize: 12,
      marginTop: 4,
    },

    /* Sessao */
    sessionLine: {
      flexDirection: "row",
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border + "40",
    },
    sessionText: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
    },

    /* Steps */
    userLine: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
      marginBottom: 6,
      textShadowColor: t.colors.command,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 3,
    },
    userLabel: {
      color: t.colors.border,
      fontWeight: "bold",
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingLeft: 6,
      borderLeftWidth: 2,
      borderLeftColor: t.colors.border + "60",
      marginBottom: 4,
    },
    miauLabel: {
      color: t.colors.warning,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 3,
    },
    miauText: {
      color: t.colors.text,
      fontFamily: "monospace",
      fontSize: 12,
      lineHeight: 18,
    },
    thinking: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 12,
      fontStyle: "italic",
    },
    cursor: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 12,
    },
    tipLine: {
      marginTop: 6,
      marginLeft: 76,
      fontSize: 10,
      color: t.colors.border,
      fontFamily: "monospace",
      fontStyle: "italic",
    },
    tipCmd: {
      color: t.colors.command,
      fontWeight: "bold",
    },
    modelLine: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 9,
      letterSpacing: 0.5,
      marginTop: 4,
      marginBottom: 10,
      opacity: 0.7,
    },

    /* Status box */
    statusBox: {
      marginTop: 8,
      padding: 10,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: t.colors.border + "60",
      borderRadius: 4,
    },
    statusBoxDone: {
      borderStyle: "solid",
      borderColor: t.colors.command,
      backgroundColor: t.colors.command + "12",
    },
    statusDone: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
    statusPending: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 11,
    },
    statusCmd: {
      color: t.colors.warning,
      fontWeight: "bold",
    },

    /* Mini terminal */
    miniWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: t.colors.border + "50",
      backgroundColor: t.colors.bgDeep,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    miniPrefix: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "bold",
    },
    miniInput: {
      flex: 1,
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 13,
      paddingVertical: 2,
    },

    /* Footer */
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: t.colors.border + "50",
      backgroundColor: t.colors.bgHeader,
      gap: 8,
    },
    footerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexShrink: 1,
    },
    skipBtn: {
      borderWidth: 1,
      borderColor: t.colors.error,
      borderRadius: 3,
      paddingHorizontal: 10,
      paddingVertical: 5,
      flexShrink: 0,
    },
    skipText: {
      color: t.colors.error,
      fontFamily: "monospace",
      fontSize: 10,
    },
    stepInfo: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
    },
    unstuckBtn: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    unstuckText: {
      color: t.colors.dim,
      fontFamily: "monospace",
      fontSize: 10,
      fontStyle: "italic",
      textDecorationLine: "underline",
    },
    nextBtn: {
      borderWidth: 1,
      borderColor: t.colors.command,
      borderRadius: 3,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    nextBtnDisabled: {
      borderColor: t.colors.border + "40",
    },
    nextText: {
      color: t.colors.command,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
      textShadowColor: t.colors.command,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 3,
    },
    finishBtn: {
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.command,
      borderRadius: 3,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    finishText: {
      color: t.colors.bg,
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: "bold",
    },
  });
}
