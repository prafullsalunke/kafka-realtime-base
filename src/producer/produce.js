import { producer } from "../config/kafka.js";
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
    metadata: {
      source: "web",
      ip: "192.168.1.100",
    },
  },
  {
    type: "order_created",
    orderId: "order_456",
    userId: "user_123",
    amount: 99.99,
    currency: "USD",
    timestamp: new Date().toISOString(),
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
    metadata: {
      totalItems: 2,
      totalValue: 89.98,
    },
  },
];

async function connectProducer() {
  try {
    await producer.connect();
    console.log("✅ Producer connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect producer:", error);
    throw error;
  }
}

async function disconnectProducer() {
  try {
    await producer.disconnect();
    console.log("✅ Producer disconnected successfully");
  } catch (error) {
    console.error("❌ Error disconnecting producer:", error);
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

    console.log(`✅ Event published successfully:`, {
      type: event.type,
      partition: result[0].partition,
      offset: result[0].baseOffset,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error(
      `❌ Failed to publish event (attempt ${retryCount + 1}):`,
      error.message
    );

    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying in ${Math.pow(2, retryCount) * 1000}ms...`);
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
      return publishEvent(event, retryCount + 1);
    } else {
      console.error(`❌ Max retries exceeded for event: ${event.type}`);
      throw error;
    }
  }
}

async function publishEvents() {
  try {
    await connectProducer();

    console.log(
      `🚀 Starting to publish ${sampleEvents.length} events to topic: ${topic}`
    );
    console.log("=".repeat(60));

    for (const event of sampleEvents) {
      await publishEvent(event);

      // Add a small delay between events to simulate real-world scenario
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("=".repeat(60));
    console.log(`✅ Successfully published ${sampleEvents.length} events`);
  } catch (error) {
    console.error("❌ Error in publishEvents:", error);
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
