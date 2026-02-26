import { Controller, type Control } from 'react-hook-form';
import TextField from '../atoms/TextField';
import Select, { type SelectOption } from '../atoms/Select';
import Autocomplete, { type AutocompleteOption } from '../atoms/Autocomplete';
import RadioGroup, { type RadioOption } from '../atoms/RadioGroup';
import Switch from '../atoms/Switch';
import Checkbox from '../atoms/Checkbox';
import { timestampToDateInput, dateInputToTimestamp } from '../../../utils/dateUtils';

/**
 * Props для обертки полей формы с Controller
 */
export interface FormFieldProps {
  /** Имя поля в форме */
  name: string;
  /** Control из react-hook-form */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  /** Метка поля */
  label: string;
  /** Тип поля */
  type?: 'text' | 'password' | 'email' | 'number' | 'date' | 'select' | 'autocomplete' | 'radio' | 'multiselect' | 'switch' | 'checkbox';
  /** Обязательное поле */
  required?: boolean;
  /** Опции для select/autocomplete/radio */
  options?: SelectOption[] | AutocompleteOption[] | RadioOption[];
  /** Поле неактивно */
  disabled?: boolean;
  /** Placeholder */
  placeholder?: string;
  /** Многострочное поле (для text) */
  multiline?: boolean;
  /** Количество строк (для multiline) */
  rows?: number;
  /** Helper text */
  helperText?: string;
}

/**
 * Обертка для полей формы с Controller из react-hook-form
 *
 * @example
 * ```tsx
 * const { control, handleSubmit } = useForm();
 *
 * <FormField
 *   name="email"
 *   control={control}
 *   label="Email"
 *   type="email"
 *   required
 * />
 *
 * <FormField
 *   name="status"
 *   control={control}
 *   label="Статус"
 *   type="select"
 *   options={[
 *     { value: 'active', label: 'Активен' },
 *     { value: 'inactive', label: 'Неактивен' },
 *   ]}
 *   required
 * />
 *
 * <FormField
 *   name="isActive"
 *   control={control}
 *   label="Активен"
 *   type="switch"
 * />
 * ```
 */
const FormField = ({
  name,
  control,
  label,
  type = 'text',
  required = false,
  options = [],
  disabled = false,
  placeholder,
  multiline = false,
  rows,
  helperText,
}: FormFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} обязательно для заполнения` : false,
      }}
      render={({ field, fieldState: { error } }) => {
        switch (type) {
          case 'select':
            return (
              <Select
                name={field.name}
                label={label}
                value={field.value || ''}
                onChange={(value) => field.onChange(value)}
                options={options as SelectOption[]}
                error={!!error}
                helperText={error?.message}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
              />
            );

          case 'autocomplete':
            return (
              <Autocomplete
                name={field.name}
                label={label}
                value={field.value || null}
                onChange={(value) => field.onChange(value)}
                options={options as AutocompleteOption[]}
                error={!!error}
                helperText={error?.message || helperText}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
              />
            );

          case 'radio':
            return (
              <RadioGroup
                name={field.name}
                label={label}
                value={field.value || ''}
                onChange={(value) => field.onChange(value)}
                options={options as RadioOption[]}
                error={!!error}
                helperText={error?.message || helperText}
                required={required}
                disabled={disabled}
                row={true}
              />
            );

          case 'multiselect':
            return (
              <Select
                name={field.name}
                label={label}
                value={field.value || []}
                onChange={(value) => field.onChange(value)}
                options={options as SelectOption[]}
                error={!!error}
                helperText={error?.message || helperText}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                multiple={true}
              />
            );

          case 'switch':
            return (
              <Switch
                name={field.name}
                label={label}
                checked={field.value || false}
                onChange={(checked) => field.onChange(checked)}
                disabled={disabled}
              />
            );

          case 'checkbox':
            return (
              <Checkbox
                label={label}
                checked={field.value || false}
                onChange={(checked) => field.onChange(checked)}
                disabled={disabled}
              />
            );

          case 'date':
            // Convert Unix timestamp (seconds) to date input format (YYYY-MM-DD)
            return (
              <TextField
                name={field.name}
                label={label}
                type="date"
                value={field.value ? timestampToDateInput(field.value) : ''}
                onChange={(e) => {
                  // Convert date input (YYYY-MM-DD) to Unix timestamp (seconds)
                  const timestamp = dateInputToTimestamp(e.target.value);
                  field.onChange(timestamp);
                }}
                onBlur={field.onBlur}
                error={!!error}
                helperText={error?.message || helperText}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                InputProps={{
                  inputProps: {
                    // Set min/max if needed
                  },
                }}
              />
            );

          case 'text':
          case 'password':
          case 'email':
          case 'number':
          default:
            return (
              <TextField
                name={field.name}
                label={label}
                type={type}
                value={field.value || ''}
                onChange={(e) => {
                  // Convert to number for number inputs
                  const value = type === 'number' ? Number(e.target.value) : e.target.value;
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                error={!!error}
                helperText={error?.message || helperText}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                multiline={multiline}
                rows={rows}
              />
            );
        }
      }}
    />
  );
};

export default FormField;
