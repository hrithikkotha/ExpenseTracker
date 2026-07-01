import { Tag, type TagDocument } from '../models/Tag';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/AppError';

export interface CreateTagInput {
  name: string;
  color: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

export async function listTags(userId: string): Promise<TagDocument[]> {
  return Tag.find({ user: userId }).sort({ usageCount: -1, name: 1 });
}

export async function getTag(userId: string, id: string): Promise<TagDocument> {
  const tag = await Tag.findOne({ _id: id, user: userId });
  if (!tag) throw AppError.notFound('Tag not found');
  return tag;
}

export async function createTag(
  userId: string,
  input: CreateTagInput,
): Promise<TagDocument> {
  const existing = await Tag.findOne({ user: userId, name: input.name });
  if (existing) {
    throw AppError.conflict('A tag with this name already exists');
  }

  return Tag.create({
    user: userId,
    name: input.name,
    color: input.color,
    usageCount: 0,
  });
}

export async function updateTag(
  userId: string,
  id: string,
  input: UpdateTagInput,
): Promise<TagDocument> {
  const tag = await Tag.findOne({ _id: id, user: userId });
  if (!tag) throw AppError.notFound('Tag not found');

  if (input.name) {
    const existing = await Tag.findOne({
      user: userId,
      name: input.name,
      _id: { $ne: id },
    });
    if (existing) {
      throw AppError.conflict('A tag with this name already exists');
    }
    tag.name = input.name;
  }

  if (input.color) tag.color = input.color;

  await tag.save();
  return tag;
}

export async function deleteTag(userId: string, id: string): Promise<void> {
  const tag = await Tag.findOne({ _id: id, user: userId });
  if (!tag) throw AppError.notFound('Tag not found');

  // Remove tag from all transactions
  await Transaction.updateMany(
    { user: userId, tags: id },
    { $pull: { tags: id } }
  );

  await tag.deleteOne();
}

export async function getFrequentTags(
  userId: string,
  limit = 10,
): Promise<TagDocument[]> {
  return Tag.find({ user: userId }).sort({ usageCount: -1 }).limit(limit);
}

// Called internally when transaction tags change
export async function updateTagUsageCounts(userId: string): Promise<void> {
  const tags = await Tag.find({ user: userId });

  for (const tag of tags) {
    const count = await Transaction.countDocuments({
      user: userId,
      tags: tag._id,
    });
    tag.usageCount = count;
    await tag.save();
  }
}
