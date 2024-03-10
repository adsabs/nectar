#!/usr/bin/env bash

set -o nounset
set -o errexit
set -o errtrace
set -o pipefail
IFS=$'\n\t'
_ME="$(basename "${0}")"
__DEBUG_COUNTER=0
_GIT_SHA=$(git rev-parse HEAD)

_debug() {
  if ((${_USE_DEBUG:-0}))
  then
    __DEBUG_COUNTER=$((__DEBUG_COUNTER+1))
    {
      # Prefix debug message with "bug (U+1F41B)"
      printf "🐛  %s " "${__DEBUG_COUNTER}"
      "${@}"
      printf "―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――\\n"
    } 1>&2
  fi
}

_exit_1() {
  {
    printf "%s " "$(tput setaf 1)!$(tput sgr0)"
    "${@}"
  } 1>&2
  exit 1
}

_warn() {
  {
    printf "%s " "$(tput setaf 1)!$(tput sgr0)"
    "${@}"
  } 1>&2
}

_print_help() {
  cat <<HEREDOC

███╗░░██╗███████╗░█████╗░████████╗░█████╗░██████╗░
████╗░██║██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗
██╔██╗██║█████╗░░██║░░╚═╝░░░██║░░░███████║██████╔╝
██║╚████║██╔══╝░░██║░░██╗░░░██║░░░██╔══██║██╔══██╗
██║░╚███║███████╗╚█████╔╝░░░██║░░░██║░░██║██║░░██║
╚═╝░░╚══╝╚══════╝░╚════╝░░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝

Script for running, and building the various docker containers

Usage:
  ${_ME} [--options] -- [<arguments>]
  ${_ME} -h | --help

Options:
  -h, --help       Display this help information.
  -p, --prod       Build and start a production server container
  -i, --e2e        Build and run the integration tests in container
      --ui         Run the playwright UI for integration tests
  -u, --unit       Build and run the unit tests
  -d, --dev        Build and run a dev server
  -s, --skip       Skip building the image and only run the container
      --ci         Run the containers in CI mode
      --silent     Silence script debug logs
HEREDOC
}


# Initialize program option variables.
_PRINT_HELP=0
_USE_DEBUG=1

# Initialize additional expected option variables.
_E2E=
_PROD=
_SKIP_BUILD=
_UNIT=
_DEV=
_UI=
_CI=

while ((${#}))
do
  __arg="${1:-}"

  case "${__arg}" in
    -h|--help)
      _PRINT_HELP=1
      ;;
    --silent)
      _USE_DEBUG=0
      ;;
    -i|--e2e)
      _E2E=1
      ;;
    --ui)
      _E2E=1
      _UI=1
      ;;
    -p|--prod)
      _PROD=1
      ;;
    -u|--unit)
      _UNIT=1
      ;;
    -d|--dev)
      _DEV=1
      ;;
    -s|--skip)
      _SKIP_BUILD=1
      ;;
    --ci)
      _CI=1
      ;;
    -is)
      _E2E=1
      _SKIP_BUILD=1
      ;;
    -ds)
      _DEV=1
      _SKIP_BUILD=1
      ;;
    -us)
      _UNIT=1
      _SKIP_BUILD=1
      ;;
    --)
      # Terminate option parsing.
      shift
      break
      ;;
    -*)
      _exit_1 printf "Unexpected option: %s\\n" "${__arg}"
      ;;
  esac

  shift
done

###############################################################################
# Program Functions
###############################################################################

_prod() {
  _ADDIT_ARGS="$*"
  _TARGET=prod

  if [[ -z "${_SKIP_BUILD}" ]]
  then
    _debug printf ">> production server container building...\\n"
    docker build -t "nectar-${_TARGET}:${_GIT_SHA}" \
      --target="${_TARGET}" \
      --build-arg USER_ID="$(id -u)" \
      --build-arg GROUP_ID="$(id -g)" \
      --build-arg GIT_SHA="${_GIT_SHA}" \
      "$(pwd)"
  else
    _debug printf ">> skipping build\\n"
  fi

  _debug printf ">> production server starting...\\n"
  docker run -it --rm --name nectar \
    --env-file .env.local \
    -p 8000:8000 \
    --name "nectar-${_TARGET}" \
    "nectar-${_TARGET}:${_GIT_SHA}" \
    "${_ADDIT_ARGS}"
}

