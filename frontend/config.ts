export const BASE_URL = import.meta.env.VITE_BASE_URL
export const API_URL = `${BASE_URL}/api`
export const SUBSCRIPTION_URL = `${BASE_URL}/subscription`
export const WS_URL = `${BASE_URL}`
export const MEDIASOUP_URL = import.meta.env.VITE_MEDIASOUP_URL
export const ENV = import.meta.env.NODE_ENV
export const SUPABASE_AUTH_KEY = import.meta.env.VITE_SUPABASE_AUTH_KEY
export const YOUTUBE_API_KEY = import.meta.env.VITE_YT_API_KEY
export const ROUTES_NO_SIDEBAR = ['/app/room']

export const GOOGLE_AUTH_CONFIG = {
  SCOPE: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(),
  REDIRECT_URL: `${BASE_URL}/user/googleauth`,
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
}
