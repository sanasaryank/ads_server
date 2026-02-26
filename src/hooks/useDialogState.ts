/**
 * useDialogState Hook
 * Generic hook for managing dialog/modal state with open/close functionality
 */

import { useState, useCallback } from 'react';

export interface UseDialogStateOptions<T = any> {
  /** Initial open state */
  initialOpen?: boolean;
  /** Initial data/context */
  initialData?: T | null;
  /** Callback when dialog opens */
  onOpen?: (data?: T) => void;
  /** Callback when dialog closes */
  onClose?: () => void;
}

export interface UseDialogStateReturn<T = any> {
  /** Whether dialog is open */
  open: boolean;
  /** Dialog context data */
  data: T | null;
  /** Open the dialog with optional data */
  openDialog: (data?: T) => void;
  /** Close the dialog */
  closeDialog: () => void;
  /** Toggle dialog state */
  toggleDialog: () => void;
  /** Set dialog data without opening */
  setData: (data: T | null) => void;
}

export function useDialogState<T = any>(
  options: UseDialogStateOptions<T> = {}
): UseDialogStateReturn<T> {
  const { initialOpen = false, initialData = null, onOpen, onClose } = options;
  
  const [open, setOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(initialData);

  const openDialog = useCallback(
    (dialogData?: T) => {
      if (dialogData !== undefined) {
        setData(dialogData);
      }
      setOpen(true);
      onOpen?.(dialogData);
    },
    [onOpen]
  );

  const closeDialog = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const toggleDialog = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return {
    open,
    data,
    openDialog,
    closeDialog,
    toggleDialog,
    setData,
  };
}
