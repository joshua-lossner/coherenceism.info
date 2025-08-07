# Development Commands

## Command: /dev:start
Start the development server and open browser

```bash
npm run dev
echo "Development server started at http://localhost:3000"
echo "Terminal interface ready for testing"
```

## Command: /dev:build
Build the project for production

```bash
echo "Building production bundle..."
npm run build
echo "Build complete! Run 'npm start' to test production build"
```

## Command: /dev:lint
Run linting and type checking

```bash
echo "Running ESLint..."
npm run lint
echo ""
echo "Running TypeScript compiler check..."
npx tsc --noEmit
echo "Code quality checks complete!"
```

## Command: /dev:clean
Clean build artifacts and caches

```bash
echo "Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo
echo "Clean complete! Run 'npm install' if needed"
```