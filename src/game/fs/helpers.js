// src/game/fs/helpers.js
// Portado 1:1 do web (src/utils/helpers.js + src/filesystem/helpers.js).

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(deepClone);
  const c = {};
  for (const k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) c[k] = deepClone(obj[k]);
  return c;
}

export function getNodeByPath(fs, path) {
  if (!path || path === '/') return fs;
  const parts = (path.startsWith('/') ? path : '/' + path).split('/').filter(p => p !== '');
  let cur = fs;
  for (const part of parts) {
    if (part === '..') return null;
    if (!cur.children || !cur.children[part]) return null;
    cur = cur.children[part];
  }
  return cur;
}

export function getParentPath(path) {
  if (!path || path === '/') return '/';
  const clean = path.endsWith('/') ? path.slice(0, -1) : path;
  const i = clean.lastIndexOf('/');
  return i <= 0 ? '/' : clean.substring(0, i);
}

export function getFileName(path) {
  if (!path || path === '/') return '/';
  const clean = path.endsWith('/') ? path.slice(0, -1) : path;
  return clean.substring(clean.lastIndexOf('/') + 1);
}

export function joinPath(base, rel) {
  if (!rel || rel === '.') return base || '/';
  if (rel === '~') return '/home/k1tty';
  if (rel.startsWith('~/')) rel = rel.replace(/^~/, '/home/k1tty');
  if (rel.startsWith('/')) return rel;
  if (rel === '..') return getParentPath(base);

  const bp = base.split('/').filter(p => p !== '');
  const rp = rel.split('/').filter(p => p !== '');
  for (const part of rp) {
    if (part === '..') bp.pop();
    else if (part !== '.') bp.push(part);
  }
  return '/' + bp.join('/');
}

export function formatPermissions(node) {
  if (node.permissions === 'sudo') return 'sudo';
  return node.permissions || 'rw-r--r--';
}

export function formatSize(size) {
  if (size < 1024) return size + 'B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'K';
  return (size / (1024 * 1024)).toFixed(1) + 'M';
}

export function formatDate(d) {
  try {
    return new Date(d).toLocaleString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return '---'; }
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}