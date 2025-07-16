# Loki and Promtail API Guide for Custom UI

This guide shows how to use the Loki and Promtail APIs to build your own custom logging UI.

## Overview

- **Loki**: Runs on `http://localhost:3100` - Provides the query API
- **Promtail**: Runs as a service - Collects logs and sends to Loki
- **Grafana**: Runs on `http://localhost:3000` - Built-in UI (optional)

## Loki API Endpoints

### Base URL: `http://localhost:3100`

### 1. Query Logs

#### Range Query (GET)
```bash
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="kafka-node-events"}' \
  --data-urlencode 'start=1640995200000000000' \
  --data-urlencode 'end=1640998800000000000' \
  --data-urlencode 'limit=100'
```

#### Instant Query (GET)
```bash
curl -G -s "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={job="kafka-node-events"}' \
  --data-urlencode 'limit=100'
```

#### Query Parameters:
- `query`: LogQL query string
- `start`: Start timestamp (nanoseconds)
- `end`: End timestamp (nanoseconds)
- `limit`: Maximum number of entries to return
- `direction`: `forward` or `backward` (default: `backward`)

### 2. List Labels

#### All Labels
```bash
curl -s "http://localhost:3100/loki/api/v1/labels"
```

#### Label Values
```bash
curl -s "http://localhost:3100/loki/api/v1/label/logType/values"
```

### 3. Series Query
```bash
curl -G -s "http://localhost:3100/loki/api/v1/series" \
  --data-urlencode 'match[]={job="kafka-node-events"}' \
  --data-urlencode 'start=1640995200000000000' \
  --data-urlencode 'end=1640998800000000000'
```

## LogQL Query Examples

### Basic Queries
```logql
# All logs from kafka-node-events job
{job="kafka-node-events"}

# Filter by logType
{job="kafka-node-events", logType="audit"}

# Filter by service
{job="kafka-node-events", service="consumer"}

# Filter by event type
{job="kafka-node-events"} |= "payment_processed"
```

### Advanced Queries
```logql
# Count logs by logType
sum by (logType) (count_over_time({job="kafka-node-events"}[5m]))

# Rate of logs per second
rate({job="kafka-node-events"}[5m])

# Error logs only
{job="kafka-node-events"} |= "error"

# Payment events with specific amount
{job="kafka-node-events"} |= "payment_processed" | json | amount > 50
```

## JavaScript/TypeScript Examples

### 1. Basic Log Query Function

```typescript
interface LogQueryParams {
  query: string;
  start?: number;
  end?: number;
  limit?: number;
  direction?: 'forward' | 'backward';
}

interface LogResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      stream: Record<string, string>;
      values: Array<[string, string]>;
    }>;
  };
}

async function queryLogs(params: LogQueryParams): Promise<LogResponse> {
  const url = new URL('http://localhost:3100/loki/api/v1/query_range');
  
  url.searchParams.set('query', params.query);
  if (params.start) url.searchParams.set('start', params.start.toString());
  if (params.end) url.searchParams.set('end', params.end.toString());
  if (params.limit) url.searchParams.set('limit', params.limit.toString());
  if (params.direction) url.searchParams.set('direction', params.direction);

  const response = await fetch(url.toString());
  return response.json();
}
```

### 2. React Hook for Log Queries

```typescript
import { useState, useEffect } from 'react';

interface UseLogsOptions {
  query: string;
  interval?: number; // Auto-refresh interval in ms
  enabled?: boolean;
}

export function useLogs({ query, interval, enabled = true }: UseLogsOptions) {
  const [logs, setLogs] = useState<LogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const end = Date.now() * 1000000; // Convert to nanoseconds
      const start = end - (60 * 60 * 1000000000); // 1 hour ago
      
      const result = await queryLogs({
        query,
        start,
        end,
        limit: 1000
      });
      
      setLogs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    if (interval) {
      const timer = setInterval(fetchLogs, interval);
      return () => clearInterval(timer);
    }
  }, [query, enabled, interval]);

  return { logs, loading, error, refetch: fetchLogs };
}
```

### 3. React Component Example

