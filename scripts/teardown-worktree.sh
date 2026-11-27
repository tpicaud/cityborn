#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/teardown-worktree.sh [chemin_du_worktree]
       scripts/teardown-worktree.sh --orphans

Sans argument, supprime le worktree courant et son env de dev :
  - refuse un worktree d'un autre dépôt, le checkout principal, un worktree verrouillé,
    qui contient d'autres worktrees ou qui a des changements non commités
  - arrête les processus lancés dans son dossier
  - revérifie ces critères, puis supprime son projet Docker Compose : conteneurs, volumes, réseau
  - supprime son dossier avec `git worktree remove` ; la branche locale est conservée

Décider si le worktree est encore utilisé revient à l'appelant.

Avec --orphans, supprime l'env de dev de chaque worktree disparu : processus restés
dans son dossier supprimé, puis projet Docker Compose. Un env n'est orphelin que si
aucun checkout du dépôt ne le déclare et que son dossier n'existe plus.
USAGE
}

target=""
orphans=false

for arg in "$@"; do
  case "$arg" in
    --orphans) orphans=true ;;
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

if [ "$orphans" = true ] && [ -n "$target" ]; then
  echo "--orphans ne prend pas de chemin de worktree." >&2
  exit 1
fi

main_project="cityborn-main"
compose_relative_path="apps/backend/docker-compose.resources.yml"
script_repo="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --path-format=absolute --git-common-dir)"

env_value() {
  { grep -m 1 "^$2=" "$1" 2>/dev/null || true; } | cut -d= -f2- | tr -d '\r'
}

checkouts() {
  git --git-dir="$script_repo" worktree list --porcelain | awk '/^worktree / {print substr($0, 10)}'
}

declared_projects() {
  echo "$main_project"
  checkouts | while IFS= read -r checkout; do
    env_value "$checkout/apps/backend/.env" COMPOSE_PROJECT_NAME
  done
}

ancestors_of() {
  local pid="$1"
  while [ -n "$pid" ] && [ "$pid" -gt 1 ]; do
    echo "$pid"
    pid="$(awk '/^PPid:/ {print $2}' "/proc/$pid/status" 2>/dev/null || true)"
  done
}

