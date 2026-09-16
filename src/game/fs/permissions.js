// src/game/fs/permissions.js
// Portado 1:1 do web.

export function canRead(node, user = 'k1tty') {
  if (!node) return false;
  const p = node.permissions || 'rw-r--r--';
  if (node.owner === user) return p[0] === 'r';
  return p[3] === 'r' || p[6] === 'r';
}

export function canWrite(node, user = 'k1tty') {
  if (!node) return false;
  const p = node.permissions || 'rw-r--r--';
  if (node.owner === user) return p[1] === 'w';
  return p[4] === 'w' || p[7] === 'w';
}

export function canExecute(node, user = 'k1tty') {
  if (!node) return false;
  const p = node.permissions || 'rw-r--r--';
  if (node.owner === user) return p[2] === 'x';
  return p[5] === 'x' || p[8] === 'x';
}

export function requiresSudo(node) {
  return node?.requiresSudo === true || node?.locked === true;
}