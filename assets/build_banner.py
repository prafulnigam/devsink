import re, html, cairosvg

# --- tiny JSON-ish tokenizer -> colored tspans ---
COL = {'key':'#38bdf8','str':'#6ee7b7','base':'#cbd5e1','warn':'#fbbf24','err':'#f87171','ok':'#34d399'}
def tspans(s):
    out=[]; i=0; n=len(s)
    toks=re.findall(r'"[^"]*"|\d+|[^"\d]+', s)
    pos=0
    for t in toks:
        rest=s[pos+len(t):]
        if t.startswith('"'):
            is_key = rest.lstrip().startswith(':')
            val=t.strip('"')
            if val=='warn': c=COL['warn']
            elif val=='error': c=COL['err']
            else: c=COL['key'] if is_key else COL['str']
        elif t.isdigit():
            num=int(t); c=COL['ok'] if num<400 else COL['err']
        else:
            c=COL['base']
        out.append(f'<tspan fill="{c}">{html.escape(t)}</tspan>')
        pos+=len(t)
    return ''.join(out)

ICON = '''<g transform="translate(72,60) scale(0.3711)">
  <rect x="2" y="2" width="252" height="252" rx="58" fill="url(#badge)"/>
  <rect x="2.75" y="2.75" width="250.5" height="250.5" rx="57.25" fill="none" stroke="#475569" stroke-opacity="0.45" stroke-width="1.5"/>
  <g stroke="url(#accent)" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M90 52 H166" stroke-width="11"/><path d="M98 70 H158" stroke-width="11"/><path d="M106 88 H150" stroke-width="11"/>
    <path d="M72 100 L119 156 L119 178 L137 178 L137 156 L184 100" stroke-width="13"/>
    <path d="M104 196 H152" stroke-width="11"/><path d="M112 213 H144" stroke-width="11"/>
  </g><circle cx="128" cy="189" r="4" fill="url(#accent)"/>
</g>'''

def line(x,y,s):
    return f'<text x="{x}" y="{y}" font-family="monospace" font-size="16">{tspans(s)}</text>'

card_x, card_y, card_w, card_h = 700, 132, 448, 366
svg = f'''<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#0d1626"/><stop offset="1" stop-color="#080e1a"/>
  </linearGradient>
  <linearGradient id="badge" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#1e293b"/><stop offset="1" stop-color="#0b1120"/>
  </linearGradient>
  <linearGradient id="accent" x1="64" y1="48" x2="180" y2="208" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#38bdf8"/><stop offset="0.5" stop-color="#22d3ee"/><stop offset="1" stop-color="#34d399"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.18" cy="0.2" r="0.5">
    <stop offset="0" stop-color="#22d3ee" stop-opacity="0.16"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="wm" x1="184" y1="0" x2="470" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#cbd5e1"/>
  </linearGradient>
</defs>

<rect width="1200" height="630" fill="url(#bg)"/>
<rect width="1200" height="630" fill="url(#glow)"/>

{ICON}
<text x="184" y="140" font-family="monospace" font-weight="bold" font-size="62" fill="url(#wm)">devsink</text>

<text x="74" y="272" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="42" fill="#f1f5f9">Console + network logs,</text>
<text x="74" y="322" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="42" fill="#f1f5f9">saved to your <tspan fill="#34d399">codebase</tspan>.</text>

<text x="76" y="374" font-family="DejaVu Sans, sans-serif" font-size="21" fill="#94a3b8">Streamed into JSONL files you can grep,</text>
<text x="76" y="402" font-family="DejaVu Sans, sans-serif" font-size="21" fill="#94a3b8">diff, or hand to an AI agent. Dev-only.</text>

<!-- chips -->
<g font-family="DejaVu Sans, sans-serif" font-size="18" fill="#7dd3fc">
  <rect x="76" y="446" width="74" height="36" rx="18" fill="#13243b"/><text x="113" y="470" text-anchor="middle">Vite</text>
  <rect x="160" y="446" width="118" height="36" rx="18" fill="#13243b"/><text x="219" y="470" text-anchor="middle">webpack</text>
  <rect x="288" y="446" width="74" height="36" rx="18" fill="#13243b"/><text x="325" y="470" text-anchor="middle">CRA</text>
  <rect x="372" y="446" width="130" height="36" rx="18" fill="#13243b"/><text x="437" y="470" text-anchor="middle">plain HTML</text>
</g>

<!-- install pill -->
<rect x="76" y="516" width="300" height="48" rx="12" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
<text x="96" y="547" font-family="monospace" font-size="20"><tspan fill="#34d399">$</tspan><tspan fill="#e2e8f0"> npm i -D devsink</tspan></text>

<!-- output window -->
<rect x="{card_x}" y="{card_y}" width="{card_w}" height="{card_h}" rx="16" fill="#0b1322" stroke="#1f2c44" stroke-width="1.5"/>
<rect x="{card_x}" y="{card_y}" width="{card_w}" height="44" rx="16" fill="#111c30"/>
<rect x="{card_x}" y="{card_y+28}" width="{card_w}" height="16" fill="#111c30"/>
<circle cx="{card_x+24}" cy="{card_y+22}" r="6" fill="#f87171"/>
<circle cx="{card_x+46}" cy="{card_y+22}" r="6" fill="#fbbf24"/>
<circle cx="{card_x+68}" cy="{card_y+22}" r="6" fill="#34d399"/>
<text x="{card_x+96}" y="{card_y+28}" font-family="monospace" font-size="15" fill="#64748b">.devsink/</text>

<text x="{card_x+28}" y="{card_y+78}" font-family="monospace" font-size="12" fill="#475569" letter-spacing="1">CONSOLE.JSONL</text>
{line(card_x+28, card_y+104, '{"level":"warn","args":["slow render"]}')}
{line(card_x+28, card_y+130, '{"level":"error","args":["fetch failed"]}')}
<text x="{card_x+28}" y="{card_y+176}" font-family="monospace" font-size="12" fill="#475569" letter-spacing="1">NETWORK.JSONL</text>
{line(card_x+28, card_y+202, '{"url":"/api/users","status":200}')}
{line(card_x+28, card_y+228, '{"url":"/api/cart","status":500}')}
{line(card_x+28, card_y+254, '{"url":"/api/feed","status":200}')}
</svg>'''

open('devsink-banner.svg','w').write(svg)
cairosvg.svg2png(bytestring=svg.encode(), write_to='devsink-banner.png', output_width=2400, output_height=1260)
cairosvg.svg2png(bytestring=svg.encode(), write_to='banner_preview.png', output_width=900)
print('banner built')
