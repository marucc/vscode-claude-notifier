import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MESSAGES } from './messages';

const L10N_DIR = path.join(__dirname, '..', 'l10n');

test('すべての翻訳ファイルが原文の文言と同じキーを持つ', () => {
  const expected = Object.values(MESSAGES).sort();
  for (const file of fs.readdirSync(L10N_DIR).filter(f => f.endsWith('.json'))) {
    const bundle = JSON.parse(fs.readFileSync(path.join(L10N_DIR, file), 'utf8'));
    assert.deepEqual(Object.keys(bundle).sort(), expected, file);
  }
});
