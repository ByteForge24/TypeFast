#!/bin/bash
total_commits=211
start_timestamp=$(date -d "2025-04-01" +%s)
end_timestamp=$(date -d "2025-05-31 23:59:59" +%s)
day_span=$((($end_timestamp - $start_timestamp) / 86400))

# Get current commit number (0-indexed from oldest)
commit_num=$(git rev-list --reverse HEAD | grep -n $GIT_COMMIT | cut -d: -f1)
commit_num=$((commit_num - 1))

# Calculate evenly spaced timestamp
interval=$(echo "scale=0; ($day_span * 86400) / ($total_commits - 1)" | bc)
new_timestamp=$(($start_timestamp + (commit_num * interval)))

export GIT_COMMITTER_DATE="$new_timestamp +0000"
export GIT_AUTHOR_DATE="$new_timestamp +0000"
export GIT_COMMITTER_NAME="hkrishna8124"
export GIT_COMMITTER_EMAIL="hkrishna8124@gmail.com"
export GIT_AUTHOR_NAME="hkrishna8124"
export GIT_AUTHOR_EMAIL="hkrishna8124@gmail.com"
