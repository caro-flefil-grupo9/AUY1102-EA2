import {
  renderGreetingPage,
  sanitizeUsername,
} from '../../src/quality/insecure-1-object';

describe('insecure-1-object remediated SSTI/XSS utilities', () => {
  it('should sanitize non-alphanumeric XSS characters from usernames', () => {
    expect(sanitizeUsername('<script>alert(1)</script>Francisco')).toBe(
      'scriptalert1scriptFrancisco'
    );
    expect(sanitizeUsername('Francisco Flefil')).toBe('Francisco Flefil');
    expect(sanitizeUsername(null)).toBe('');
    expect(sanitizeUsername(undefined)).toBe('');
  });

  it('should render a safe HTML greeting page without script tags', () => {
    const html = renderGreetingPage('<img src=x onerror=alert(1)>');

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<p>Hello ');
  });
});
