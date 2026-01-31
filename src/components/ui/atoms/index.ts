/**
 * Библиотека переиспользуемых UI компонентов (Atoms)
 *
 * Atoms - это базовые строительные блоки UI, которые используются
 * для создания более сложных компонентов (molecules, organisms).
 *
 * Все компоненты:
 * - Полностью типизированы с TypeScript
 * - Мемоизированы с React.memo для оптимизации
 * - Основаны на Material-UI компонентах
 * - Имеют JSDoc документацию
 */

export { default as Button } from './Button';
export { default as TextField } from './TextField';
export { default as Select } from './Select';
export type { SelectOption } from './Select';
export { default as Autocomplete } from './Autocomplete';
export type { AutocompleteOption } from './Autocomplete';
export { default as RadioGroup } from './RadioGroup';
export type { RadioOption } from './RadioGroup';
export { default as Switch } from './Switch';
export { default as Checkbox } from './Checkbox';
export { default as IconButton } from './IconButton';
export { default as Chip } from './Chip';
export { default as Link } from './Link';
