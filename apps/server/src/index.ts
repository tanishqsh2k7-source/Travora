import { createApp } from "./app.js";
import { connectDB } from "./db.js";
import env from "./config.js";

async function main() {
  await connectDB();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(
      `[server] Travora API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`
    );
  });
}

main().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});

