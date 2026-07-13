import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

async function run() {
  await mongoose.connect(MONGO_URI);
  const total = await User.countDocuments({});
  const admins = await User.countDocuments({ role: 'admin' });
  const regular = await User.countDocuments({ role: 'user' });
  console.log(`Total users: ${total}`);
  console.log(`Admins: ${admins}`);
  console.log(`Regular users: ${regular}`);
  
  if (regular > 0) {
    const list = await User.find({ role: 'user' }).limit(5);
    console.log('Sample regular users:', list.map(u => ({ name: u.name, email: u.email })));
  }
  await mongoose.disconnect();
}

run().catch(console.error);
