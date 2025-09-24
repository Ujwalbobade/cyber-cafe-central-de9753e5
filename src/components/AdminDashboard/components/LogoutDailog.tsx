import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="card-gaming">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-gaming text-warning">Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription className="font-gaming">
            Are you sure you want to logout? You will need to login again to access the admin dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-gaming">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-warning text-warning-foreground hover:bg-warning/90 font-gaming"
            onClick={onConfirm}
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutDialog;

