# PARSER REFACTOR PLAN - ELIMINATE TYPE DUPLICATES

## PROBLEM ANALYSIS
The formedible-parser package is creating DUPLICATE types that already exist in the main formedible library. This violates DRY principles and creates maintenance hell.

### CURRENT DUPLICATES IDENTIFIED:
- `ParsedFormConfig` - DUPLICATE of `UseFormedibleOptions<T>`
- `ParsedFieldConfig` - DUPLICATE of `FieldConfig`
- Custom layout/tab interfaces - DUPLICATES of main lib types
- Missing imports for 90% of formedible types

## STAGE 1: AUDIT AND INVENTORY
### 1.1 Complete Type Audit
- [ ] List ALL types in `/packages/formedible-parser/src/lib/formedible/parser-types.ts`
- [ ] List ALL types in `/packages/formedible-parser/src/lib/formedible/types.ts` 
- [ ] Identify exact duplicates
- [ ] Identify missing imports from main lib

### 1.2 Parser Usage Analysis
- [ ] Find all places `ParsedFormConfig` is used in parser code
- [ ] Find all places `ParsedFieldConfig` is used in parser code
- [ ] Document what properties the parser actually needs vs what formedible provides

## STAGE 2: IMPORT STRATEGY
### 2.1 Import ALL Required Types
Add to `/packages/formedible-parser/src/lib/formedible/parser-types.ts`:
- [ ] `UseFormedibleOptions` - the REAL form config interface
- [ ] `LayoutConfig` - for layout configurations
- [ ] `ConditionalSection` - for conditional logic
- [ ] `FormAnalytics` - for analytics config
- [ ] `CrossFieldValidation` - for cross-field validation
- [ ] `AsyncValidation` - for async validation
- [ ] All field-specific config types (TextareaConfig, PasswordConfig, etc.)

### 2.2 Re-export Strategy
- [ ] Re-export ALL imported types for consistency
- [ ] Create type aliases ONLY where absolutely necessary for parser-specific needs
- [ ] NO new interfaces unless parser-specific and not in main lib

## STAGE 3: REPLACE DUPLICATE INTERFACES
### 3.1 Replace ParsedFormConfig
- [ ] Replace `ParsedFormConfig` with `UseFormedibleOptions<Record<string, unknown>>`
- [ ] Update all parser validation code to use real formedible interface
- [ ] Update all parser return types

### 3.2 Replace ParsedFieldConfig  
- [ ] Replace `ParsedFieldConfig` with `FieldConfig`
- [ ] Update field validation code
- [ ] Update field processing code

### 3.3 Update Parser Implementation
- [ ] Update `FormedibleParser.validateAndSanitize()` method signature
- [ ] Update all validation switch cases to handle real formedible properties
- [ ] Update ALLOWED_KEYS to match complete `UseFormedibleOptions` interface

## STAGE 4: SYSTEM PROMPT FIXES
### 4.1 Remove Function Strings
- [ ] Remove ALL `"onSubmit": "async ({ value }) => ..."` examples
- [ ] Replace with proper formedible configuration structure
- [ ] Show how AI should generate config objects, not executable code

### 4.2 Use Real Formedible Examples
- [ ] Update all examples to match actual `UseFormedibleOptions` structure
- [ ] Ensure all examples can be parsed by the updated parser
- [ ] Test examples against real formedible hook

## STAGE 5: VALIDATION AND TESTING
### 5.1 Parser Tests
- [ ] Test parser with real formedible configurations
- [ ] Test all field types and configurations
- [ ] Test layout, tabs, pages, conditional sections
- [ ] Test advanced features (analytics, persistence, etc.)

### 5.2 System Prompt Tests
- [ ] Generate forms using updated system prompt
- [ ] Verify generated forms parse successfully
- [ ] Verify generated forms work with real formedible hook

### 5.3 Integration Tests
- [ ] Test parser with AI-generated forms
- [ ] Test complete flow: system prompt → AI generation → parser → formedible
- [ ] Verify no type mismatches

## SUCCESS CRITERIA
1. **Zero duplicate types** between parser and main lib
2. **Parser uses real formedible interfaces** throughout
3. **System prompt generates parseable forms** that work with formedible
4. **All formedible features supported** by parser
5. **Type safety maintained** throughout the system

## FILES TO MODIFY
- `/packages/formedible-parser/src/lib/formedible/parser-types.ts` - Import real types
- `/packages/formedible-parser/src/lib/formedible/formedible-parser.ts` - Use real interfaces
- `/packages/formedible-parser/src/lib/formedible/parser-config-schema.ts` - Fix examples
- All files using `ParsedFormConfig` or `ParsedFieldConfig`

## PRIORITY ORDER
1. **STAGE 1** - Complete audit (CRITICAL - understand scope)
2. **STAGE 2** - Import real types (FOUNDATION)  
3. **STAGE 3** - Replace duplicates (CORE FIX)
4. **STAGE 4** - Fix system prompt (USER-FACING)
5. **STAGE 5** - Validation (QUALITY ASSURANCE)