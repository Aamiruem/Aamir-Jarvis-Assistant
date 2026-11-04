"""Tables for ML Lab: read a CSV, work out column types, and profile the data (EDA).

Plain csv + NumPy on purpose: pandas' compiled parts are blocked by Windows Smart App Control
on some PCs (see the README), and these few operations don't need it.
"""
import csv
import io
import math
from dataclasses import dataclass, field

import numpy as np

MISSING = {"", "na", "n/a", "nan", "null", "none", "-", "?"}
MAX_ROWS = 100_000
MAX_COLUMNS = 200


@dataclass
class Table:
    columns: list[str]
    rows: np.ndarray                      # object array, shape (n_rows, n_columns); None = missing
    kinds: dict[str, str] = field(default_factory=dict)  # column -> "numeric" | "categorical" | "id" | "constant"

    def column(self, name: str) -> np.ndarray:
        return self.rows[:, self.columns.index(name)]

    @property
    def n_rows(self) -> int:
        return len(self.rows)


def _number(value: str):
    """A float, None for missing, or the text itself. "1,234" counts as 1234."""
    v = value.strip() if isinstance(value, str) else value
    if v is None or (isinstance(v, str) and v.lower() in MISSING):
        return None
    try:
        f = float(v.replace(",", "") if isinstance(v, str) else v)
    except (TypeError, ValueError):
        return v
    return None if math.isnan(f) else f


def read_csv(data: bytes) -> Table:
    """Parses CSV bytes (UTF-8, comma/semicolon/tab separated) into a typed Table."""
    text = data.decode("utf-8-sig", errors="replace")
    try:
        dialect = csv.Sniffer().sniff(text[:20_000], delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    header = next(reader, None)
    if not header:
        raise ValueError("The file is empty.")
    columns = [(h.strip() or f"column_{i + 1}") for i, h in enumerate(header)]
    if len(set(columns)) != len(columns):
        seen: dict[str, int] = {}
        for i, c in enumerate(columns):
            seen[c] = seen.get(c, 0) + 1
            if seen[c] > 1:
                columns[i] = f"{c}_{seen[c]}"
    if len(columns) > MAX_COLUMNS:
        raise ValueError(f"Too many columns ({len(columns)}); the limit is {MAX_COLUMNS}.")
    rows = []
    for line in reader:
        if not any(cell.strip() for cell in line):
            continue
        line = (line + [""] * len(columns))[: len(columns)]
        rows.append([_number(cell) for cell in line])
        if len(rows) > MAX_ROWS:
            raise ValueError(f"Too many rows; the limit is {MAX_ROWS:,}.")
    if len(rows) < 20:
        raise ValueError("At least 20 rows are needed to train and test a model.")
    table = Table(columns, np.array(rows, dtype=object))
    table.kinds = {c: infer_kind(table.column(c)) for c in columns}
    return table


def from_arrays(columns: list[str], X: np.ndarray) -> Table:
    """A Table from an all-numeric matrix (built-in datasets)."""
    table = Table(list(columns), np.asarray(X, dtype=object))
    table.kinds = {c: infer_kind(table.column(c)) for c in columns}
    return table


def infer_kind(values: np.ndarray) -> str:
    present = [v for v in values if v is not None]
    if not present:
        return "constant"
    numeric = sum(isinstance(v, float) for v in present)
    unique = len(set(present))
    if unique == 1:
        return "constant"
    if numeric / len(present) >= 0.95:
        return "numeric"
    # Text that is different on (almost) every row is an identifier or free text, not a category.
    if unique / len(present) > 0.5 and unique > 50:
        return "id"
    return "categorical"


def as_float(values: np.ndarray) -> np.ndarray:
    """Numeric column -> float array; non-numbers and missing become NaN."""
    return np.array([v if isinstance(v, float) else np.nan for v in values], dtype=float)


def suggest_target(table: Table) -> str:
    """The last usable column: datasets usually end with the value to predict."""
    for c in reversed(table.columns):
        if table.kinds[c] in ("numeric", "categorical"):
            return c
    return table.columns[-1]


def profile(table: Table, target: str | None = None) -> dict:
    """Exploratory data analysis: types, missing values, statistics, outliers and
    how strongly each numeric column moves with the target (Pearson correlation)."""
    target = target or suggest_target(table)
    y_num = as_float(table.column(target)) if table.kinds.get(target) == "numeric" else None
    cols = []
    for c in table.columns:
        values = table.column(c)
        missing = sum(v is None for v in values)
        info = {
            "name": c,
            "kind": table.kinds[c],
            "missing_pct": round(100 * missing / table.n_rows, 1),
            "unique": len({v for v in values if v is not None}),
        }
        if table.kinds[c] == "numeric":
            x = as_float(values)
            x = x[~np.isnan(x)]
            q1, med, q3 = np.percentile(x, [25, 50, 75])
            iqr = q3 - q1
            outliers = int(((x < q1 - 1.5 * iqr) | (x > q3 + 1.5 * iqr)).sum())
            info.update(
                mean=round(float(x.mean()), 4), std=round(float(x.std()), 4), min=round(float(x.min()), 4),
                median=round(float(med), 4), max=round(float(x.max()), 4), outliers=outliers,
            )
            if y_num is not None and c != target:
                both = ~np.isnan(as_float(values)) & ~np.isnan(y_num)
                if both.sum() > 2 and np.std(as_float(values)[both]) > 0 and np.std(y_num[both]) > 0:
                    info["corr_with_target"] = round(float(np.corrcoef(as_float(values)[both], y_num[both])[0, 1]), 3)
        elif table.kinds[c] == "categorical":
            counts: dict = {}
            for v in values:
                if v is not None:
                    counts[str(v)] = counts.get(str(v), 0) + 1
            info["top"] = sorted(counts.items(), key=lambda kv: -kv[1])[:5]
        cols.append(info)
    return {"rows": table.n_rows, "columns": cols, "suggested_target": target}
