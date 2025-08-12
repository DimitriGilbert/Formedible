# DRY Roadmap: Opportunities for Refactoring

This document lists identified areas of code duplication and opportunities to make the Formedible library more concise and maintainable (Don't Repeat Yourself).

---

### 1. Redundant `FieldConfig` and `UseFormedibleOptions` Definitions

-   **Issue:** The main configuration interfaces, `FieldConfig` and `UseFormedibleOptions`, are defined inside `use-formedible.tsx` and are almost identical to the more detailed definitions in `lib/formedible/types.ts`.
-   **Location:**
    -   `packages/formedible/src/hooks/use-formedible.tsx`
    -   `packages/formedible/src/lib/formedible/types.ts`
-   **Suggestion:** Remove the local definitions in `use-formedible.tsx` and import them directly from `lib/formedible/types.ts`. This will create a single source of truth for the library's public API.

---

### 2. Duplicated `objectConfig` Type

-   **Issue:** The shape of the `objectConfig` object is defined identically in two places within `lib/formedible/types.ts`.
-   **Location:**
    -   `packages/formedible/src/lib/formedible/types.ts` (inside `ArrayFieldProps`)
    -   `packages/formedible/src/lib/formedible/types.ts` (inside `ObjectFieldProps`)
-   **Code Snippet:**
    ```typescript
    // This structure is repeated
    objectConfig?: {
      title?: string;
      description?: string;
      fields: Array<{...}>;
      collapsible?: boolean;
      // ...and other properties
    };
    ```
-   **Suggestion:** Create a single, exported `ObjectConfig` interface in `types.ts` and reference it in both `ArrayFieldProps` and `ObjectFieldProps`. This ensures consistency.

---

### 3. Boilerplate in Field Components

-   **Issue:** Almost every field component contains the same boilerplate code to get basic information from the `fieldApi` prop.
-   **Location:** All files in `packages/formedible/src/components/formedible/fields/`.
-   **Code Snippet:**
    ```typescript
    const name = fieldApi.name;
    const value = fieldApi.state?.value; // with type casting
    const isDisabled = fieldApi.form?.state?.isSubmitting ?? false;
    const hasErrors = fieldApi.state?.meta?.isTouched && fieldApi.state?.meta?.errors?.length > 0;
    ```
-   **Suggestion:** Create a custom hook, for example `useFieldState(fieldApi)`, that encapsulates this logic and returns an object with `{ name, value, isDisabled, hasErrors, onBlur, onChange }`. This would significantly clean up every field component.

---

### 4. Repeated Dropdown/Popover Logic

-   **Issue:** Several components that use a pop-up or dropdown menu have identical logic for handling the open/closed state and detecting clicks outside the component to close it.
-   **Location:**
    -   `autocomplete-field.tsx`
    -   `multi-select-field.tsx`
    -   `color-picker-field.tsx`
    -   `date-field.tsx`
-   **Code Snippet:**
    ```typescript
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    ```
-   **Suggestion:** Create a reusable custom hook, like `useDropdown(initialState)`, that manages the open state, the container ref, and the outside click handling. It could return `[isOpen, setIsOpen, containerRef]`.

---

### 5. Duplicated Option Normalization Logic

-   **Issue:** Components that accept an `options` prop (which can be `string[]` or `{value, label}[]`) all contain the same logic to normalize this into a consistent format.
-   **Location:**
    -   `select-field.tsx`
    -   `radio-field.tsx`
    -   `multi-select-field.tsx`
    -   `autocomplete-field.tsx`
-   **Code Snippet:**
    ```typescript
    const normalizedOptions = options.map(option => 
      typeof option === 'string' 
        ? { value: option, label: option }
        : option
    );
    ```
-   **Suggestion:** Create a `normalizeOptions` utility function in a shared `lib/utils.ts` file and import it where needed. This centralizes the logic and makes it testable.

---

### 6. Centralize Field Component Mapping

-   **Issue:** The mapping from a field `type` string to its corresponding React component is defined in multiple places.
-   **Location:**
    -   `use-formedible.tsx` (as `defaultFieldComponents`)
    -   `array-field.tsx` (as `fieldTypeComponents`)
    -   `field-registry.tsx` (as `fieldComponents`)
-   **Suggestion:** The `field-registry.tsx` file should be the single source of truth for this mapping. The `useFormedible` hook and `ArrayField` component should import the map from the registry instead of redefining their own.

---

### 7. Extract Location and Color Utilities

-   **Issue:** The `location-picker-field.tsx` and `color-picker-field.tsx` components contain complex utility functions that are not directly related to the component's rendering logic.
-   **Location:**
    -   `location-picker-field.tsx`: Contains `nominatim` search, `nominatimReverse` geocoding, Leaflet loading, and `formatCoordinates` logic.
    -   `color-picker-field.tsx`: Contains `hexToRgb` and `hexToHsl` color conversion functions.
-   **Suggestion:**
    -   Move the location-related functions into a dedicated `packages/formedible/src/lib/location.ts` utility file.
    -   Move the color conversion functions into `packages/formedible/src/lib/colors.ts` or a general `utils.ts`.
    This will make the components themselves much cleaner and easier to understand, while making the utilities reusable and testable.
