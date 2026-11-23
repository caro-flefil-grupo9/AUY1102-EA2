// Remediación EP3: se eliminan vulnerabilidades críticas (SQLi, XSS, credenciales hardcodeadas, JSON sin validar)

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildParameterizedUserQuery(username: string): {
  query: string;
  params: string[];
} {
  return {
    query: 'SELECT * FROM Users WHERE username = ?',
    params: [username],
  };
}

function renderSafeDiv(userInput: string): string {
  return `<div>${escapeHtml(userInput)}</div>`;
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getDatabaseConfig() {
  return {
    dbUsername: process.env.DB_USERNAME ?? '',
    dbPassword: process.env.DB_PASSWORD ?? '',
    apiKey: process.env.API_KEY ?? '',
  };
}

export {
  escapeHtml,
  buildParameterizedUserQuery,
  renderSafeDiv,
  safeParseJson,
  getDatabaseConfig,
};
