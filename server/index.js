import { checkEnv } from "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";
import { warmUpEmbedder } from "./services/rag.js";

checkEnv();
await connectDB();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  warmUpEmbedder(); // load the embedding model in the background
});
