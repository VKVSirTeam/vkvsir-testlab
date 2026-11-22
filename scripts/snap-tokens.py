"""Snap app.css font sizes, corner radii and weights to the design scale.
Run once from the repo root: python scripts/snap-tokens.py
Rules whose selector belongs to the printed-resume preview are left alone."""
import re, sys

SIZES = [12, 14, 16, 18, 22, 28, 36, 44, 56]
SKIP = re.compile(r'rv-|rv\b|rb-mini|rb-paper|paper|\.wm|svg|(?<![-\w])text\b')


def size(v):
    v = float(v)
    if v <= 12.8: return 12
    if v < 15: return 14
    if v < 16.8: return 16
    if v < 19.5: return 18
    if v < 25: return 22
    if v < 31: return 28
    if v < 39: return 36
    if v < 50: return 44
    return 56


def radius(v):
    v = float(v)
    if v <= 4: return v
    if v <= 9: return 8
    if v <= 12: return 12
    if v <= 18: return 16
    if v < 90: return 24
    return 999


def fix_decl(block):
    block = re.sub(r'font-size:([0-9.]+)px', lambda m: 'font-size:%dpx' % size(m.group(1)), block)
    block = re.sub(r'border-radius:([0-9.]+)px(?=[;}!\s]|$)', lambda m: 'border-radius:%spx' % ('%g' % radius(m.group(1))), block)
    block = re.sub(r'font-weight:(650|750)', lambda m: 'font-weight:%d' % {650: 700, 750: 800}[int(m.group(1))], block)
    return block


src = open('app.css', encoding='utf-8').read()
out, n = [], 0
# walk rule by rule: selector { declarations }
for m in re.finditer(r'([^{}]*)\{([^{}]*)\}|([^{}]+|[{}])', src):
    if m.group(3) is not None:
        out.append(m.group(3)); continue
    sel, body = m.group(1), m.group(2)
    new = body if SKIP.search(sel) else fix_decl(body)
    n += new != body
    out.append(sel + '{' + new + '}')
res = ''.join(out)
# nested blocks (@media) are handled because inner rules match the same pattern; keep braces balanced
if res.count('{') != src.count('{') or res.count('}') != src.count('}'):
    sys.exit('brace mismatch, nothing written')
open('app.css', 'w', encoding='utf-8').write(res)
print('rules changed:', n)
