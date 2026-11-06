#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 4 ] || ! [[ "$1" =~ ^[1-9][0-9]*$ ]]; then
  echo "Usage: scripts/recette/publish-captures.sh <numéro PR> <PNG> [PNG] [PNG]" >&2
  exit 1
fi

pr_number="$1"
shift
capture_paths=()
for capture in "$@"; do
  if [ ! -f "$capture" ] || [ "$(od -An -tx1 -N8 "$capture" | tr -d ' \n')" != 89504e470d0a1a0a ]; then
    echo "Capture PNG introuvable ou invalide : $capture" >&2
    exit 1
  fi
  capture_paths+=("$(cd "$(dirname "$capture")" && pwd -P)/$(basename "$capture")")
done

repository_root="$(cd "$(dirname "$0")/../.." && pwd -P)"
cd "$repository_root"
repository_url="$(git remote get-url origin)"
case "$repository_url" in
  git@github.com:*) repository_path="${repository_url#git@github.com:}" ;;
  https://github.com/*) repository_path="${repository_url#https://github.com/}" ;;
  *) echo "Le remote origin doit cibler GitHub." >&2; exit 1 ;;
esac
repository_path="${repository_path%.git}"

capture_directory="$(mktemp -d)"
trap 'rm -rf "$capture_directory"' EXIT
export GIT_INDEX_FILE="$capture_directory/index"

remote_head="$(git ls-remote --heads origin refs/heads/recette)"
parent="${remote_head%%$'\t'*}"
commit_parent=()
if [ -n "$parent" ]; then
  git fetch --quiet origin "$parent"
  if git merge-base HEAD "$parent" >/dev/null; then
    echo "La branche recette doit avoir une histoire indépendante de main." >&2
    exit 1
  fi
  git read-tree "$parent"
  commit_parent=(-p "$parent")
else
  git read-tree --empty
fi

git ls-files -z -- "pr-$pr_number/" | git update-index --force-remove -z --stdin
capture_number=0
for capture in "${capture_paths[@]}"; do
  capture_number=$((capture_number + 1))
  blob="$(git hash-object -w -- "$capture")"
  git update-index --add --cacheinfo "100644,$blob,pr-$pr_number/capture-$capture_number.png"
done

tree="$(git write-tree)"
commit="$(git commit-tree "$tree" "${commit_parent[@]}" -m "docs: capture PR #$pr_number")"
git push --force-with-lease="refs/heads/recette:$parent" origin "$commit:refs/heads/recette"

capture_number=0
for capture in "${capture_paths[@]}"; do
  capture_number=$((capture_number + 1))
  echo "![PR #$pr_number — capture $capture_number](https://github.com/$repository_path/blob/$commit/pr-$pr_number/capture-$capture_number.png?raw=true)"
done
