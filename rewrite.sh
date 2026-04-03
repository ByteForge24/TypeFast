#!/bin/bash
set -e

cd /mnt/c/Users/HP/TypeFast/TypeFast

echo "Starting git history rewrite..."
echo "Location: $(pwd)"

# Configuration
START_DATE="2025-04-01"
END_DATE="2025-05-31"
AUTHOR_NAME="hkrishna8124"
AUTHOR_EMAIL="hkrishna8124@gmail.com"

# Convert dates to Unix timestamps
START_UNIX=$(date -d "$START_DATE" +%s)
END_UNIX=$(date -d "$END_DATE 23:59:59" +%s)

echo "Start: $START_UNIX ($(date -d @$START_UNIX))"
echo "End: $END_UNIX ($(date -d @$END_UNIX))"

# Get commits count
TOTAL=$(git rev-list HEAD | wc -l)
echo "Total commits: $TOTAL"

# Calculate duration
DURATION=$((END_UNIX - START_UNIX))
echo "Duration: $DURATION seconds"

# Export the rewrite script
export FILTER_BRANCH_SQUELCH_WARNING=1

# Perform filter-branch
git filter-branch -f --env-filter "
    # Get all commits (oldest first)
    COMMITS=\$(git rev-list --reverse HEAD)
    TOTAL=\$(echo \"\$COMMITS\" | wc -l)
    START_UNIX=$START_UNIX
    END_UNIX=$END_UNIX
    DURATION=$DURATION
    
    # Find index of current commit
    INDEX=0
    for COMMIT in \$COMMITS; do
        if [ \"\$COMMIT\" = \"\$GIT_COMMIT\" ]; then
            break
        fi
        INDEX=\$((INDEX + 1))
    done
    
    # Calculate new timestamp
    if [ \$TOTAL -gt 1 ]; then
        OFFSET=\$((DURATION * INDEX / (TOTAL - 1)))
    else
        OFFSET=0
    fi
    NEW_TIME=\$((START_UNIX + OFFSET))
    
    export GIT_AUTHOR_DATE=\"\$NEW_TIME +0000\"
    export GIT_COMMITTER_DATE=\"\$NEW_TIME +0000\"
    export GIT_AUTHOR_NAME=\"$AUTHOR_NAME\"
    export GIT_AUTHOR_EMAIL=\"$AUTHOR_EMAIL\"
    export GIT_COMMITTER_NAME=\"$AUTHOR_NAME\"
    export GIT_COMMITTER_EMAIL=\"$AUTHOR_EMAIL\"
" -- --all

echo "History rewrite complete!"
echo "Checking new commits..."
git log --oneline -3
git log --pretty=format="%an <%ae>" -1
