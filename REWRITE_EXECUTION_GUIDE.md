# GIT HISTORY REWRITE - STEP-BY-STEP EXECUTION GUIDE

## STATUS ✓
- [x] Backup branch created: `backup-before-rewrite`
- [x] Total commits to rewrite: **213**
- [x] Commit timestamp mapping generated: `commit-timestamps.txt`
- [x] Author set to: `hkrishna8124 <hkrishna8124@gmail.com>`
- [x] Date range: **April 1, 2025 → May 31, 2025**

---

## FILES READY
- `commit-timestamps.txt` — Commit hash → Unix timestamp mapping
- `filter-env.sh` — Git filter-branch environment script
- `commits.txt` — List of all commit hashes in order

---

## EXECUTION STEPS

### Step 1: Verify Backup (SAFETY CHECK)
**Run:**
```bash
git branch -v | grep backup
```
**Expected output:**
```
backup-before-rewrite  60c9be1 fix: suppress TypeScript baseUrl deprecation warning
```

---

### Step 2: Verify Current State
**Run:**
```bash
git status
git log --oneline -5
```
**Expected:** Clean working directory, HEAD on `main`

---

### Step 3: Convert commits.txt to DOS format (WINDOWS ONLY)
Since your commits.txt is UTF-16, convert it to standard format for filter-env.sh to read:

**Run (in PowerShell):**
```powershell
$content = [System.IO.File]::ReadAllText("commit-timestamps.txt")
[System.IO.File]::WriteAllText("commit-timestamps.txt", $content, [System.Text.Encoding]::UTF8)
```

**Or (in Git Bash):**
```bash
dos2unix commit-timestamps.txt
```

---

### Step 4: CRITICAL - Run git filter-branch

**⚠️ WARNING**: This rewrites history. After this step:
- You CANNOT undo with git reflog (the rewrite changes commit SHAs)
- You must use force push: `git push --force`
- GitHub will update commit dates after a few minutes

**Run (in Git Bash - DO NOT use PowerShell):**
```bash
# Make the filter script executable
chmod +x filter-env.sh

# Run the rewrite (this will take 1-2 minutes)
git filter-branch -f --env-filter 'bash filter-env.sh' -- --all

# Clean up refs/originals
git update-ref -d refs/original/refs/heads/main
```

---

### Step 5: Verify Rewrite Success

**Verify commit count:**
```bash
git log --oneline | wc -l
# Should output: 213
```

**Verify date range:**
```bash
# Oldest commits
git log --reverse --pretty=format:"%ai %s" | head -5

# Newest commits
git log --pretty=format:"%ai %s" | head -5
```

**Expected dates:** All between 2025-04-01 and 2025-05-31

**Verify author/committer:**
```bash
git log --pretty=fuller | head -20
# Should show:
# Author:     hkrishna8124 <hkrishna8124@gmail.com>
# AuthorDate: Thu Apr 1 ... 2025
# Commit:     hkrishna8124 <hkrishna8124@gmail.com>
# CommitDate: Thu Apr 1 ... 2025
```

---

### Step 6: Force Push to Origin

**⚠️ DESTRUCTIVE - You're overwriting GitHub history**

**Run:**
```bash
git push origin main --force
```

**Expected output:**
```
+ 60c9be1...abc1234 main -> main (forced update)
```

---

### Step 7: Verify on GitHub

**Check in browser:**
1. Go to: https://github.com/ByteForge24/TypeFast/commits/main
2. Look for commits dated April-May 2025
3. Contribution graph should show activity in April-May 2025
4. **GitHub may take 5-10 minutes to refresh**

**Run for final verification:**
```bash
git log --all --graph --oneline | head -30
git log --stat | head -50
```

---

## TROUBLESHOOTING

### If filter-branch fails with encoding error:
**Solution:** The filter-env.sh script can't read commit-timestamps.txt
```bash
# Fix encoding
file commit-timestamps.txt  # Check current encoding
iconv -f UTF-16 -t UTF-8 commit-timestamps.txt > commit-timestamps-utf8.txt
mv commit-timestamps-utf8.txt commit-timestamps.txt
```

### If commits disappear:
**IMMEDIATELY STOP and restore:**
```bash
git reset --hard backup-before-rewrite
# No damage - no force push executed yet
```

### If force push fails (permission denied):
```bash
# Check branch protection settings on GitHub
# Temporarily disable branch protection for main
# Then retry: git push origin main --force
# Re-enable protection afterward
```

### If commits went to wrong dates:
**IMMEDIATELY STOP and restore:**
```bash
git reset --hard backup-before-rewrite
git push origin main --force  # Restore original on GitHub
```

---

## SUCCESS CONFIRMATION

After step 7, verify ALL of these:

- [ ] `git log --oneline | wc -l` equals 213
- [ ] First commit date: April 1, 2025
- [ ] Last commit date: May 31, 2025 or earlier
- [ ] All dates between Apr 1 - May 31 2025
- [ ] Author: hkrishna8124
- [ ] Author email: hkrishna8124@gmail.com
- [ ] GitHub shows new commit dates after refresh
- [ ] Backup branch still exists and points to original

---

## TIMELINE REFERENCE

**Generated timestamp mapping:**
- Start: Timestamp 1743490051 = Fri Apr 1 2025 05:37:31 IST
- End: Timestamp 1748673232 = Sat May 31 2025 07:47:12 IST
- Interval: ~24,743 seconds (~6.9 hours) between commits
- Variance: Added realistic time-of-day variation (9-18 weekdays, 10-16 weekends)

---

## FILES CREATED FOR THIS REWRITE

```
TypeFast/
  ├── commit-timestamps.txt      # 213 mappings: commit_hash unix_timestamp tz
  ├── commits.txt                # List of all commits (do not modify)
  ├── filter-env.sh              # Filter script for git filter-branch
  ├── generate-timestamps.js     # Node.js generator (can delete after)
  ├── rewrite-history.sh         # Bash script documentation (reference)
  └── backup-before-rewrite      # BRANCH - your original history backup
```

---

## FINAL CHECKLIST BEFORE EXECUTING

- [ ] On `main` branch (`git status`)
- [ ] Working directory clean (`git status`)
- [ ] Backup branch exists (`git branch | grep backup`)
- [ ] commit-timestamps.txt has 213 entries (`wc -l commit-timestamps.txt`)
- [ ] First commit: 79da6c9c6885b0ada5976770ce6109b4323f26f4
- [ ] Last commit: 60c9be1432acb5ff2b315b21a42f49494d7c899a
- [ ] Using **Git Bash** (NOT PowerShell) for filter-branch
- [ ] Understand this CANNOT be undone after force push

---

## EXECUTION ORDER

**Start in PowerShell/Command Prompt:**
1. Verify backup exists
2. Convert encoding (Step 3) - PowerShell
3. **Switch to Git Bash**
4. Run filter-branch (Step 4) - Git Bash
5. Verify locally (Step 5) - Git Bash
6. Force push (Step 6) - Git Bash
7. Verify on GitHub (Step 7)

---

**When you're ready, proceed with Step 1 above.**
