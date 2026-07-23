export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendCreated(res, data) {
  return sendSuccess(res, data, 201);
}

export function sendNoContent(res) {
  return res.status(204).end();
}
