import { consumer } from "../config/kafka.js";
import logger, { protectedLogger } from "../config/logger.js";
import dotenv from "dotenv";

dotenv.config();

const topic = process.env.KAFKA_TOPIC || "events-log";

async function connectConsumer() {
  try {
    await consumer.connect();
    logger.info("Consumer connected successfully", { service: "consumer" });
  } catch (error) {
    logger.error("Failed to connect consumer", {
      error: error.message,
      service: "consumer",
    });
    throw error;
  }
}

async function disconnectConsumer() {
  try {
    await consumer.disconnect();
    logger.info("Consumer disconnected successfully", { service: "consumer" });
  } catch (error) {
    logger.error("Error disconnecting consumer", {
      error: error.message,
      service: "consumer",
    });
  }
}

async function subscribeToTopic() {
  try {
    await consumer.subscribe({
      topic,
      fromBeginning: false, // Start consuming from the latest offset
    });
    logger.info("Subscribed to topic", { topic, service: "consumer" });
  } catch (error) {
    logger.error("Failed to subscribe to topic", {
      error: error.message,
      topic,
      service: "consumer",
    });
    throw error;
  }
}

function processMessage(message) {
  try {
    const event = JSON.parse(message.value.toString());
    const timestamp = new Date().toLocaleString();

    // Determine logType - use event's logType or determine based on event type
    const logType =
      event.logType ||
      (event.type === "user_signup" || event.type === "user_signin"
        ? "audit"
        : "normal");

    // Use protected logger for payment events, regular logger for others
    const isPaymentEvent = event.type === "payment_processed";
    const logData = {
      timestamp,
      key: message.key?.toString() || "N/A",
      partition: message.partition,
      offset: message.offset,
      eventType: event.type,
      eventId: event.userId || event.orderId || event.paymentId || "N/A",
      eventData: event,
      service: "consumer",
    };

    if (isPaymentEvent) {
      // For payment events, use protected logger (logType is already set to "protected" in logger config)
      // Remove any logType from event data to ensure it uses the logger's default
      const { logType: eventLogType, ...eventDataWithoutLogType } =
        logData.eventData;
      logData.eventData = eventDataWithoutLogType;
      protectedLogger.info("Payment event received", logData);
    } else {
      // For non-payment events, add logType to the log data
      logData.logType = logType;
      logger.info("Message received", logData);
    }

    // Simulate processing time (mimic real-world lag)
    const processingDelay = Math.random() * 2000 + 500; // 500ms to 2.5s
    const delayLogData = {
      processingDelay: processingDelay.toFixed(0),
      service: "consumer",
    };

    if (isPaymentEvent) {
      // For payment events, delay log data already has logType: "protected" from logger config
      protectedLogger.info("Payment processing delay calculated", delayLogData);
    } else {
      // For non-payment events, add logType to delay log data
      delayLogData.logType = logType;
      logger.info("Processing delay calculated", delayLogData);
    }

    return { success: true, processingDelay, isPaymentEvent, logType };
  } catch (error) {
    logger.error("Error processing message", {
      error: error.message,
      service: "consumer",
    });
    return { success: false, error: error.message };
  }
}

async function startConsuming() {
  try {
    await connectConsumer();
    await subscribeToTopic();

    logger.info("Starting to consume messages", { topic, service: "consumer" });

    let messageCount = 0;

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messageCount++;

        logger.info("Processing message", {
          messageNumber: messageCount,
          service: "consumer",
        });

        const result = await processMessage(message);

        if (result.success) {
          if (result.isPaymentEvent) {
            // For payment events, use protected logger (logType is already "protected")
            const successLogData = {
              messageNumber: messageCount,
              service: "consumer",
            };
            protectedLogger.info(
              "Payment message processed successfully",
              successLogData
            );
          } else {
            // For non-payment events, add logType to success log data
            const successLogData = {
              messageNumber: messageCount,
              logType: result.logType,
              service: "consumer",
            };
            logger.info("Message processed successfully", successLogData);
          }
        } else {
          logger.error("Message processing failed", {
            messageNumber: messageCount,
            error: result.error,
            service: "consumer",
          });
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
    logger.error("Error in startConsuming", {
      error: error.message,
      service: "consumer",
    });

    // Attempt to reconnect after a delay
    logger.info("Attempting to reconnect", {
      delay: 5000,
      service: "consumer",
    });
    setTimeout(() => {
      disconnectConsumer().then(() => {
        startConsuming();
      });
    }, 5000);
  }
}

// Graceful shutdown handling
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully", {
    service: "consumer",
  });
  await disconnectConsumer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully", {
    service: "consumer",
  });
  await disconnectConsumer();
  process.exit(0);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startConsuming();
}

export { startConsuming, connectConsumer, disconnectConsumer };
