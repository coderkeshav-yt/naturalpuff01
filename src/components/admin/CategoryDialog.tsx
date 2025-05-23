
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveCategory: (category: string) => Promise<void>;
  isSubmitting: boolean;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onOpenChange,
  onSaveCategory,
  isSubmitting
}) => {
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  const handleSave = async () => {
    if (!newCategory.trim()) {
      toast({ title: "Error", description: "Category name cannot be empty." });
      return;
    }

    try {
      await onSaveCategory(newCategory.trim());
      setNewCategory('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const handleClose = () => {
    setNewCategory('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add New Category</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the name of the new category you want to add.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="newCategory">Category Name</Label>
          <Input
            type="text"
            id="newCategory"
            placeholder="Category Name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? 'Adding...' : 'Add Category'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CategoryDialog;
