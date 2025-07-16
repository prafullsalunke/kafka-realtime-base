#!/bin/bash

# Log viewer script for Kafka Node Events project

LOG_DIR="./logs"
SYSLOG_DIR="$LOG_DIR/syslog-ng"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}Kafka Node Events - Log Viewer${NC}"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  kafka          - View Kafka broker logs"
    echo "  kafka-ui       - View Kafka UI logs"
    echo "  syslog         - View syslog-ng logs"
    echo "  events         - View event messages from Kafka topic"
    echo "  all            - View all logs (tail -f)"
    echo "  clean          - Clean all log files"
    echo "  help           - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 kafka       - View Kafka logs"
    echo "  $0 events      - View event messages"
    echo "  $0 all         - Monitor all logs in real-time"
}

# Function to check if logs directory exists
check_logs_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        echo -e "${RED}Error: Logs directory not found.${NC}"
        echo "Make sure you've started the Docker services first:"
        echo "  docker-compose up -d"
        exit 1
    fi
}

# Function to view Kafka logs
view_kafka_logs() {
    echo -e "${GREEN}=== Kafka Broker Logs ===${NC}"
    if [ -f "$SYSLOG_DIR/kafka.log" ]; then
        tail -f "$SYSLOG_DIR/kafka.log"
    else
        echo -e "${YELLOW}No Kafka logs found. Start the services first.${NC}"
    fi
}

# Function to view Kafka UI logs
view_kafka_ui_logs() {
    echo -e "${GREEN}=== Kafka UI Logs ===${NC}"
    if [ -f "$SYSLOG_DIR/kafka-ui.log" ]; then
        tail -f "$SYSLOG_DIR/kafka-ui.log"
    else
        echo -e "${YELLOW}No Kafka UI logs found. Start the services first.${NC}"
    fi
}

# Function to view syslog-ng logs
view_syslog_logs() {
    echo -e "${GREEN}=== Syslog-ng Logs ===${NC}"
    if [ -f "$SYSLOG_DIR/syslog-ng.log" ]; then
        tail -f "$SYSLOG_DIR/syslog-ng.log"
    else
        echo -e "${YELLOW}No syslog-ng logs found. Start the services first.${NC}"
    fi
}

# Function to view event messages
view_events() {
    echo -e "${GREEN}=== Event Messages from Kafka Topic ===${NC}"
    echo "Reading messages from events-log topic..."
    docker exec kafka kafka-console-consumer \
        --bootstrap-server localhost:9092 \
        --topic events-log \
        --from-beginning \
        --property print.timestamp=true \
        --property print.key=true \
        --property print.value=true
}

# Function to view all logs
view_all_logs() {
    echo -e "${GREEN}=== Monitoring All Logs ===${NC}"
    echo "Press Ctrl+C to stop monitoring"
    echo ""
    
    # Use tail -f on all log files
    tail -f "$SYSLOG_DIR"/*.log 2>/dev/null | while read line; do
        echo "$line"
    done
}

# Function to clean logs
clean_logs() {
    echo -e "${YELLOW}Cleaning all log files...${NC}"
    if [ -d "$LOG_DIR" ]; then
        rm -rf "$LOG_DIR"/*
        echo -e "${GREEN}Logs cleaned successfully!${NC}"
    else
        echo -e "${YELLOW}No logs directory found.${NC}"
    fi
}

# Main script logic
case "${1:-help}" in
    kafka)
        check_logs_dir
        view_kafka_logs
        ;;
    kafka-ui)
        check_logs_dir
        view_kafka_ui_logs
        ;;
    syslog)
        check_logs_dir
        view_syslog_logs
        ;;
    events)
        view_events
        ;;
    all)
        check_logs_dir
        view_all_logs
        ;;
    clean)
        clean_logs
        ;;
    help|*)
        show_usage
        ;;
esac 