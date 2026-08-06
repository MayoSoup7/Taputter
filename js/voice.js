/*
 * voice.js
 * -----------------------------------------------------------------------
 * ボイスDMで実際にどのセリフを選ぶかを決めるロジックです。
 * 時間帯（朝/夜限定のセリフ）と、DMモード（甘々モード優先 等）を
 * 考慮してランダムに1つ選びます。
 * -----------------------------------------------------------------------
 */

const TapuVoice = (() => {
  function currentPool() {
    const data = window.TAPU_VOICE_LINES;
    if (!data) return [];
    const h = new Date().getHours();
    let pool = (data.general || []).slice();
    if (h >= 5 && h < 10) pool = pool.concat(data.morning || []);
    if (h >= 20 || h < 5) pool = pool.concat(data.night || []);
    // 実際に音声ファイルが登録されているものだけを対象にする
    // （タップしたのに何も鳴らない、を避けるため）
    return pool.filter(v => v.file);
  }

  // mode を指定すると、そのモード向けのセリフ（mode一致）があれば
  // 高確率でそちらを優先する。逆に他モード専用のタグが付いたセリフは
  // （例: amaama専用ボイスが煽りモード中に来る、等）除外する
  function pickLine(mode) {
    let pool = currentPool();
    if (pool.length === 0) return null;

    // 現在のモードに合わない「モード専用」タグのセリフは除外
    pool = pool.filter(v => !v.mode || v.mode === mode);
    if (pool.length === 0) pool = currentPool().filter(v => !v.mode);
    if (pool.length === 0) return null;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  return { pickLine };
})();

if (typeof window !== 'undefined') {
  window.TapuVoice = TapuVoice;
}
