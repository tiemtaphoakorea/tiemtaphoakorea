#!/usr/bin/env python3
"""Extract test names and descriptions from e2e spec files."""

import os
import re
from pathlib import Path
from collections import defaultdict

def extract_tests_from_file(filepath):
    """Extract test() and describe() names from a spec file."""
    tests = []
    describes = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find describe blocks
        describe_pattern = r'test\.describe\("([^"]+)"'
        describes = re.findall(describe_pattern, content)

        # Find test() calls
        test_pattern = r'test\("([^"]+)"'
        tests = re.findall(test_pattern, content)

    except Exception as e:
        print(f"Error reading {filepath}: {e}")

    return describes, tests

def main():
    """Main function."""
    spec_dir = Path("/Users/kien.ha/Code/auth_shop_platform/tests/e2e")

    # Organize by domain
    tests_by_domain = defaultdict(list)

    # Walk through all spec files
    for spec_file in sorted(spec_dir.glob("**/*.spec.ts")):
        # Get domain from path (e.g., tests/e2e/auth/login.spec.ts -> auth)
        rel_path = spec_file.relative_to(spec_dir)
        parts = rel_path.parts

        if len(parts) == 1:
            # Root level spec (e.g., a11y.spec.ts)
            domain = "root"
            filename = parts[0]
        else:
            domain = parts[0]
            filename = parts[-1]

        # Extract tests
        describes, tests = extract_tests_from_file(spec_file)

        if tests or describes:
            tests_by_domain[domain].append({
                'file': str(rel_path),
                'describes': describes,
                'tests': tests
            })

    # Print results
    print("# E2E Test Coverage by Domain\n")
    for domain in sorted(tests_by_domain.keys()):
        domain_data = tests_by_domain[domain]
        print(f"\n## {domain.upper()}")
        for item in domain_data:
            print(f"\n### {item['file']}")

            if item['describes']:
                print(f"**Describes:**")
                for desc in item['describes']:
                    print(f"- {desc}")

            if item['tests']:
                print(f"**Tests:**")
                for test in item['tests'][:10]:  # Limit to 10 per file
                    print(f"- {test}")
                if len(item['tests']) > 10:
                    print(f"- ... and {len(item['tests']) - 10} more")

if __name__ == "__main__":
    main()
