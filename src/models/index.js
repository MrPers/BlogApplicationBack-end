const sequelize = require('../config/database');
const createUser = require('./User');
const createPost = require('./Post');

const User = createUser(sequelize);
const Post = createPost(sequelize);

User.hasMany(Post, {
  foreignKey: 'userId',
  as: 'posts',
});

Post.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author',
});

module.exports = {
  sequelize,
  User,
  Post,
};
