export const BASE_URL = import.meta.env.VITE_BASE_URL;
export const ENV = import.meta.env.NODE_ENV;
export const SUPABASE_AUTH_KEY = import.meta.env.VITE_SUPABASE_AUTH_KEY;

export const GOOGLE_AUTH_CONFIG = {
    SCOPE: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"].join(),
    REDIRECT_URL: `${BASE_URL}/user/googleauth`,
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};
