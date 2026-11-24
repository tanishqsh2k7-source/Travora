import type { CreateTripRequest, TravelStyle, PacePreference } from "@travora/contracts";
import { getChatModel } from "../agents/llm.js";
import { HumanMessage } from "@langchain/core/messages";

const KNOWN_DESTINATIONS: Record<string, { city: string; country: string; defaultCurrency: string }> = {
  paris: { city: "Paris", country: "France", defaultCurrency: "EUR" },
  tokyo: { city: "Tokyo", country: "Japan", defaultCurrency: "JPY" },
  udaipur: { city: "Udaipur", country: "India", defaultCurrency: "INR" },
  jodhpur: { city: "Jodhpur", country: "India", defaultCurrency: "INR" },
  jaipur: { city: "Jaipur", country: "India", defaultCurrency: "INR" },
  delhi: { city: "Delhi", country: "India", defaultCurrency: "INR" },
  mumbai: { city: "Mumbai", country: "India", defaultCurrency: "INR" },
  lisbon: { city: "Lisbon", country: "Portugal", defaultCurrency: "EUR" },
  london: { city: "London", country: "UK", defaultCurrency: "GBP" },
  rome: { city: "Rome", country: "Italy", defaultCurrency: "EUR" },
  barcelona: { city: "Barcelona", country: "Spain", defaultCurrency: "EUR" },
  amsterdam: { city: "Amsterdam", country: "Netherlands", defaultCurrency: "EUR" },
  "new york": { city: "New York", country: "USA", defaultCurrency: "USD" },
  "san francisco": { city: "San Francisco", country: "USA", defaultCurrency: "USD" },
  dubai: { city: "Dubai", country: "UAE", defaultCurrency: "AED" },
  bali: { city: "Bali", country: "Indonesia", defaultCurrency: "USD" },
  bangkok: { city: "Bangkok", country: "Thailand", defaultCurrency: "USD" },
  singapore: { city: "Singapore", country: "Singapore", defaultCurrency: "SGD" },
  dehradun: { city: "Dehradun", country: "India", defaultCurrency: "INR" },
  denver: { city: "Denver", country: "USA", defaultCurrency: "USD" },
  detroit: { city: "Detroit", country: "USA", defaultCurrency: "USD" },
};

function getDefaultFutureDates(durationDays = 4): { start: string; end: string } {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 30); // 30 days ahead

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (durationDays - 1));

  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
  };
}

