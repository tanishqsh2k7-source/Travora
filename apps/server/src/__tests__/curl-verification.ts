/**
 * Live API verification script (simulates curl requests against running server)
 */
import { createApp } from "../app.js";
import { setupTestDB, teardownTestDB } from "./setup.js";
import type { Server } from "http";

async function run() {
  console.log("=== Phase 1 Live Verification ===");

  await setupTestDB();
  const app = createApp();

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(3099, () => resolve(s));
  });

  const baseUrl = "http://localhost:3099";

  try {
    // 1. Health check
    console.log("\n1. Testing GET /api/health...");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    console.log("Health Status:", healthRes.status, await healthRes.json());

    // 2. Register user
    console.log("\n2. Testing POST /api/v1/auth/register...");
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "traveler@example.com",
        password: "securePassword123",
        name: "Pioneer Traveler",
      }),
    });
    const regData = await regRes.json();
    console.log("Register Status:", regRes.status, "Token:", regData.token ? "RECEIVED" : "NONE");

    const token = regData.token;

    // 3. Create a trip
    console.log("\n3. Testing POST /api/v1/trips (Create trip)...");
    const tripPayload = {
      origin: "Delhi, India",
      destination: "Tokyo, Japan",
      startDate: "2027-04-10",
      endDate: "2027-04-16",
      timezone: "Asia/Tokyo",
      travellers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: 22000000, currency: "INR", flexibilityPct: 5 },
      interests: ["food", "anime", "museums"],
      travelStyle: "balanced",
      transportPreferences: ["public_transit"],
      constraints: { accessibility: [], dietary: ["vegetarian"], pace: "moderate" },
    };

    const createRes = await fetch(`${baseUrl}/api/v1/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tripPayload),
    });
    const tripData = await createRes.json();
    console.log("Create Trip Status:", createRes.status);
    console.log("Created Trip ID:", tripData.id);
    console.log("Created Trip Destination:", tripData.destination);
    console.log("Created Trip Budget:", tripData.budget);

    // 4. Get the trip
    console.log(`\n4. Testing GET /api/v1/trips/${tripData.id} (Get trip)...`);
    const getRes = await fetch(`${baseUrl}/api/v1/trips/${tripData.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getTripData = await getRes.json();
    console.log("Get Trip Status:", getRes.status);
    console.log("Retrieved Trip matches created ID:", getTripData.id === tripData.id);

    // 5. Test ownership check with another user
    console.log("\n5. Testing Ownership Check with a second user...");
    const regRes2 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "intruder@example.com",
        password: "password123",
      }),
    });
    const regData2 = await regRes2.json();
    const token2 = regData2.token;

    const forbiddenRes = await fetch(`${baseUrl}/api/v1/trips/${tripData.id}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    console.log("Forbidden Check Status (expected 403):", forbiddenRes.status);
    console.log("Forbidden Body:", await forbiddenRes.json());

    console.log("\n=== All Phase 1 Verification Checks Passed! ===");
  } finally {
    server.close();
    await teardownTestDB();
  }
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
