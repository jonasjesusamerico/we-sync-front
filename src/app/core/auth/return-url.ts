import { PRIMARY_OUTLET, Router, UrlTree } from '@angular/router';

const GUEST_PATHS = new Set(['login', 'cadastro']);

/** RN-09, RN-10, CA-14: aceita só caminho interno que não seja login/cadastro; senão `'/'`. */
export function sanitizeReturnUrl(url: string | null | undefined, router: Router): string {
  if (typeof url !== 'string' || url === '') {
    return '/';
  }
  if (!url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\') || url.includes('\\')) {
    return '/';
  }
  let tree: UrlTree;
  try {
    tree = router.parseUrl(url);
  } catch {
    return '/';
  }
  const firstSegment = tree.root.children[PRIMARY_OUTLET]?.segments[0]?.path;
  if (firstSegment !== undefined && GUEST_PATHS.has(firstSegment)) {
    return '/';
  }
  return router.serializeUrl(tree);
}
