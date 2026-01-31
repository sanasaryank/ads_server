import React from 'react';
import {
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material';

/**
 * Option for RadioGroup
 */
export interface RadioOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Option is disabled */
  disabled?: boolean;
}

/**
 * Props for RadioGroup component
 */
export interface RadioGroupProps {
  /** Input name attribute */
  name?: string;
  /** Label text */
  label?: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Available options */
  options: RadioOption[];
  /** Error state */
  error?: boolean;
  /** Helper/error text */
  helperText?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Layout direction */
  row?: boolean;
}

/**
 * RadioGroup component - wrapper around MUI RadioGroup
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   name="mode"
 *   label="Mode"
 *   value={mode}
 *   onChange={setMode}
 *   options={[
 *     { value: 'allowed', label: 'Allowed' },
 *     { value: 'denied', label: 'Denied' }
 *   ]}
 *   row
 * />
 * ```
 */
const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  error = false,
  helperText,
  required = false,
  disabled = false,
  row = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl component="fieldset" error={error} disabled={disabled} fullWidth>
      {label && (
        <FormLabel component="legend" required={required}>
          {label}
        </FormLabel>
      )}
      <MuiRadioGroup
        name={name}
        value={value}
        onChange={handleChange}
        row={row}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
            disabled={option.disabled || disabled}
          />
        ))}
      </MuiRadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default React.memo(RadioGroup);
