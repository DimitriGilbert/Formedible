# Security & Code Quality Fixing Session - Precise Directive

## OVERVIEW

You are conducting a systematic security and code quality audit of the Formedible.com codebase.
Your task is to process scan result JSON files and fix identified issues in the corresponding
SOURCE CODE files.

## CRITICAL RULES - READ CAREFULLY

### WHAT TO MODIFY

• ✅ SOURCE CODE FILES ONLY - Fix issues in .ts, .tsx, .js, .jsx files
• ✅ Dockerfile.admin - If issues are found in this file

### WHAT NOT TO MODIFY

• ❌ Any other configuration files unless explicitly mentioned in scan results
• ❌ Package files unless they contain actual security vulnerabilities

### STATUS TRACKING

• add status fields to onject in JSON files

## PROCESS WORKFLOW

### 1. FILE SELECTION

• Process files alphabetically by filename from scan_result/ directory
• Start with next alphabetical file after completed ones
• One file at a time - complete each before moving to next
• WAIT FOR EXPLICIT APPROVAL between files

### 2. ISSUE ANALYSIS (READ-ONLY)

• Read the JSON file to understand the issues
• Analyze each issue for:
• Severity (high/medium/low)
• Type (security/performance/code_quality)
• Location (file path and line number)
• Description and fix suggestions

### 3. SOURCE CODE EXAMINATION

• Read the corresponding source code file
• Verify the issue exists and is valid
• Check if issue is already fixed
• Determine if fix suggestion is appropriate

### 4. FIX IMPLEMENTATION

• ONLY implement fixes that are:
• Actually needed (not false positives)
• Safe and won't break functionality
• Follow existing code patterns
• NEVER implement fixes that could:
• Introduce security vulnerabilities
• Break existing functionality
• Conflict with business logic

### 5. VERIFICATION

• Run bun run check-types after each fix
• Run bun run build periodically to verify compilation
• Test fixes don't break existing functionality

## PRIORITY ORDER

1. High-severity security issues - Fix immediately
2. Medium-severity security issues - Fix next
3. Performance issues - Fix after security
4. Code quality issues - Fix last

## WORKING DIRECTORY

/home/didi/workspace/Code/formedible.com

## COMMANDS TO USE

• bun run check-types - TypeScript checking after each fix
• bun run build - Full build verification periodically **MANDATORY !!!**

## STEP-BY-STEP PROCESS FOR EACH FILE

1. ./check_scan_status.sh to see what files remain to be processed
2. Choose next alphabetical file after completed ones
3. Read JSON file - understand issues
4. Read source code file - examine current state
5. Analyze each issue - determine validity and fix approach
6. Implement fixes in source code only
7. Run type checks - bun run check-types
8. Run build - bun run build periodically
9. Document changes made to source files
10. WAIT FOR APPROVAL before proceeding to next file

## WHEN TO STOP/ASK FOR HELP

• If you encounter any security vulnerability you're unsure about
• If a fix would require major architectural changes
• If you find code that appears malicious
• If you're unsure about any aspect of the process
• If type checks or builds fail after your changes

## FINAL NOTES

• SOURCE FILES ONLY - Only modify the actual code files mentioned in the JSON
• CONSERVATIVE APPROACH - When in doubt, don't implement a fix but ask for precision
• WAIT FOR APPROVAL - Never proceed to the next file without explicit permission
