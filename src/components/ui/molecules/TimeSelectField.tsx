/**
 * Time Select Field Component
 * Reusable time selector for schedule forms
 */

import { Controller, type Control } from 'react-hook-form';

interface TimeSelectFieldProps {
  /** Control from react-hook-form */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  /** Field name */
  name: string;
  /** Time options (e.g., ['00:00', '00:15', '00:30', ...]) */
  options: string[];
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
}

/**
 * Time selector dropdown with consistent styling
 * 
 * @example
 * ```tsx
 * const { control } = useForm();
 * const timeOptions = ['00:00', '00:30', '01:00', ...];
 * 
 * <TimeSelectField
 *   control={control}
 *   name="startTime"
 *   options={timeOptions}
 * />
 * ```
 */
export const TimeSelectField = ({
  control,
  name,
  options,
  disabled = false,
  error = false,
}: TimeSelectFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <select
          {...field}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: error ? '1px solid #d32f2f' : '1px solid #ccc',
            fontSize: '14px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {options.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      )}
    />
  );
};

export default TimeSelectField;