_e2e() {
  _ADDIT_ARGS="$*"
  _TARGET=e2e

  if [[ -z "${_SKIP_BUILD}" ]]; then
    _debug printf ">> integration tests container building...\\n"
    docker build -t "nectar-${_TARGET}:${_GIT_SHA}" \
      --target="${_TARGET}" \
      --build-arg USER_ID="$(id -u)" \
      --build-arg GROUP_ID="$(id -g)" \
      --build-arg GIT_SHA="${_GIT_SHA}" \
      "$(pwd)"
  else
    _debug printf ">> skipping build\\n"
  fi

  if [[ -n "${_UI}" ]]; then
  _debug printf ">> integration tests (UI) server is starting...\\n"
  docker run -it --rm \
    -v "$(pwd)"/playwright:/app/playwright \
    -v "$(pwd)"/screenshots:/app/screenshots \
    -v "$(pwd)"/test-results:/app/test-results \
    -v "$(pwd)"/playwright.config.ts:/app/playwright.config.ts \
    -v "$(pwd)"/e2e:/app/e2e \
    -p 3000:3000 \
    --env-file .env.local \
    --name "nectar-${_TARGET}" \
    "nectar-${_TARGET}:${_GIT_SHA}" \
    test --ui --ui-host=0.0.0.0 --ui-port=3000
  else
    _debug printf ">> integration tests running...\\n"
    docker run -it --rm \
      -v "$(pwd)"/playwright:/app/playwright \
      -v "$(pwd)"/screenshots:/app/screenshots \
      -v "$(pwd)"/test-results:/app/test-results \
      -v "$(pwd)"/playwright.config.ts:/app/playwright.config.ts \
      -v "$(pwd)"/e2e:/app/e2e \
      --env-file .env.local \
      --name "nectar-${_TARGET}" \
      "nectar-${_TARGET}:${_GIT_SHA}"
  fi
}

_unit() {
  _TARGET=unit
  _ADDIT_ARGS="$*"

  if [[ -z "${_SKIP_BUILD}" ]]
  then
    _debug printf ">> unit tests container building...\\n"
    docker build -t "nectar-${_TARGET}:${_GIT_SHA}" \
      --target="${_TARGET}" \
      "$(pwd)"
  else
    _debug printf ">> skipping build\\n"
  fi

  _debug printf ">> unit tests running...\\n"
  docker run -it --rm \
    -v "$(pwd)"/.vitest:/app/.vitest \
    -v "$(pwd)"/src:/app/src \
    --name "nectar-${_TARGET}" \
    "nectar-${_TARGET}:${_GIT_SHA}" \
    "${_ADDIT_ARGS}"
}

_dev() {
  _TARGET=dev
  _ADDIT_ARGS="$*"

  if [[ -z "${_SKIP_BUILD}" ]]
  then
    _debug printf ">>  dev container building...\\n"
    docker build -t "nectar-${_TARGET}" \
      --target="${_TARGET}" \
      "$(pwd)"
  else
    _debug printf ">> skipping build\\n"
  fi

  _debug printf ">> dev server running...\\n"
  docker run -it --rm \
    -v "$(pwd)":/app \
    -p 8000:8000 \
    --env-file .env.local \
    --name "nectar-${_TARGET}" \
    "nectar-${_TARGET}"
    "nectar-${_TARGET}:${GIT_SHA}"
}

_simple() {
  export DOCKER_BUILDKIT=1

  if [[ -n "${_PROD}" ]]; then
    _prod "$@"
  fi

  if [[ -n "${_E2E}" ]]; then
    _e2e "$@"
  fi

  if [[ -n "${_UNIT}" ]]; then
    _unit "$@"
  fi

  if [[ -n "${_DEV}" ]]; then
    _dev "$@"
  fi
}

###############################################################################
# Main
###############################################################################

# _main()
#
# Usage:
#   _main [<options>] [<arguments>]
#
# Description:
#   Entry point for the program, handling basic option parsing and dispatching.
_main() {
  if ((_PRINT_HELP))
  then
    _print_help
  else
    _simple "$@"
  fi
}

# Call `_main` after everything has been defined.
_main "$@"
