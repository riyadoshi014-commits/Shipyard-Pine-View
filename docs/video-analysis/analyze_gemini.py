"""Analyze supplied local films using Gemini 3.8 Flash agentic video processing.

Run from the project root. GEMINI_API_KEY is loaded from the environment or
the ignored .env.local file. No credential is written into analysis outputs.
"""
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs' / 'video-analysis'
BASE = 'https://generativelanguage.googleapis.com'
key = os.environ.get('GEMINI_API_KEY')
if not key:
    key = next(line.split('=', 1)[1].strip().strip('\"\'') for line in (ROOT / '.env.local').read_text(encoding='utf-8-sig').splitlines() if line.startswith('GEMINI_API_KEY='))


def request(url, payload=None, headers=None, method=None, timeout=600):
    hdr = {'x-goog-api-key': key, **(headers or {})}
    if isinstance(payload, dict):
        payload = json.dumps(payload).encode()
        hdr['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=payload, headers=hdr, method=method)
    return urllib.request.urlopen(req, timeout=timeout)


def upload(path):
    print(f'Uploading {path.name} ({path.stat().st_size // 1000000} MB)', flush=True)
    with request(BASE + '/upload/v1beta/files', {'file': {'display_name': path.name}}, {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': str(path.stat().st_size),
        'X-Goog-Upload-Header-Content-Type': 'video/mp4',
    }) as response:
        upload_url = response.headers['X-Goog-Upload-URL']
    with request(upload_url, path.read_bytes(), {
        'Content-Type': 'video/mp4',
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
    }) as response:
        file = json.load(response)['file']
    deadline = time.monotonic() + 600
    while file.get('state') == 'PROCESSING':
        if time.monotonic() > deadline:
            raise RuntimeError('File processing timed out')
        time.sleep(3)
        with request(BASE + '/v1beta/' + file['name']) as response:
            file = json.load(response)
    if file.get('state') != 'ACTIVE':
        raise RuntimeError(f'File not active: {path.name}')
    print(f'Ready: {path.name}', flush=True)
    return file


PROMPT = '''You are examining three user-supplied films as a sensitive documentary editor and product researcher. The user says they evoke strong emotions and wants them understood deeply before building ConnectAble, an inclusive employment platform. Actually inspect all three videos, listen to their full spoken audio, and dynamically revisit emotionally important moments with the agentic video tools. Do not merely summarize a transcript. Pay attention to pacing, pauses, sound/music, framing, everyday actions, relationships, and the agency of each person shown. Separate directly observed evidence from your interpretation of how viewers might respond. Do not claim to know subjects' inner feelings or infer diagnoses. Do not invent biographical relationships or employment claims.

The files are:
1. nick_video_720p.mp4: approximately 3 minutes 8 seconds; an alternate-resolution copy of Inclusion Revolution-Shipyard-Nick Video_2026.mp4.
2. IMG_0162.mp4: approximately 30 seconds, a brief interview.
3. IMG_1277.mp4: approximately 11 seconds, a brief activity clip.

Return a thoughtful Markdown report of approximately 1800-2500 words. Include:
- A concrete evidence-led reading of each film: who speaks (only names/roles explicitly stated or visibly captioned), what happens, and what gives the film emotional force.
- Nick's emotional arc in 6-9 timestamped beats. Verify exact strongest lines, who says them, and the small everyday details that earn the emotion. Check the final speaker and Nick's own closing statement. What does the opening establish and what changes by the ending?
- The short interview's personality, humor, and specifics; quote only lines you can hear confidently. Flag uncertainty in names/words. Do not attribute his workplace from his T-shirt alone.
- The card clip: visible activity, gestures, actual speech, and why it may matter to a whole-person understanding. Clearly delimit what this short clip cannot establish.
- What the films have in common and how their different production styles affect a viewer. Distinguish observed soundtrack from interpretation.
- 4-6 candidate excerpts for a website, each with file, start/end timestamp, verified quote if relevant, editorial purpose, and what must stay around it to preserve context. Include at least one self-narrated moment.
- Translate this into a restrained homepage: emotional promise, story order, video controls and sound behavior, calls to action, and the specific product capabilities the footage motivates. Center dignity, competence, belonging, supported choice, and reciprocity. Avoid pity, hero/savior framing, fabricated statistics, or reducing people to inspirational marketing.
- Explain the single most consequential design mistake a builder could make after viewing this footage.

The app is ConnectAble; Ability Passport is its shareable whole-person profile. Existing visual constraints: warm off-white, green, coral CTA, highly legible type, accessible controls; do not use blue as interface accent. This is context, not evidence about the films. No need to write code.
'''


def main():
    paths = [ROOT / 'Mr Shriver Input' / name for name in ['nick_video_720p.mp4', 'IMG_0162.mp4', 'IMG_1277.mp4']]
    uploaded = []
    try:
        for path in paths:
            uploaded.append(upload(path))
        video_input = [{'type': 'video', 'uri': file['uri'], 'mime_type': 'video/mp4', 'processing': 'agentic'} for file in uploaded]
        print('Analyzing all three films with gemini-3.8-flash, processing=agentic', flush=True)
        with request(BASE + '/v1beta/interactions', {'model': 'gemini-3.8-flash', 'input': video_input + [{'type': 'text', 'text': PROMPT}], 'store': False}) as response:
            result = json.load(response)
        (OUT / 'gemini-response.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
        steps = result.get('steps', [])
        output = result.get('output_text')
        if not output:
            output = '\n\n'.join(content['text'] for step in steps if step.get('type') == 'model_output' for content in step.get('content', []) if content.get('type') == 'text')
        if not output:
            output = '\n\n'.join(item.get('text', '') for item in result.get('outputs', []) if item.get('type') == 'text')
        if not output:
            raise RuntimeError('No report text returned; inspect response structure')
        (OUT / 'gemini-emotional-reading.md').write_text(output, encoding='utf-8')
        trace = {kind: sum(step.get('type') == kind for step in steps) for kind in ['processing_call', 'processing_result', 'model_output']}
        (OUT / 'gemini-provenance.json').write_text(json.dumps({'model': 'gemini-3.8-flash', 'requested_processing': 'agentic', 'source_files': [str(p.relative_to(ROOT)) for p in paths], 'trace_counts': trace, 'usage': result.get('usage')}, indent=2), encoding='utf-8')
        print('Saved report. Processing trace: ' + json.dumps(trace), flush=True)
    finally:
        for file in uploaded:
            try:
                with request(BASE + '/v1beta/' + file['name'], method='DELETE', timeout=30):
                    pass
            except Exception:
                print('Could not remove temporary upload ' + file['name'], flush=True)


if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as error:
        print('HTTP', error.code, error.read().decode().replace(key, '[REDACTED]'), flush=True)
        raise SystemExit(1)
