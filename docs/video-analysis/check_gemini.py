import json
import urllib.error
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[2]
key = next(line.split('=', 1)[1].strip() for line in (root / '.env.local').read_text(encoding='utf-8-sig').splitlines() if line.startswith('GEMINI_API_KEY='))
request = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash', headers={'x-goog-api-key': key})
try:
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.load(response)
        print(json.dumps({field: data.get(field) for field in ['name', 'displayName', 'supportedGenerationMethods']}))
except urllib.error.HTTPError as error:
    print('HTTP', error.code)
    print(error.read().decode().replace(key, '[REDACTED]'))
