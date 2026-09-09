#!/usr/bin/env bash
# Prépare un worktree Cityborn : copie les fichiers .env du checkout principal
# (main local) puis installe les dépendances.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/setup-worktree.sh [chemin_du_worktree] [--skip-install]

Sans argument, prépare le worktree courant.
  - copie les fichiers .env ignorés par git depuis le checkout principal
  - exécute `pnpm install` dans le worktree (sauf --skip-install)
USAGE
}

target=""
skip_install=false

for arg in "$@"; do
  case "$arg" in
    --skip-install) skip_install=true ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "Option inconnue : $arg" >&2; usage >&2; exit 1 ;;
    *)
      if [ -n "$target" ]; then
        echo "Un seul chemin de worktree est accepté." >&2
        exit 1
      fi
      target="$arg"
      ;;
  esac
done

target="${target:-$PWD}"

if [ ! -d "$target" ]; then
  echo "Worktree introuvable : $target" >&2
  exit 1
fi

target_root="$(git -C "$target" rev-parse --show-toplevel)"
main_root="$(git -C "$target" worktree list --porcelain | awk '/^worktree /{print substr($0, 10); exit}')"

if [ ! -d "$main_root" ]; then
  echo "Checkout principal introuvable : $main_root" >&2
  exit 1
fi

if [ "$target_root" = "$main_root" ]; then
  echo "Rien à faire : $target_root est le checkout principal." >&2
  exit 1
fi

echo "Worktree    : $target_root"
echo "Source .env : $main_root"

copied=0
while IFS= read -r env_file; do
  case "$env_file" in
    */) continue ;;
    *node_modules/*) continue ;;
  esac
  mkdir -p "$target_root/$(dirname "$env_file")"
  cp -p "$main_root/$env_file" "$target_root/$env_file"
  echo "  copié $env_file"
  copied=$((copied + 1))
done < <(
  git -C "$main_root" ls-files --others --ignored --exclude-standard \
    -- ':(glob).env' ':(glob).env.*' ':(glob)**/.env' ':(glob)**/.env.*' 2>/dev/null
)

if [ "$copied" -eq 0 ]; then
  echo "Aucun fichier .env trouvé dans $main_root." >&2
fi

if [ "$skip_install" = true ]; then
  echo "pnpm install ignoré (--skip-install)."
  exit 0
fi

echo "pnpm install…"
cd "$target_root"
pnpm install
