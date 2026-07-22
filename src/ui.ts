export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'})[character]!)
}

export function initial(name: string) {
  return escapeHtml(name.trim().charAt(0).toUpperCase() || '?')
}

export function logoMark() {
  return `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="5" width="13" height="13" rx="4"/><rect x="22" y="5" width="13" height="13" rx="4"/><rect x="5" y="22" width="13" height="13" rx="4"/><path d="M28.5 22v13M22 28.5h13"/></svg>`
}

export function copyIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`
}
