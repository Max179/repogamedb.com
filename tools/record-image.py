#!/usr/bin/env python3
"""Add or update one image record in content/images-manifest.json.

The manifest is a licence/provenance ledger, so its fields are not optional. This tool computes the facts that
would be easy to get wrong by hand (bytes, width, height, sha256), validates the licence fields, and writes the
records back sorted by file so a diff stays readable.

Examples:
  python3 tools/record-image.py --file fandom/oogly.png --kind community --entry the-oogly \
      --source-name "R.E.P.O. Fandom Wiki" --source-page "https://repo-2025horror.fandom.com/wiki/Oogly" \
      --author "R.E.P.O. Fandom Wiki contributors" --license CC-BY-SA-4.0 \
      --license-url https://creativecommons.org/licenses/by-sa/4.0/ --retrieved-at 2026-10-13 \
      --reviewer lead --verdict ok --provenance exact

A community record may not be written without a source page, author, licence and retrieval date. A game record
requires --source-bundle and --asset-name instead. Use --replace only when intentionally updating an existing record.
"""
import argparse
import hashlib
import json
import os
import sys

from PIL import Image

ROOT = os.getcwd()
MANIFEST = os.path.join(ROOT, 'content', 'images-manifest.json')
IMAGE_ROOTS = [os.path.join(ROOT, 'content', 'assets'), os.path.join(ROOT, 'content'), os.path.join(ROOT, 'content', 'images')]
COMMUNITY_KEYS = ['source-name', 'source-page', 'author', 'license', 'license-url', 'retrieved-at']
GAME_KEYS = ['source-bundle', 'asset-name']


def resolve(file):
    for base in IMAGE_ROOTS:
        path = os.path.join(base, file)
        if os.path.exists(path):
            return path
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--file', required=True, help='manifest path, e.g. fandom/oogly.png or mapped/foo.jpg')
    p.add_argument('--kind', required=True, choices=['game', 'community'])
    p.add_argument('--entry', required=True)
    p.add_argument('--source-name')
    p.add_argument('--source-page')
    p.add_argument('--original-url')
    p.add_argument('--author')
    p.add_argument('--license')
    p.add_argument('--license-url')
    p.add_argument('--retrieved-at')
    p.add_argument('--source-bundle')
    p.add_argument('--asset-name')
    p.add_argument('--reviewer', default='lead')
    p.add_argument('--verdict', default='ok', choices=['ok', 'flagged', 'rejected'])
    p.add_argument('--notes', default='')
    p.add_argument('--provenance', default='exact', choices=['exact', 'weak'])
    p.add_argument('--modified', action='store_true')
    p.add_argument('--replace', action='store_true')
    args = p.parse_args()

    path = resolve(args.file)
    if not path:
        print('file not found under content/: ' + args.file, file=sys.stderr)
        return 2
    with Image.open(path) as im:
        width, height = im.size
    with open(path, 'rb') as fh:
        data = fh.read()
    if len(data) < 1024:
        print('image smaller than 1 KB: ' + args.file, file=sys.stderr)
        return 2
    if args.kind == 'community':
        missing = [k for k in COMMUNITY_KEYS if not getattr(args, k.replace('-', '_'))]
        if missing:
            print('community record missing: ' + ', '.join(missing), file=sys.stderr)
            return 2
        if args.license != 'CC-BY-SA-4.0':
            print('unsupported community licence: ' + str(args.license), file=sys.stderr)
            return 2
    else:
        missing = [k for k in GAME_KEYS if not getattr(args, k.replace('-', '_'))]
        if missing:
            print('game record missing: ' + ', '.join(missing), file=sys.stderr)
            return 2

    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    records = manifest.get('records', [])
    existing = next((i for i, r in enumerate(records) if r.get('file') == args.file), None)
    if existing is not None and not args.replace:
        print('record already exists for ' + args.file + ' (pass --replace to update)', file=sys.stderr)
        return 2
    record = {
        'file': args.file,
        'kind': args.kind,
        'entity': args.entry,
        'width': width,
        'height': height,
        'bytes': len(data),
        'sha256': hashlib.sha256(data).hexdigest(),
        'verdict': args.verdict,
        'reviewer': args.reviewer,
        'reviewDate': os.environ.get('IMAGE_REVIEW_DATE', '2026-10-22'),
        'notes': args.notes,
    }
    if args.kind == 'community':
        record.update({
            'sourceName': args.source_name,
            'sourcePage': args.source_page,
            'originalUrl': args.original_url or '',
            'author': args.author,
            'license': args.license,
            'licenseUrl': args.license_url,
            'retrievedAt': args.retrieved_at,
            'modified': bool(args.modified),
            'provenance': args.provenance,
        })
    else:
        record.update({'sourceBundle': args.source_bundle, 'assetName': args.asset_name})
    if existing is None:
        records.append(record)
    else:
        records[existing] = record
    manifest['schemaVersion'] = 2
    manifest['records'] = sorted(records, key=lambda r: r['file'])
    with open(MANIFEST, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    print('[record-image] ' + ('updated ' if existing is not None else 'added ') + args.file + ' (' + str(width) + 'x' + str(height) + ', ' + str(len(data)) + ' bytes)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
