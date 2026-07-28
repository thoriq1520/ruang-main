import {betterAuth} from 'better-auth'
import {config, isAllowedWebOrigin} from './config'
import {getPool} from './db/pool'

const google = config.googleClientId && config.googleClientSecret
  ? {google: {clientId: config.googleClientId, clientSecret: config.googleClientSecret}}
  : undefined

export const auth = betterAuth({
  appName: 'Ruang Main',
  database: getPool(),
  baseURL: config.authUrl,
  secret: config.authSecret,
  trustedOrigins: (request) => {
    const origin = request?.headers.get('origin') || ''
    return isAllowedWebOrigin(origin) ? [...config.webOrigins, origin] : config.webOrigins
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: google,
  advanced: {
    cookiePrefix: 'ruang-main',
  },
})
