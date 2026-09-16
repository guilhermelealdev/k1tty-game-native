// src/game/services/pokeApi.js
const API = 'https://pokeapi.co/api/v2';
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const CAT_POKEMON_IDS = [
  52, 53, 150, 151, 300, 301, 509, 510, 677, 678, 725, 726, 727, 791, 807,
];

export const TYPE_ICONS = {
  normal: 'N', fire: 'F', water: 'W', electric: 'E',
  grass: 'G', ice: 'I', fighting: 'FT', poison: 'P',
  ground: 'GD', flying: 'FL', psychic: 'PS', bug: 'B',
  rock: 'R', ghost: 'GH', dragon: 'D', dark: 'DK',
  steel: 'ST', fairy: 'FY',
};

export const TYPE_PT = {
  normal: 'Normal', fire: 'Fogo', water: 'Agua', electric: 'Eletrico',
  grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Veneno',
  ground: 'Terra', flying: 'Voador', psychic: 'Psiquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragao', dark: 'Sombrio',
  steel: 'Aco', fairy: 'Fada',
};

function timeoutFetch(url, ms) {
  ms = ms || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

export async function fetchPokemon(idOrName) {
  const pRes = await timeoutFetch(API + '/pokemon/' + String(idOrName).toLowerCase());
  if (!pRes.ok) throw new Error('HTTP ' + pRes.status);
  const p = await pRes.json();

  let species = null;
  try {
    const sRes = await timeoutFetch(API + '/pokemon-species/' + p.id);
    if (sRes.ok) species = await sRes.json();
  } catch {}

  let flavor = '-';
  if (species && species.flavor_text_entries) {
    const en = species.flavor_text_entries.find(e => e.language && e.language.name === 'en');
    if (en && en.flavor_text) {
      flavor = en.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  let genus = '-';
  if (species && species.genera) {
    const g = species.genera.find(x => x.language && x.language.name === 'en');
    if (g) genus = g.genus;
  }

  const stats = {};
  for (const s of p.stats) stats[s.stat.name] = s.base_stat;

  return {
    id: p.id,
    name: p.name,
    sprite: SPRITES + '/' + p.id + '.png',
    types: p.types.map(t => t.type.name),
    height: p.height / 10,
    weight: p.weight / 10,
    baseExp: p.base_experience,
    stats,
    abilities: p.abilities.map(a => a.ability.name.replace(/-/g, ' ')),
    genus,
    flavor,
    isLegendary: !!(species && species.is_legendary),
    isMythical: !!(species && species.is_mythical),
  };
}

export function getRandomCatPokemonId() {
  return CAT_POKEMON_IDS[Math.floor(Math.random() * CAT_POKEMON_IDS.length)];
}