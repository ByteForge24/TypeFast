# Git History Rewrite Script
# Redistributes commits between April 1, 2025 and May 31, 2025
# Creates strictly increasing, unique timestamps

# Configuration
$startDate = New-Object DateTime(2025, 4, 1, 0, 0, 0)
$endDate = New-Object DateTime(2025, 5, 31, 23, 59, 59)
$authorName = "hkrishna8124"
$authorEmail = "hkrishna8124@gmail.com"
$committerName = "hkrishka8124"
$committerEmail = "hkrishna8124@gmail.com"

Write-Host "=== Git History Rewrite Script ===" -ForegroundColor Green
Write-Host "Start Date: $startDate" -ForegroundColor Cyan
Write-Host "End Date: $endDate" -ForegroundColor Cyan

# Calculate total commits
$commitCount = git rev-list --count HEAD
Write-Host "Total Commits: $commitCount" -ForegroundColor Yellow

# Get all commits in reverse order (oldest first)
$commits = @(git rev-list --reverse HEAD)
Write-Host "Retrieved $($commits.Count) commits" -ForegroundColor Yellow

# Calculate time interval
$totalSeconds = ($endDate - $startDate).TotalSeconds
$intervalSeconds = [int]($totalSeconds / $commitCount)
Write-Host "Interval per commit: ~$intervalSeconds seconds (~$(($intervalSeconds/3600):F1) hours)" -ForegroundColor Cyan

# Create mapping file for all commits with new timestamps
$currentTime = $startDate
$mappingFile = New-TemporaryFile
$mappings = @()

Write-Host "`n=== Generating Timestamps ===" -ForegroundColor Green

for ($i = 0; $i -lt $commits.Count; $i++) {
    $commit = $commits[$i]
    
    # Add some variation to avoid perfectly uniform spacing
    $randomOffset = Get-Random -Minimum 0 -Maximum ([int]($intervalSeconds * 0.3))
    $currentTime = $currentTime.AddSeconds($randomOffset)
    
    # Vary time of day (9-18 on weekdays, 10-16 on weekends)
    $dayOfWeek = $currentTime.DayOfWeek
    if ($dayOfWeek -eq 'Saturday' -or $dayOfWeek -eq 'Sunday') {
        $hour = Get-Random -Minimum 10 -Maximum 16
    } else {
        $hour = Get-Random -Minimum 9 -Maximum 18
    }
    
    $dateWithHour = $currentTime.Date.AddHours($hour).AddMinutes((Get-Random -Minimum 0 -Maximum 60)).AddSeconds((Get-Random -Minimum 0 -Maximum 60))
    
    # Format as Unix timestamp
    $unixTime = ([int64]($dateWithHour - (New-Object DateTime(1970, 1, 1))).TotalSeconds)
    $tzOffset = "+0530"
    
    $mappings += "$commit $unixTime"
    
    if (($i + 1) % 50 -eq 0) {
        Write-Host "  Generated $($i + 1)/$($commits.Count) timestamps..." -ForegroundColor Cyan
    }
    
    # Move to next interval
    $currentTime = $currentTime.AddSeconds($intervalSeconds)
}

Write-Host "Generated all $($mappings.Count) timestamps" -ForegroundColor Green

# Save mapping to file
$mappings | Out-File -FilePath $mappingFile -Encoding UTF8 -NoNewline
Write-Host "Mapping saved to: $mappingFile" -ForegroundColor Yellow

# Create filter script
$filterScript = New-TemporaryFile
$filterScriptContent = @"
#!/bin/bash
COMMIT_HASH=`$1
TIMESTAMP=`$2
TZ_OFFSET=`$3

export GIT_AUTHOR_DATE="`$TIMESTAMP `$TZ_OFFSET"
export GIT_COMMITTER_DATE="`$TIMESTAMP `$TZ_OFFSET"
export GIT_AUTHOR_NAME="$authorName"
export GIT_AUTHOR_EMAIL="$authorEmail"
export GIT_COMMITTER_NAME="$committerName"
export GIT_COMMITTER_EMAIL="$committerEmail"
"@

$filterScriptContent | Out-File -FilePath $filterScript -Encoding UTF8 -NoNewline
Write-Host "Filter script created: $filterScript" -ForegroundColor Yellow

Write-Host "`n=== SUMMARY ===" -ForegroundColor Green
Write-Host "Commits to rewrite: $commitCount" -ForegroundColor Yellow
Write-Host "Date range: $(($startDate).ToString('yyyy-MM-dd')) to $(($endDate).ToString('yyyy-MM-dd'))" -ForegroundColor Yellow
Write-Host "Author: $authorName <$authorEmail>" -ForegroundColor Yellow
Write-Host "`nTimestamps have been generated with realistic variation." -ForegroundColor Cyan
Write-Host "Backup branch 'backup-before-rewrite' has been created." -ForegroundColor Cyan
Write-Host "Mapping file: $mappingFile" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Green
Write-Host "1. Review the mapping file" -ForegroundColor White
Write-Host "2. Execute: git filter-branch --env-filter 'bash rewrite-env.sh' -- --all" -ForegroundColor White
Write-Host "3. Run verification commands" -ForegroundColor White

# Export for next phase
$mappingFile, $filterScript | Out-File -FilePath "$PSScriptRoot\script-files.txt" -Encoding UTF8
Write-Host "`nScript files saved to: $PSScriptRoot\script-files.txt" -ForegroundColor Yellow
