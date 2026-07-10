export PATH := './node_modules/.bin:' + env_var('PATH')

default:
    @just --list

compile:
    tsc --build

eslint *OPTIONS:
    eslint . --cache --cache-location "./target/eslintcache" --cache-strategy content --max-warnings 0 {{OPTIONS}}

eslint-fix: (eslint '--fix')

prettier *OPTIONS:
    prettier './**/*.{yml,yaml,json,md}' {{OPTIONS}}

prettier-check: (prettier '--check')

prettier-fix: (prettier '--write')

lint: eslint prettier-check

lint-fix: eslint-fix prettier-fix

test-unit:
    mocha --config mocha.config.json

test-unit-coverage:
    c8 just test-unit

test: lint test-unit-coverage packtory-dry-run

packtory-dry-run: compile
    packtory publish

release-plan: compile
    packtory release

release-diff: compile
    packtory release-diff

changelog: compile
    packtory changelog

prepare-release: compile
    packtory release --write-changelog --commit --no-dry-run

publish-release: compile
    packtory release --publish --tag --push --github-release --no-dry-run
