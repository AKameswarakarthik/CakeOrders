/** Sub-path the app is served from (e.g. "/cakeverse" on GitHub Pages). Prefix raw asset URLs with it. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const withBase = (path: string) => `${BASE_PATH}${path}`;
