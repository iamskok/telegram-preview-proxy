import { describe, it, expect } from 'vitest';
import handler from './index';

function mockRes() {
  const res: any = {
    headers: {},
    statusCode: 200,
    setHeader(key: string, val: string) { this.headers[key] = val; },
    status(code: number) { this.statusCode = code; return this; },
    send(body: string) { this.body = body; return this; }
  };
  return res;
}

describe('preview proxy', () => {
  it('renders og tags with params', () => {
    const req: any = { query: { title: 'T', desc: 'D', image: 'https://img', url: 'https://u' } };
    const res = mockRes();
    handler(req, res);
    expect(res.body).toContain('og:title');
    expect(res.body).toContain('https://u');
  });
});
