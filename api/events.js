import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

// At top of file, add helper
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("smart-calendar");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("calendarevents");
          // Inside handler:
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      const eventId =
      parsedUrl.searchParams.get("id") || req.url.split("/").pop();

    switch (req.method) {
      case "GET":
        const events = await collection.find({}).toArray();
        const eventsWithId = events.map((event) => ({
          ...event,
          id: event.id || event._id.toString(),
        }));
        res.status(200).json(eventsWithId);
        break;

  

      case "POST":
        const newEvent = await parseBody(req); // ✅
        const insertResult = await collection.insertOne(newEvent);

      case "PUT":
        const updateData = await parseBody(req); // ✅
        const updateResult = await collection.findOneAndUpdate(
          { id: eventId },
          { $set: updateData },
          { returnDocument: "after" }
        );

      case "DELETE":
        const deleteId = req.query.id || req.url.split("/").pop();
        await collection.deleteOne({ id: deleteId });
        res.status(204).end();
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
