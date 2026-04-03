#!/bin/sh
cd /mnt/c/Users/HP/TypeFast/TypeFast

echo "Starting git history rewrite using sh..."

# Configuration
START_DATE="2025-04-01"
END_DATE="2025-05-31"
AUTHOR_NAME="hkrishna8124"
AUTHOR_EMAIL="hkrishna8124@gmail.com"

# Convert dates to Unix timestamps
START_UNIX=$(date -d "$START_DATE" +%s)
END_UNIX=$(date -d "$END_DATE 23:59:59" +%s)

TOTAL=$(git rev-list HEAD | wc -l)
DURATION=$((END_UNIX - START_UNIX))

echo "Total commits: $TOTAL"
echo "Duration: $DURATION seconds"

# Run filter-branch with simple env-filter
export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch -f --env-filter '
    export GIT_AUTHOR_NAME="hkrishna8124"
    export GIT_AUTHOR_EMAIL="hkrishna8124@gmail.com"
    export GIT_COMMITTER_NAME="hkrishna8124"
    export GIT_COMMITTER_EMAIL="hkrishna8124@gmail.com"
' -- --all

echo "Author change complete!"
git log -1 --format="%an <%ae>"
