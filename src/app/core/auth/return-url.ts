import { Router } from '@angular/router';

export const HOME_URL = '/inicio';

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const ACCESS_PAGES = new Set(['login', 'cadastro']);

/** RN-10 (DAS 5.5): the return route is always internal and never an access page; otherwise HOME_URL. */
export function sanitizeReturnUrl(raw: unknown, router: Router): string {
  if (typeof raw !== 'string' || raw === '') {
    return HOME_URL;
  }
  if (
    !raw.startsWith('/') ||
    raw.startsWith('//') ||
    raw.startsWith('/\\') ||
    raw.includes('\\') ||
    CONTROL_CHARS.test(raw)
  ) {
    return HOME_URL;
  }
  let tree;
  try {
    tree = router.parseUrl(raw);
  } catch {
    return HOME_URL;
  }
  const first = tree.root.children['primary']?.segments[0]?.path;
  if (first !== undefined && ACCESS_PAGES.has(first)) {
    return HOME_URL;
  }
  return router.serializeUrl(tree);
}
