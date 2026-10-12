import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isClaudeTitle, isBusyTitle, sessionName, transition } from './title';

test('isClaudeTitle は Claude Code 本体のマーカーで始まるタイトルを判定する', () => {
  assert.equal(isClaudeTitle('◐ demo'), true);
  assert.equal(isClaudeTitle('◑ demo'), true);
  assert.equal(isClaudeTitle('✳ demo'), true);
  assert.equal(isClaudeTitle('zsh'), false);
  assert.equal(isClaudeTitle('✦ demo'), false);
});

test('isBusyTitle は稼働中マーカーだけを稼働中とみなす', () => {
  assert.equal(isBusyTitle('◐ demo'), true);
  assert.equal(isBusyTitle('◑ demo'), true);
  assert.equal(isBusyTitle('✳ demo'), false);
  assert.equal(isBusyTitle('✦ demo'), false);
  assert.equal(isBusyTitle('zsh'), false);
});

test('isBusyTitle はセッション名にマーカーが含まれても先頭だけを見る', () => {
  assert.equal(isBusyTitle('✳ ◐ の説明'), false);
});

test('sessionName は先頭のマーカーと空白を除く', () => {
  assert.equal(sessionName('◐ demo'), 'demo');
  assert.equal(sessionName('✳ demo'), 'demo');
  assert.equal(sessionName('▶ demo'), 'demo');
});

test('sessionName はサロゲートペアのマーカーと複数の空白も除く', () => {
  assert.equal(sessionName('\u{F009A}  demo'), 'demo');
});

test('transition は稼働中から別の表示に変わったら finished を返す', () => {
  assert.equal(transition(true, false), 'finished');
});

test('transition は稼働中以外から稼働中に変わったら resumed を返す', () => {
  assert.equal(transition(false, true), 'resumed');
});

test('transition は変化がないか初回なら null を返す', () => {
  assert.equal(transition(true, true), null);
  assert.equal(transition(false, false), null);
  assert.equal(transition(undefined, true), null);
  assert.equal(transition(undefined, false), null);
});