processes_in() {
  local root="$1" deleted_only="${2:-false}" ancestors link cwd pid
  ancestors="$(ancestors_of "$BASHPID")"
  for proc in /proc/[0-9]*; do
    pid="${proc#/proc/}"
    link="$(readlink "$proc/cwd" 2>/dev/null || true)"
    cwd="${link% (deleted)}"
    [ "$deleted_only" = false ] || [ "$cwd" != "$link" ] || continue
    case "$cwd" in
      "$root"|"$root"/*) ;;
      *) continue ;;
    esac
    grep -qx "$pid" <<< "$ancestors" || echo "$pid"
  done
}

stop_processes() {
  local pids="$1" remaining
  [ -n "$pids" ] || return 0
  echo "  processus arrêtés : $(paste -sd' ' <<< "$pids")"
  xargs -r kill -TERM <<< "$pids" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    remaining="$(while read -r pid; do kill -0 "$pid" 2>/dev/null && echo "$pid"; done <<< "$pids" || true)"
    [ -n "$remaining" ] || return 0
    sleep 1
  done
  xargs -r kill -KILL <<< "$remaining" 2>/dev/null || true
}

project_checkouts() {
  docker ps --all --filter "label=com.docker.compose.project=$1" \
    --format '{{.Label "com.docker.compose.project.config_files"}}' |
    sort -u |
    while IFS= read -r config_files; do
      echo "${config_files%%,*}"
    done |
    awk -v suffix="/$compose_relative_path" 'length($0) > length(suffix) && substr($0, length($0) - length(suffix) + 1) == suffix {print substr($0, 1, length($0) - length(suffix))}'
}

project_of_checkout() {
  docker ps --all --filter label=com.docker.compose.project \
    --format '{{.Label "com.docker.compose.project"}}	{{.Label "com.docker.compose.project.config_files"}}' |
    awk -F '\t' -v compose="$1/$compose_relative_path" '$1 ~ /^cityborn-/ && split($2, files, ",") && files[1] == compose {print $1; exit}'
}

remove_env() {
  local project="$1"
  docker compose -p "$project" down --volumes --remove-orphans </dev/null >/dev/null 2>&1 || {
    echo "  suppression impossible : env $project" >&2
    return 1
  }
  echo "  env supprimé $project"
}

orphan_blocker() {
  local project="$1" checkout
  if grep -qxF "$project" <<< "$(declared_projects)"; then
    echo "déclaré par un checkout"
    return
  fi
  while IFS= read -r checkout; do
    [ -n "$checkout" ] || continue
    [ ! -e "$checkout" ] || { echo "dossier présent : $checkout"; return; }
    [ -d "$(dirname "$checkout")" ] || { echo "dossier parent absent : $(dirname "$checkout")"; return; }
  done <<< "$(project_checkouts "$project")"
}

if [ "$orphans" = true ]; then
  {
    docker ps --all --filter label=com.docker.compose.project --format '{{.Label "com.docker.compose.project"}}'
    docker volume ls --filter label=com.docker.compose.project --format '{{.Label "com.docker.compose.project"}}'
  } | grep '^cityborn-' | sort -u | while IFS= read -r project; do
    [ -z "$(orphan_blocker "$project")" ] || continue
    echo "Env orphelin : $project"
    while IFS= read -r checkout; do
      [ -n "$checkout" ] || continue
      stop_processes "$(processes_in "$checkout" true)"
    done <<< "$(project_checkouts "$project")"
    blocker="$(orphan_blocker "$project")"
    [ -z "$blocker" ] || { echo "  conservé, $blocker entre-temps" >&2; continue; }
    remove_env "$project" || true
  done
  exit 0
fi

target="${target:-$PWD}"

if [ ! -d "$target" ]; then
  echo "Worktree introuvable : $target" >&2
  exit 1
fi

target_root="$(git -C "$target" rev-parse --show-toplevel)"
if [ "$(git -C "$target_root" rev-parse --path-format=absolute --git-common-dir)" != "$script_repo" ]; then
  echo "Refusé : $target_root n'est pas un worktree du dépôt de ce script." >&2
  exit 1
fi

main_root="$(checkouts | head -n 1)"
if [ "$target_root" = "$main_root" ]; then
  echo "Refusé : $target_root est le checkout principal." >&2
  exit 1
fi

worktree_blocker() {
  local changes nested
  nested="$(checkouts | awk -v root="$target_root/" 'index($0, root) == 1')"
  if [ -n "$nested" ]; then
    printf 'il contient des worktrees :\n%s\n' "$nested"
    return
  fi
  if git --git-dir="$script_repo" worktree list --porcelain |
    awk -v root="$target_root" '/^worktree / {current = substr($0, 10)} current == root && /^locked/ {found = 1} END {exit !found}'; then
    echo "le worktree est verrouillé"
    return
  fi
  changes="$(git -C "$target_root" status --porcelain)"
  [ -z "$changes" ] || printf 'changements non commités :\n%s\n' "$changes"
}

refuse_if_blocked() {
  local blocker
  blocker="$(worktree_blocker)"
  [ -z "$blocker" ] || { echo "Refusé : $target_root, $blocker" >&2; exit 1; }
}

refuse_if_blocked

project="$(env_value "$target_root/apps/backend/.env" COMPOSE_PROJECT_NAME)"
project="${project:-$(project_of_checkout "$target_root")}"
if [ "$project" = "$main_project" ]; then
  project=""
fi
if [ -n "$project" ]; then
  owners="$(project_checkouts "$project")"
  if [ -n "$owners" ] && ! grep -qxF "$target_root" <<< "$owners"; then
    echo "  env $project ignoré : il appartient à $(paste -sd' ' <<< "$owners")" >&2
    project=""
  fi
fi

echo "Worktree : $target_root ($(git -C "$target_root" branch --show-current))"
cd "$main_root"
stop_processes "$(processes_in "$target_root")"
refuse_if_blocked

[ -z "$project" ] || remove_env "$project"
git -C "$main_root" worktree remove "$target_root"
echo "  dossier supprimé"
