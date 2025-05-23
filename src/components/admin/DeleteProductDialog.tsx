
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
import { Product } from "@/types/product";
import { Trash } from "lucide-react";

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  onConfirm,
  isSubmitting
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash className="h-5 w-5 text-red-500" />
            <span>Are you absolutely sure?</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{product?.name}</span>?
            <div className="mt-2 text-red-600">
              This will permanently delete the product from the database and remove it from your store.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProductDialog;