export async function parseTripPrompt(prompt: string): Promise<{
  tripRequest: CreateTripRequest;
  summary: string;
}> {
  const p = prompt.trim();

  // Try LLM parsing if GEMINI_API_KEY is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const llm = getChatModel();
      const systemPrompt = `You are an expert travel intake agent. Convert the user's natural language trip request into a JSON structure matching the schema below:
{
  "destination": "City, Country",
  "origin": "City, Country",
  "durationDays": 4,
  "adults": 2,
  "children": 0,
  "budgetAmount": 2000,
  "currency": "USD" | "EUR" | "GBP" | "INR",
  "interests": ["culture", "food", "museums"],
  "travelStyle": "budget" | "balanced" | "luxury" | "fast-paced" | "relaxed",
  "pace": "relaxed" | "moderate" | "fast",
  "summary": "Brief 1-sentence trip intent summary"
}

If details are omitted in the prompt, apply sensible defaults:
- Default adults = 2, children = 0.
- Default duration = 4 days.
- Default origin = "London, UK" unless specified.
- Default budgetAmount = 2000 with currency appropriate to destination or prompt.
- Default travelStyle = "balanced", pace = "moderate".

Output ONLY valid JSON.`;

      const response = await llm.invoke([
        new HumanMessage(`${systemPrompt}\n\nUser request: "${p}"`),
      ]);

      const content = typeof response.content === "string" ? response.content : "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const duration = typeof parsed.durationDays === "number" && parsed.durationDays > 0 ? parsed.durationDays : 4;
        const dates = getDefaultFutureDates(duration);

        const amountNum = typeof parsed.budgetAmount === "number" && parsed.budgetAmount > 0 ? parsed.budgetAmount : 2000;
        const currencyStr = (parsed.currency || "USD").toUpperCase();

        const tripRequest: CreateTripRequest = {
          origin: parsed.origin || "London, UK",
          destination: parsed.destination || "Paris, France",
          startDate: dates.start,
          endDate: dates.end,
          timezone: "UTC",
          travellers: {
            adults: Math.max(1, parsed.adults || 2),
            children: Math.max(0, parsed.children || 0),
            infants: 0,
          },
          budget: {
            amount: Math.round(amountNum * 100),
            currency: currencyStr,
            flexibilityPct: 10,
          },
          interests: Array.isArray(parsed.interests) && parsed.interests.length > 0
            ? parsed.interests
            : ["culture", "food", "museums", "history"],
          travelStyle: (parsed.travelStyle as TravelStyle) || "balanced",
          transportPreferences: ["public_transit", "walking"],
          constraints: {
            accessibility: [],
            dietary: [],
            pace: (parsed.pace as PacePreference) || "moderate",
          },
        };

        return {
          tripRequest,
          summary: parsed.summary || `Personalized ${duration}-day trip to ${tripRequest.destination}`,
        };
      }
    } catch (err) {
      console.warn("LLM prompt parsing fallback to rule-based:", err);
    }
  }

  // Robust Rule-Based Parser
  const lower = p.toLowerCase();

  // 1. Destination
  let destination = "Paris, France";
  let targetCurrency = "EUR";

  for (const [key, info] of Object.entries(KNOWN_DESTINATIONS)) {
    if (lower.includes(key)) {
      destination = `${info.city}, ${info.country}`;
      targetCurrency = info.defaultCurrency;
      break;
    }
  }

  // Check for "to <city>" pattern
  const toMatch = lower.match(/\bto\s+([a-zA-Z\s]+?)(?:\s+for|\s+with|\s+from|\s+in|\s+under|\s+on|$)/i);
  if (toMatch && toMatch[1]) {
    const rawDest = toMatch[1].trim();
    if (rawDest.length >= 3 && !rawDest.includes("people") && !rawDest.includes("day")) {
      const matchKey = Object.keys(KNOWN_DESTINATIONS).find((k) => rawDest.includes(k));
      if (matchKey) {
        destination = `${KNOWN_DESTINATIONS[matchKey].city}, ${KNOWN_DESTINATIONS[matchKey].country}`;
        targetCurrency = KNOWN_DESTINATIONS[matchKey].defaultCurrency;
      } else {
        destination = rawDest.charAt(0).toUpperCase() + rawDest.slice(1);
      }
    }
  }

  // 2. Origin
  let origin = targetCurrency === "INR" ? "Delhi, India" : "London, UK";
  const fromMatch = lower.match(/\bfrom\s+([a-zA-Z\s]+?)(?:\s+to|\s+for|\s+with|\s+in|$)/i);
  if (fromMatch && fromMatch[1]) {
    origin = fromMatch[1].trim();
  }

  // 3. Travellers
  let adults = 2;
  let children = 0;

  if (lower.includes("solo") || lower.includes("1 person") || lower.includes("for myself") || lower.includes("alone")) {
    adults = 1;
  } else if (lower.includes("couple")) {
    adults = 2;
  } else {
    const peopleMatch = lower.match(/(\d+)\s*(?:people|persons|travellers|travelers|pax|adults|friends)/i);
    if (peopleMatch) {
      adults = parseInt(peopleMatch[1], 10) || 2;
    }
    const kidsMatch = lower.match(/(\d+)\s*(?:kids|children|child)/i);
    if (kidsMatch) {
      children = parseInt(kidsMatch[1], 10) || 0;
    }
  }

  // 4. Duration
  let durationDays = 4;
  const daysMatch = lower.match(/(\d+)\s*(?:days?|nights?)/i);
  if (daysMatch) {
    durationDays = Math.max(1, Math.min(14, parseInt(daysMatch[1], 10)));
  } else if (lower.includes("week")) {
    durationDays = 7;
  } else if (lower.includes("weekend")) {
    durationDays = 3;
  }

  // 5. Travel Style & Interests
  let travelStyle: TravelStyle = "balanced";
  if (lower.includes("luxury") || lower.includes("5 star") || lower.includes("premium")) {
    travelStyle = "luxury";
  } else if (lower.includes("budget") || lower.includes("backpack") || lower.includes("cheap")) {
    travelStyle = "budget";
  } else if (lower.includes("relaxed") || lower.includes("slow") || lower.includes("chill")) {
    travelStyle = "relaxed";
  }

  // 6. Currency & Budget (dynamic scaling when not specified)
  if (lower.includes("inr") || lower.includes("rs") || lower.includes("₹")) {
    targetCurrency = "INR";
  } else if (lower.includes("eur") || lower.includes("€") || lower.includes("euros")) {
    targetCurrency = "EUR";
  } else if (lower.includes("gbp") || lower.includes("£") || lower.includes("pounds")) {
    targetCurrency = "GBP";
  } else if (lower.includes("usd") || lower.includes("$") || lower.includes("dollars")) {
    targetCurrency = "USD";
  }

  const budgetNumMatch = lower.match(/(?:\$|€|£|₹|rs\.?|budget\s*(?:of)?\s*)(\d[\d,]*)/i);
  let budgetAmount: number;

  if (budgetNumMatch) {
    const rawNum = parseInt(budgetNumMatch[1].replace(/,/g, ""), 10);
    budgetAmount = rawNum > 0 ? rawNum : 150000;
  } else {
    // Dynamic estimate based on travelers, duration, and style when budget is not provided
    const totalTravelers = Math.max(1, adults + children);
    if (targetCurrency === "INR") {
      const perPersonDaily = travelStyle === "luxury" ? 16000 : travelStyle === "budget" ? 3500 : 7500;
      const flightPerPerson = travelStyle === "luxury" ? 20000 : travelStyle === "budget" ? 7000 : 12000;
      budgetAmount = (perPersonDaily * durationDays + flightPerPerson) * totalTravelers;
    } else {
      const perPersonDaily = travelStyle === "luxury" ? 420 : travelStyle === "budget" ? 110 : 220;
      const flightPerPerson = travelStyle === "luxury" ? 850 : travelStyle === "budget" ? 320 : 550;
      budgetAmount = (perPersonDaily * durationDays + flightPerPerson) * totalTravelers;
    }
  }

  const interests: string[] = [];
  if (lower.includes("food") || lower.includes("culinary") || lower.includes("dining") || lower.includes("wine")) interests.push("food");
  if (lower.includes("culture") || lower.includes("heritage") || lower.includes("temple") || lower.includes("palace")) interests.push("culture");
  if (lower.includes("museum") || lower.includes("art") || lower.includes("gallery")) interests.push("museums");
  if (lower.includes("history") || lower.includes("historic") || lower.includes("fort")) interests.push("history");
  if (lower.includes("nature") || lower.includes("park") || lower.includes("lake") || lower.includes("hiking")) interests.push("nature");
  if (lower.includes("shopping") || lower.includes("market") || lower.includes("bazaar")) interests.push("shopping");
  if (lower.includes("nightlife") || lower.includes("bars") || lower.includes("club")) interests.push("nightlife");

  if (interests.length === 0) {
    interests.push("culture", "food", "history", "museums");
  }

  const dates = getDefaultFutureDates(durationDays);

  const tripRequest: CreateTripRequest = {
    origin,
    destination,
    startDate: dates.start,
    endDate: dates.end,
    timezone: "UTC",
    travellers: { adults, children, infants: 0 },
    budget: {
      amount: Math.round(budgetAmount * 100),
      currency: targetCurrency,
      flexibilityPct: 10,
    },
    interests,
    travelStyle,
    transportPreferences: ["public_transit", "walking"],
    constraints: {
      accessibility: [],
      dietary: [],
      pace: travelStyle === "relaxed" ? "relaxed" : "moderate",
    },
  };

  return {
    tripRequest,
    summary: `Curated ${durationDays}-day ${travelStyle} trip to ${destination} for ${adults} ${adults === 1 ? "traveller" : "travellers"}`,
  };
}
