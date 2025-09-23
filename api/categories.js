import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('smart-calendar');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('taskcategories');

    switch (req.method) {
      case 'GET':
        const categories = await collection.find({}).toArray();
        res.status(200).json(categories);
        break;

      case 'POST':
        const newCategory = req.body;
        const insertResult = await collection.insertOne(newCategory);
        const createdCategory = await collection.findOne({ _id: insertResult.insertedId });
        res.status(201).json(createdCategory);
        break;

      case 'PUT':
        const categoryId = req.query.id || req.url.split('/').pop();
        const updateData = req.body;
        const updateResult = await collection.findOneAndUpdate(
          { id: categoryId },
          { $set: updateData },
          { returnDocument: 'after' }
        );
        res.status(200).json(updateResult.value);
        break;

      case 'DELETE':
        const deleteId = req.query.id || req.url.split('/').pop();
        await collection.deleteOne({ id: deleteId });
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}