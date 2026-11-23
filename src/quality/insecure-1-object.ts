import { escapeHtml } from './insecure-2-object';

// Remediación EP2/EP3 (SonarCloud SSTI + Snyk Code XSS)
// Se sanitiza estrictamente la entrada del usuario y se escapa el contenido HTML
// evitando inyección de plantillas (SSTI) y Cross-Site Scripting (XSS).

export function sanitizeUsername(rawInput: unknown): string {
  const value = typeof rawInput === 'string' ? rawInput : '';
  return value.replace(/[^a-zA-Z0-9 _.-]/g, '').trim();
}

export function renderGreetingPage(rawUsername: unknown): string {
  const safeUsername = escapeHtml(sanitizeUsername(rawUsername));
  return [
    '<!doctype html>',
    '<html>',
    '<head><title>Hello world</title></head>',
    '<body>',
    '<form action="/" method="post">',
    `<input id="username" class="form-control" type="text" name="username" value="${safeUsername}" />`,
    '<button class="btn btn-primary" type="submit">Submit</button>',
    '</form>',
    `<p>Hello ${safeUsername}</p>`,
    '</body>',
    '</html>',
  ].join('');
}
