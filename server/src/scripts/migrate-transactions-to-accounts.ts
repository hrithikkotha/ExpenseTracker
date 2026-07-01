import { connectDB, disconnectDB } from '../config/db';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { User } from '../models/User';

/**
 * Migration script to assign existing transactions to default accounts.
 *
 * This script:
 * 1. Finds all users with transactions but no accounts
 * 2. Creates a default Cash account for them
 * 3. Assigns all existing transactions to the default account
 * 4. Updates account balances
 *
 * Run with: npm run migrate:accounts
 */

async function migrateTransactionsToAccounts() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);

    let migratedCount = 0;
    let accountsCreated = 0;

    for (const user of users) {
      // Check if user has any accounts
      const existingAccount = await Account.findOne({ user: user._id });

      let defaultAccount;
      if (!existingAccount) {
        // Create default Cash account
        defaultAccount = await Account.create({
          user: user._id,
          name: 'Cash',
          type: 'cash',
          icon: '💵',
          color: '#22c55e',
          currency: user.currency,
          openingBalance: 0,
          currentBalance: 0,
          isDefault: true,
          includeInNetWorth: true,
        });
        accountsCreated++;
        console.log(`  ✅ Created default account for user ${user.email}`);
      } else {
        // Use existing default account or first account
        defaultAccount = await Account.findOne({ user: user._id, isDefault: true }) || existingAccount;
      }

      // Find transactions without account field
      const transactionsToMigrate = await Transaction.find({
        user: user._id,
        account: { $exists: false },
      });

      if (transactionsToMigrate.length > 0) {
        // Update all transactions to use default account
        await Transaction.updateMany(
          { user: user._id, account: { $exists: false } },
          { $set: { account: defaultAccount._id } }
        );

        migratedCount += transactionsToMigrate.length;
        console.log(`  ✅ Migrated ${transactionsToMigrate.length} transactions for user ${user.email}`);

        // Recalculate account balance
        const result = await Transaction.aggregate([
          {
            $match: {
              user: user._id,
              $or: [{ account: defaultAccount._id }, { toAccount: defaultAccount._id }],
            },
          },
          {
            $group: {
              _id: null,
              balance: {
                $sum: {
                  $cond: [
                    { $eq: ['$account', defaultAccount._id] },
                    {
                      $cond: [
                        { $eq: ['$type', 'income'] },
                        '$amount',
                        { $cond: [{ $eq: ['$type', 'expense'] }, { $multiply: ['$amount', -1] }, { $multiply: ['$amount', -1] }] },
                      ],
                    },
                    '$amount',
                  ],
                },
              },
            },
          },
        ]);

        const calculatedBalance = result[0]?.balance ?? 0;
        defaultAccount.currentBalance = defaultAccount.openingBalance + calculatedBalance;
        await defaultAccount.save();

        console.log(`  ✅ Updated account balance: ${defaultAccount.currentBalance}`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Accounts created: ${accountsCreated}`);
    console.log(`   - Transactions migrated: ${migratedCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration
migrateTransactionsToAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
