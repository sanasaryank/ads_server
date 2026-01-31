import { useState, useCallback } from 'react';

/**
 * Hook for toggling boolean state
 *
 * @param initialValue - Initial boolean value (default: false)
 * @returns A tuple containing:
 *   - Current boolean value
 *   - Toggle function (switches between true/false)
 *   - Set function (sets a specific boolean value)
 *
 * @example
 * ```tsx
 * const [isOpen, toggle, setIsOpen] = useToggle(false);
 *
 * return (
 *   <div>
 *     <button onClick={toggle}>Toggle</button>
 *     <button onClick={() => setIsOpen(true)}>Open</button>
 *     <button onClick={() => setIsOpen(false)}>Close</button>
 *   </div>
 * );
 * ```
 */
function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const set = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, toggle, set];
}

export default useToggle;
