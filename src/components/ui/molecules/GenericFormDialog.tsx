import { memo, useEffect, useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton as MuiIconButton,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Button } from '../atoms';
import FormField, { type FormFieldProps } from './FormField';
import { logger } from '@utils/logger';

/**
 * Configuration for a form field
 */
export interface FormFieldConfig<T extends FieldValues> {
  name: keyof T & string;
  label: string;
  type: FormFieldProps['type'];
  options?: FormFieldProps['options'];
  helperText?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  render?: (control: any, formValues?: T) => React.ReactNode;
}

/**
 * Configuration for a form tab
 */
export interface FormTab<T extends FieldValues> {
  label: string;
  fields: FormFieldConfig<T>[];
  render?: (control: any, formValues?: T) => React.ReactNode;
}

/**
 * Props for GenericFormDialog component
 */
export interface GenericFormDialogProps<T extends FieldValues> {
  /** Whether the dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Zod validation schema */
  schema: ZodSchema<T>;
  /** Default form values */
  defaultValues: T;
  /** Submit handler */
  onSubmit: (data: T) => Promise<void>;
  /** Close handler */
  onClose: () => void;
  /** Form fields configuration (for simple single-tab forms) */
  fields?: FormFieldConfig<T>[];
  /** Tabs configuration (for multi-tab forms) */
  tabs?: FormTab<T>[];
  /** Maximum dialog width */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom submit button text */
  submitText?: string;
  /** Custom cancel button text */
  cancelText?: string;
  /** Whether to show loading state */
  loading?: boolean;
}

/**
 * Generic reusable form dialog component
 * Reduces duplication of form setup logic across the application
 * 
 * @example
 * ```tsx
 * // Simple single-tab form
 * <GenericFormDialog
 *   open={open}
 *   title="Create User"
 *   schema={userSchema}
 *   defaultValues={{ name: '', email: '' }}
 *   onSubmit={handleSubmit}
 *   onClose={handleClose}
 *   fields={[
 *     { name: 'name', label: 'Name', type: 'text', required: true },
 *     { name: 'email', label: 'Email', type: 'text', required: true },
 *   ]}
 * />
 * 
 * // Multi-tab form
 * <GenericFormDialog
 *   open={open}
 *   title="Create Campaign"
 *   schema={campaignSchema}
 *   defaultValues={defaultValues}
 *   onSubmit={handleSubmit}
 *   onClose={handleClose}
 *   tabs={[
 *     {
 *       label: 'General',
 *       fields: [{ name: 'name', label: 'Name', type: 'text' }]
 *     },
 *     {
 *       label: 'Advanced',
 *       fields: [{ name: 'priority', label: 'Priority', type: 'number' }]
 *     }
 *   ]}
 * />
 * ```
 */
export const GenericFormDialog = memo(<T extends FieldValues>({
  open,
  title,
  schema,
  defaultValues,
  onSubmit,
  onClose,
  fields,
  tabs,
  maxWidth = 'md',
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
}: GenericFormDialogProps<T>) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
  });

  // Reset form when dialog opens/closes or default values change
  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setActiveTab(0);
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
      logger.error('Form submission error:', error as Error);
    }
  };

  const handleFormError = (errors: any) => {
    // Form validation errors are displayed inline by FormField components
    logger.warn('Form validation failed:', errors);
  };

  const renderFields = (fieldConfigs: FormFieldConfig<T>[]) => {
    return (
      <Stack spacing={2}>
        {fieldConfigs.map((field) => {
          if (field.render) {
            return <Box key={String(field.name)}>{field.render(control)}</Box>;
          }
          
          return (
            <FormField
              key={String(field.name)}
              name={field.name as any}
              control={control}
              type={field.type}
              label={field.label}
              options={field.options}
              helperText={field.helperText}
              required={field.required}
              multiline={field.multiline}
              rows={field.rows}
            />
          );
        })}
      </Stack>
    );
  };

  const hasTabs = tabs && tabs.length > 0;
  const hasFields = fields && fields.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      disableRestoreFocus
      hideBackdrop
      container={() => document.getElementById('modal-root')}
      TransitionProps={{
        timeout: 0,
      }}
      sx={{
        '& .MuiDialog-container': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box component="span" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {title}
        </Box>
        <MuiIconButton
          aria-label="close"
          onClick={onClose}
          disabled={isSubmitting || loading}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </MuiIconButton>
      </DialogTitle>

      {hasTabs && (
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 3, flexShrink: 0 }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      )}

      <DialogContent
        sx={{
          pt: 3,
          pb: 0,
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(handleFormSubmit, handleFormError)}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
            {hasTabs ? (
              tabs[activeTab]?.render ? (
                tabs[activeTab].render(control)
              ) : (
                renderFields(tabs[activeTab]?.fields || [])
              )
            ) : hasFields ? (
              renderFields(fields)
            ) : null}
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              position: 'sticky',
              bottom: 0,
            }}
          >
            <Button
              onClick={onClose}
              variant="outlined"
              disabled={isSubmitting || loading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || loading}
            >
              {submitText}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}) as <T extends FieldValues>(props: GenericFormDialogProps<T>) => React.ReactElement;

(GenericFormDialog as any).displayName = 'GenericFormDialog';
