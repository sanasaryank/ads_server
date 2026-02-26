import React from 'react';
import {
  Autocomplete as MuiAutocomplete,
  TextField,
} from '@mui/material';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

/**
 * Option for Autocomplete
 */
export interface AutocompleteOption {
  /** Option value */
  value: string | number;
  /** Display text */
  label: string;
  /** Option disabled */
  disabled?: boolean;
}

/**
 * Props for Autocomplete component
 */
interface AutocompleteProps {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Selected value */
  value: string | number | null;
  /** Change handler */
  onChange: (value: string | number | null) => void;
  /** Options list */
  options: AutocompleteOption[];
  /** Has error */
  error?: boolean;
  /** Helper/error text */
  helperText?: string;
  /** Required field */
  required?: boolean;
  /** Field disabled */
  disabled?: boolean;
  /** Field takes full width */
  fullWidth?: boolean;
  /** Placeholder */
  placeholder?: string;
}

/**
 * Autocomplete component with search/filter functionality
 *
 * @example
 * ```tsx
 * <Autocomplete
 *   name="campaign"
 *   label="Campaign"
 *   value={campaignId}
 *   onChange={setCampaignId}
 *   options={campaigns.map(c => ({ value: c.id, label: c.name }))}
 *   required
 *   fullWidth
 * />
 * ```
 */
const Autocomplete: React.FC<AutocompleteProps> = React.memo(({
  name,
  label,
  value,
  onChange,
  options,
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder,
}) => {
  // Find the selected option object
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <MuiAutocomplete
      fullWidth={fullWidth}
      disabled={disabled}
      options={options}
      value={selectedOption}
      onChange={(_event, newValue) => {
        onChange(newValue ? newValue.value : null);
      }}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderInput={(params: AutocompleteRenderInputParams) => (
        <TextField
          {...params}
          name={name}
          label={label}
          error={error}
          helperText={helperText}
          required={required}
          placeholder={placeholder}
          variant="outlined"
        />
      )}
      noOptionsText="No options"
    />
  );
});

Autocomplete.displayName = 'Autocomplete';

export default Autocomplete;
