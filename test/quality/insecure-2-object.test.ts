import {
  buildParameterizedUserQuery,
  escapeHtml,
  getDatabaseConfig,
  renderSafeDiv,
  safeParseJson,
} from '../../src/quality/insecure-2-object';

describe('insecure-2-object remediated security utilities', () => {
  it('should escape HTML special characters to prevent XSS', () => {
    const payload = '<script>alert("XSS" & \'test\')</script>';
    const escaped = escapeHtml(payload);

    expect(escaped).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot; &amp; &#39;test&#39;)&lt;/script&gt;'
    );
    expect(renderSafeDiv(payload)).toBe(`<div>${escaped}</div>`);
  });

  it('should build a parameterized SQL query to prevent SQL injection', () => {
    const maliciousInput = "admin'; DROP TABLE Users; --";
    const result = buildParameterizedUserQuery(maliciousInput);

    expect(result.query).toBe('SELECT * FROM Users WHERE username = ?');
    expect(result.params).toEqual([maliciousInput]);
  });

  it('should safely parse valid and invalid JSON strings', () => {
    expect(safeParseJson<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true });
    expect(safeParseJson('{invalid json')).toBeNull();
  });

  it('should read database credentials from environment variables', () => {
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.API_KEY;

    expect(getDatabaseConfig()).toEqual({
      dbUsername: '',
      dbPassword: '',
      apiKey: '',
    });

    process.env.DB_USERNAME = 'app_user';
    process.env.DB_PASSWORD = 'env_password';
    process.env.API_KEY = 'env_api_key';

    expect(getDatabaseConfig()).toEqual({
      dbUsername: 'app_user',
      dbPassword: 'env_password',
      apiKey: 'env_api_key',
    });

    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.API_KEY;
  });
});
