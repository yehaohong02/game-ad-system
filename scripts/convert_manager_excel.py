#!/usr/bin/env python3
"""
Convert manager designer material Excel to JSON.
Parses xlsx XML directly to avoid encoding issues with openpyxl.
"""
import zipfile
import re
import json
import sys
from pathlib import Path

EXCEL_PATH = Path(r"D:\CC\管理者设计师素材表_20260521111807.xlsx")
OUTPUT_PATH = Path(r"D:\CC\game-ad-desktop\frontend\src\data\managerMaterialData.json")

# Column mapping: column letter -> field name
# Only extracting columns A, C-R (skipping B which is preview URL)
COLUMN_MAP = {
    'A': 'materialId',
    'C': 'category',
    'D': 'designer',
    'E': 'media',
    'F': 'spend',
    'G': 'impressions',
    'H': 'cpm',
    'I': 'clicks',
    'J': 'cpc',
    'K': 'ctr',
    'L': 'playCount',
    'M': 'play2s',
    'N': 'play6s',
    'O': 'play25',
    'P': 'play50',
    'Q': 'play75',
    'R': 'play100',
}

STRING_FIELDS = {'materialId', 'category', 'designer', 'media'}


def parse_cell_ref(ref: str) -> tuple[str, int]:
    """Split cell reference like 'C4' into ('C', 4)."""
    m = re.match(r'([A-Z]+)(\d+)', ref)
    return m.group(1), int(m.group(2))


def extract_cell_value(cell_elem, ns):
    """Extract value from a cell element, handling inline strings and numbers."""
    # Check if it's an inline string
    is_elem = cell_elem.find('s:is', ns)
    if is_elem is not None:
        t_elem = is_elem.find('s:t', ns)
        if t_elem is not None and t_elem.text:
            return t_elem.text.strip()
        return ''
    # Check for value element
    v_elem = cell_elem.find('s:v', ns)
    if v_elem is not None and v_elem.text:
        try:
            return float(v_elem.text)
        except ValueError:
            return v_elem.text.strip()
    return None


def convert():
    if not EXCEL_PATH.exists():
        print(f"ERROR: Excel file not found: {EXCEL_PATH}", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(EXCEL_PATH) as z:
        sheet_xml = z.read('xl/worksheets/sheet1.xml')

    # Parse with namespace
    import xml.etree.ElementTree as ET
    root = ET.fromstring(sheet_xml)
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

    rows = root.findall('.//s:sheetData/s:row', ns)
    print(f"Total rows in sheet: {len(rows)}")

    records = []
    skipped = 0
    key = 0

    for row_elem in rows:
        row_num = int(row_elem.get('r', '0'))

        # Skip rows 1-3 (header, headers, summary)
        if row_num <= 3:
            continue

        # Extract cell values into a dict keyed by column letter
        cells = {}
        for cell_elem in row_elem:
            ref = cell_elem.get('r', '')
            col_letter, _ = parse_cell_ref(ref)
            value = extract_cell_value(cell_elem, ns)
            cells[col_letter] = value

        # Get materialId (column A)
        material_id = cells.get('A')
        if material_id is None or material_id == '' or material_id == '合计':
            skipped += 1
            continue

        # Build record
        record = {'key': key}
        for col_letter, field_name in COLUMN_MAP.items():
            if col_letter == 'A':
                continue  # Already handled
            value = cells.get(col_letter)
            if field_name in STRING_FIELDS:
                record[field_name] = str(value) if value is not None else ''
            else:
                # Numeric fields
                if value is None or value == '':
                    record[field_name] = 0
                elif isinstance(value, (int, float)):
                    record[field_name] = value
                else:
                    try:
                        record[field_name] = float(value)
                    except (ValueError, TypeError):
                        record[field_name] = 0

        # Set materialId
        record['materialId'] = str(material_id)

        records.append(record)
        key += 1

    # Ensure output directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Write JSON
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Converted {len(records)} records (skipped {skipped} invalid rows)")
    print(f"Output: {OUTPUT_PATH}")

    # Print sample record
    if records:
        print(f"\nSample record:")
        print(json.dumps(records[0], ensure_ascii=False, indent=2))

    return len(records)


if __name__ == '__main__':
    convert()
