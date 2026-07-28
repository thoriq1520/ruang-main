function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} belum diisi`)
  return value
}

const production = process.env.NODE_ENV === 'production'
const webOrigins = (process.env.WEB_ORIGIN?.trim() || (production ? 'https://ruangmain.web.id' : 'http://localhost:5173'))
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

export function isAllowedWebOrigin(origin: string) {
  return webOrigins.includes(origin) || (!production && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
}

export const config = {
  get databaseUrl() { return required('DATABASE_URL') },
  authUrl: process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:3000',
  authSecret: process.env.BETTER_AUTH_SECRET?.trim() || (process.env.NODE_ENV === 'production' ? required('BETTER_AUTH_SECRET') : 'ruang-main-local-development-secret-only'),
  webOrigin: webOrigins[0],
  webOrigins,
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
  port: Number(process.env.PORT || 3000),
}
