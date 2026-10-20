import bcrypt from 'bcrypt';
import { prisma } from '../../src/db/client.js';

export async function bootstrapAdmin(
  request,
  { nama = 'Admin', email = 'admin@test.com', password = 'admin1234' } = {},
) {
  await prisma.user.create({
    data: { nama, email, password: await bcrypt.hash(password, 10), role: 'admin' },
  });

  const res = await request.post('/api/v1/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Bootstrap admin gagal login (${res.status}): ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.data.token, userId: res.body.data.user.id };
}

export async function registerAs(request, adminToken, data) {
  const res = await request
    .post('/api/v1/register')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(data);

  if (res.status !== 201) {
    throw new Error(`Register ${data.email} gagal (${res.status}): ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}
