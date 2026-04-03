# Precise Git History Rewrite - Windows PowerShell Version
# Redistributes 213 commits between April 1, 2025 and May 31, 2025

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         GIT HISTORY REWRITE - COMMANDS ONLY                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Step 1: Verify backup
Write-Host "`n[1/5] VERIFY BACKUP" -ForegroundColor Green
Write-Host "Command to verify backup branch exists:" -ForegroundColor Yellow
Write-Host 'git branch -v | grep backup' -ForegroundColor White

$backup = git branch | Select-String "backup-before-rewrite"
if ($backup) {
    Write-Host "✓ Backup branch exists" -ForegroundColor Green
} else {
    Write-Host "✗ Backup branch missing! Creating now..." -ForegroundColor Red
    git branch backup-before-rewrite
}

# Step 2: Get commit details
Write-Host "`n[2/5] ANALYZING COMMITS" -ForegroundColor Green
$commitCount = [int](git rev-list --count HEAD)
$allCommits = git rev-list --reverse HEAD

Write-Host "Total commits: $commitCount" -ForegroundColor Yellow

# Step 3: Calculate timestamps
Write-Host "`n[3/5] CALCULATING TIMESTAMPS" -ForegroundColor Green

$startDate = [DateTime]"2025-04-01 00:00:00"
$endDate = [DateTime]"2025-05-31 23:59:59"
$totalSeconds = ($endDate - $startDate).TotalSeconds
$intervalSeconds = [int]($totalSeconds / $commitCount)

Write-Host "Date range: $($startDate.ToString('yyyy-MM-dd')) to $($endDate.ToString('yyyy-MM-dd'))" -ForegroundColor Cyan
Write-Host "Total seconds: $totalSeconds" -ForegroundColor Cyan
Write-Host "Interval per commit: $intervalSeconds seconds (~$([Math]::Round($intervalSeconds/3600, 1)) hours)" -ForegroundColor Cyan

# Build commit timestamp mapping
$commitMap = @{}
$currentTime = $startDate
$commitIndex = 0

foreach ($commit in $allCommits) {
    # Add random variance (0-30% of interval)
    $variance = Get-Random -Minimum 0 -Maximum ([int]($intervalSeconds * 0.3))
    $currentTime = $currentTime.AddSeconds($variance)
    
    # Vary hour based on day of week (realistic pattern)
    $dayOfWeek = $currentTime.DayOfWeek
    if ($dayOfWeek -eq 'Saturday' -or $dayOfWeek -eq 'Sunday') {
        $randomHour = Get-Random -Minimum 10 -Maximum 16
    } else {
        $randomHour = Get-Random -Minimum 9 -Maximum 18
    }
    $randomMinute = Get-Random -Minimum 0 -Maximum 60
    $randomSecond = Get-Random -Minimum 0 -Maximum 60
    
    $committedTime = $currentTime.Date.AddHours($randomHour).AddMinutes($randomMinute).AddSeconds($randomSecond)
    
    # Convert to Unix timestamp
    $unixTime = [int64](($committedTime - [DateTime]"1970-01-01").TotalSeconds)
    $tzOffset = "+0530"
    
    $commitMap[$commit] = @{
        timestamp = $unixTime
        tzOffset = $tzOffset
        date = $committedTime
    }
    
    $commitIndex++
    if ($commitIndex % 50 -eq 0) {
        Write-Host "  Processed $commitIndex/$commitCount commits" -ForegroundColor Cyan
    }
    
    # Advance to next interval
    $currentTime = $currentTime.AddSeconds($intervalSeconds)
}

Write-Host "✓ Generated timestamps for all $commitCount commits" -ForegroundColor Green

# Step 4: Generate filter-branch command
Write-Host "`n[4/5] GENERATING FILTER-BRANCH COMMAND" -ForegroundColor Green

# Create temporary environment script
$tempDir = [System.IO.Path]::GetTempPath()
$envScriptPath = Join-Path $tempDir "git-rewrite-env.ps1"
$mapFilePath = Join-Path $tempDir "git-commit-map.txt"

# Save mapping to file
$mapContent = @()
foreach ($commit in $commitMap.Keys) {
    $ts = $commitMap[$commit].timestamp
    $tz = $commitMap[$commit].tzOffset
    $mapContent += "$commit $ts $tz"
}
$mapContent | Out-File -FilePath $mapFilePath -Encoding UTF8 -Force

Write-Host "Map file: $mapFilePath" -ForegroundColor Yellow
Write-Host "First 3 mappings:" -ForegroundColor Cyan
$mapContent[0..2] | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

# Step 5: Execute rewrite
Write-Host "`n[5/5] EXECUTING REWRITE" -ForegroundColor Green
Write-Host "Running git filter-branch..." -ForegroundColor Yellow

# Build the filter-branch command
$filterBranchCmd = @"
`$mapFile = '$mapFilePath'
`$mapContent = Get-Content `$mapFile | ConvertFrom-StringData -Delimiter ' '

`$commit = `$env:GIT_COMMIT
`$mapLine = Select-String -Path `$mapFile -Pattern "^`$commit " | Select-Object -First 1

