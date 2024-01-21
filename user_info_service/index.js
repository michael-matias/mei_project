const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/iotLowFrequencyTrackingPlatformDatabase', { useNewUrlParser: true, useUnifiedTopology: true });

// Define User Schema (adjust as needed)
const UserSchema = new mongoose.Schema({
  email: String,
  isAdmin: Boolean,
});

const User = mongoose.model('User', UserSchema);

// Endpoint to get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Update user in MongoDB
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.status(200).send(updatedUser);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

app.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user from MongoDB
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.status(200).send({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

app.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error getting user count', error: error.message });
  }
});

app.listen(3002, () => {
  console.log('User Info Service running on port 3002');
});
