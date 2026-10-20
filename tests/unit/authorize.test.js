import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../../src/middlewares/authorize.js';
import { AppError } from '../../src/errors/AppError.js';

describe('authorize middleware', () => {
  const adminOnly = authorize('admin');

  it('calls next() without error for allowed role', () => {
    let err = 'not-called';
    adminOnly({ user: { id: '1', role: 'admin' } }, {}, (e) => (err = e));

    assert.equal(err, undefined);
  });

  it('throws 403 FORBIDDEN for a role that is not allowed', () => {
    let err;
    adminOnly({ user: { id: '1', role: 'guru' } }, {}, (e) => (err = e));

    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 403);
    assert.equal(err.code, 'FORBIDDEN');

    let muridErr;
    adminOnly({ user: { id: '2', role: 'murid' } }, {}, (e) => (muridErr = e));

    assert.ok(muridErr instanceof AppError);
    assert.equal(muridErr.statusCode, 403);
  });

  it('throws 401 UNAUTHORIZED when there is no authenticated user', () => {
    let err;
    adminOnly({}, {}, (e) => (err = e));

    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 401);
    assert.equal(err.code, 'UNAUTHORIZED');
  });

  it('accepts any of multiple allowed roles', () => {
    const adminOrGuru = authorize('admin', 'guru');

    let guruErr = 'not-called';
    adminOrGuru({ user: { id: '1', role: 'guru' } }, {}, (e) => (guruErr = e));
    assert.equal(guruErr, undefined);

    let muridErr;
    adminOrGuru({ user: { id: '2', role: 'murid' } }, {}, (e) => (muridErr = e));
    assert.equal(muridErr.statusCode, 403);
  });
});
