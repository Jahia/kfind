#!/bin/bash
version=$(node -p "require('./package.json').devDependencies['@jahia/cypress']")
echo Using @jahia/cypress@$version...

# Keep legacy artifact paths available for external CI publishers.
mkdir -p results artifacts/results

npx --yes --package @jahia/cypress@$version env.run
status=$?

if [[ -f results/test_success ]]; then
	cp results/test_success artifacts/results/test_success
fi

if [[ -f results/test_failure ]]; then
	cp results/test_failure artifacts/results/test_failure
fi

exit "$status"
