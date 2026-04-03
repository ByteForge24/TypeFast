#!/bin/bash
# Git timestamp rewrite using filter-branch
# Redistributes commits between April 1, 2025 and May 31, 2025

set -e

REPO_DIR="${1:-.}"
cd "$REPO_DIR"

echo "=== Git History Rewrite Using filter-branch ==="
echo "Repository: $(pwd)"

# Configuration
START_DATE="2025-04-01"
END_DATE="2025-05-31"
AUTHOR_NAME="hkrishna8124"
AUTHOR_EMAIL="hkrishna8124@gmail.com"
COMMITTER_NAME="hkrishna8124"
COMMITTER_EMAIL="hkrishna8124@gmail.com"

# Convert dates to Unix timestamps
START_TIMESTAMP=$(date -d "$START_DATE 00:00:00" +%s)
END_TIMESTAMP=$(date -d "$END_DATE 23:59:59" +%s)
TOTAL_SECONDS=$((END_TIMESTAMP - START_TIMESTAMP))

echo "Start Timestamp: $START_TIMESTAMP ($START_DATE)"
echo "End Timestamp: $END_TIMESTAMP ($END_DATE)"
echo "Total Seconds: $TOTAL_SECONDS"

# Get commit count
COMMIT_COUNT=$(git rev-list --count HEAD)
echo "Total Commits: $COMMIT_COUNT"

# Calculate interval
INTERVAL=$((TOTAL_SECONDS / COMMIT_COUNT))
echo "Interval per commit: ~$INTERVAL seconds"

# Create temporary file for commit mapping
COMMIT_MAP=$(mktemp)
CURRENT_TIMESTAMP=$START_TIMESTAMP
COUNTER=0

echo "=== Generating Commit Timestamps ==="
while IFS= read -r HASH; do
    # Add variance (0-30% of interval)
    VARIANCE=$((RANDOM % (INTERVAL / 3)))
    CURRENT_TIMESTAMP=$((CURRENT_TIMESTAMP + VARIANCE))
    
    # Additional per-commit interval
    CURRENT_TIMESTAMP=$((CURRENT_TIMESTAMP + INTERVAL))
    
    echo "$HASH $CURRENT_TIMESTAMP" >> "$COMMIT_MAP"
    
    COUNTER=$((COUNTER + 1))
    if (( COUNTER % 50 == 0 )); then
        echo "  Generated $COUNTER timestamps..."
    fi
done < <(git rev-list --reverse HEAD)

echo "Mapping file: $COMMIT_MAP"
echo "Total mapped: $COUNTER"

# Create filter script
FILTER_SCRIPT=$(mktemp)
cat > "$FILTER_SCRIPT" << 'FILTER_EOF'
#!/bin/bash
COMMIT_HASH="$1"
TIMESTAMP="$2"
TZ_OFFSET="+0530"

export GIT_AUTHOR_DATE="$TIMESTAMP $TZ_OFFSET"
export GIT_COMMITTER_DATE="$TIMESTAMP $TZ_OFFSET"
export GIT_AUTHOR_NAME="hkrishna8124"
export GIT_AUTHOR_EMAIL="hkrishna8124@gmail.com"
export GIT_COMMITTER_NAME="hkrishna8124"
export GIT_COMMITTER_EMAIL="hkrishna8124@gmail.com"
FILTER_EOF
chmod +x "$FILTER_SCRIPT"

echo "Filter script: $FILTER_SCRIPT"

# Run filter-branch
echo "=== Running git filter-branch ==="
export COMMIT_MAP="$COMMIT_MAP"

git filter-branch -f --env-filter '
    TIMESTAMP=$(grep "^$GIT_COMMIT " "$COMMIT_MAP" | cut -d" " -f2)
    if [ -n "$TIMESTAMP" ]; then
        export GIT_AUTHOR_DATE="$TIMESTAMP +0530"
        export GIT_COMMITTER_DATE="$TIMESTAMP +0530"
    fi
    export GIT_AUTHOR_NAME="hkrishna8124"
    export GIT_AUTHOR_EMAIL="hkrishna8124@gmail.com"
    export GIT_COMMITTER_NAME="hkrishna8124"
    export GIT_COMMITTER_EMAIL="hkrishna8124@gmail.com"
' -- --all

# Cleanup
rm -f "$COMMIT_MAP" "$FILTER_SCRIPT"

echo "=== Rewrite Complete ==="
echo "Run verification with:"
echo "  git log --pretty=fuller | head -20"
echo "  git log --pretty=format:'%ai %s' | tail -10"
echo "  git log --all --graph --oneline | head -20"
