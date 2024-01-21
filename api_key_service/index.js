const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/iotLowFrequencyTrackingPlatformDatabase', { useNewUrlParser: true, useUnifiedTopology: true });

// Define User Schema (adjust as needed)
const UserSchema = new mongoose.Schema({
  apiKey: String
});

const User = mongoose.model('User', UserSchema);

// Generate or Regenerate API Key
app.post('/api-key/:userId', async (req, res) => {
    const { userId } = req.params;
    // Logic to generate a new API key
    const newApiKey = generateApiKey(); // Implement this function
    await User.findByIdAndUpdate(userId, { apiKey: newApiKey });
    res.json({ apiKey: newApiKey });
});

// Delete API Key
app.delete('/api-key/:userId', async (req, res) => {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, { apiKey: null });
    res.send('API key deleted successfully');
});

// Get API Key
app.get('/api-key/:userId',  async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        res.json(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Validate API Key
app.get('/validate-api-key', async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'];
      const user = await User.findOne({ apiKey: apiKey });
      if (user) {
        res.json({ userId: user._id.toString() });
      } else {
        res.status(401).send('Invalid API key');
      }
    } catch (error) {
      res.status(500).send(error);
    }
  });

// Helper function to generate a new API key
function generateApiKey() {
    // Simple example: generate a random string
    return require('crypto').randomBytes(16).toString('hex');
}

app.listen(3003, () => {
    console.log('API Key Service running on port 3003');
  });
  