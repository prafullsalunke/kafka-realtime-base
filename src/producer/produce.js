import { producer } from "../config/kafka.js";
import logger from "../config/logger.js";
import dotenv from "dotenv";

dotenv.config();

const topic = process.env.KAFKA_TOPIC || "events-log";

// Sample event data
const sampleEvents = [
  {
    type: "user_signup",
    userId: "user_123",
    email: "user123@example.com",
    timestamp: new Date().toISOString(),
    logType: "audit",
    metadata: {
      source: "web",
      ip: "192.168.1.100",
    },
  },
  {
    type: "user_signin",
    userId: "user_123",
    email: "user123@example.com",
    timestamp: new Date().toISOString(),
    logType: "audit",
    metadata: {
      source: "web",
      ip: "192.168.1.100",
      sessionId: "session_789",
    },
  },
  {
    type: "order_created",
    orderId: "order_456",
    userId: "user_123",
    amount: 99.99,
    currency: "USD",
    timestamp: new Date().toISOString(),
    logType: "normal",
    metadata: {
      items: ["product_1", "product_2"],
      shipping: "express",
    },
  },
  {
    type: "payment_processed",
    paymentId: "payment_789",
    orderId: "order_456",
    amount: 99.99,
    status: "completed",
    timestamp: new Date().toISOString(),
    logType: "normal",
    metadata: {
      method: "credit_card",
      processor: "stripe",
    },
  },
  {
    type: "product_viewed",
    productId: "product_1",
    userId: "user_123",
    timestamp: new Date().toISOString(),
    logType: "normal",
    metadata: {
      category: "electronics",
      price: 49.99,
    },
  },
  {
    type: "cart_updated",
    userId: "user_123",
    cartId: "cart_001",
    items: ["product_1", "product_3"],
    timestamp: new Date().toISOString(),
    logType: "normal",
    metadata: {
      totalItems: 2,
      totalValue: 89.98,
    },
  },
];

async function connectProducer() {
  try {
    await producer.connect();
    logger.info("Producer connected successfully", { service: "producer" });
  } catch (error) {
    logger.error("Failed to connect producer", {
      error: error.message,
      service: "producer",
    });
    throw error;
  }
}

async function disconnectProducer() {
  try {
    await producer.disconnect();
    logger.info("Producer disconnected successfully", { service: "producer" });
  } catch (error) {
    logger.error("Error disconnecting producer", {
      error: error.message,
      service: "producer",
    });
  }
}

async function publishEvent(event, retryCount = 0) {
  const maxRetries = parseInt(process.env.PRODUCER_RETRY_ATTEMPTS) || 3;

  try {
    const result = await producer.send({
      topic,
      messages: [
        {
          key: event.type,
          value: JSON.stringify(event),
          timestamp: Date.now(),
        },
      ],
    });

    logger.info("Event published successfully", {
      type: event.type,
      partition: result[0].partition,
      offset: result[0].baseOffset,
      timestamp: new Date().toISOString(),
      service: "producer",
    });

    return result;
  } catch (error) {
    logger.error("Failed to publish event", {
      attempt: retryCount + 1,
      error: error.message,
      eventType: event.type,
      service: "producer",
    });

    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      logger.info("Retrying event publication", {
        attempt: retryCount + 1,
        delay,
        eventType: event.type,
        service: "producer",
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return publishEvent(event, retryCount + 1);
    } else {
      logger.error("Max retries exceeded for event", {
        eventType: event.type,
        maxRetries,
        service: "producer",
      });
      throw error;
    }
  }
}

async function publishEvents() {
  try {
    await connectProducer();

    logger.info("Starting to publish events", {
      count: sampleEvents.length,
      topic,
      service: "producer",
    });

    for (const event of sampleEvents) {
      await publishEvent(event);

      // Add a small delay between events to simulate real-world scenario
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    logger.info("Successfully published all events", {
      count: sampleEvents.length,
      topic,
      service: "producer",
    });
  } catch (error) {
    logger.error("Error in publishEvents", {
      error: error.message,
      service: "producer",
    });
    process.exit(1);
  } finally {
    await disconnectProducer();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  publishEvents();
}

export { publishEvents, publishEvent, connectProducer, disconnectProducer };
