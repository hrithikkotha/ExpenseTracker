import { Category, type CategoryDocument } from '../models/Category';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/AppError';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../validators/category.validators';

interface Filter {
  type?: 'income' | 'expense';
}

/**
 * Lists the system defaults (user: null) plus the user's own categories.
 * Sorted defaults-first, then alphabetically.
 */
export async function listCategories(
  userId: string,
  filter: Filter,
): Promise<CategoryDocument[]> {
  const query: Record<string, unknown> = {
    $or: [{ user: null }, { user: userId }],
  };
  if (filter.type) query.type = filter.type;

  return Category.find(query).sort({ isDefault: -1, name: 1 });
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
): Promise<CategoryDocument> {
  try {
    return await Category.create({
      user: userId,
      name: input.name,
      type: input.type,
      icon: input.icon,
      color: input.color,
      isDefault: false,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw AppError.conflict(
        `You already have a ${input.type} category named "${input.name}"`,
      );
    }
    throw err;
  }
}

/**
 * Fetches a category the user is allowed to mutate: it must be owned by them
 * and not a system default. Anything else (missing, default, other user's)
 * surfaces as 404 to avoid leaking existence.
 */
async function findOwnedOrThrow(
  userId: string,
  id: string,
): Promise<CategoryDocument> {
  const category = await Category.findById(id);
  if (!category || category.isDefault || String(category.user) !== userId) {
    throw AppError.notFound('Category not found');
  }
  return category;
}

export async function updateCategory(
  userId: string,
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryDocument> {
  const category = await findOwnedOrThrow(userId, id);
  // Note: `type` is intentionally immutable to keep future transactions
  // consistent with their category's type.
  if (input.name !== undefined) category.name = input.name;
  if (input.icon !== undefined) category.icon = input.icon;
  if (input.color !== undefined) category.color = input.color;

  try {
    return await category.save();
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw AppError.conflict('You already have a category with that name');
    }
    throw err;
  }
}

export async function deleteCategory(
  userId: string,
  id: string,
): Promise<void> {
  const category = await findOwnedOrThrow(userId, id);

  // Prevent orphaning transactions: block deletion while any reference it.
  const inUse = await Transaction.countDocuments({
    user: userId,
    category: id,
  });
  if (inUse > 0) {
    throw AppError.conflict(
      `This category is used by ${inUse} transaction(s). Reassign or delete them first.`,
    );
  }

  await category.deleteOne();
}
