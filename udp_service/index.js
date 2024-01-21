const dgram = require('dgram');
const { Kafka } = require('kafkajs');
const server = dgram.createSocket('udp4');

const kafka = new Kafka({
  clientId: 'udp-service',
  brokers: ['kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();

const startKafkaProducer = async () => {
  await producer.connect();
};

server.on('error', (err) => {
  console.error(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', async (msg, rinfo) => {
  try {
    // Forward the message to Kafka
    await producer.send({
      topic: 'gps-data',
      messages: [{ value: msg.toString() }],
    });
  } catch (error) {
    console.error('Error sending message to Kafka:', error);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
  startKafkaProducer();
});

server.bind(41234); // UDP port
