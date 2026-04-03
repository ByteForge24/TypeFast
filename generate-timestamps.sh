#!/bin/bash
# Git Timestamp Mapping Generator
# Creates commit hash -> unix timestamp mapping
# Date range: April 1, 2025 to May 31, 2025
# Total commits: 213

START_DATE="2025-04-01 00:00:00"
END_DATE="2025-05-31 23:59:59"

# Convert to timestamps
if date --version &> /dev/null; then
    # GNU date
    START_TS=$(date -d "$START_DATE" +%s)
    END_TS=$(date -d "$END_DATE" +%s)
else
    # macOS/BSD date
    START_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$START_DATE" +%s)
    END_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$END_DATE" +%s)
fi

TOTAL_SECS=$((END_TS - START_TS))
COMMIT_COUNT=213
INTERVAL=$((TOTAL_SECS / COMMIT_COUNT))

echo "Start: $START_DATE ($START_TS)"
echo "End: $END_DATE ($END_TS)"
echo "Total seconds: $TOTAL_SECS"
echo "Commit count: $COMMIT_COUNT"
echo "Interval: $INTERVAL seconds"
echo ""

CURRENT_TS=$START_TS
COUNTER=0
MAP_FILE="commit-timestamps.txt"

> "$MAP_FILE"  # Clear file

while IFS= read -r COMMIT_HASH; do
    # Add variance (0-30% of interval)
    VARIANCE=$((RANDOM % (INTERVAL / 3)))
    CURRENT_TS=$((CURRENT_TS + VARIANCE))
    
    # Add base interval for this commit
    CURRENT_TS=$((CURRENT_TS + INTERVAL))
    
    # Convert timestamp to date for logging
    if date --version &> /dev/null; then
        DATE_STR=$(date -d @$CURRENT_TS "+%Y-%m-%d %H:%M:%S")
    else
        DATE_STR=$(date -r $CURRENT_TS "+%Y-%m-%d %H:%M:%S")
    fi
    
    # Write to map: COMMIT_HASH UNIX_TIMESTAMP TZ_OFFSET
    echo "$COMMIT_HASH $CURRENT_TS +0530" >> "$MAP_FILE"
    
    COUNTER=$((COUNTER + 1))
    if (( COUNTER % 50 == 0 )); then
        echo "  [$COUNTER/$COMMIT_COUNT] $COMMIT_HASH -> $CURRENT_TS ($DATE_STR)"
    fi
done < commits.txt

echo ""
echo "✓ Mapping complete: $MAP_FILE"
echo "Total entries: $(wc -l < $MAP_FILE)"
echo ""
echo "First 3 entries:"
head -3 "$MAP_FILE"
echo ""
echo "Last 3 entries:"
tail -3 "$MAP_FILE"