```typescript
import React, { useState } from 'react';
import { useLogs } from './useLogs';

interface LogViewerProps {
  defaultQuery?: string;
}

export function LogViewer({ defaultQuery = '{job="kafka-node-events"}' }: LogViewerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const { logs, loading, error, refetch } = useLogs({
    query,
    interval: 5000, // Refresh every 5 seconds
    enabled: true
  });

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) / 1000000).toLocaleString();
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="log-viewer">
      <div className="query-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Enter LogQL query..."
          className="query-input"
        />
        <button onClick={refetch} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="logs-container">
        {loading && <div>Loading logs...</div>}
        
        {logs?.data?.result?.map((stream, index) => (
          <div key={index} className="log-stream">
            <div className="stream-labels">
              {Object.entries(stream.stream).map(([key, value]) => (
                <span key={key} className="label">
                  {key}={value}
                </span>
              ))}
            </div>
            
            <div className="log-entries">
              {stream.values.map(([timestamp, logLine], logIndex) => (
                <div key={logIndex} className="log-entry">
                  <span className="timestamp">
                    {formatTimestamp(timestamp)}
                  </span>
                  <span className="log-line">{logLine}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Filter Components

```typescript
interface LogFilters {
  logType?: 'audit' | 'normal' | 'protected';
  service?: 'producer' | 'consumer';
  eventType?: string;
  timeRange?: '1h' | '6h' | '24h' | '7d';
}

function buildQuery(filters: LogFilters): string {
  let query = '{job="kafka-node-events"';
  
  if (filters.logType) {
    query += `, logType="${filters.logType}"`;
  }
  
  if (filters.service) {
    query += `, service="${filters.service}"`;
  }
  
  query += '}';
  
  if (filters.eventType) {
    query += ` |= "${filters.eventType}"`;
  }
  
  return query;
}

export function LogFilters({ onFiltersChange }: { onFiltersChange: (filters: LogFilters) => void }) {
  const [filters, setFilters] = useState<LogFilters>({});

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="log-filters">
      <select
        value={filters.logType || ''}
        onChange={(e) => handleFilterChange('logType', e.target.value)}
      >
        <option value="">All Log Types</option>
        <option value="audit">Audit</option>
        <option value="normal">Normal</option>
        <option value="protected">Protected</option>
      </select>

      <select
        value={filters.service || ''}
        onChange={(e) => handleFilterChange('service', e.target.value)}
      >
        <option value="">All Services</option>
        <option value="producer">Producer</option>
        <option value="consumer">Consumer</option>
      </select>

      <input
        type="text"
        placeholder="Event Type Filter"
        value={filters.eventType || ''}
        onChange={(e) => handleFilterChange('eventType', e.target.value)}
      />

      <select
        value={filters.timeRange || ''}
        onChange={(e) => handleFilterChange('timeRange', e.target.value)}
      >
        <option value="1h">Last Hour</option>
        <option value="6h">Last 6 Hours</option>
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
      </select>
    </div>
  );
}
```

## Promtail API

Promtail doesn't expose a REST API for querying logs directly. Instead, it:

1. **Reads log files** from the configured paths
2. **Sends logs to Loki** via HTTP/gRPC
3. **Exposes metrics** on `/metrics` endpoint (if configured)

### Promtail Metrics Endpoint
```bash
curl http://localhost:9080/metrics
```

## Error Handling

```typescript
class LokiAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'LokiAPIError';
  }
}

async function queryLogsWithErrorHandling(params: LogQueryParams): Promise<LogResponse> {
  try {
    const response = await fetch(/* ... */);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new LokiAPIError(
        `Loki API error: ${response.statusText}`,
        response.status,
        errorData
      );
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof LokiAPIError) {
      throw error;
    }
    throw new LokiAPIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}
```

## Security Considerations

1. **Authentication**: Loki doesn't have built-in auth - consider using a reverse proxy
2. **Rate Limiting**: Implement rate limiting in your UI
3. **Query Validation**: Validate LogQL queries before sending to Loki
4. **CORS**: Configure CORS if your UI is on a different domain

## Performance Tips

1. **Use appropriate time ranges** - don't query too much data at once
2. **Implement pagination** using the `limit` parameter
3. **Cache frequently used queries**
4. **Use instant queries** for real-time data
5. **Implement debouncing** for search inputs

## Testing the APIs

You can test the APIs using the provided curl commands or tools like Postman. Make sure your Docker containers are running:

```bash
# Check if Loki is running
curl http://localhost:3100/ready

# Test a simple query
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="kafka-node-events"}' \
  --data-urlencode 'start=1640995200000000000' \
  --data-urlencode 'end=1640998800000000000' \
  --data-urlencode 'limit=10'
```

This guide provides a foundation for building your own custom logging UI using the Loki and Promtail APIs. 