const mongoose = require('mongoose');
const User = require('./user');

async function runMigration() {
  try {
    const count = await User.countDocuments({});
    if (count === 0) {
      console.log("No users found, creating an admin user...");

      const adminUser = new User({
        email: 'michael.f.matias@gmail.com',
        password: '123456', // Not hashed here as your model will hash it
        isAdmin: true
      });

      await adminUser.save();
      console.log("New admin user created successfully.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (error) {
    console.error("Migration error:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}

module.exports = runMigration;