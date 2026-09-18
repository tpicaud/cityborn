#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/cleanup-worktree.sh [chemin_du_worktree]

Supprime un worktree dont tout le travail est publié, puis remet le checkout
principal sur un main à jour. Sans argument, cible le worktree courant.

Le travail est considéré comme publié si HEAD est déjà sur sa branche distante,
ou déjà dans origin/main, ou porté par une PR fusionnée. Sinon la suppression
est refusée : les commits manquants doivent être poussés.

La branche locale et la branche distante sont conservées.
USAGE
}

caller_pwd="$(pwd -P)"
target=""

for arg in "$@"; do
  case "$arg" in
    -h|--help) usage; exit 0 ;;
    -*) echo "Option inconnue : $arg" >&2; usage >&2; exit 1 ;;
    *) target="$arg" ;;
  esac
done

target="${target:-$PWD}"

if [ ! -d "$target" ]; then
  echo "Worktree introuvable : $target" >&2
  echo "Si son répertoire a déjà été supprimé : git worktree prune" >&2
  exit 1
fi

worktree_root="$(cd "$(git -C "$target" rev-parse --show-toplevel)" && pwd -P)"
main_root="$(git -C "$target" worktree list --porcelain | awk '/^worktree /{print substr($0, 10); exit}')"

if [ "$worktree_root" = "$main_root" ]; then
  echo "Refus : $worktree_root est le checkout principal, il n'y a rien à nettoyer." >&2
  exit 1
fi

self="$(cd "$(dirname "$0")" && pwd -P)/$(basename "$0")"

case "$self" in
  "$worktree_root"/*) exec "$main_root/scripts/cleanup-worktree.sh" "$worktree_root" ;;
esac

git -C "$worktree_root" fetch --prune origin || echo "Fetch impossible : vérification faite sur les références locales." >&2

if ! git -C "$worktree_root" rev-parse --verify --quiet origin/main >/dev/null; then
  echo "Refus : origin/main introuvable, impossible de vérifier que le travail est publié." >&2
  exit 1
fi

dirty="$(git -C "$worktree_root" status --porcelain)"

if [ -n "$dirty" ]; then
  echo "Refus : $worktree_root a des modifications non commitées." >&2
  echo "$dirty" | sed 's/^/  /' >&2
  exit 1
fi

branch="$(git -C "$worktree_root" symbolic-ref --quiet --short HEAD || true)"
upstream="$(git -C "$worktree_root" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
published=""

if [ -n "$upstream" ] && git -C "$worktree_root" rev-parse --verify --quiet "$upstream" >/dev/null; then
  if [ -z "$(git -C "$worktree_root" log --oneline "$upstream..HEAD")" ]; then
    published="$upstream"
  fi
fi

if [ -z "$published" ] && git -C "$worktree_root" merge-base --is-ancestor HEAD origin/main; then
  published="origin/main"
fi

if [ -z "$published" ] && [ -n "$branch" ] && command -v gh >/dev/null; then
  merged_pr="$(gh pr list --repo "$(git -C "$worktree_root" remote get-url origin)" --head "$branch" --state merged --limit 1 --json number --jq '.[0].number' 2>/dev/null || true)"
  if [ -n "$merged_pr" ]; then
    published="PR #$merged_pr fusionnée"
  fi
fi

if [ -z "$published" ]; then
  echo "Refus : des commits de ${branch:-la HEAD détachée} ne sont publiés nulle part." >&2
  git -C "$worktree_root" log --oneline origin/main..HEAD | sed 's/^/  /' >&2
  echo "Les pousser, puis relancer." >&2
  exit 1
fi

cd "$main_root"

git -C "$main_root" worktree remove --force "$worktree_root"
git -C "$main_root" worktree prune

if git -C "$main_root" switch main; then
  git -C "$main_root" pull --ff-only || echo "main local non mis à jour : pull impossible." >&2
fi

echo "Worktree supprimé : $worktree_root"
echo "Travail publié sur : $published"
echo "Branche locale conservée : ${branch:-aucune (HEAD détachée)}"
echo "Checkout principal : $main_root ($(git -C "$main_root" rev-parse --abbrev-ref HEAD))"

case "$caller_pwd" in
  "$worktree_root"|"$worktree_root"/*)
    echo "Répertoire courant supprimé, reprendre avec : cd $main_root" ;;
esac
