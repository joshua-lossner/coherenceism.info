# Analysis Commands

## Command: /analyze:performance
Analyze bundle size and performance

```bash
echo "Analyzing bundle size..."
npx next build --profile
echo ""
echo "Check .next/analyze/ for detailed bundle analysis"
echo "Large bundles to watch:"
find .next -name "*.js" -size +500k -exec ls -lh {} \; 2>/dev/null | head -10
```

## Command: /analyze:deps
Analyze project dependencies

```bash
echo "Project Dependencies Analysis"
echo "============================="
echo ""
echo "Production dependencies:"
npm ls --depth=0 --prod
echo ""
echo "Development dependencies:"
npm ls --depth=0 --dev
echo ""
echo "Checking for outdated packages..."
npm outdated
echo ""
echo "Checking for duplicate packages..."
npm dedupe --dry-run
```

## Command: /analyze:code
Analyze code complexity and patterns

```bash
echo "Code Analysis Report"
echo "==================="
echo ""
echo "TypeScript files:"
find app components lib -name "*.ts" -o -name "*.tsx" | wc -l
echo ""
echo "Total lines of code:"
find app components lib -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1
echo ""
echo "API Routes:"
find app/api -name "route.ts" | sed 's|app/api/||' | sed 's|/route.ts||'
echo ""
echo "React Components:"
find components -name "*.tsx" | xargs basename -s .tsx
echo ""
echo "Utility Libraries:"
find lib -name "*.ts" | xargs basename -s .ts
```

## Command: /analyze:terminal
Analyze terminal component structure

```bash
echo "ECHOTerminal Component Analysis"
echo "==============================="
echo ""
echo "Component size:"
wc -l components/ECHOTerminal.tsx
echo ""
echo "Terminal commands:"
grep -o "'/[a-z]*'" components/ECHOTerminal.tsx | sort | uniq
echo ""
echo "State variables:"
grep "useState" components/ECHOTerminal.tsx | grep -o "\\[.*," | sed 's/\[//' | sed 's/,//'
echo ""
echo "Navigation states:"
grep -o "'[A-Z_]*'" components/ECHOTerminal.tsx | grep -v "'" | sort | uniq | head -20
```