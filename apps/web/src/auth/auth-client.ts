import {createAuthClient} from 'better-auth/client'
import {apiOrigin} from '../api/client'

export const authClient = createAuthClient({
  baseURL: apiOrigin,
  fetchOptions: {credentials: 'include'},
})
