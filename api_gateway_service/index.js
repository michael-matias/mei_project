const express = require('express');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret';

const corsOptions = {
  origin: 'https://localhost:30000',  // Replace with your Angular app's URL
  optionsSuccessStatus: 200
};

const app = express();

// Replace with your actual certificate and key files for HTTPS
const options = {
    key: fs.readFileSync('/certs/server.key'),
    cert: fs.readFileSync('/certs/server.crt')
};

app.use([express.json(), cors(corsOptions)]);

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }
      req.user = user;
      next();
    });
  } else if (apiKey) {
    try {
      const response = await axios.get(`http://api-key-service:3003/validate-api-key`, { headers: { 'x-api-key': apiKey } });
      if (response.status === 200) {
        req.user = { userId: response.data.userId };
        next();
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      res.status(401).json({ message: 'Invalid API key', error: error.message });
    }
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).send({ message: 'Access denied' });
  }
  next();
};

// Public API

app.post('/api/login', async (req, res) => {
  try {
    const response = await axios.post('http://user-authentication-service:3001/login', req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying /login' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const response = await axios.post('http://user-authentication-service:3001/register', req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying /register' });
  }
});

app.use(authenticate);

// Admin API

app.get('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://user-info-service:3002/users');
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying /register' });
  }
});

app.put('/api/users/:userId', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await axios.put(`http://user-info-service:3002/users/${userId}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying user edit' });
  }
});

app.delete('/api/users/:userId', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await axios.delete(`http://user-info-service:3002/users/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying user deletion' });
  }
});

app.post('/api/devices', authenticate, isAdmin, async (req, res) => {
  try {
    const response = await axios.post('http://device-info-service:3000/devices', req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying device creation' });
  }
});

app.get('/api/devices', authenticate, isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://device-info-service:3000/devices');
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get devices' });
  }
});

app.delete('/api/devices/:numberId', authenticate, isAdmin, async (req, res) => {
  try {
    const { numberId } = req.params;
    const response = await axios.delete(`http://device-info-service:3000/devices/${numberId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying device deletion' });
  }
});

app.put('/api/devices/:numberId', authenticate, isAdmin, async (req, res) => {
  try {
    const { numberId } = req.params;
    const response = await axios.put(`http://device-info-service:3000/devices/${numberId}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying device update' });
  }
});

app.get('/api/deviceData', authenticate, isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://device-info-service:3000/deviceData');
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get device data' });
  }
});

app.get('/api/devices/count', authenticate, isAdmin, async (req, res) => {
  try {
    const response = await axios.get(`http://device-info-service:3000/devices/count`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: `Error proxying get devices by userId: ${userId}` });
  }
});

app.get('/api/deviceData/count', authenticate, isAdmin, async (req, res) => {
  try {
    const response = await axios.get(`http://device-info-service:3000/deviceData/count`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get device data by numberId and userId' });
  }
});

app.get('/api/users/count', authenticate, isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://user-info-service:3002/users/count');
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying /register' });
  }
});

// Non Admin & API Key API

app.get('/api/devices/byNumberId/:numberId', authenticate, async (req, res) => {
  try {
    const { numberId } = req.params;
    const userId = req.user.userId;
    const response = await axios.get(`http://device-info-service:3000/devices/byNumberId/${numberId}/byUserId/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get device by numberId and userId' });
  }
});

app.get('/api/devices/byUserId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const response = await axios.get(`http://device-info-service:3000/devices/byUserId/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: `Error proxying get devices by userId: ${userId}` });
  }
});

app.get('/api/devices/count/byUserId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const response = await axios.get(`http://device-info-service:3000/devices/count/byUserId/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: `Error proxying get devices by userId: ${userId}` });
  }
});

app.get('/api/deviceData/byNumberId/:numberId/byUserId', authenticate, async (req, res) => {
  try {
    const { numberId } = req.params;
    const userId = req.user.userId;
    const response = await axios.get(`http://device-info-service:3000/deviceData/byNumberId/${numberId}/byUserId/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get device data by numberId and userId' });
  }
});

app.get('/api/deviceData/byNumberId/:numberId/byUserId', authenticate, async (req, res) => {
  try {
    const { numberId } = req.params;
    const userId = req.user.userId;
    const response = await axios.get(`http://device-info-service:3000/deviceData/byNumberId/${numberId}/byUserId/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get device data by numberId and userId' });
  }
});

app.get('/api/deviceData/:numberId/lastData/byUserId', authenticate, async (req, res) => {
  try {
    const { numberId } = req.params;
    const userId = req.user.userId;
    const response = await axios.get(`http://device-info-service:3000/deviceData/${numberId}/lastData/byUserId/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get device data by numberId and userId' });
  }
});

app.get('/api/deviceData/count/byUserId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const response = await axios.get(`http://device-info-service:3000/deviceData/count/byUserId/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error proxying get device data by numberId and userId' });
  }
});

app.get('/api/api-key/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const response = await axios.get(`http://api-key-service:3003/api-key/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: `Error proxying get devices by userId: ${userId}` });
  }
});

app.post('/api/api-key/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const response = await axios.post(`http://api-key-service:3003/api-key/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: `Error proxying get devices by userId: ${userId}` });
  }
});

app.delete('/api/api-key/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const response = await axios.delete(`http://api-key-service:3003/api-key/${userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: `Error proxying get devices by userId: ${userId}` });
  }
});

/*app.listen(443, () => {
  console.log('API Gateway listening on port 443');
});*/

https.createServer(options, app).listen(443, () => {
  console.log('API Gateway listening on port 443');
});
