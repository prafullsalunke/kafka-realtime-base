# Kafka Node Events

A comprehensive Kafka event-streaming example using **Node.js** and **Docker Compose**. This project demonstrates how to build a real-time event streaming system with KafkaJS, featuring both producer and consumer implementations.

## 🚀 Features

- **KafkaJS Integration**: Latest Kafka client for Node.js
- **Docker Compose Setup**: Complete Kafka + Zookeeper + UI environment
- **Producer with Retry Logic**: Robust event publishing with exponential backoff
- **Consumer with Graceful Handling**: Continuous message consumption with error recovery
- **Kafdrop UI**: Web-based Kafka management interface
- **Sample Events**: Realistic e-commerce event examples
- **Environment Configuration**: Flexible configuration via environment variables
- **🔒 Protected Data Logging**: Separate handling of sensitive events with unified monitoring
- **📊 Grafana + Loki**: Advanced log aggregation and visualization

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Docker** and **Docker Compose**
- **Git**

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kafka-node-events
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env file if needed (defaults work for local development)
   ```

## 🐳 Quick Start

### Option 1: Full Demo (Recommended)
```bash
# Start everything and run the complete demo
npm run setup
```

### Option 2: Step by Step
```bash
# 1. Start Kafka infrastructure
npm run docker:up

# 2. Wait for services to be ready (check logs)
npm run docker:logs

# 3. Run the complete demo
npm start
```

## 🔒 Protected Data Logging Feature

This project includes advanced logging capabilities for handling sensitive data:

### Key Features
- **Dual Logging System**: Regular events and sensitive events are logged separately
- **Automatic Routing**: Payment events automatically go to protected log files
- **Console Redaction**: Sensitive data is redacted in console output
- **Unified Monitoring**: Both log types appear merged in Grafana for easy monitoring
- **Security Ready**: Separate access controls and compliance features

### Quick Demo
```bash
# Start services
npm run docker:up

# Generate events (including payment events)
npm run produce

# Process events (payment events go to protected logs)
npm run consume &

# View in Grafana: http://localhost:3000 (admin/admin)
# Query: {job="application-merged"}
```

### Documentation
- **[Complete Guide](docs/KAFKA_EVENT_LOGGING_WITH_PROTECTED_DATA.md)** - Detailed documentation
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Commands and queries

## 📁 Project Structure

```
kafka-node-events/
│
├── docker-compose.yml          # Kafka & monitoring setup
├── env.example                 # Environment configuration template
├── package.json               # Node.js dependencies and scripts
├── config/
│   ├── syslog-ng.conf         # Syslog-ng configuration
│   ├── promtail-config.yaml   # Log collection configuration
│   ├── loki-config.yaml       # Loki configuration
│   └── grafana-datasources.yaml # Grafana data sources
├── scripts/
│   └── view-logs.sh           # Log viewer script
├── logs/                      # 📍 LOCAL LOG STORAGE (gitignored)
│   ├── kafka/                 # Kafka data and logs
│   ├── kafka-logs/            # Kafka application logs
│   ├── kafka-ui/              # Kafka UI logs
│   ├── syslog-ng/             # Syslog-ng centralized logs
│   └── application/           # Application logs (regular + protected)
├── src/
│   ├── config/
│   │   ├── kafka.js           # Kafka client configuration
│   │   └── logger.js          # Winston logger setup
│   ├── producer/
│   │   └── produce.js         # Event publishing logic
│   ├── consumer/
│   │   └── consume.js         # Message consumption logic
│   └── index.js               # Main demo entry point
├── docs/
│   ├── KAFKA_EVENT_LOGGING_WITH_PROTECTED_DATA.md # Complete guide
│   └── QUICK_REFERENCE.md     # Quick reference
└── README.md                  # This file
```

## 🎯 Usage

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the complete demo (producer + consumer) |
| `npm run produce` | Publish sample events to Kafka |
| `npm run consume` | Start consuming messages from Kafka |
| `npm run dev` | Run with nodemon for development |
| `npm run docker:up` | Start Kafka infrastructure |
| `npm run docker:down` | Stop Kafka infrastructure |
| `npm run docker:logs` | View Docker logs |
| `npm run setup` | Complete setup and demo |

#### Log Management Commands

| Command | Description |
|---------|-------------|
| `npm run logs:kafka` | View Kafka broker logs |
| `npm run logs:ui` | View Kafka UI logs |
| `npm run logs:syslog` | View syslog-ng logs |
| `npm run logs:events` | View event messages from Kafka |
| `npm run logs:all` | Monitor all logs in real-time |
| `npm run logs:clean` | Clean all log files |

### Individual Components

#### Producer
```bash
npm run produce
```
Publishes 5 sample events:
- `user_signup`
- `order_created`
- `payment_processed`
- `product_viewed`
- `cart_updated`

#### Consumer
```bash
npm run consume
```
Continuously consumes messages with:
- Real-time processing
- Partition and offset tracking
- Simulated processing delays
- Graceful error handling

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Kafka Configuration
KAFKA_BROKER_URL=localhost:9092
KAFKA_TOPIC=events-log
KAFKA_CLIENT_ID=kafka-node-events
KAFKA_CONSUMER_GROUP_ID=events-consumer-group

# Producer Configuration
PRODUCER_RETRY_ATTEMPTS=3

# Consumer Configuration
CONSUMER_SESSION_TIMEOUT=30000
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| Kafka | 9092 | Main Kafka broker (KRaft mode) |
| Kafdrop UI | 9000 | Web-based Kafka management |
| Grafana | 3000 | Log visualization and monitoring |
| Loki | 3100 | Log aggregation and querying |
| Custom Log UI | 8081 | Custom log viewer with Loki API |
| Syslog-ng | 514 | Centralized logging system |

## 📊 Monitoring & Logging

### Kafdrop UI
Access the Kafka management interface at: http://localhost:9000

Features:
- Topic management
- Message browsing
- Consumer group monitoring
- Real-time metrics

### Custom Log UI
Access the custom log viewer at: http://localhost:8081

Features:
- Real-time log viewing with Loki API
- LogQL query support
- Auto-refresh capability
- Log type filtering (normal, audit, protected)
- Statistics dashboard
- CORS-enabled for external integrations

### Local Log Storage
All logs are stored locally in the `./logs/` directory:

```bash
./logs/
├── kafka/              # Kafka data & logs
├── kafka-logs/         # Kafka application logs  
├── kafka-ui/           # Kafka UI logs
└── syslog-ng/          # Syslog-ng centralized logs
```

### Log Viewing Commands
```bash
# View different log types
npm run logs:kafka      # Kafka broker logs
npm run logs:ui         # Kafka UI logs
npm run logs:syslog     # Syslog-ng logs
npm run logs:events     # Event messages from Kafka
npm run logs:all        # Monitor all logs in real-time
npm run logs:clean      # Clean all log files
```

### Docker Logs
```bash
# View all logs
npm run docker:logs

