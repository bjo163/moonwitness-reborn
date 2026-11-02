import json
import re

d = json.load(open('.qoder/tmp/issues.json', encoding='utf-8'))
byid = {}
for i in d:
    m = re.search(r'<!-- mw-task-id: (MW-\d+) -->', i['body'])
    if not m:
        m = re.match(r'\[(MW-\d+)\]', i['title'])
    if m:
        byid[m.group(1)] = (i['number'], i['title'], i['body'])

for k in sorted(byid):
    num, title, body = byid[k]
    deps = None
    blk = re.search(r'```json\n(\{.*?\n\})\n```', body, re.S)
    if blk:
        try:
            deps = json.loads(blk.group(1)).get('depends_on')
        except Exception:
            deps = 'PARSE_ERR'
    print(k, num, deps, title[:70])
