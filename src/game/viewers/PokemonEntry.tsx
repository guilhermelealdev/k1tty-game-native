// src/game/viewers/PokemonEntry.tsx
import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { TYPE_ICONS, TYPE_PT } from '../services/pokeApi';

const TYPE_COLORS = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030',
  grass: '#78c850', ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0',
  ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848',
  steel: '#b8b8d0', fairy: '#ee99ac',
};

function StatBar({ label, value, max, color }: any) {
  const pct = Math.min(100, Math.round((value / (max || 150)) * 100));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
      <Text style={{ fontSize: 9, color: '#888', width: 46, fontFamily: 'monospace' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 9, color: '#aaa', width: 32, textAlign: 'right', fontFamily: 'monospace' }}>
        {value}
      </Text>
      <View style={{ flex: 1, height: 5, backgroundColor: '#00000080', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: pct + '%', height: '100%', backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function PokemonEntry({ data }: any) {
  if (!data) return null;

  const styles = useMemo(() => makeStyles(), []);
  const idStr = String(data.id).padStart(4, '0');
  const nameUpper = data.name.toUpperCase();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 4 }}>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View style={styles.spriteWrap}>
          <Image
            source={{ uri: data.sprite }}
            style={styles.sprite}
            resizeMode="contain"
          />
          <Text style={styles.idText}>#{idStr}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 180 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <Text style={styles.name}>{nameUpper}</Text>
            {data.isLegendary && <Text style={styles.badgeGold}>LENDARIO</Text>}
            {data.isMythical && <Text style={styles.badgePink}>MITICO</Text>}
          </View>

          <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {data.types.map((t: string) => (
              <View key={t} style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[t] || '#666' }]}>
                <Text style={styles.typeText}>
                  {(TYPE_ICONS[t] || '?') + ' ' + (TYPE_PT[t] || t)}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.meta}>Categoria: {data.genus}</Text>
          <Text style={styles.meta}>Altura: {data.height.toFixed(1)} m</Text>
          <Text style={styles.meta}>Peso: {data.weight.toFixed(1)} kg</Text>
          <Text style={styles.meta}>Exp base: {data.baseExp || '-'}</Text>
          <Text style={styles.meta} numberOfLines={2}>Habilidades: {data.abilities.join(', ')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>STATS BASE</Text>
      <StatBar label="HP"      value={data.stats.hp}                color="#ff6b6b" />
      <StatBar label="ATAQUE"  value={data.stats.attack}            color="#ffa94d" />
      <StatBar label="DEFESA"  value={data.stats.defense}           color="#74c0fc" />
      <StatBar label="SP.ATK"  value={data.stats['special-attack']} color="#b197fc" />
      <StatBar label="SP.DEF"  value={data.stats['special-defense']} color="#63e6be" />
      <StatBar label="VELOC."  value={data.stats.speed}             color="#ffd43b" />

      <View style={styles.flavorBox}>
        <Text style={styles.flavor}>"{data.flavor}"</Text>
      </View>

      <Text style={styles.source}>fonte: pokeapi.co</Text>
    </ScrollView>
  );
}

function makeStyles() {
  return StyleSheet.create({
    spriteWrap: { alignItems: 'center', justifyContent: 'center' },
    sprite: { width: 110, height: 110, imageRendering: 'pixelated' },
    idText: { color: '#666', fontFamily: 'monospace', fontSize: 9, marginTop: 4 },
    name: { color: '#C7EF00', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    badgeGold: {
      backgroundColor: '#b8860b', color: '#000', fontSize: 9, fontWeight: 'bold',
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    },
    badgePink: {
      backgroundColor: '#b967ff', color: '#000', fontSize: 9, fontWeight: 'bold',
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    typeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', textShadowColor: '#00000080', textShadowRadius: 1 },
    meta: { color: '#ccc', fontFamily: 'monospace', fontSize: 10, marginBottom: 2 },
    sectionTitle: {
      color: '#95C623', fontFamily: 'monospace', fontSize: 9,
      letterSpacing: 1, marginTop: 12, marginBottom: 4,
    },
    flavorBox: {
      marginTop: 12, padding: 10, backgroundColor: '#00000040',
      borderLeftWidth: 3, borderLeftColor: '#C7EF00', borderRadius: 3,
    },
    flavor: { color: '#ccc', fontFamily: 'monospace', fontSize: 10, fontStyle: 'italic', lineHeight: 15 },
    source: { color: '#666', fontFamily: 'monospace', fontSize: 8, textAlign: 'right', marginTop: 8 },
  });
}