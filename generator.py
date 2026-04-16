"""
CBAM JSON Generátor
-------------------
Generuje nominal.json a benchmark.json z Excel souborů.

Použití:
    python generator.py

Očekává soubory:
    Nominal.xlsx      - jeden sheet = jedna země
    Benchmarky.xlsx   - jeden sheet "Benchmarks"

Výstup:
    nominal.json
    benchmark.json
"""

import pandas as pd, re, json
from datetime import date

# ── Pomocné funkce ─────────────────────────────────────────────────────────────

def valid_hs(x):
    """HS kód = pouze číslice, délka 4–10 znaků."""
    return re.fullmatch(r'\d{4,10}', str(x).replace(' ', '')) is not None

def is_numeric(x):
    """Vrátí True pokud je hodnota použitelné číslo (včetně 0)."""
    try:
        if pd.isna(x): return False
        s = str(x).strip()
        if s in ['–', '_', 'N/A', '-', 'nan', '']: return False
        float(s)
        return True
    except:
        return False

def fmt(x):
    """Formátuje číslo stejně jak ho zobrazuje Excel (3 des. místa, bez koncových nul)."""
    try:
        if pd.isna(x): return ''
        s = str(x).strip()
        if s in ['–', '_', 'N/A', '-', 'nan', '']: return ''
        return f'{float(s):.3f}'.rstrip('0').rstrip('.')
    except:
        return ''

def fmt_bm(x):
    """Jako fmt(), ale vrátí None pokud hodnota chybí (pro benchmark)."""
    try:
        if pd.isna(x): return None
        s = str(x).strip()
        if s in ['–', '_', 'N/A', '-', 'nan', '']: return None
        return f'{float(s):.3f}'.rstrip('0').rstrip('.')
    except:
        return None

def clean_pt(x):
    """Vyčistí ProdType — odstraní závorky, odmítne hlavičky a dlouhé texty."""
    if pd.isna(x): return ''
    s = str(x).strip().replace('(', '').replace(')', '')
    if len(s) > 10 or '\n' in s: return ''
    return s if s not in ['nan', ''] else ''

# Přejmenování zemí (záchranná síť pokud nejsou opraveny v Excelu)
COUNTRY_RENAME = {
    'Türkiye':      'Turkey',
    'Curaçao':      'Curacao',
    "Côte d'Ivoire": 'Ivory Coast',
}

# ── Generování nominal.json ────────────────────────────────────────────────────

print("Načítám Nominal.xlsx...")
xls_n = pd.ExcelFile('Nominal.xlsx')
nom_data = []

for sheet in xls_n.sheet_names:
    df = pd.read_excel(xls_n, sheet_name=sheet, header=None)
    df[0] = df[0].ffill()

    for _, r in df.iterrows():
        hs = re.sub(r'\.0$', '', str(r[0]).replace(' ', ''))
        if not valid_hs(hs): continue
        # Pouze řádky kde je alespoň jedna hodnota v F/G/H (sloupce 5/6/7)
        if not any(is_numeric(r[i]) for i in [5, 6, 7]): continue

        desc = str(r[1]).strip() if pd.notna(r[1]) else ''
        country = COUNTRY_RENAME.get(sheet, sheet)

        nom_data.append({
            'HS':           hs,
            'Country':      country,
            'Description':  desc,
            'Nominal_2026': fmt(r[5]),
            'Nominal_2027': fmt(r[6]),
            'Nominal_2028': fmt(r[7]),
            'ProdType':     clean_pt(r[8])
        })

# ── Generování benchmark.json ──────────────────────────────────────────────────

print("Načítám Benchmarky.xlsx...")
xls_b = pd.ExcelFile('Benchmarky.xlsx')
df_b = pd.read_excel(xls_b, sheet_name='Benchmarks', header=None)

# ffill na HS kód a Benchmark A (merged cells)
df_b[0] = df_b[0].ffill()
df_b[2] = df_b[2].ffill()
df_b[3] = df_b[3].ffill()

bm_data = []

for _, r in df_b.iterrows():
    hs = re.sub(r'\.0$', '', str(r[0]).replace(' ', ''))
    if not valid_hs(hs): continue

    bm_a = fmt_bm(r[2])
    bm_b = fmt_bm(r[4])

    bm_data.append({
        'HS':        hs,
        'ProdType':  clean_pt(r[3]),
        'Benchmark': bm_a if bm_a is not None else '',
        'Source':    'A'
    })
    bm_data.append({
        'HS':        hs,
        'ProdType':  clean_pt(r[5]),
        'Benchmark': bm_b if bm_b is not None else '',
        'Source':    'B'
    })

# ── Rozvinutí krátkých HS kódů ────────────────────────────────────────────────

bm_hs = set(x['HS'] for x in bm_data)
seen = set()
expanded = []
for rec in nom_data:
    if len(rec['HS']) < 8:
        matches = [hs for hs in bm_hs if hs.startswith(rec['HS']) and len(hs) > len(rec['HS'])]
        for full_hs in matches:
            key = (full_hs, rec['Country'])
            if key in seen: continue
            seen.add(key)
            new_rec = dict(rec)
            new_rec['HS'] = full_hs
            expanded.append(new_rec)

nom_data += expanded

# ── Uložení ───────────────────────────────────────────────────────────────────

today = date.today().isoformat()

# Zkrácené klíče pro menší velikost souboru
nom_short = [{'h':x['HS'],'c':x['Country'],'d':x['Description'],
              'n6':x['Nominal_2026'],'n7':x['Nominal_2027'],'n8':x['Nominal_2028'],
              'p':x['ProdType']} for x in nom_data]

bm_short = [{'h':x['HS'],'p':x['ProdType'],'b':x['Benchmark'],'s':x['Source']} for x in bm_data]

# Autocomplete
hs_set = sorted(set(x['HS'] for x in nom_data if len(x['HS']) == 8))
country_set = sorted(set(x['Country'] for x in nom_data if not x['Country'].startswith('_')))

json.dump({'v': today, 'data': nom_short}, open('nominal.json', 'w'), ensure_ascii=False, separators=(',',':'))
json.dump({'v': today, 'data': bm_short}, open('benchmark.json', 'w'), ensure_ascii=False, separators=(',',':'))
json.dump({'hs': hs_set, 'countries': country_set}, open('autocomplete.json', 'w'), ensure_ascii=False, separators=(',',':'))

print(f"\nHotovo!")
print(f"  nominal.json:     {len(nom_short)} záznamů")
print(f"  benchmark.json:   {len(bm_short)} záznamů")
print(f"  autocomplete.json:{len(hs_set)} HS kódů, {len(country_set)} zemí")
print(f"  Rozvinuto:        +{len(expanded)} záznamů z krátkých HS kódů")
print(f"  Verze dat:        {today}")
