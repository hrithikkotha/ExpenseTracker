import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

async function seedAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@expensetracker.com' });
  if (existing) {
    console.log('Admin account already exists. Ensuring role is admin...');
    existing.role = 'admin';
    await existing.save();
    console.log('Done.');
  } else {
    await User.create({
      name: 'Admin',
      email: 'admin@expensetracker.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });
    console.log('Admin account created: admin@expensetracker.com / admin123');
  }

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
