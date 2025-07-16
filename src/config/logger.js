import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
import fs from "fs";
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create application logs directory
const appLogsDir = path.join(logsDir, "application");
if (!fs.existsSync(appLogsDir)) {
  fs.mkdirSync(appLogsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "kafka-node-events" },
  transports: [
    // Write all logs to console in JSON format
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Write all logs to application.log
    new winston.transports.File({
      filename: path.join(appLogsDir, "application.log"),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(appLogsDir, "error.log"),
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Protected logger for sensitive data (payments, etc.)
const protectedLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "kafka-node-events", logType: "protected" },
  transports: [
    // Write protected logs to console in JSON format (with redaction)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
          ({ timestamp, level, message, logType, ...meta }) => {
            // Redact sensitive data in console output
            const redactedMeta = { ...meta };
            if (redactedMeta.eventData) {
              redactedMeta.eventData = "[REDACTED]";
            }
            return JSON.stringify({
              timestamp,
              level,
              message,
              logType: "protected",
              ...redactedMeta,
            });
          }
        )
      ),
    }),
    // Write protected logs to application-protected.log
    new winston.transports.File({
      filename: path.join(appLogsDir, "application-protected.log"),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

export default logger;
export { protectedLogger };
