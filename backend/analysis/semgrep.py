from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union


@dataclass(frozen=True)
class SemgrepFinding:
    rule_id: str
    message: str
    path: str
    start_line: int
    end_line: int
    start_col: int
    end_col: int
    severity: Optional[str] = None
    confidence: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SemgrepError(RuntimeError):
    pass


def run_semgrep_analysis(
    filepath: str,
    *,
    config: Union[str, List[str]] = "p/security-audit",
    timeout_s: int = 120,
    semgrep_bin: str = "semgrep",
    extra_args: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Run Semgrep CLI against a file or directory and return the raw Semgrep JSON output.

    Requirements:
      - `semgrep` must be installed and on PATH, or provide semgrep_bin explicitly.
        Example install: `pip install semgrep` or use their official binaries.

    Args:
      filepath: Path to a file or directory to scan.
      config: Semgrep config string (e.g., "p/security-audit") or list of configs.
      timeout_s: Seconds before killing the semgrep process.
      semgrep_bin: Semgrep executable name or full path.
      extra_args: Additional semgrep CLI args, e.g. ["--exclude", "venv"].

    Returns:
      Parsed JSON dict from Semgrep.

    Raises:
      FileNotFoundError: if filepath doesn't exist.
      SemgrepError: if semgrep isn't installed, times out, or returns non-JSON output.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(filepath)

    if shutil.which(semgrep_bin) is None:
        raise SemgrepError(
            f"Semgrep binary '{semgrep_bin}' not found on PATH. "
            f"Install it (e.g., `pip install semgrep`) or pass semgrep_bin='/path/to/semgrep'."
        )

    cmd: List[str] = [semgrep_bin, "--json"]
    if isinstance(config, str):
        cmd += ["--config", config]
    else:
        for c in config:
            cmd += ["--config", c]

    if extra_args:
        cmd += extra_args

    cmd.append(filepath)

    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding="utf-8",
            text=True,
            errors="replace",
            timeout=timeout_s,
            check=False,  # semgrep uses non-zero codes sometimes even with findings
        )
    except subprocess.TimeoutExpired as e:
        raise SemgrepError(f"Semgrep timed out after {timeout_s}s: {e}") from e

    # Semgrep can write non-JSON to stdout if something goes wrong; fail loudly.
    out = proc.stdout.strip()
    if not out:
        raise SemgrepError(
            f"Semgrep produced no JSON output. stderr:\n{proc.stderr.strip()}"
        )

    try:
        data = json.loads(out)
    except json.JSONDecodeError as e:
        raise SemgrepError(
            "Failed to parse Semgrep JSON output.\n"
            f"Exit code: {proc.returncode}\n"
            f"stderr:\n{proc.stderr.strip()}\n"
            f"stdout (first 500 chars):\n{out[:500]}"
        ) from e

    # If semgrep had a fatal error, it usually reports it in `errors`.
    # Still return the JSON, but you can choose to raise here if desired.
    return data


def semgrep_findings(filepath: str, **kwargs: Any) -> List[SemgrepFinding]:
    """
    Convenience wrapper: returns normalized findings extracted from Semgrep JSON.
    """
    data = run_semgrep_analysis(filepath, **kwargs)
    results = data.get("results", []) or []
    findings: List[SemgrepFinding] = []

    for r in results:
        rule_id = r.get("check_id", "")
        message = (r.get("extra", {}) or {}).get("message", "") or ""
        sev = (r.get("extra", {}) or {}).get("severity")
        conf = (r.get("extra", {}) or {}).get("confidence")
        meta = (r.get("extra", {}) or {}).get("metadata")

        path = (r.get("path") or "")
        start = (r.get("start") or {})
        end = (r.get("end") or {})

        findings.append(
            SemgrepFinding(
                rule_id=rule_id,
                message=message,
                path=path,
                start_line=int(start.get("line", 0) or 0),
                end_line=int(end.get("line", 0) or 0),
                start_col=int(start.get("col", 0) or 0),
                end_col=int(end.get("col", 0) or 0),
                severity=sev,
                confidence=conf,
                metadata=meta if isinstance(meta, dict) else None,
            )
        )

    return findings

# Raw JSON
if __name__ == "__main__":
    report = run_semgrep_analysis("smoketest.py")

    # Normalized findings
    findings = semgrep_findings(
        "smoketest.py",
        config=["p/security-audit"],
        extra_args=["--exclude", "venv", "--exclude", ".git"],
    )
    print(findings)
    for f in findings:
        print(f"{f.severity} {f.rule_id} {f.path}:{f.start_line}:{f.start_col} - {f.message}")
