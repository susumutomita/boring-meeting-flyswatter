.PHONY: install
install:
	# --ignore-scripts: defuse mini-shai-hulud 2nd wave (Flatt Tech, 2026-05-12).
	# bun does not honour npm_config_ignore_scripts or .npmrc's ignore-scripts,
	# so the flag is required on every invocation. Husky's `prepare` is skipped
	# along with everything else, so we re-bootstrap it explicitly afterwards.
	bun install --ignore-scripts
	bun x husky

.PHONY: install_ci
install_ci:
	bun install --ignore-scripts --frozen-lockfile

.PHONY: build
build:
	bun run build

.PHONY: clean
clean:
	bun run clean

.PHONY: test
test:
	bun run test

.PHONY: test_coverage
test_coverage:
	bun run test:coverage

.PHONY: test_watch
test_watch:
	bun run --filter '*' test --watch

.PHONY: lint
lint:
	bun run lint

.PHONY: lint_fix
lint_fix:
	bun run lint:fix

.PHONY: lint_text
lint_text:
	bun run lint:text

.PHONY: typecheck
typecheck:
	bun run typecheck

.PHONY: format
format:
	bun run format

.PHONY: format_check
format_check:
	bun run format:check

.PHONY: security_audit
security_audit:
	node scripts/security/check-supply-chain.mjs

.PHONY: before-commit
before-commit: security_audit lint_text lint typecheck test build

.PHONY: dev
dev:
	bun run dev
