#!/usr/bin/env bash

set -e
PKGROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && echo "$PWD")
PATH=$PKGROOT/node_modules/.bin:$PATH

main() {
  for name in constraint expression text; do
    jison "$PKGROOT/src/parsers/grammars/$name.jison" -m commonjs -o "$PKGROOT/src/parsers/grammars/$name.js"
  done
  jest --coverage "$@"
}

main "$@"
