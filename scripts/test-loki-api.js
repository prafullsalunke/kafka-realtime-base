#!/usr/bin/env node

/**
 * Test script for Loki API endpoints
 * Run with: node scripts/test-loki-api.js
 */

const BASE_URL = "http://localhost:3100";

async function testLokiAPI() {
  console.log("🧪 Testing Loki API endpoints...\n");

  try {
    // Test 1: Check if Loki is ready
    console.log("1. Testing Loki readiness...");
    const readyResponse = await fetch(`${BASE_URL}/ready`);
    console.log(
      `   Status: ${readyResponse.status} ${readyResponse.statusText}`
    );
    console.log(`   Ready: ${readyResponse.ok ? "✅" : "❌"}\n`);

    // Test 2: Get all labels
    console.log("2. Getting all labels...");
    const labelsResponse = await fetch(`${BASE_URL}/loki/api/v1/labels`);
    const labelsData = await labelsResponse.json();
    console.log(`   Status: ${labelsResponse.status}`);
    console.log(`   Labels: ${JSON.stringify(labelsData.data, null, 2)}\n`);

    // Test 3: Get logType label values
    console.log("3. Getting logType values...");
    const logTypeResponse = await fetch(
      `${BASE_URL}/loki/api/v1/label/logType/values`
    );
    const logTypeData = await logTypeResponse.json();
    console.log(`   Status: ${logTypeResponse.status}`);
    console.log(`   Log Types: ${JSON.stringify(logTypeData.data, null, 2)}\n`);

    // Test 4: Query recent logs
    console.log("4. Querying recent logs...");
    const now = Date.now() * 1000000; // Convert to nanoseconds
    const oneHourAgo = now - 60 * 60 * 1000000000; // 1 hour ago

    const queryUrl = new URL(`${BASE_URL}/loki/api/v1/query_range`);
    queryUrl.searchParams.set("query", '{job="kafka-node-events"}');
    queryUrl.searchParams.set("start", oneHourAgo.toString());
    queryUrl.searchParams.set("end", now.toString());
    queryUrl.searchParams.set("limit", "10");

    const queryResponse = await fetch(queryUrl.toString());
    const queryData = await queryResponse.json();

    console.log(`   Status: ${queryResponse.status}`);
    console.log(`   Result Type: ${queryData.data?.resultType}`);
    console.log(`   Number of streams: ${queryData.data?.result?.length || 0}`);

    if (queryData.data?.result?.length > 0) {
      console.log("   Sample log entries:");
      queryData.data.result.forEach((stream, index) => {
        console.log(`   Stream ${index + 1}:`);
        console.log(`     Labels: ${JSON.stringify(stream.stream)}`);
        if (stream.values.length > 0) {
          console.log(
            `     First log: ${stream.values[0][1].substring(0, 100)}...`
          );
        }
      });
    }
    console.log("");

    // Test 5: Query by logType
    console.log("5. Querying audit logs...");
    const auditQueryUrl = new URL(`${BASE_URL}/loki/api/v1/query_range`);
    auditQueryUrl.searchParams.set(
      "query",
      '{job="kafka-node-events", logType="audit"}'
    );
    auditQueryUrl.searchParams.set("start", oneHourAgo.toString());
    auditQueryUrl.searchParams.set("end", now.toString());
    auditQueryUrl.searchParams.set("limit", "5");

    const auditResponse = await fetch(auditQueryUrl.toString());
    const auditData = await auditResponse.json();

    console.log(`   Status: ${auditResponse.status}`);
    console.log(
      `   Audit logs found: ${auditData.data?.result?.length || 0} streams`
    );
    console.log("");

    // Test 6: Query protected logs
    console.log("6. Querying protected logs...");
    const protectedQueryUrl = new URL(`${BASE_URL}/loki/api/v1/query_range`);
    protectedQueryUrl.searchParams.set(
      "query",
      '{job="kafka-node-events", logType="protected"}'
    );
    protectedQueryUrl.searchParams.set("start", oneHourAgo.toString());
    protectedQueryUrl.searchParams.set("end", now.toString());
    protectedQueryUrl.searchParams.set("limit", "5");

    const protectedResponse = await fetch(protectedQueryUrl.toString());
    const protectedData = await protectedResponse.json();

    console.log(`   Status: ${protectedResponse.status}`);
    console.log(
      `   Protected logs found: ${
        protectedData.data?.result?.length || 0
      } streams`
    );
    console.log("");

    // Test 7: Instant query
    console.log("7. Testing instant query...");
    const instantQueryUrl = new URL(`${BASE_URL}/loki/api/v1/query`);
    instantQueryUrl.searchParams.set("query", '{job="kafka-node-events"}');
    instantQueryUrl.searchParams.set("limit", "5");

    const instantResponse = await fetch(instantQueryUrl.toString());
    const instantData = await instantResponse.json();

    console.log(`   Status: ${instantResponse.status}`);
    console.log(
      `   Instant query result type: ${instantData.data?.resultType}`
    );
    console.log(
      `   Number of streams: ${instantData.data?.result?.length || 0}`
    );
    console.log("");

    console.log("✅ All API tests completed successfully!");
  } catch (error) {
    console.error("❌ Error testing Loki API:", error.message);
    console.log("\n💡 Make sure:");
    console.log("   1. Docker containers are running: npm run docker:up");
    console.log("   2. Loki is accessible at http://localhost:3100");
    console.log(
      "   3. Some logs have been generated: npm run produce && npm run consume"
    );
  }
}

// Run the tests
testLokiAPI();
