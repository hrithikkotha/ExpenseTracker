import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTags } from '../hooks';
import { TagBadge } from './TagBadge';
import type { Tag } from '../types';

interface TagInputProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagInput({ selectedTags, onChange }: TagInputProps) {
  const { data: allTags = [] } = useTags();
  const [isOpen, setIsOpen] = useState(false);

  const availableTags = allTags.filter(
    (tag) => !selectedTags.some((selected) => selected._id === tag._id)
  );

  const handleAddTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t._id !== tagId));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Tags</label>

      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag._id}
            tag={tag}
            onRemove={() => handleRemoveTag(tag._id)}
          />
        ))}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm border rounded-full hover:bg-muted transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {isOpen && availableTags.length > 0 && (
        <div className="border rounded-lg p-2 bg-background shadow-lg max-h-48 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag._id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="hover:opacity-80 transition-opacity"
              >
                <TagBadge tag={tag} size="sm" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
