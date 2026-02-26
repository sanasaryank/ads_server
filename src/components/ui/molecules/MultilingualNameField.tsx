/**
 * Multilingual Name Field Component
 * Reusable component for entering names in three languages (ARM, ENG, RUS)
 * with flag icons
 */

import { Stack, Box, InputAdornment } from '@mui/material';
import { Controller, type Control } from 'react-hook-form';
import TextField from '../atoms/TextField';

interface MultilingualNameFieldProps {
  /** Control from react-hook-form */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  /** Base field name (e.g., 'name') */
  name: string;
  /** Whether the fields are required */
  required?: boolean;
  /** Whether the fields are disabled */
  disabled?: boolean;
}

const LANGUAGES = [
  { code: 'ARM', flag: '🇦🇲', label: 'Armenian' },
  { code: 'ENG', flag: '🇺🇸', label: 'English' },
  { code: 'RUS', flag: '🇷🇺', label: 'Russian' },
] as const;

/**
 * Multilingual name input with three language fields (ARM, ENG, RUS)
 * 
 * Note: The label should be added as a Typography element ABOVE this component,
 * not passed as a prop. Each input field only shows a flag icon to differentiate languages.
 * 
 * @example
 * ```tsx
 * const { control } = useForm();
 * 
 * <Box>
 *   <Typography variant="body2" sx={{ mb: 1 }}>
 *     {t('fields.name')} *
 *   </Typography>
 *   <MultilingualNameField
 *     control={control}
 *     name="name"
 *     required
 *   />
 * </Box>
 * ```
 */
export const MultilingualNameField = ({
  control,
  name,
  required = false,
  disabled = false,
}: MultilingualNameFieldProps) => {
  return (
    <Stack spacing={1.5}>
      {LANGUAGES.map(({ code, flag }) => (
        <Controller
          key={code}
          name={`${name}.${code}`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label=""
              type="text"
              error={!!error}
              helperText={error?.message}
              required={required}
              disabled={disabled}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="span"
                      sx={{
                        fontSize: '1.5rem',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {flag}
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      ))}
    </Stack>
  );
};

export default MultilingualNameField;
