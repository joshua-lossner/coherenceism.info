#!/bin/bash

echo "========================================="
echo "Claude Code Integration Test"
echo "========================================="
echo ""

# Check for CLAUDE.md
if [ -f "CLAUDE.md" ]; then
  echo "✓ CLAUDE.md found ($(wc -l < CLAUDE.md) lines)"
else
  echo "✗ CLAUDE.md missing"
fi

# Check for commands directory
if [ -d ".claude/commands" ]; then
  echo "✓ Commands directory found ($(ls .claude/commands/*.md | wc -l) command files)"
else
  echo "✗ Commands directory missing"
fi

# Check for project configuration
if [ -f ".claude/project.json" ]; then
  echo "✓ Project configuration found"
else
  echo "✗ Project configuration missing"
fi

# Check for settings
if [ -f ".claude/settings.local.json" ]; then
  echo "✓ Settings file found"
else
  echo "✗ Settings file missing"
fi

# Check for README
if [ -f ".claude/README.md" ]; then
  echo "✓ Claude README found"
else
  echo "✗ Claude README missing"
fi

echo ""
echo "Command Files:"
for file in .claude/commands/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    commands=$(grep "^## Command:" "$file" | wc -l)
    echo "  - $filename ($commands commands)"
  fi
done

echo ""
echo "Project Info:"
if [ -f ".claude/project.json" ]; then
  name=$(grep '"name"' .claude/project.json | head -1 | cut -d'"' -f4)
  type=$(grep '"type"' .claude/project.json | head -1 | cut -d'"' -f4)
  echo "  Name: $name"
  echo "  Type: $type"
fi

echo ""
echo "========================================="
echo "Integration test complete!"
echo "========================================="