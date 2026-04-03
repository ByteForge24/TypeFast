#!/bin/bash
# Git Filter Branch Environment Setup
# Reads commit->timestamp mapping and sets GIT_*_DATE variables

MAP_FILE="/c/Users/HP/TypeFast/TypeFast/commit-timestamps.txt"

if [ ! -f "$MAP_FILE" ]; then
    echo "ERROR: $MAP_FILE not found!"
    exit 1
fi

COMMIT_HASH=$GIT_COMMIT

# Look up this commit in the mapping
MAPPING=$(grep "^$COMMIT_HASH " "$MAP_FILE")

if [ -z "$MAPPING" ]; then
    echo "WARNING: No mapping found for $COMMIT_HASH, using fallback"
    TIMESTAMP=$(date -d "2025-04-15" +%s)
    TZ_OFFSET="+0530"
else
    # Parse: COMMIT_HASH UNIX_TIMESTAMP TZ_OFFSET
    TIMESTAMP=$(echo "$MAPPING" | awk '{print $2}')
    TZ_OFFSET=$(echo "$MAPPING" | awk '{print $3}')
fi

# Set the environment variables
export GIT_AUTHOR_DATE="$TIMESTAMP $TZ_OFFSET"
export GIT_COMMITTER_DATE="$TIMESTAMP $TZ_OFFSET"
export GIT_AUTHOR_NAME="hkrishna8124"
export GIT_AUTHOR_EMAIL="hkrishna8124@gmail.com"
export GIT_COMMITTER_NAME="hkrishna8124"
export GIT_COMMITTER_EMAIL="hkrishna8124@gmail.com"
