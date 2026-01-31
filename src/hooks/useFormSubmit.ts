import { useState, useCallback } from 'react';

/**
 * Return type for useFormSubmit hook
 */
export interface UseFormSubmitReturn<T> {
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Error message if submit failed */
  error: string | null;
  /** Function to handle form submission */
  handleSubmit: (
    data: T,
    submitFn: (data: T) => Promise<void>,
    onSuccess?: () => void
  ) => Promise<void>;
}

/**
 * Hook for handling form submission with loading and error states
 *
 * @template T - The type of form data
 * @returns Object with submission state and submit handler
 *
 * @example
 * ```tsx
 * interface FormData {
 *   name: string;
 *   email: string;
 * }
 *
 * const { isSubmitting, error, handleSubmit } = useFormSubmit<FormData>();
 *
 * const onSubmit = async (data: FormData) => {
 *   await handleSubmit(
 *     data,
 *     async (formData) => {
 *       await api.createUser(formData);
 *     },
 *     () => {
 *       console.log('Success!');
 *       navigate('/users');
 *     }
 *   );
 * };
 * ```
 */
function useFormSubmit<T>(): UseFormSubmitReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (
      data: T,
      submitFn: (data: T) => Promise<void>,
      onSuccess?: () => void
    ) => {
      try {
        setIsSubmitting(true);
        setError(null);
        await submitFn(data);
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred during submission';
        setError(errorMessage);
        throw err; // Re-throw to allow caller to handle if needed
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    error,
    handleSubmit,
  };
}

export default useFormSubmit;
