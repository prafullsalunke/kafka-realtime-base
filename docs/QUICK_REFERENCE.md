# Quick Reference Guide - Kafka Event Logging with Protected Data

## 🚀 Quick Start

```bash
# Start all services
npm run docker:up

# Generate events
npm run produce

# Process events (in background)
npm run consume &

# View logs in Grafana
# http://localhost:3000 (admin/admin)
```

## 📊 Grafana Queries

### View All Events (Merged)
```
{job="application-merged"}
```

### View Only Regular Events
```
{job="application"}
```

### View Only Payment Events
```
{job="application-merged"} |= "payment_processed"
```

### View Protected Logs Only
```
{job="application-merged"} | json | logType="protected"
```

### Filter by Event Type
```
{job="application-merged"} |= "user_signup"
{job="application-merged"} |= "order_created"
{job="application-merged"} |= "payment_processed"
```

## 🔧 Common Commands

### Service Management
```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# Restart services
npm run docker:restart

# View service status
docker-compose ps
```

### Log Management
```bash
# View all logs
npm run logs:all

# View specific logs
npm run logs:kafka
npm run logs:ui
npm run logs:syslog

# View log files directly
tail -f logs/application/application.log
tail -f logs/application/application-protected.log
```

### Event Generation
```bash
# Generate sample events
npm run produce

# Start consumer
npm run consume

# Run both (setup script)
npm run setup
```

## 📁 File Structure

```
kafka-realtime/
├── logs/
│   └── application/
│       ├── application.log          # Regular events
│       ├── application-protected.log # Payment/sensitive events
│       └── error.log                # Error logs
├── src/
│   ├── config/
│   │   ├── kafka.js                 # Kafka configuration
│   │   └── logger.js                # Winston logger setup
│   ├── producer/
│   │   └── produce.js               # Event producer
│   └── consumer/
│       └── consume.js               # Event consumer
└── config/
    ├── promtail-config.yaml         # Log collection config
    └── grafana-datasources.yaml     # Grafana data sources
```

## 🔒 Protected Event Types

Currently protected:
- `payment_processed`

To add more protected events, edit `src/consumer/consume.js`:
```javascript
const protectedEventTypes = ['payment_processed', 'credit_card_updated', 'ssn_verified'];
```

## 🌐 Service URLs

- **Grafana**: http://localhost:3000 (admin/admin)
- **Kafka UI**: http://localhost:9000
- **Kafka**: localhost:9092
- **Loki**: localhost:3100

## 🐛 Troubleshooting

### Logs Not in Grafana
```bash
docker-compose logs promtail
ls -la logs/application/
```

### Services Not Starting
```bash
docker-compose ps
docker-compose logs <service-name>
```

### Payment Events Not Protected
```bash
grep "payment_processed" logs/application/application.log
grep "payment_processed" logs/application/application-protected.log
```

## 📈 Monitoring Queries

### Event Processing Rate
```
rate({job="application-merged"}[5m])
```

### Error Rate
```
rate({job="application-merged"} |= "error"[5m])
```

### Payment Success Rate
```
rate({job="application-merged"} |= "payment_processed" |= "success"[5m])
```

## 🔐 Security Features

- ✅ Sensitive data in separate files
- ✅ Console output redaction
- ✅ Full data in protected logs
- ✅ Unified monitoring view
- ✅ Access control ready

## 📝 Log Examples

### Regular Event
```json
{
  "level": "info",
  "message": "Message received",
  "eventType": "user_signup",
  "service": "consumer"
}
```

### Protected Event
```json
{
  "level": "info",
  "message": "Payment event received",
  "logType": "protected",
  "eventType": "payment_processed",
  "service": "consumer"
}
``` 