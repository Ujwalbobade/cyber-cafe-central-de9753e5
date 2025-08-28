import React from 'react';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Station",
  description,
  itemName
}) => {
  const defaultDescription = itemName 
    ? `Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`
    : "Are you sure you want to permanently delete this item? This action cannot be undone.";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="card-gaming">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-gaming text-error flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-gaming">
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-gaming" onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            className="bg-error text-error-foreground hover:bg-error/90 font-gaming"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;