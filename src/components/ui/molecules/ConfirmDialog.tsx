import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import Button from '../atoms/Button';

/**
 * Props для диалога подтверждения
 */
export interface ConfirmDialogProps {
  /** Состояние открытия диалога */
  open: boolean;
  /** Заголовок диалога */
  title: string;
  /** Текст сообщения */
  message: string;
  /** Обработчик подтверждения */
  onConfirm: () => void;
  /** Обработчик отмены */
  onCancel: () => void;
  /** Текст кнопки подтверждения */
  confirmText?: string;
  /** Текст кнопки отмены */
  cancelText?: string;
  /** Цвет кнопки подтверждения */
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

/**
 * Универсальный диалог подтверждения
 *
 * @example
 * ```tsx
 * const confirmDialog = useConfirmDialog();
 *
 * <ConfirmDialog
 *   open={confirmDialog.isOpen}
 *   title="Удалить элемент?"
 *   message="Вы уверены, что хотите удалить этот элемент?"
 *   onConfirm={confirmDialog.confirm}
 *   onCancel={confirmDialog.close}
 * />
 *
 * // Or spread dialog props
 * <ConfirmDialog {...confirmDialog.dialogProps} />
 * ```
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = React.memo(({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmColor = 'primary',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="text" color="secondary">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
