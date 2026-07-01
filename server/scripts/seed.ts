/**
 * Seeds system defaults: categories + optional admin user. Safe to run repeatedly.
 * Usage: npm run seed
 */
import { connectDB, disconnectDB } from '../src/config/db';
import { Category } from '../src/models/Category';
import { User } from '../src/models/User';
import { env } from '../src/config/env';
import { DEFAULT_CATEGORIES } from '../src/config/defaultCategories';

async function seed() {
  await connectDB();

  let categoriesCreated = 0;
  for (const cat of DEFAULT_CATEGORIES) {
    const res = await Category.updateOne(
      { user: null, type: cat.type, name: cat.name },
      { $setOnInsert: { ...cat, user: null, isDefault: true } },
      { upsert: true },
    );
    if (res.upsertedCount) categoriesCreated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `✅ Categories: ${categoriesCreated} created, ${
      DEFAULT_CATEGORIES.length - categoriesCreated
    } already existed.`,
  );

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
