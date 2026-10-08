export function sendSuccess(res, data, statusCode = 200) {
  const body = JSON.stringify({ success: true, data }, null, 2);
  return res.status(statusCode).type('application/json').send(body);
}

export function sendCreated(res, data) {
  return sendSuccess(res, data, 201);
}

export function sendNoContent(res) {
  return res.status(204).end();
}
