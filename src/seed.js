require('dotenv').config({ quiet: true });
const { sequelize, User, Post } = require('./models');

async function findOrCreateUser(userData) {
  const [user] = await User.findOrCreate({
    where: { email: userData.email },
    defaults: userData,
  });

  return user;
}

async function ensurePost(postData) {
  await Post.findOrCreate({
    where: {
      title: postData.title,
      userId: postData.userId,
    },
    defaults: postData,
  });
}

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const anton = await findOrCreateUser({
      username: 'anton',
      email: 'anton@example.com',
      password: 'password123',
    });

    const maria = await findOrCreateUser({
      username: 'maria',
      email: 'maria@example.com',
      password: 'password123',
    });

    await ensurePost({
      title: 'Welcome to the tech blog',
      content: 'This is a sample tech post created by the seed script.',
      category: 'tech',
      userId: anton.id,
    });

    await ensurePost({
      title: 'Travel notes from Kyiv',
      content: 'A short seeded story for the travel category.',
      category: 'travel',
      userId: maria.id,
    });

    process.stdout.write('Seed completed successfully.\n');
  } catch (error) {
    process.stderr.write(`Seed failed: ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
