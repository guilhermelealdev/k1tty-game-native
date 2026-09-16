// src/game/components/Emoji.tsx
// Renderiza um emoji sem fontFamily monospace.
// Isso evita que o Android mostre "caixa" (□) no lugar do emoji.

import { Text } from "react-native";

interface Props {
  children: string;
  size?: number;
  style?: any;
}

export default function Emoji({ children, size = 16, style }: Props) {
  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontSize: size,
          /* IMPORTANTE: sem fontFamily.
             Deixa o sistema escolher a fonte de emoji. */
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
