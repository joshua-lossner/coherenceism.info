# Deployment Commands

## Command: /deploy:preview
Create a preview deployment

```bash
echo "Creating preview deployment..."
git status
echo ""
echo "Pushing to current branch for preview..."
BRANCH=$(git branch --show-current)
git push origin $BRANCH
echo ""
echo "Preview URL will be available at:"
echo "https://coherenceism-info-git-$BRANCH-joshua-lossner.vercel.app"
echo ""
echo "Check Vercel dashboard for deployment status"
```

## Command: /deploy:production
Deploy to production

```bash
echo "Production Deployment Checklist"
echo "==============================="
echo ""
echo "Pre-deployment checks:"
echo "[ ] All tests passing"
echo "[ ] No TypeScript errors"
echo "[ ] Lint checks clean"
echo "[ ] Security audit passed"
echo "[ ] Environment variables configured in Vercel"
echo ""
echo "To deploy to production:"
echo "1. Merge to main branch"
echo "2. git checkout main"
echo "3. git pull origin main"
echo "4. git push origin main"
echo ""
echo "Production will auto-deploy at: https://coherenceism.info"
```

## Command: /deploy:rollback
Rollback to previous deployment

```bash
echo "Rollback Instructions"
echo "===================="
echo ""
echo "Option 1: Via Vercel Dashboard"
echo "1. Go to https://vercel.com/joshua-lossner/coherenceism-info"
echo "2. Click on 'Deployments' tab"
echo "3. Find the previous stable deployment"
echo "4. Click '...' menu and select 'Promote to Production'"
echo ""
echo "Option 2: Via Git"
echo "1. Find the last stable commit:"
git log --oneline -10
echo ""
echo "2. Revert to that commit:"
echo "   git revert HEAD"
echo "   git push origin main"
```

## Command: /deploy:env
Check environment variables

```bash
echo "Environment Variables Check"
echo "=========================="
echo ""
echo "Required environment variables:"
echo "- OPENAI_API_KEY: OpenAI API access"
echo "- POSTGRES_URL: Vercel Postgres connection"
echo "- ELEVENLABS_API_KEY: Text-to-speech API"
echo "- BLOB_READ_WRITE_TOKEN: Vercel Blob storage"
echo ""
echo "Optional environment variables:"
echo "- OPENAI_PROJECT_ID: OpenAI project organization"
echo "- GITHUB_TOKEN: Enhanced API rate limits"
echo ""
echo "Local .env.local file:"
if [ -f .env.local ]; then
  echo "✓ Found"
  echo "Variables defined:"
  grep -o "^[A-Z_]*=" .env.local | sed 's/=//'
else
  echo "✗ Not found - create .env.local with required variables"
fi
```