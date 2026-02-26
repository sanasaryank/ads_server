/**
 * Switch Field Component
 * Reusable switch control with label for react-hook-form
 */

import { Box, Typography } from '@mui/material';
import { Controller, type Control } from 'react-hook-form';
import Switch from '../atoms/Switch';

interface SwitchFieldProps {
  /** Control from react-hook-form */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  /** Field name */
  name: string;
  /** Label text */
  label: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Custom color for the label based on value */
  colorOnTrue?: string;
  /** Custom color for the label based on value */
  colorOnFalse?: string;
}

/**
 * Switch with label integrated with react-hook-form
 * 
 * @example
 * ```tsx
 * const { control } = useForm();
 * 
 * <SwitchField
 *   control={control}
 *   name="isBlocked"
 *   label="Blocked"
 *   colorOnTrue="error.main"
 *   colorOnFalse="text.secondary"
 * />
 * ```
 */
export const SwitchField = ({
  control,
  name,
  label,
  disabled = false,
  colorOnTrue,
  colorOnFalse,
}: SwitchFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Switch
            checked={field.value || false}
            onChange={field.onChange}
            disabled={disabled}
          />
          <Typography
            variant="body2"
            sx={{
              color: colorOnTrue && colorOnFalse
                ? field.value
                  ? colorOnTrue
                  : colorOnFalse
                : undefined,
            }}
          >
            {label}
          </Typography>
        </Box>
      )}
    />
  );
};

export default SwitchField;
