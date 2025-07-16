import { publishEvents } from "./producer/produce.js";
import { startConsuming } from "./consumer/consume.js";
import dotenv from "dotenv";

dotenv.config();

console.log("🚀 Kafka Node Events Demo");
console.log("=".repeat(50));
console.log(
  `📡 Kafka Broker: ${process.env.KAFKA_BROKER_URL || "localhost:9092"}`
);
console.log(`📋 Topic: ${process.env.KAFKA_TOPIC || "events-log"}`);
console.log(
  `👥 Consumer Group: ${
    process.env.KAFKA_CONSUMER_GROUP_ID || "events-consumer-group"
  }`
);
console.log("=".repeat(50));

async function runDemo() {
  try {
    console.log("\n🎯 Starting Kafka Event Streaming Demo...\n");

    // Start the consumer in the background
    console.log("🎧 Starting consumer...");
    const consumerPromise = startConsuming();

    // Wait a bit for consumer to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Publish events
    console.log("\n📤 Publishing sample events...");
    await publishEvents();

    // Wait for consumer to process messages
    console.log("\n⏳ Waiting for consumer to process messages...");
    console.log("Press Ctrl+C to stop the demo\n");

    // Keep the process running
    await consumerPromise;
  } catch (error) {
    console.error("❌ Error in demo:", error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\n🛑 Demo stopped by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Demo stopped by system");
  process.exit(0);
});

// Run the demo
runDemo();
