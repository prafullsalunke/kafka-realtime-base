# Kafka Event Logging with Protected Data Handling

## Overview

This document describes a complete event-streaming system using Kafka, Node.js, and Grafana that handles both regular and sensitive (protected) events. The system separates sensitive data into protected log files while providing a unified view in the monitoring UI.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Node.js       │    │   Node.js       │    │   Grafana       │
│   Producer      │───▶│   Consumer      │───▶│   + Loki        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       ▲
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              │
│   Kafka         │    │   Log Files     │              │
│   (events-log)  │    │                 │              │
└─────────────────┘    │  • application.log             │
                       │  • application-protected.log   │
                       └─────────────────┘              │
                                │                       │
                                ▼                       │
                       ┌─────────────────┐              │
                       │   Promtail      │──────────────┘
                       │   (Log Agent)   │
                       └─────────────────┘
```

## Tools & Technologies Used

### Core Technologies
- **Apache Kafka** - Event streaming platform
- **Node.js** - Runtime environment
- **KafkaJS** - Kafka client for Node.js
- **Winston** - Logging library

### Monitoring & Visualization
- **Grafana** - Web UI for log visualization
- **Loki** - Log aggregation system
- **Promtail** - Log collection agent

### Infrastructure
- **Docker Compose** - Container orchestration
- **Confluent Kafka** - Kafka distribution
- **Kafka UI** - Web interface for Kafka management

## Key Features

### 1. Dual Logging System
- **Regular logs**: `logs/application/application.log`
- **Protected logs**: `logs/application/application-protected.log`

### 2. Security Features
- Sensitive data (payments) automatically routed to protected logs
- Console output redacts sensitive information
- Full data preserved in protected log files
- Separate access controls possible

### 3. Unified Monitoring
- Both log files appear merged in Grafana
- Single query shows all events chronologically
- Filtering by event type, log type, or content

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Git

### 1. Clone and Setup
```bash
git clone <repository>
cd kafka-realtime
npm install
```

### 2. Environment Configuration
```bash
cp env.example .env
# Edit .env file with your configuration
```

### 3. Start Infrastructure
```bash
npm run docker:up
```

### 4. Verify Services
```bash
docker-compose ps
```

## Configuration Details

### Winston Logger Configuration (`src/config/logger.js`)

```javascript
// Regular logger for standard events
const logger = winston.createLogger({
  // ... configuration for application.log
});

// Protected logger for sensitive events
const protectedLogger = winston.createLogger({
  // ... configuration for application-protected.log
  // Console output redacts sensitive data
});
```

### Promtail Configuration (`config/promtail-config.yaml`)

```yaml
# Merged view configuration
- job_name: application-logs-merged
  static_configs:
    - targets: [localhost]
      labels:
        job: application-merged
        __path__: /var/log/application/application.log
    - targets: [localhost]
      labels:
        job: application-merged
        __path__: /var/log/application/application-protected.log