# View specific service logs
docker-compose logs -f kafka
docker-compose logs -f syslog-ng
```

## 🧪 Sample Events

The producer generates realistic e-commerce events:

```json
{
  "type": "user_signup",
  "userId": "user_123",
  "email": "user123@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "source": "web",
    "ip": "192.168.1.100"
  }
}
```

## 🔄 Event Flow

1. **Producer** connects to Kafka broker
2. **Events** are published to `events-log` topic
3. **Consumer** subscribes to the topic
4. **Messages** are processed with metadata logging
5. **Processing delays** simulate real-world scenarios

## 🛡️ Error Handling

### Producer
- Automatic retry with exponential backoff
- Connection error recovery
- Graceful shutdown

### Consumer
- Message parsing error handling
- Reconnection logic
- Graceful shutdown on SIGINT/SIGTERM

## 🚀 Production Considerations

### Scaling
- Multiple consumer instances for load balancing
- Partition-based parallelism
- Consumer group coordination

### Monitoring & Logging
- Kafka metrics and health checks
- Application logging and alerting
- Performance monitoring
- Centralized logging with syslog-ng
- Local log storage for easy access

### Security
- SASL/SSL authentication
- Topic access control
- Network security

## 🐛 Troubleshooting

### Common Issues

1. **Kafka not starting**
   ```bash
   # Check Docker resources
   docker system prune
   docker-compose down -v
   docker-compose up -d
   ```

2. **Connection refused**
   ```bash
   # Wait for services to be ready
   npm run docker:logs
   # Check if port 9092 is available
   ```

3. **Consumer not receiving messages**
   ```bash
   # Check consumer group
   # Verify topic exists
   # Check offset configuration
   ```

4. **Log viewing issues**
   ```bash
   # Check if logs directory exists
   ls -la logs/
   
   # Clean and restart if needed
   npm run logs:clean
   docker-compose restart
   ```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# View all logs in real-time
npm run logs:all
```

## 📚 Resources

- [KafkaJS Documentation](https://kafka.js.org/)
- [Confluent Kafka Docker](https://docs.confluent.io/platform/current/quickstart/docker.html)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Syslog-ng Documentation](https://www.syslog-ng.com/technical-documents/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Happy Event Streaming! 🎉** 

## Running Producer and Consumer via Docker Compose

To run the producer:

```sh
docker-compose run --rm producer
```

To run the consumer:

```sh
docker-compose run --rm consumer
```

Both services use the same code and .env file, and will connect to the Kafka broker at `kafka:9092`.

> **Note:** If you run the Node.js scripts on your host, set `KAFKA_BROKER_URL=localhost:9092` in your `.env`. For Docker Compose, use `kafka:9092`. 