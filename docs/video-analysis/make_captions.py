"""Make explicitly auto-generated caption tracks from local Whisper transcripts."""
import json
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def timestamp(seconds):
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    seconds, millis = divmod(millis, 1000)
    return f'{hours:02}:{minutes:02}:{seconds:02}.{millis:03}'


for source, destination in [('nick_video_720p.mp4', 'nick'), ('IMG_0162.mp4', 'adam'), ('IMG_1277.mp4', 'cards')]:
    segments = json.loads((ROOT / 'docs/video-analysis' / f'{source}.json').read_text(encoding='utf-8'))
    cues = ['WEBVTT', '', 'NOTE Auto-generated with faster-whisper base.en; timing and words may contain errors.', '']
    for index, segment in enumerate(segments, 1):
        text = segment['text'].strip()
        # Correct only obvious names/terms independently corroborated by Gemini
        # and the visible Sarasota Ford title. Preserve uncertain names as unclear.
        text = text.replace('Nick Wolfensky', 'Nick [surname unclear]').replace('Circe of the Fort', 'Sarasota Ford').replace('serve sort of Ford', 'Sarasota Ford').replace('publics', 'Publix').replace('good will', 'Goodwill')
        text = text.replace('Fold napkins are all silver and sword out silver for the dishwasher.', 'Fold napkins, roll silverware and sort out silverware for the dishwasher.')
        cues.extend([str(index), f"{timestamp(segment['start'])} --> {timestamp(segment['end'])}", '\n'.join(textwrap.wrap(text, 48)), ''])
    (ROOT / 'public/stories' / f'{destination}.vtt').write_text('\n'.join(cues), encoding='utf-8')
