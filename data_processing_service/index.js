const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');

const kafka = new Kafka({
  clientId: 'data-processing-service',
  brokers: ['kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const consumer = kafka.consumer({ groupId: 'data-group' });

const mongoUrl = 'mongodb://mongodb:27017'; 
const dbName = 'iotLowFrequencyTrackingPlatformDatabase';
const collectionName = 'deviceData';

const processMessage = async (message, db) => {
  try {
    const data = JSON.parse(message.value.toString());
    const collection = db.collection(collectionName);

    await collection.insertOne({
      deviceId: data.numberId,
      coordinates: data.coordinates,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error processing message:', error);
  }
};

const run = async () => {
  const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  console.log('Connected successfully to MongoDB');
  const db = client.db(dbName);

  await consumer.connect();
  await consumer.subscribe({ topic: 'gps-data', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await processMessage(message, db);
    },
  });
};

run().catch(console.error);
