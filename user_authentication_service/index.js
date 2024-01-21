// Dependencies
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user');
const runMigration = require('./initialSetup');

// MongoDB URL
const mongoUrl = 'mongodb://mongodb:27017/iotLowFrequencyTrackingPlatformDatabase';

// Connect to MongoDB and run migration
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');
    await runMigration(); // Await the migration script
    startExpressApp(); // Start the Express app after the migration
  })
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1); // Exit the process if the DB connection fails
  });

function startExpressApp() {
  // Express setup
  const app = express();
  app.use(express.json());

  // Registration endpoint
  app.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = new User({ email, password });
      await user.save();
      res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
      res.status(400).send(error);
    }
  });

  // Login endpoint
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send({ message: 'Login failed' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send({ message: 'Login failed' });
      }
      const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, 'your_jwt_secret');
      res.send({ token });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  // Start listening
  app.listen(3001, () => {
    console.log('Authentication service running on port 3001');
  });
}