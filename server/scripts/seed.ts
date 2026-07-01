/**
 * Seeds system default categories (idempotent). Safe to run repeatedly.
 * Usage: npm run seed
 */
import { connectDB, disconnectDB } from '../src/config/db';
import { Category } from '../src/models/Category';
import { DEFAULT_CATEGORIES } from '../src/config/defaultCategories';

async function seed() {
  await connectDB();

  let created = 0;
  for (const cat of DEFAULT_CATEGORIES) {
    const res = await Category.updateOne(
      { user: null, type: cat.type, name: cat.name },
      { $setOnInsert: { ...cat, user: null, isDefault: true } },
      { upsert: true },
    );
    if (res.upsertedCount) created += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `✅ Seed complete: ${created} created, ${
      DEFAULT_CATEGORIES.length - created
    } already existed.`,
  );

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
