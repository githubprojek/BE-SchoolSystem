import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../../src/app/app.js';

const request = supertest(app);

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request.get('/api/v1/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
  });
});
