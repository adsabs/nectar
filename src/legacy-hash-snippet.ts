import { LEGACY_PAYLOAD_ROOTS, LEGACY_STANDALONE_ROOTS } from '@/lib/legacyRoutes';

export const LEGACY_REDIRECT_CLASS = 'scix-legacy-redirecting';

export const LEGACY_REDIRECT_TIMEOUT_MS = 6000;

export const LEGACY_REDIRECT_CSS = `
html.${LEGACY_REDIRECT_CLASS} main > *,
html.${LEGACY_REDIRECT_CLASS} .chakra-portal,
html.${LEGACY_REDIRECT_CLASS} .shepherd-element,
html.${LEGACY_REDIRECT_CLASS} .shepherd-modal-overlay-container { display: none; }
html.${LEGACY_REDIRECT_CLASS} main { min-height: 60vh; }
html.${LEGACY_REDIRECT_CLASS}::after {
  content: 'This link has moved. Taking you there\\002026';
  position: fixed;
  top: 7rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  color: #333333;
  font: 500 1.05rem/1.4 system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
html.${LEGACY_REDIRECT_CLASS}[data-theme='dark']::after {
  color: #ffffff;
}
`;

export const getLegacyHashSnippet = (): string => `
(function(){
  try {
    var standalone = ${JSON.stringify([...LEGACY_STANDALONE_ROOTS])};
    var payload = ${JSON.stringify([...LEGACY_PAYLOAD_ROOTS])};
    var body = (window.location.hash || '').replace(/^#!?\\/?/, '');
    if (!body) { return; }
    var slash = body.indexOf('/');
    var root = slash === -1 ? body : body.slice(0, slash);
    var rest = slash === -1 ? '' : body.slice(slash + 1);
    if (!(rest ? payload.indexOf(root) !== -1 : standalone.indexOf(root) !== -1)) { return; }
    var html = document.documentElement;
    var cls = ${JSON.stringify(LEGACY_REDIRECT_CLASS)};
    window.setTimeout(function(){ html.classList.remove(cls); }, ${LEGACY_REDIRECT_TIMEOUT_MS});
    html.classList.add(cls);
  } catch (e) {}
})();
`;
