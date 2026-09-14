#!/usr/bin/env python3
"""Installs git hooks for Meta AI Moderator"""
import subprocess
import sys

def main():
    try:
        subprocess.run(["git", "config", "core.hooksPath", ".githooks"], check=True)
        print(" Git pre-commit hooks installed successfully! Quality gate is now active.")
    except Exception as e:
        print(f"Error installing hooks: {e}")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
