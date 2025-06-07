import React from 'react';
import { COCOCategory } from '../types/coco';

interface ClassDropdownProps {
  categories: COCOCategory[];
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number) => void;
}

const ClassDropdown: React.FC<ClassDropdownProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
}) => {
  return (
    <div className="class-dropdown">
      <label htmlFor="category-select">Object Class:</label>
      <select
        id="category-select"
        value={selectedCategoryId || ''}
        onChange={(e) => onCategoryChange(Number(e.target.value))}
      >
        <option value="">Select a class...</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClassDropdown;
