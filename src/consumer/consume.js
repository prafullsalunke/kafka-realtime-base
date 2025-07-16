import { consumer } from "../config/kafka.js";
import dotenv from "dotenv";

dotenv.config();

const topic = process.env.KAFKA_TOPIC || "events-log";

async function connectConsumer() {
  try {
    await consumer.connect();
    console.log("✅ Consumer connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect consumer:", error);
    throw error;
  }
}

async function disconnectConsumer() {
  try {
    await consumer.disconnect();
    console.log("✅ Consumer disconnected successfully");
  } catch (error) {
    console.error("❌ Error disconnecting consumer:", error);
  }
}

async function subscribeToTopic() {
  try {
    await consumer.subscribe({
      topic,
      fromBeginning: false, // Start consuming from the latest offset
    });
    console.log(`✅ Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error("❌ Failed to subscribe to topic:", error);
    throw error;
  }
}

function processMessage(message) {
  try {
    const event = JSON.parse(message.value.toString());
    const timestamp = new Date().toLocaleString();

    console.log("\n📨 Message Received:");
    console.log("=".repeat(50));
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`🔑 Key: ${message.key?.toString() || "N/A"}`);
    console.log(`📊 Partition: ${message.partition}`);
    console.log(`📍 Offset: ${message.offset}`);
    console.log(`📋 Event Type: ${event.type}`);
    console.log(
      `🆔 Event ID: ${
        event.userId || event.orderId || event.paymentId || "N/A"
      }`
    );
    console.log(`📝 Event Data:`, JSON.stringify(event, null, 2));
    console.log("=".repeat(50));

    // Simulate processing time (mimic real-world lag)
    const processingDelay = Math.random() * 2000 + 500; // 500ms to 2.5s
    console.log(`⏱️  Processing delay: ${processingDelay.toFixed(0)}ms`);

    return { success: true, processingDelay };
  } catch (error) {
    console.error("❌ Error processing message:", error);
    return { success: false, error: error.message };
  }
}

async function startConsuming() {
  try {
    await connectConsumer();
    await subscribeToTopic();

    console.log("🎧 Starting to consume messages...");
    console.log("Press Ctrl+C to stop the consumer");
    console.log("=".repeat(60));

    let messageCount = 0;

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messageCount++;

        console.log(`\n🔄 Processing message #${messageCount}`);

        const result = await processMessage(message);

        if (result.success) {
          console.log(`✅ Message #${messageCount} processed successfully`);
        } else {
          console.error(
            `❌ Message #${messageCount} processing failed:`,
            result.error
          );
        }

        // Simulate the processing delay
        if (result.processingDelay) {
          await new Promise((resolve) =>
            setTimeout(resolve, result.processingDelay)
          );
        }
      },

      eachBatch: async ({
        batch,
        resolveOffset,
        heartbeat,
        isRunning,
        isStale,
      }) => {
        for (const message of batch.messages) {
          if (!isRunning() || isStale()) break;

          await processMessage(message);
          resolveOffset(message.offset);
          await heartbeat();
        }
      },
    });
  } catch (error) {
    console.error("❌ Error in startConsuming:", error);

    // Attempt to reconnect after a delay
    console.log("🔄 Attempting to reconnect in 5 seconds...");
    setTimeout(() => {
      disconnectConsumer().then(() => {
        startConsuming();
      });
    }, 5000);
  }
}

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  await disconnectConsumer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  await disconnectConsumer();
  process.exit(0);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startConsuming();
}

export { startConsuming, connectConsumer, disconnectConsumer };
