#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/cleanup-worktree.sh [chemin_du_worktree] [--force]

Supprime un worktree livré, purge les entrées de worktrees disparus et remet le
checkout principal sur main. À lancer depuis le checkout principal ; sans
argument, cible le répertoire courant.

Seul garde-fou : les commits absents de la branche distante, que --force ignore.
Les modifications non commitées du worktree sont supprimées avec lui, et les
branches locale et distante restent en place.
USAGE
}

target=""
force=false

for arg in "$@"; do
  case "$arg" in
    --force) force=true ;;
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

script_dir="$(cd "$(dirname "$0")" && pwd)"
main_root="$(git -C "$script_dir" worktree list --porcelain | awk '/^worktree /{print substr($0, 10); exit}')"
worktree_root="$(git -C "$target" rev-parse --show-toplevel)"

if [ "$worktree_root" = "$main_root" ]; then
  echo "Refus : $worktree_root est le checkout principal." >&2
  exit 1
fi

if [ "$(git rev-parse --show-toplevel 2>/dev/null || true)" = "$worktree_root" ]; then
  echo "Refus : commande lancée depuis le worktree à supprimer." >&2
  echo "Relancer depuis le checkout principal : cd $main_root && ./scripts/cleanup-worktree.sh $worktree_root" >&2
  exit 1
fi

if [ "$force" = false ]; then
  upstream="$(git -C "$worktree_root" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"

  if [ -z "$upstream" ]; then
    echo "Refus : la branche de $worktree_root n'a pas de distant, son travail n'existe nulle part ailleurs." >&2
    echo "La pousser, ou relancer avec --force pour la perdre." >&2
    exit 1
  fi

  unpushed="$(git -C "$worktree_root" log --oneline "$upstream..HEAD")"
  if [ -n "$unpushed" ]; then
    echo "Commits absents de $upstream :" >&2
    echo "$unpushed" | sed 's/^/  /' >&2
    echo "Les pousser, ou relancer avec --force pour les perdre." >&2
    exit 1
  fi
fi

git -C "$main_root" worktree remove --force "$worktree_root"
git -C "$main_root" worktree prune
git -C "$main_root" switch main || echo "Bascule sur main impossible : $main_root laissé en l'état." >&2

echo "Worktree supprimé : $worktree_root"
echo "Checkout principal : $main_root"
