/**
 * Seeds system defaults: optional admin user. Safe to run repeatedly.
 * Usage: npm run seed
 */
import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { env } from '../src/config/env';

async function seed() {
  await connectDB();

  // Admin user
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const existing = await User.findOne({ email: env.ADMIN_EMAIL });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        // eslint-disable-next-line no-console
        console.log(`✅ Admin: role updated for ${env.ADMIN_EMAIL}`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`✅ Admin: ${env.ADMIN_EMAIL} already exists.`);
      }
    } else {
      await User.create({
        name: 'Admin',
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      });
      // eslint-disable-next-line no-console
      console.log(`✅ Admin: created ${env.ADMIN_EMAIL}`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('⚠️  Admin: ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping.');
  }

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
