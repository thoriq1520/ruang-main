import {betterAuth} from 'better-auth'
import type {Pool} from 'pg'
import {config, isAllowedWebOrigin} from './config'
import {getPool} from './db/pool'

export function createAuth(database: Pool = getPool()) {
  const google = config.googleClientId && config.googleClientSecret
    ? {google: {clientId: config.googleClientId, clientSecret: config.googleClientSecret}}
    : undefined

  return betterAuth({
    appName: 'Ruang Main',
    database,
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
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    },
    socialProviders: google,
    advanced: {
      cookiePrefix: 'ruang-main',
    },
  })
}