if (`$mapLine) {
    `$parts = `$mapLine.ToString() -split ' '
    `$timestamp = `$parts[1]
    `$tzOffset = `$parts[2]
} else {
    `$timestamp = (Get-Random -Minimum 1700000000 -Maximum 1750000000)
    `$tzOffset = '+0530'
}

`$env:GIT_AUTHOR_DATE = "`$timestamp `$tzOffset"
`$env:GIT_COMMITTER_DATE = "`$timestamp `$tzOffset"
`$env:GIT_AUTHOR_NAME = 'hkrishna8124'
`$env:GIT_AUTHOR_EMAIL = 'hkrishna8124@gmail.com'
`$env:GIT_COMMITTER_NAME = 'hkrishna8124'
`$env:GIT_COMMITTER_EMAIL = 'hkrishna8124@gmail.com'
"@

$envScriptPath | Out-File -FilePath $envScriptPath -Encoding UTF8 -Force -Value $filterBranchCmd

# Execute git filter-branch
$env:GIT_AUTHOR_NAME = 'hkrishna8124'
$env:GIT_AUTHOR_EMAIL = 'hkrishna8124@gmail.com'
$env:GIT_COMMITTER_NAME = 'hkrishna8124'
$env:GIT_COMMITTER_EMAIL = 'hkrishna8124@gmail.com'

# Alternative: Direct rebase approach
Write-Host "`nExecuting: git filter-branch with custom dates..." -ForegroundColor White

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# For Windows, we need to use git filter-branch with bash/sh
Write-Host "`n⚠️  IMPORTANT: Using Git Bash for filter-branch execution" -ForegroundColor Yellow

# Create a bash script for filter-branch
$bashScriptPath = Join-Path $tempDir "git-filter.sh"
$bashScript = @"
#!/bin/bash
MAP_FILE="$($mapFilePath -replace '\\', '/')"
COMMIT=`$GIT_COMMIT

# Find this commit in map
TIMESTAMP=`$(grep "^`$COMMIT " "`$MAP_FILE" | awk '{print `$2}')
TZ_OFFSET=`$(grep "^`$COMMIT " "`$MAP_FILE" | awk '{print `$3}')

if [ -z "`$TIMESTAMP" ]; then
    TIMESTAMP=1743206400  # Fallback to default in range
    TZ_OFFSET="+0530"
fi

export GIT_AUTHOR_DATE="`$TIMESTAMP `$TZ_OFFSET"
export GIT_COMMITTER_DATE="`$TIMESTAMP `$TZ_OFFSET"
export GIT_AUTHOR_NAME="hkrishna8124"
export GIT_AUTHOR_EMAIL="hkrishna8124@gmail.com"
export GIT_COMMITTER_NAME="hkrishna8124"
export GIT_COMMITTER_EMAIL="hkrishna8124@gmail.com"
"@

$bashScript | Out-File -FilePath $bashScriptPath -Encoding UTF8 -Force

Write-Host "`nBash script path: $bashScriptPath" -ForegroundColor Yellow
Write-Host "`nMap file path: $mapFilePath" -ForegroundColor Yellow

Write-Host "`n" + "═" * 70 -ForegroundColor Cyan
Write-Host "EXECUTE THESE COMMANDS IN ORDER:" -ForegroundColor Green
Write-Host "═" * 70 -ForegroundColor Cyan

Write-Host "`n# Step 1: Verify you're on main branch"
Write-Host "git status" -ForegroundColor White

Write-Host "`n# Step 2: Run filter-branch (this will take a while)"
Write-Host "git filter-branch -f --env-filter 'bash `"$bashScriptPath`"' -- --all" -ForegroundColor White
Write-Host "# OR on Windows with git bash already running:" -ForegroundColor Gray
Write-Host "git filter-branch -f --env-filter 'bash $($bashScriptPath -replace '\\', '/')' -- --all" -ForegroundColor White

Write-Host "`n# Step 3: Verify rewrite success"
Write-Host "git log --pretty=fuller --oneline | head -5" -ForegroundColor White

Write-Host "`n# Step 4: Check date range"
Write-Host "git log --pretty=format:'%ai %s' 2>&1 | head -10" -ForegroundColor White
Write-Host "git log --reverse --pretty=format:'%ai %s' 2>&1 | head -10" -ForegroundColor White

Write-Host "`n# Step 5: Verify all commits are present"
Write-Host "git log --oneline 2>&1 | wc -l" -ForegroundColor White
Write-Host "# Should show: $commitCount" -ForegroundColor Yellow

Write-Host "`n# Step 6: Force push to origin"
Write-Host "git push origin main --force" -ForegroundColor White

Write-Host "`n# Step 7: Verify on GitHub (may take a few minutes to refresh)"
Write-Host "git log --all --graph --oneline | head -20" -ForegroundColor White

Write-Host "`n" + "═" * 70 -ForegroundColor Cyan
Write-Host "FILES CREATED FOR THIS REWRITE:" -ForegroundColor Green
Write-Host "═" * 70 -ForegroundColor Cyan

Write-Host "Commit Map: $mapFilePath" -ForegroundColor Cyan
Write-Host "Bash Script: $bashScriptPath" -ForegroundColor Cyan

Write-Host "`nFirst 5 commit mappings (commit hash -> unix timestamp):" -ForegroundColor Yellow
$mapContent[0..4] | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n" + "═" * 70 -ForegroundColor Cyan
Write-Host "SAFETY REMINDERS:" -ForegroundColor Yellow
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "✓ Backup created: git branch backup-before-rewrite" -ForegroundColor Green
Write-Host "✓ Verify dates range from 2025-04-01 to 2025-05-31" -ForegroundColor Green
Write-Host "✗ After filter-branch, DO NOT run git gc until you verify success" -ForegroundColor Red
Write-Host "✗ After filter-branch, git push MUST use --force flag" -ForegroundColor Red

Write-Host "`n" + "═" * 70 -ForegroundColor Cyan
Write-Host "NEXT: Open Git Bash and run the commands above in order" -ForegroundColor Green
Write-Host "═" * 70 -ForegroundColor Cyan
