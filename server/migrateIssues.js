
const mongoose = require('mongoose');
require('dotenv').config();

const Issue = require('./models/Issue');

async function migrateIssues() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const oldUserId = new mongoose.Types.ObjectId(
      '6ae71b240326af1249b64bb2'
    );

    const newUserId = new mongoose.Types.ObjectId(
      '6ae722e149ac76d9123bf011'
    );

    const result = await Issue.updateMany(
      { createdBy: oldUserId },
      { $set: { createdBy: newUserId } }
    );

    console.log('Matched issues:', result.matchedCount);
    console.log('Updated issues:', result.modifiedCount);

  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

migrateIssues();
