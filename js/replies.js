/*
 * replies.js
 * -----------------------------------------------------------------------
 * 「たぷ」のDM返信を生成する会話エンジンです。
 *
 * 仕組み:
 *   1. data/replies/*.txt を読み込み、話題ごとに
 *      REACTION（リアクション）/ TALK（自分の話）/ QUESTION（質問）
 *      の3つの引き出しに分類する
 *   2. プレイヤーの発言からキーワードで話題を推定する（topics.js）
 *   3. 3つの引き出しからランダムに1つずつ選んで組み合わせる
 *      → 少ない素材数でも掛け算で膨大なパターンになる
 *   4. 直近と同じ組み合わせ・同じ話題が連続しすぎないように調整する
 *
 * ■ 返信のバリエーションを増やしたいとき
 *   data/replies/<話題>.txt に1行追加するだけでOK。
 *   コードは一切変更不要です。
 * -----------------------------------------------------------------------
 */

const TapuReplyEngine = (() => {
  const pools = {}; // { topicId: { reaction: [...], talk: [...], question: [...] } }
  let loaded = false;

  const history = {
    lastTopic: null,
    lastTopicStreak: 0,
    lastCombo: null, // "reactionIdx-talkIdx-questionIdx"
  };

  function parsePoolText(text) {
    const sections = { reaction: [], talk: [], question: [] };
    let current = null;
    const lines = text.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('## REACTION')) { current = 'reaction'; continue; }
      if (line.startsWith('## TALK')) { current = 'talk'; continue; }
      if (line.startsWith('## QUESTION')) { current = 'question'; continue; }
      if (current) sections[current].push(line);
    }
    return sections;
  }

  async function loadAll() {
    if (loaded) return;

    const source = window.TAPU_REPLY_DATA || {};
    const entries = Object.entries(window.REPLY_TOPIC_FILES);
    for (const [topicId] of entries) {
      const text = source[topicId];
      if (text) {
        pools[topicId] = parsePoolText(text);
      } else {
        console.error('返信データが見つかりません:', topicId);
        pools[topicId] = { reaction: ['たぷたぷ！🍡'], talk: [], question: [] };
      }
    }
    loaded = true;
  }

  function pickIndex(len, avoidIdx) {
    if (len <= 1) return 0;
    let idx = Math.floor(Math.random() * len);
    if (idx === avoidIdx) idx = (idx + 1) % len;
    return idx;
  }

  function detectTopic(text) {
    if (!text) return 'zatsudan';
    const lower = text;
    const keywordMap = window.TOPIC_KEYWORDS || {};
    const candidates = [];
    for (const [topicId, keywords] of Object.entries(keywordMap)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          candidates.push(topicId);
          break;
        }
      }
    }
    if (candidates.length === 0) return 'zatsudan';
    // 同じ話題が連続しすぎないよう、候補が複数あれば直前と違うものを優先
    if (candidates.length > 1 && history.lastTopic) {
      const filtered = candidates.filter(t => t !== history.lastTopic);
      if (filtered.length > 0) return filtered[Math.floor(Math.random() * filtered.length)];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 会話の流れ: だいたい「リアクション→自分の話→質問」の3段だが、
  // 毎回同じテンポだと不自然なので、いろんな長さ・組み合わせをランダムに出す
  function pickShape() {
    const r = Math.random();
    if (r < 0.28) return ['reaction', 'talk', 'question'];
    if (r < 0.45) return ['reaction', 'talk'];
    if (r < 0.58) return ['reaction', 'question'];
    if (r < 0.75) return ['reaction'];
    if (r < 0.85) return ['talk', 'question'];
    if (r < 0.93) return ['talk'];
    return ['question'];
  }

  function applyName(text, nickname) {
    const name = (nickname && nickname.trim()) ? nickname.trim() : 'きみ';
    return text.split('{name}').join(name);
  }

  function generate(userText, nickname, opts) {
    opts = opts || {};
    let topic = detectTopic(userText);
    let pool = pools[topic];
    if (!pool || (pool.reaction.length === 0 && pool.talk.length === 0)) {
      topic = 'zatsudan';
      pool = pools[topic];
    }
    if (!pool) return 'たぷたぷ！🍡';

    // 同じ話題が3連続以上にならないよう調整
    if (topic === history.lastTopic) {
      history.lastTopicStreak++;
    } else {
      history.lastTopicStreak = 0;
    }
    if (history.lastTopicStreak >= 2 && pools.zatsudan) {
      topic = 'zatsudan';
      pool = pools.zatsudan;
      history.lastTopicStreak = 0;
    }

    const shape = opts.reactionOnly ? ['reaction'] : pickShape();
    const parts = [];
    const idxKey = [];

    for (const part of shape) {
      const arr = pool[part];
      if (!arr || arr.length === 0) continue;
      const idx = Math.floor(Math.random() * arr.length);
      parts.push(applyName(arr[idx], nickname));
      idxKey.push(idx);
    }

    if (parts.length === 0) parts.push('たぷたぷ！🍡');

    history.lastTopic = topic;
    history.lastCombo = `${topic}:${idxKey.join('-')}`;

    // LINEのように複数バブルへ分割して返す（呼び出し側で1通ずつ送信する）
    return parts;
  }

  // ----- DMモード用（雑談モード以外）-----
  // 話題判定はせず、モードのセリフ集からランダムに1〜2個選んで返す
  const modeHistory = {}; // mode -> 直近使ったインデックス

  function generateForMode(mode, nickname) {
    const map = {
      zentei: window.MODE_ZENTEI_LINES,
      ouen: window.MODE_OUEN_LINES,
      amaama: window.MODE_AMAAMA_LINES,
      soudan: window.MODE_SOUDAN_LINES,
      aori: window.MODE_AORI_LINES,
      mesugaki: window.MODE_MESUGAKI_LINES,
      tsundere: window.MODE_TSUNDERE_LINES,
      ojousama: window.MODE_OJOUSAMA_LINES,
    };
    const pool = map[mode];
    if (!pool || pool.length === 0) return ['たぷたぷ！🍡'];

    const count = Math.random() < 0.35 ? 2 : 1;
    const parts = [];
    const usedIdx = new Set();
    for (let i = 0; i < count; i++) {
      let idx = Math.floor(Math.random() * pool.length);
      if (pool.length > 1) {
        let guard = 0;
        while ((usedIdx.has(idx) || idx === modeHistory[mode]) && guard < 10) {
          idx = Math.floor(Math.random() * pool.length);
          guard++;
        }
      }
      usedIdx.add(idx);
      parts.push(applyName(pool[idx], nickname));
    }
    modeHistory[mode] = [...usedIdx].pop();
    return parts;
  }

  return { loadAll, generate, generateForMode, detectTopic, applyName };
})();

if (typeof window !== 'undefined') {
  window.TapuReplyEngine = TapuReplyEngine;
}
