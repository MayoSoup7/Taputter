/*
 * engagement.js
 * -----------------------------------------------------------------------
 * 「たぷが本当にスマホの向こうにいる」感じを出すための、時間経過に
 * よって発生する自発的な行動をまとめています。
 *
 *   1. 自動ツイート  : アプリを開いている間、たまにたぷが自分でツイートする
 *   2. 突然DM        : 前回のDMから一定時間（現実時間）が経つと、
 *                       次にアプリを開いたときにたぷの方から話しかけてくる
 *
 * ■ 頻度や時間帯のセリフを調整したいとき
 *   このファイル内の SURPRISE_DM_GREETINGS と各種確率値を編集してください。
 * -----------------------------------------------------------------------
 */

const TapuEngagement = (() => {
  const SURPRISE_DM_MIN_HOURS = 6;
  const SURPRISE_DM_MAX_HOURS = 24;
  const SURPRISE_DM_TRIGGER_PROB = 0.7; // 条件を満たした時に実際に送る確率

  // プレイ中に「たまに」たぷから自発的なひとことDMが届く間隔（5〜30分でランダム）
  const SPONTANEOUS_DM_MIN_MINUTES = 5;
  const SPONTANEOUS_DM_MAX_MINUTES = 30;

  // ボイスDM: 自発DMのうち、たまにテキストの代わりにボイスメッセージが届く
  const VOICE_DM_CHANCE = 0.25; // 自発DMが発生した時、この確率でボイス版になる

  const AUTO_TWEET_CHECK_INTERVAL_MS = 90 * 1000; // 90秒ごとにチャンス判定

  // モブキャラ（誰が呟いてもいい共通プール）としてランダム抽選される候補
  const MOB_AUTHOR_IDS = ['sada', 'niki', 'kaoru', 'dokozo', 'manu', 'mayo', 'other1', 'other2', 'other3', 'other4', 'other5', 'other6', 'other7', 'other8'];

  // 自動でツイートするアカウント一覧。増やしたい時はここに追加するだけでOK。
  const BOT_ACCOUNTS = [
    { authorId: 'tapu', dataKey: 'TAPU_POSTS_DATA', prob: 0.28, notify: false,
      likesRange: [30, 430], repliesRange: [0, 30] },
    { authorId: 'tapu', dataKey: 'TAPU_STREAM_POSTS_DATA', prob: 0.05, notify: false,
      likesRange: [30, 430], repliesRange: [0, 30] },
    { authorId: 'trivia_bot', dataKey: 'TAPU_TRIVIA_POSTS_DATA', prob: 0.16, notify: false,
      likesRange: [10, 150], repliesRange: [0, 12] },
    { authorId: 'cry_bot', dataKey: 'TAPU_CRY_POSTS_DATA', prob: 0.20, notify: false,
      likesRange: [5, 80], repliesRange: [0, 8] },
    { authorPool: MOB_AUTHOR_IDS, dataKey: 'TAPU_MOB_POSTS_DATA', prob: 0.35, notify: false,
      likesRange: [3, 120], repliesRange: [0, 10] },
  ];

  const botPools = {}; // dataKey -> string[]

  function loadBotPools() {
    BOT_ACCOUNTS.forEach(bot => {
      const text = window[bot.dataKey] || '';
      botPools[bot.dataKey] = text.split(/\r?\n---\r?\n/).map(s => s.trim()).filter(Boolean);
      if (botPools[bot.dataKey].length === 0) {
        console.error('自動投稿データが見つかりません:', bot.dataKey);
      }
    });
  }

  function maybeAttachFlavorReplies(post, authorId) {
    const pool = window.GENERIC_QUICK_REPLIES;
    if (!pool || pool.length === 0) return;
    const r = Math.random();
    let count = 0;
    if (r < 0.45) count = 1;
    else if (r < 0.60) count = 2;
    if (count === 0) return;

    const candidates = MOB_AUTHOR_IDS.concat(['tapu']).filter(id => id !== authorId);
    for (let i = 0; i < count; i++) {
      const replierId = candidates[Math.floor(Math.random() * candidates.length)];
      const text = pool[Math.floor(Math.random() * pool.length)];
      TapuSNS_State.addReplyToPost(post.id, text, replierId);
    }
  }

  function maybeAutoTweetOnce() {
    BOT_ACCOUNTS.forEach(bot => {
      const pool = botPools[bot.dataKey];
      if (!pool || pool.length === 0) return;
      if (Math.random() > bot.prob) return;

      const authorId = bot.authorPool
        ? bot.authorPool[Math.floor(Math.random() * bot.authorPool.length)]
        : bot.authorId;

      const text = pool[Math.floor(Math.random() * pool.length)];
      const author = window.TapuSNS_Config.CHARACTERS[authorId];
      const post = TapuSNS_State.addAutoPost(authorId, text, { likesRange: bot.likesRange, repliesRange: bot.repliesRange });
      maybeAttachFlavorReplies(post, authorId);

      if (bot.notify) {
        TapuSNS_State.addNotification({ text: `${author ? author.name : authorId} がツイートしました🍡`, icon: '🍡' });
      }

      if (window.TapuUI_Home) window.TapuUI_Home.renderTimeline();
      if (window.TapuUI_Notify) window.TapuUI_Notify.renderNotifications();
      if (window.TapuUI_Main) window.TapuUI_Main.updateBadges();
      if (window.TapuUI_Profile) window.TapuUI_Profile.renderTapuProfile();
    });
  }

  function startAutoTweetTimer() {
    setInterval(maybeAutoTweetOnce, AUTO_TWEET_CHECK_INTERVAL_MS);
  }

  // TL更新ボタン用：確率を無視して1〜5件のツイートを即座に追加する
  function forceRefreshTimeline() {
    const count = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const bot = BOT_ACCOUNTS[Math.floor(Math.random() * BOT_ACCOUNTS.length)];
      const pool = botPools[bot.dataKey];
      if (!pool || pool.length === 0) continue;

      const authorId = bot.authorPool
        ? bot.authorPool[Math.floor(Math.random() * bot.authorPool.length)]
        : bot.authorId;

      const text = pool[Math.floor(Math.random() * pool.length)];
      const post = TapuSNS_State.addAutoPost(authorId, text, { likesRange: bot.likesRange, repliesRange: bot.repliesRange });
      maybeAttachFlavorReplies(post, authorId);
    }

    if (window.TapuUI_Home) window.TapuUI_Home.renderTimeline();
    if (window.TapuUI_Notify) window.TapuUI_Notify.renderNotifications();
    if (window.TapuUI_Main) window.TapuUI_Main.updateBadges();
    if (window.TapuUI_Profile) window.TapuUI_Profile.renderTapuProfile();
    return count;
  }

  const SURPRISE_DM_GREETINGS = {
    morning: [
      ['おはよ〜！！😆', '今日も一日頑張ろうね〜💕'],
      ['朝だ〜！おはよ〜😆', '{name}は今日どんな一日になりそう？'],
      ['おっはよ〜🍡', 'なまら良い天気で目覚め良かった〜'],
      ['ねむい目こすりながらおはよ〜www', '{name}はちゃんと起きれた？'],
      ['朝ごはん食べた〜？アタイはまだなんだよね😆'],
      ['今日も配信あるから応援よろしくね〜💕'],
    ],
    day: [
      ['ねえねえ、聞いて〜😆', '暇してたから{name}のこと思い出しちゃった💕'],
      ['やっほ〜！！', '今何してるところ？'],
      ['ふと{name}のこと考えてたら連絡したくなっちゃった😆'],
      ['お昼食べた〜？アタイ今から食べるとこ🍜'],
      ['なんか眠くなってきた…www {name}は眠くない？'],
      ['ひまだ〜、{name}構ってくれる？www'],
      ['作業の合間にちょっと一息、{name}は元気にしてる？'],
    ],
    evening: [
      ['おつかれさま〜！😆', '今日一日どうだった？'],
      ['夕方だ〜、なんか{name}の顔（？）見たくなった💕', '元気にしてる？'],
      ['そろそろご飯どうしようか迷い中…{name}は決まった？'],
      ['今日の配信、聞いてくれてたらうれしいな💕'],
    ],
    night: [
      ['ねむいけど{name}とちょっと話したくなった…www'],
      ['夜だ〜、まだ起きてる？😆', '眠れなかったら話し相手になるよ〜'],
      ['今日も一日おつかれさま💕', 'ゆっくり休んでね〜'],
      ['寝る前についスマホ見ちゃう、{name}もそのタイプ？www'],
      ['なんか{name}のこと考えてたら寝るタイミング逃した…笑'],
    ],
  };

  function timeSlot() {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return 'morning';
    if (h >= 10 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  // たぷから複数バブルのグリーティングDMを届ける共通処理
  // （startDelayMs: 最初のバブルが届くまでの間、フェーズ演出用）
  // アプリを開いてすぐの「突然DM」ではボイスは送らない（voiceOk=falseで通常テキストのみ）
  function deliverGreetingDM(startDelayMs = 0, voiceOk = true) {
    if (voiceOk && window.TapuVoice && Math.random() < VOICE_DM_CHANCE) {
      const v = window.TapuVoice.pickLine(TapuSNS_State.getDmMode ? TapuSNS_State.getDmMode() : 'zatsudan');
      if (v) {
        const profile = TapuSNS_State.getProfile();
        const caption = window.TapuReplyEngine.applyName(v.caption, profile.nickname);
        setTimeout(() => {
          TapuSNS_State.addDmMessage({
            from: 'tapu', type: 'voice',
            text: caption,
            audioUrl: v.file ? `assets/voice/${v.file}` : '',
            duration: v.duration,
          });
          if (window.TapuUI_DM) window.TapuUI_DM.renderDM();
          if (window.TapuUI_Main) window.TapuUI_Main.updateBadges();
        }, startDelayMs);
        return;
      }
    }

    const slot = timeSlot();
    const pool = SURPRISE_DM_GREETINGS[slot] || SURPRISE_DM_GREETINGS.day;
    const parts = pool[Math.floor(Math.random() * pool.length)];
    const profile = TapuSNS_State.getProfile();
    const filled = parts.map(t => window.TapuReplyEngine.applyName(t, profile.nickname));

    setTimeout(() => {
      filled.forEach((text, i) => {
        setTimeout(() => {
          TapuSNS_State.addDmMessage({ from: 'tapu', text, type: 'text' });
          if (window.TapuUI_DM) window.TapuUI_DM.renderDM();
          if (window.TapuUI_Main) window.TapuUI_Main.updateBadges();
        }, i * 1400);
      });
    }, startDelayMs);
  }

  function checkSurpriseDM() {
    const meta = TapuSNS_State.getMeta();
    const hoursSince = (Date.now() - meta.lastTapuDmAt) / 3600000;
    const threshold = SURPRISE_DM_MIN_HOURS + Math.random() * (SURPRISE_DM_MAX_HOURS - SURPRISE_DM_MIN_HOURS);

    if (hoursSince < threshold) return;
    if (Math.random() > SURPRISE_DM_TRIGGER_PROB) return;

    deliverGreetingDM(2500, false); // アプリを開いてから少し間を置いて届く演出。初回はテキストのみ
  }

  // アプリを開いている間、5〜30分間隔でたぷから自発的なDMが届く
  function scheduleNextSpontaneousDM() {
    const minutes = SPONTANEOUS_DM_MIN_MINUTES + Math.random() * (SPONTANEOUS_DM_MAX_MINUTES - SPONTANEOUS_DM_MIN_MINUTES);
    setTimeout(() => {
      deliverGreetingDM(0, true);
      scheduleNextSpontaneousDM();
    }, minutes * 60 * 1000);
  }

  async function init() {
    loadBotPools();
    startAutoTweetTimer();
    setTimeout(maybeAutoTweetOnce, 15000); // 起動15秒後にも1回チャンス判定
    checkSurpriseDM();
    scheduleNextSpontaneousDM();
  }

  return { init, forceRefreshTimeline };
})();

if (typeof window !== 'undefined') {
  window.TapuEngagement = TapuEngagement;
}
