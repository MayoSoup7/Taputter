/*
 * notifications.js
 * -----------------------------------------------------------------------
 * プレイヤーが投稿したときに「何も起きない／ちょっと反応がある／バズる／
 * 炎上する」をランダムに判定し、通知タブに流れる一連の通知を生成する
 * エンジンです。ノリはできるだけカオス・大喜利よりでOKという方針です。
 *
 * 発生確率（お任せということで以下に設定。調整したい場合はPROBSを編集）:
 *   何もなし   : 60%
 *   ちょっと反応: 20%（minor.txtから1件）
 *   バズる     : 12%（buzz.txtから1ブロック＝複数件が時間差で届く）
 *   炎上する   :  8%（enjou.txtから1ブロック＝複数件が時間差で届く）
 *
 * ■ 通知パターンを増やしたいとき
 *   data/notifications/buzz.txt / enjou.txt / minor.txt に追記するだけでOK。
 *   {user} と書いておくと data/notifications/usernames.txt からランダムな
 *   名前に自動で差し替えられます。
 * -----------------------------------------------------------------------
 */

const TapuNotifyEngine = (() => {
  let usernames = [];
  let buzzBlocks = [];
  let enjouBlocks = [];
  let minorLines = [];
  let loaded = false;

  const PROBS = { nothing: 0.35, minor: 0.40, buzz: 0.15, enjou: 0.10 };

  function parseBlocks(text) {
    return text.split(/\r?\n---\r?\n/)
      .map(block => block.split(/\r?\n/).map(l => l.trim()).filter(Boolean))
      .filter(block => block.length > 0);
  }

  function parseLines(text) {
    return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  }

  async function loadAll() {
    if (loaded) return;
    const src = window.TAPU_NOTIFY_DATA || {};
    usernames = parseLines(src.usernames || '');
    buzzBlocks = parseBlocks(src.buzz || '');
    enjouBlocks = parseBlocks(src.enjou || '');
    minorLines = parseLines(src.minor || '');
    loaded = true;
  }

  function randomUsername() {
    if (usernames.length === 0) return '名無しさん';
    return usernames[Math.floor(Math.random() * usernames.length)];
  }

  function fillUsers(text) {
    return text.replace(/\{user\}/g, () => randomUsername());
  }

  function iconFor(text) {
    if (/^[🔥📈🎉✨📢🎊⚠️🚨💬]/.test(text)) return text.slice(0, 2).trim();
    if (text.includes('いいね')) return '❤️';
    if (text.includes('フォロー') || text.includes('ブロック')) return '👤';
    if (text.includes('コメント')) return '💬';
    if (text.includes('リポスト') || text.includes('保存')) return '🔁';
    return '🍡';
  }

  // 1行を解析する。REPLY|ペルソナ名|本文 の形式なら「実際にツイートへ
  // 付くリプライ」として扱う。それ以外は普通の通知行として扱う。
  function parseLine(rawLine) {
    if (rawLine.startsWith('REPLY|')) {
      const parts = rawLine.split('|');
      const persona = parts[1] || '通りすがりの人';
      const commentRaw = parts.slice(2).join('|') || '';
      return { isReply: true, persona, commentRaw };
    }
    return { isReply: false, textRaw: rawLine };
  }

  function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

  // ティアに応じたいいね/リプ/リツイート増加の合計量（イベント通知の数に応じて後で分配する）
  function statsDeltaForTier(tier) {
    switch (tier) {
      case 'minor': return { likes: randInt(2, 15), replies: randInt(0, 3), retweets: randInt(0, 2) };
      case 'buzz':  return { likes: randInt(10000, 1000000), replies: randInt(300, 4000), retweets: randInt(1000, 100000) };
      case 'enjou': return { likes: randInt(300, 8000), replies: randInt(150, 900), retweets: randInt(50, 2000) };
      default:      return { likes: 0, replies: 0, retweets: 0 };
    }
  }

  // 投稿トリガー時に呼ぶ。{ tier, events, statsDelta } を返す
  // forceTier を渡すと確率判定をスキップして指定ティアで生成する（テスト用）
  function rollForPost(forceTier) {
    let tier;
    if (forceTier) {
      tier = forceTier;
    } else {
      const r = Math.random();
      if (r < PROBS.nothing) tier = 'nothing';
      else if (r < PROBS.nothing + PROBS.minor) tier = 'minor';
      else if (r < PROBS.nothing + PROBS.minor + PROBS.buzz) tier = 'buzz';
      else tier = 'enjou';
    }

    if (tier === 'nothing') return { tier, events: [], statsDelta: { likes: 0, replies: 0, retweets: 0 } };

    const statsDelta = statsDeltaForTier(tier);

    if (tier === 'minor') {
      if (minorLines.length === 0) return { tier, events: [], statsDelta };
      const line = fillUsers(minorLines[Math.floor(Math.random() * minorLines.length)]);
      return {
        tier,
        events: [{ text: line, icon: iconFor(line), delayMs: 1500 + Math.random() * 3000 }],
        statsDelta,
      };
    }

    const blocks = tier === 'buzz' ? buzzBlocks : enjouBlocks;
    if (blocks.length === 0) return { tier, events: [], statsDelta };
    const block = blocks[Math.floor(Math.random() * blocks.length)];

    let cumulative = 1200;
    const events = block.map((rawLine, i) => {
      const parsed = parseLine(rawLine);
      cumulative += 1400 + Math.random() * 1800;

      if (parsed.isReply) {
        const commentFilled = fillUsers(parsed.commentRaw); // {user}だけ先に埋める。{quote}は呼び出し側で埋める
        return {
          text: `💬 ${parsed.persona}：「{quote}」`,
          icon: '💬',
          delayMs: cumulative,
          isEventStart: i === 0,
          tier,
          isReply: true,
          persona: parsed.persona,
          replyText: commentFilled, // こちらにも {quote} が残っている場合がある
        };
      }

      const text = fillUsers(parsed.textRaw);
      return { text, icon: iconFor(text), delayMs: cumulative, isEventStart: i === 0, tier };
    });
    return { tier, events, statsDelta };
  }

  function randomMinorLine() {
    if (minorLines.length === 0) return null;
    const line = fillUsers(minorLines[Math.floor(Math.random() * minorLines.length)]);
    return { text: line, icon: iconFor(line) };
  }

  return { loadAll, rollForPost, randomMinorLine };
})();

if (typeof window !== 'undefined') {
  window.TapuNotifyEngine = TapuNotifyEngine;
}