```

### Consumer Logic (`src/consumer/consume.js`)

```javascript
// Route events to appropriate logger
const isPaymentEvent = event.type === 'payment_processed';
if (isPaymentEvent) {
  protectedLogger.info("Payment event received", logData);
} else {
  logger.info("Message received", logData);
}
```

## Usage Examples

### 1. Producing Events

```bash
# Generate sample events (including payment events)
npm run produce
```

**Sample Events Generated:**
- `user_signup` - Regular event
- `order_created` - Regular event  
- `payment_processed` - **Protected event**
- `product_viewed` - Regular event
- `cart_updated` - Regular event

### 2. Consuming Events

```bash
# Start consumer to process events
npm run consume
```

**What Happens:**
- Regular events → `application.log`
- Payment events → `application-protected.log`
- Console shows redacted payment data

### 3. Viewing Logs in Grafana

**Access Grafana:** http://localhost:3000
- Username: `admin`
- Password: `admin`

#### Query Examples

**View All Events (Merged):**
```
{job="application-merged"}
```

**View Only Regular Events:**
```
{job="application"}
```

**View Only Payment Events:**
```
{job="application-merged"} |= "payment_processed"
```

**Filter by Event Type:**
```
{job="application-merged"} |= "user_signup"
{job="application-merged"} |= "order_created"
```

**View Protected Logs Only:**
```
{job="application-merged"} | json | logType="protected"
```

## Log File Structure

### Regular Log (`application.log`)
```json
{
  "level": "info",
  "message": "Message received",
  "eventType": "user_signup",
  "eventData": {
    "type": "user_signup",
    "userId": "user_123",
    "email": "user123@example.com"
  },
  "service": "consumer",
  "timestamp": "2025-07-16T19:01:03.498Z"
}
```

### Protected Log (`application-protected.log`)
```json
{
  "level": "info",
  "message": "Payment event received",
  "logType": "protected",
  "eventType": "payment_processed",
  "eventData": {
    "type": "payment_processed",
    "paymentId": "payment_789",
    "amount": 99.99,
    "method": "credit_card",
    "processor": "stripe"
  },
  "service": "consumer",
  "timestamp": "2025-07-16T19:01:07.221Z"
}
```

## Security Considerations

### 1. Data Separation
- Sensitive data automatically isolated
- Different file permissions possible
- Separate backup strategies

### 2. Access Control
- Protected logs can have restricted file permissions
- Grafana access can be controlled by user roles
- Log file access can be monitored

### 3. Compliance
- GDPR compliance for personal data
- PCI DSS considerations for payment data
- Audit trail maintenance

## Monitoring & Alerting

### 1. Grafana Dashboards
Create dashboards for:
- Event processing rates
- Error rates by event type
- Payment processing metrics
- System health indicators

### 2. Alerting Rules
Set up alerts for:
- High error rates
- Payment processing failures
- System downtime
- Unusual event patterns

### 3. Metrics to Track
- Events per second
- Processing latency
- Error rates
- Payment success rates

## Troubleshooting

### Common Issues

**1. Logs Not Appearing in Grafana**
```bash
# Check Promtail status
docker-compose logs promtail

# Verify log files exist
ls -la logs/application/
```

**2. Protected Logs Not Created**
```bash
# Check consumer logs
docker-compose logs consumer

# Verify payment events are being processed
grep "payment_processed" logs/application/application.log
```

**3. Grafana Connection Issues**
```bash
# Check Grafana status
docker-compose ps grafana

# Verify Loki is running
docker-compose ps loki
```

### Debug Commands

```bash
# View all logs
npm run logs:all

# View specific service logs
npm run logs:kafka
npm run logs:ui

# Check log file contents
tail -f logs/application/application.log
tail -f logs/application/application-protected.log
```

## Extending the System

### 1. Adding New Protected Event Types
```javascript
// In src/consumer/consume.js
const protectedEventTypes = ['payment_processed', 'credit_card_updated', 'ssn_verified'];
const isProtectedEvent = protectedEventTypes.includes(event.type);
```

### 2. Adding New Log Levels
```javascript
// In src/config/logger.js
const securityLogger = winston.createLogger({
  // Configuration for security events
});
```

### 3. Custom Alerting
```javascript
// Add alerting logic in consumer
if (event.type === 'payment_processed' && event.amount > 1000) {
  // Trigger high-value payment alert
}
```

## Best Practices

### 1. Log Management
- Implement log rotation
- Set up log retention policies
- Monitor log file sizes
- Regular log analysis

### 2. Security
- Encrypt sensitive log files
- Implement access controls
- Regular security audits
- Monitor for suspicious patterns

### 3. Performance
- Monitor log processing performance
- Optimize log queries
- Implement log sampling for high-volume events
- Use appropriate log levels

## Conclusion

This system provides a robust foundation for handling both regular and sensitive events in a Kafka-based architecture. The dual logging approach ensures data security while maintaining operational visibility through unified monitoring in Grafana.

The modular design allows for easy extension and customization based on specific business requirements and compliance needs. 