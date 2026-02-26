import { useState, useCallback } from 'react';

/**
 * Configuration for opening a confirm dialog
 */
export interface ConfirmDialogConfig {
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Function to call when user confirms */
  onConfirm: () => void;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
}

/**
 * Props to spread on confirm dialog component
 */
export interface ConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm handler */
  onConfirm: () => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
}

/**
 * Return type for useConfirmDialog hook
 */
export interface UseConfirmDialogReturn {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Open dialog with config */
  open: (config: ConfirmDialogConfig) => void;
  /** Close dialog */
  close: () => void;
  /** Confirm and close dialog */
  confirm: () => void;
  /** Props to spread on dialog component */
  dialogProps: ConfirmDialogProps;
}

/**
 * Hook for managing confirm dialog state
 *
 * @returns Object with dialog state and control functions
 *
 * @example
 * ```tsx
 * const confirmDialog = useConfirmDialog();
 *
 * const handleDelete = () => {
 *   confirmDialog.open({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     onConfirm: () => {
 *       // Perform delete
 *     },
 *   });
 * };
 *
 * return (
 *   <div>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog {...confirmDialog.dialogProps} />
 *   </div>
 * );
 * ```
 */
function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<ConfirmDialogConfig>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const open = useCallback((dialogConfig: ConfirmDialogConfig) => {
    setConfig(dialogConfig);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = useCallback(() => {
    config.onConfirm();
    close();
  }, [config, close]);

  const dialogProps: ConfirmDialogProps = {
    open: isOpen,
    title: config.title,
    message: config.message,
    onConfirm: confirm,
    onCancel: close,
    confirmText: config.confirmText,
    cancelText: config.cancelText,
  };

  return {
    isOpen,
    open,
    close,
    confirm,
    dialogProps,
  };
}

export default useConfirmDialog;
