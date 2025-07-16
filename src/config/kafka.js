import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "kafka-node-events",
  brokers: [process.env.KAFKA_BROKER_URL || "localhost:9092"],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

// Producer configuration
const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
  metadataMaxAge: 300000,
  retry: {
    initialRetryTime: 100,
    retries: 3,
  },
});

// Consumer configuration
const consumer = kafka.consumer({
  groupId: process.env.KAFKA_CONSUMER_GROUP_ID || "events-consumer-group",
  sessionTimeout: parseInt(process.env.CONSUMER_SESSION_TIMEOUT) || 30000,
  heartbeatInterval: 3000,
  rebalanceTimeout: 60000,
  maxBytesPerPartition: 1048576, // 1MB
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

// Admin client for topic management
const admin = kafka.admin({
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export { kafka, producer, consumer, admin };
