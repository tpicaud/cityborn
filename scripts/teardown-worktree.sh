#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/teardown-worktree.sh [chemin_du_worktree] [--force]
       scripts/teardown-worktree.sh --orphans

Sans argument, supprime le worktree courant et son env de dev :
  - refuse le checkout principal et un worktree qui a des changements non commités
  - refuse un worktree où des processus tournent encore après 60 s d'attente ;
    avec --force, les arrête
  - supprime son projet Docker Compose : conteneurs, volumes, réseau
  - supprime son dossier avec `git worktree remove` ; la branche locale est conservée

Avec --orphans, supprime l'env de dev de chaque worktree dont le dossier a disparu :
processus restés dans le dossier supprimé, puis projet Docker Compose.
USAGE
}

target=""
orphans=false
force=false

for arg in "$@"; do
  case "$arg" in
    --orphans) orphans=true ;;
    --force) force=true ;;
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

if [ "$orphans" = true ] && { [ -n "$target" ] || [ "$force" = true ]; }; then
  echo "--orphans ne prend ni chemin de worktree ni --force." >&2
  exit 1
fi

compose_relative_path="apps/backend/docker-compose.resources.yml"

ancestors_of() {
  local pid="$1"
  while [ -n "$pid" ] && [ "$pid" -gt 1 ]; do
    echo "$pid"
    pid="$(awk '/^PPid:/ {print $2}' "/proc/$pid/status" 2>/dev/null || true)"
  done
}

wait_for_processes_to_exit() {
  local root="$1" pids
  for _ in $(seq 30); do
    pids="$(processes_in "$root")"
    [ -n "$pids" ] || return 0
    sleep 2
  done
  echo "$pids"
}

processes_in() {
  local root="$1" ancestors cwd pid
  ancestors="$(ancestors_of "$BASHPID")"
  for proc in /proc/[0-9]*; do
    pid="${proc#/proc/}"
    cwd="$(readlink "$proc/cwd" 2>/dev/null || true)"
    cwd="${cwd% (deleted)}"
    case "$cwd" in
      "$root"|"$root"/*) ;;
      *) continue ;;
    esac
    grep -qx "$pid" <<< "$ancestors" || echo "$pid"
  done
}

stop_processes() {
  local root="$1" pids remaining
  pids="$(processes_in "$root")"
  [ -n "$pids" ] || return 0
  echo "  processus arrêtés : $(tr '\n' ' ' <<< "$pids")"
  xargs -r kill -TERM <<< "$pids" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    remaining="$(while read -r pid; do kill -0 "$pid" 2>/dev/null && echo "$pid"; done <<< "$pids" || true)"
    [ -n "$remaining" ] || return 0
    sleep 1
  done
  xargs -r kill -KILL <<< "$remaining" 2>/dev/null || true
}

compose_projects() {
  docker ps --all --filter label=com.docker.compose.project \
    --format '{{.Label "com.docker.compose.project"}}	{{.Label "com.docker.compose.project.config_files"}}' |
    sort -u |
    while IFS=$'\t' read -r project config_files; do
      case "$project" in cityborn-*) ;; *) continue ;; esac
      echo "$project	${config_files%%,*}"
    done
}

remove_env() {
  local project="$1"
  docker compose -p "$project" down --volumes --remove-orphans >/dev/null 2>&1 || {
    echo "  suppression impossible : env $project" >&2
    return 1
  }
  echo "  env supprimé $project"
}

if [ "$orphans" = true ]; then
  compose_projects | while IFS=$'\t' read -r project compose_file; do
    checkout="${compose_file%/"$compose_relative_path"}"
    [ "$checkout" != "$compose_file" ] || continue
    [ ! -e "$compose_file" ] && [ -d "$(dirname "$checkout")" ] || continue
    echo "Worktree disparu : $checkout"
    stop_processes "$checkout"
    [ ! -e "$compose_file" ] || { echo "  recréé entre-temps, conservé" >&2; continue; }
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
main_root="$(git -C "$target_root" worktree list --porcelain | awk '/^worktree / && !found {print substr($0, 10); found=1}')"

if [ "$target_root" = "$main_root" ]; then
  echo "Refusé : $target_root est le checkout principal." >&2
  exit 1
fi

changes="$(git -C "$target_root" status --porcelain)"
if [ -n "$changes" ]; then
  echo "Refusé : $target_root a des changements non commités." >&2
  echo "$changes" >&2
  exit 1
fi

echo "Worktree : $target_root ($(git -C "$target_root" branch --show-current))"
cd "$main_root"
if [ "$force" = true ]; then
  stop_processes "$target_root"
else
  busy="$(wait_for_processes_to_exit "$target_root")"
  if [ -n "$busy" ]; then
    echo "Refusé : des processus tournent encore dans $target_root ; relancer avec --force pour les arrêter." >&2
    ps -o pid=,args= -p "$(paste -sd, <<< "$busy")" >&2 || true
    exit 1
  fi
fi
compose_projects | while IFS=$'\t' read -r project compose_file; do
  [ "$compose_file" = "$target_root/$compose_relative_path" ] || continue
  remove_env "$project"
done
git -C "$main_root" worktree remove "$target_root"
echo "  dossier supprimé"
