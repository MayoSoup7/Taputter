/*
 * sound.js
 * -----------------------------------------------------------------------
 * 効果音(SE)の再生を担当する小さなヘルパーです。
 * RPGツクールMZ版で使われていたSE名をそのままファイル名として扱っています
 * （例: 投稿送信音 = Book2.ogg、いいね音 = Bell3.ogg）。
 *
 * ■ SEを追加したいとき
 *   1. assets/se/ に音声ファイル（.ogg推奨、.mp3でも可）を置く
 *   2. このファイルの SE_FILES に名前を追加する
 *   3. 鳴らしたい場所で TapuSound.play('ファイル名（拡張子なし）') を呼ぶ
 *
 *   元のMZ版プラグインでは以下のSEが使われていました（該当ファイルが
 *   届いたら同じように鳴らせます）:
 *     投稿送信 = Book2 / DM送信 = Book1 / リプ送信 = Decision3 / いいね = Bell3
 * -----------------------------------------------------------------------
 */

const TapuSound = (() => {
  const cache = {};
  let enabled = true;

  // 拡張子はここで一括管理（.ogg以外にした場合はここを変える）
  const EXT = 'ogg';

  function getAudio(name) {
    if (!cache[name]) {
      const audio = new Audio(`assets/se/${name}.${EXT}`);
      audio.volume = 0.5;
      cache[name] = audio;
    }
    return cache[name];
  }

  function play(name) {
    if (!enabled || !name) return;
    try {
      const base = getAudio(name);
      // 連打されても毎回頭から鳴るようにクローンして再生
      const node = base.cloneNode();
      node.volume = base.volume;
      node.play().catch(() => { /* ユーザー操作前の自動再生ブロック等は無視 */ });
    } catch (e) {
      console.warn('SE再生に失敗:', name, e);
    }
  }

  function setEnabled(v) { enabled = v; }

  return { play, setEnabled };
})();

if (typeof window !== 'undefined') {
  window.TapuSound = TapuSound;
}
