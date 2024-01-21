const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// MongoDB URL
const mongoUrl = 'mongodb://mongodb:27017/iotLowFrequencyTrackingPlatformDatabase';

// Connect to MongoDB
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

// Device Schema for registered devices
const deviceSchema = new mongoose.Schema({
  numberId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Device Model
const Device = mongoose.model('Device', deviceSchema);

// MongoClient for raw device data
const { MongoClient } = require('mongodb');
const client = new MongoClient(mongoUrl);
let deviceDataDB;

client.connect().then(() => {
  console.log('Connected to MongoDB for deviceData');
  deviceDataDB = client.db("iotLowFrequencyTrackingPlatformDatabase");
}).catch(err => {
  console.error('Failed to connect to MongoDB for deviceData', err);
});

// Endpoint to add a new device
app.post('/devices', async (req, res) => {
  try {
    const { numberId, userId } = req.body;

    const existingDevice = await Device.findOne({ numberId });
    if (existingDevice) {
        return res.status(400).send('A device with the same Number ID already exists.');
    }

    const newDevice = new Device({ numberId, userId });
    await newDevice.save();
    res.status(201).json(newDevice);
  } catch (error) {
    console.error('Error adding new device:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Endpoint to get all registered devices
app.get('/devices', async (req, res) => {
  try {
    const devices = await Device.find({});
    res.json(devices);
  } catch (error) {
    console.error('Error retrieving devices:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Endpoint to get all registered devices by a numberId
app.get('/devices/byNumberId/:numberId/byUserId/:userId', async (req, res) => {
  const { numberId, userId } = req.params;
  try {
    const devices = await Device.find({ numberId, userId });
    res.json(devices);
  } catch (error) {
    console.error('Error retrieving devices by numberId and userId:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Endpoint to delete a device by numberId
app.delete('/devices/:numberId', async (req, res) => {
  const { numberId } = req.params;
  try {
    const result = await Device.deleteOne({ _id: numberId });
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Device not found' });
    }
    res.send({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Endpoint to edit a device by its MongoDB _id
app.put('/devices/:id', async (req, res) => {
  const { id } = req.params; // Assuming 'id' is the MongoDB _id of the device
  const updateData = req.body;

  try {
    const updatedDevice = await Device.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedDevice) {
      return res.status(404).send({ message: 'Device not found' });
    }
    res.json(updatedDevice);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Endpoint to get all devices by a specific userId
app.get('/devices/byUserId/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const devices = await Device.find({ userId });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices by userId:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Endpoint to count devices for a specific user
app.get('/devices/count/byUserId/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await Device.countDocuments({ userId: userId });
    res.json({ count });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Endpoint to count device data for a specific user's devices
app.get('/deviceData/count/byUserId/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const devices = await Device.find({ userId: userId });
    const deviceIds = devices.map(device => device.numberId);
    const count = await deviceDataDB.collection('deviceData').countDocuments({ deviceId: { $in: deviceIds } });
    res.json({ count });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Endpoint to get device data from 'deviceData' collection
app.get('/deviceData', async (req, res) => {
  if (!deviceDataDB) {
    return res.status(500).json({ message: 'MongoDB for deviceData not connected' });
  }

  try {
    const deviceData = await deviceDataDB.collection('deviceData').find({}).toArray();
    res.json(deviceData);
  } catch (error) {
    console.error('Error retrieving device data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Endpoint to get device data for a specific numberId
app.get('/deviceData/byNumberId/:numberId/byUserId/:userId', async (req, res) => {
  const { numberId, userId } = req.params;

  if (!deviceDataDB) {
    return res.status(500).json({ message: 'MongoDB for deviceData not connected' });
  }

  const devices = await Device.find({ userId });
  if(!devices){
    return res.status(404).send({ message: 'Device not found' });
  }

  try {
    const deviceData = await deviceDataDB.collection('deviceData')
                                          .find({ deviceId: numberId}).toArray();
    res.json(deviceData);
  } catch (error) {
    console.error('Error retrieving device data for numberId and userId:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/deviceData/:numberId/lastData/byUserId/:userId', async (req, res) => {
  try {
      const { numberId, userId } = req.params;

      const devices = await Device.find({ userId });
      if(!devices){
        return res.status(404).send({ message: 'Device not found' });
      }
      const lastData = await deviceDataDB.collection('deviceData').find({deviceId: numberId}).sort({timestamp: -1}).limit(1).toArray();
      if(lastData != null && lastData.length > 0){
        res.json(lastData[0]);
      }
      return null;
  } catch (error) {
      console.error('Error fetching last coordinates:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/devices/count', async (req, res) => {
  try {
    const count = await Device.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error getting device count', error: error.message });
  }
});

app.get('/deviceData/count', async (req, res) => {
  try {
    const count = await deviceDataDB.collection('deviceData').countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error getting device data count', error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Device Information Service listening on port 3000');
});
