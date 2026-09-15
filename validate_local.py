"""Local pre-flight validator for Bob AI Hackathon submission.
Mirrors the exact rules enforced by .github/workflows/validate.yml.
Run with: python validate_local.py
"""

import sys
import os
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import yaml
except ImportError:
    print("Warning: PyYAML not installed. Install with 'pip install pyyaml'")
    sys.exit(1)

def run_checks():
    repo_root = Path(__file__).resolve().parent
    errors = []
    warnings = []

    print("==================================================")
    print("[*] Bob AI Hackathon Submission Pre-Flight Validator")
    print("==================================================")

    # 1. Required files check
    required_files = [
        "README.md",
        "submission.yaml",
        "docs/problem-statement.md",
        "docs/solution-overview.md",
        "docs/architecture.md",
        "docs/setup-guide.md",
        "demo/demo-video-link.txt",
    ]

    for req in required_files:
        p = repo_root / req
        if not p.is_file():
            errors.append(f"Missing required file: {req}")

    if errors:
        print("\n❌ File presence check failed:")
        for e in errors:
            print(f"  - {e}")
        return False

    print("✅ All required files are present.")

    # 2. Parse submission.yaml
    sub_yaml_path = repo_root / "submission.yaml"
    try:
        with open(sub_yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except Exception as e:
        print(f"\n❌ submission.yaml is not valid YAML: {e}")
        return False

    if not isinstance(data, dict):
        print("\n❌ submission.yaml root must be a mapping/dictionary.")
        return False

    print("✅ submission.yaml is valid YAML.")

    # 3. Check required fields
    team = data.get("team") or {}
    submission = data.get("submission") or {}

    def check_required(val, name):
        if val is None or (isinstance(val, str) and not val.strip()) or (isinstance(val, list) and len(val) == 0):
            errors.append(f"Required field missing or empty: {name}")

    check_required(team.get("name"), "team.name")
    check_required(team.get("track"), "team.track")
    lead = team.get("lead") or {}
    check_required(lead.get("name"), "team.lead.name")
    check_required(lead.get("email"), "team.lead.email")

    track = team.get("track", "")
    valid_tracks = ["AI", "DevOps", "Sustainability", "Open"]
    if track not in valid_tracks:
        errors.append(f"team.track must be one of: {', '.join(valid_tracks)} (got: '{track}')")

    check_required(submission.get("title"), "submission.title")
    check_required(submission.get("problem_statement"), "submission.problem_statement")
    check_required(submission.get("solution_summary"), "submission.solution_summary")

    features = submission.get("key_features") or []
    # Filter empty string features
    valid_features = [f for f in features if isinstance(f, str) and f.strip()]
    if len(valid_features) < 1:
        errors.append("submission.key_features must have at least 1 non-empty entry")

    if errors:
        print("\n❌ submission.yaml field validation failed:")
        for e in errors:
            print(f"  - {e}")
    else:
        print("✅ All required submission.yaml fields are filled.")

    # 4. Check src/ has actual code
    src_dir = repo_root / "src"
    code_files = []
    if src_dir.is_dir():
        for root, dirs, files in os.walk(src_dir):
            for file in files:
                if file not in ["README.md", ".env.example", ".gitkeep"]:
                    code_files.append(Path(root) / file)

    if len(code_files) < 1:
        errors.append("src/ contains no source code files (excluding README.md and .env.example).")
    else:
        print(f"✅ src/ contains {len(code_files)} source code file(s).")

    # 5. Check demo video link is not placeholder
    demo_video_file = repo_root / "demo" / "demo-video-link.txt"
    if demo_video_file.is_file():
        content = demo_video_file.read_text(encoding="utf-8").strip()
        first_line = content.splitlines()[0] if content else ""
        if "your-demo-video-link-here" in first_line:
            errors.append("demo/demo-video-link.txt still contains the placeholder URL.")
        elif not first_line.startswith("http"):
            warnings.append("demo/demo-video-link.txt does not look like a valid HTTP URL.")
        else:
            print(f"✅ demo/demo-video-link.txt updated: {first_line}")

    # 6. Check README placeholders
    readme_file = repo_root / "README.md"
    if readme_file.is_file():
        readme_text = readme_file.read_text(encoding="utf-8")
        if "[Your Project Title Here]" in readme_text:
            errors.append("README.md contains '[Your Project Title Here]'.")
        if "[Your Team Name]" in readme_text:
            errors.append("README.md contains '[Your Team Name]'.")
        # Check for any remaining brackets
        bracket_placeholders = [line.strip() for line in readme_text.splitlines() if "[" in line and "]" in line and not line.strip().startswith("[") and not line.strip().startswith("- [")]
        if bracket_placeholders:
            warnings.append(f"README.md may still contain {len(bracket_placeholders)} placeholder bracket lines. Double-check before submitting.")
        print("✅ README.md placeholder check completed.")

    # Summary
    print("\n==================================================")
    if warnings:
        print("⚠️ Warnings:")
        for w in warnings:
            print(f"  - {w}")

    if errors:
        print(f"\n❌ Validation FAILED with {len(errors)} error(s). Fix these before pushing to GitHub.")
        return False
    else:
        print("🎉 Validation PASSED! Ready for GitHub push.")
        print(f"Team:  {team.get('name')}")
        print(f"Title: {submission.get('title')}")
        print(f"Track: {team.get('track')}")
        return True

if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
