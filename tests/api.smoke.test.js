const test = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config({ quiet: true });

const app = require('../src/app');
const { sequelize, User, Post } = require('../src/models');

let server;
let baseUrl;
let createdUserId;
let createdPostId;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const data = await response.json().catch(() => ({}));

  return {
    status: response.status,
    data,
  };
}

test.before(async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (createdPostId) {
    await Post.destroy({ where: { id: createdPostId } });
  }

  if (createdUserId) {
    await User.destroy({ where: { id: createdUserId } });
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  await sequelize.close();
});

test('health endpoint returns ok', async () => {
  const response = await request('/health');

  assert.equal(response.status, 200);
  assert.equal(response.data.status, 'ok');
});

test('public posts endpoint returns an array', async () => {
  const response = await request('/api/posts');

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(response.data), true);
});

test('register, login, and full CRUD flow work', async () => {
  const uniqueId = Date.now();
  const email = `smoke-${uniqueId}@example.com`;
  const username = `smoke_${uniqueId}`;
  const password = 'password123';

  const registerResponse = await request('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  assert.equal(registerResponse.status, 201);
  assert.equal(registerResponse.data.user.email, email);
  assert.ok(registerResponse.data.token);

  createdUserId = registerResponse.data.user.id;

  const loginResponse = await request('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.data.token);

  const token = loginResponse.data.token;

  const createResponse = await request('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Smoke Test Post',
      content: 'Testing secured CRUD flow.',
      category: 'testing',
    }),
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.data.author.email, email);

  createdPostId = createResponse.data.id;

  const updateResponse = await request(`/api/posts/${createdPostId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Updated Smoke Test Post',
      content: 'Updated secured CRUD flow.',
      category: 'testing',
    }),
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.data.title, 'Updated Smoke Test Post');

  const deleteResponse = await request(`/api/posts/${createdPostId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.data.message, 'Post deleted successfully.');

  createdPostId = undefined;
});