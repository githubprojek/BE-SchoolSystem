import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asyncHandler } from '../../src/utils/async-handler.js';

describe('asyncHandler', () => {
  it('calls next with resolved promise', async () => {
    const fn = async (_req, _res, next) => {
      next();
    };
    const wrapped = asyncHandler(fn);
    const next = (err) => assert.equal(err, undefined);
    await wrapped(null, null, next);
  });

  it('calls next with error on rejection', async () => {
    const error = new Error('test error');
    const fn = async () => {
      throw error;
    };
    const wrapped = asyncHandler(fn);
    const next = (err) => assert.equal(err, error);
    await wrapped(null, null, next);
  });
});
