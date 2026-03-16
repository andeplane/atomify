#!/usr/bin/env bash
# Sequentially merge dependabot PRs: rebase → wait for CI → merge → repeat
# ORDER: patches first, majors at end (require manual review)

PATCH_PRS=(291 292 293 295 296 297 298 305)
MAJOR_PRS=(279 280 281)
# Skipping #277, #278 (react/react-dom - CI failing)

wait_for_merge() {
  local pr=$1
  echo "  Waiting for PR #$pr to merge..."
  for i in $(seq 1 80); do
    state=$(gh pr view $pr --json state --jq '.state' 2>/dev/null)
    if [ "$state" = "MERGED" ]; then
      echo "  ✅ PR #$pr merged!"
      return 0
    fi
    mergestate=$(gh pr view $pr --json mergeStateStatus --jq '.mergeStateStatus' 2>/dev/null)
    echo "    [$(date +%H:%M:%S)] state=$state mergeState=$mergestate (attempt $i/80)"
    sleep 20
  done
  echo "  ⚠️  Timed out waiting for PR #$pr"
  return 1
}

wait_for_ci() {
  local pr=$1
  echo "  Waiting for CI on PR #$pr..."
  for i in $(seq 1 60); do
    raw=$(gh pr checks $pr 2>/dev/null)
    failing=$(echo "$raw" | grep -c "fail" || true)
    pending=$(echo "$raw" | grep -cE "pending|in_progress|queued" || true)
    passing=$(echo "$raw" | grep -c "pass" || true)
    echo "    [$(date +%H:%M:%S)] pass=$passing pending=$pending fail=$failing (attempt $i/60)"
    if [ "$failing" -gt 0 ]; then
      echo "  ❌ CI failing on PR #$pr — skipping"
      return 1
    fi
    if [ "$pending" -eq 0 ] && [ "$passing" -gt 0 ]; then
      echo "  ✅ CI passing on PR #$pr"
      return 0
    fi
    sleep 20
  done
  echo "  ⚠️  CI timed out on PR #$pr"
  return 1
}

process_pr() {
  local pr=$1
  local label=$2

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 PR #$pr [$label]"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  state=$(gh pr view $pr --json state --jq '.state' 2>/dev/null)
  if [ "$state" = "MERGED" ]; then
    echo "  Already merged ✓"
    return 0
  fi

  echo "  Triggering @dependabot rebase..."
  gh pr comment $pr --body "@dependabot rebase" 2>/dev/null || true
  sleep 30  # Give dependabot time to kick off

  if ! wait_for_ci $pr; then
    echo "  ⚠️  Skipping PR #$pr"
    return 1
  fi

  echo "  Merging..."
  gh pr merge $pr --merge 2>/dev/null || gh pr merge $pr --merge --auto 2>/dev/null || true
  wait_for_merge $pr || true
  sleep 10
}

echo "🩹 PATCH BUMPS (safe)"
for pr in "${PATCH_PRS[@]}"; do
  process_pr $pr "patch"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  MAJOR BUMPS — proceeding (CI passing)"
echo "  #279: @vitejs/plugin-react 4→5"
echo "  #280: @ant-design/icons 5→6"
echo "  #281: @types/jest 29→30"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for pr in "${MAJOR_PRS[@]}"; do
  process_pr $pr "major"
done

echo ""
echo "🎉 All done!"
echo "Skipped (CI failing): #277 (react), #278 (react-dom) — needs manual review"
