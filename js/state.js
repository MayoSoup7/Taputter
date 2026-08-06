/*
 * state.js
 * -----------------------------------------------------------------------
 * アプリ全体のデータを一箇所で管理するストアです。
 * ブラウザの localStorage に保存されるので、GitHub Pages のような
 * バックエンドなしの静的サイトでも「続き」が遊べます。
 *
 * ■ 保存されるデータ
 *   - profile   : プレイヤーのプロフィール（名前・呼び方・アイコン等）
 *   - posts     : タイムラインの投稿一覧（最初にseed_posts.jsを読み込む）
 *   - likedPostIds : プレイヤーがいいねした投稿ID
 *   - dmThread  : たぷとのDM履歴
 *   - notifications : 通知一覧
 *   - meta      : 最終起動時刻など、システム的な値
 * -----------------------------------------------------------------------
 */

const TapuSNS_State = (() => {
  const STORAGE_KEY = 'taputter_save_v1';

  let data = null;

  function defaultProfile() {
    return {
      name: 'おもち',
      handle: '@omochi_fan',
      bio: 'たぷたぷぷの大ファンです🍡',
      icon: '', // base64 dataURL。未設定なら絵文字アイコン表示
      nickname: 'おもち', // たぷがDMで呼ぶときの呼び方（自由入力・呼び捨てOK）
    };
  }

  function buildInitialData() {
    const now = Date.now();
    const seedPosts = (window.TapuSNS_SeedPosts || []).map(p => ({
      id: p.id,
      authorId: p.authorId,
      content: p.content,
      createdAt: now - p.minutesAgo * 60 * 1000,
      likes: p.likes,
      replyCount: p.replies,
      replies: [], // プレイヤーが返信したリプライのみここに積む（表示用）
    }));

    return {
      version: 1,
      profile: defaultProfile(),
      posts: seedPosts,
      likedPostIds: [],
      retweets: {},
      dmThread: [
        // 起動直後にたぷからの一言をあらかじめ用意しておく
        {
          id: 'dm_seed_1',
          from: 'tapu',
          text: 'はじめまして〜！たぷたぷぷです🍡\nこれからよろしくね〜！なんでも話しかけて〜💕',
          createdAt: now - 3 * 60 * 1000,
          read: true,
        },
      ],
      notifications: [],
      dmMode: 'zatsudan', // 'zatsudan' | 'zentei' | 'ouen' | 'amaama'
      meta: {
        lastOpenedAt: now,
        lastTapuDmAt: now - 3 * 60 * 1000,
        followerCount: 248000,
        unreadDm: 0,
        unreadNotify: 0,
      },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        data = JSON.parse(raw);
        // 新しい話題ファイルなどが増えても壊れないよう、欠けているキーを補完
        const fresh = buildInitialData();
        data.profile = Object.assign({}, fresh.profile, data.profile);
        data.meta = Object.assign({}, fresh.meta, data.meta);
        if (!Array.isArray(data.posts)) data.posts = fresh.posts;
        if (!Array.isArray(data.dmThread)) data.dmThread = fresh.dmThread;
        if (!Array.isArray(data.notifications)) data.notifications = [];
        if (!Array.isArray(data.likedPostIds)) data.likedPostIds = [];
        if (!data.retweets || typeof data.retweets !== 'object') data.retweets = {};
        if (!data.dmMode) data.dmMode = 'zatsudan';
      } else {
        data = buildInitialData();
      }
    } catch (e) {
      console.error('セーブデータの読み込みに失敗、初期化します', e);
      data = buildInitialData();
    }
    save();
    return data;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('セーブに失敗しました', e);
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    data = buildInitialData();
    save();
  }

  // ----- profile -----
  function getProfile() { return data.profile; }
  function updateProfile(patch) {
    data.profile = Object.assign({}, data.profile, patch);
    save();
  }

  // ----- posts -----
  function getPosts() {
    return [...data.posts].sort((a, b) => b.createdAt - a.createdAt);
  }
  function addPlayerPost(content) {
    const post = {
      id: 'post_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      authorId: 'player',
      content,
      createdAt: Date.now(),
      likes: 0,
      replyCount: 0,
      replies: [],
    };
    data.posts.unshift(post);
    save();
    return post;
  }
  function addTapuPost(content) {
    return addAutoPost('tapu', content, { likesRange: [30, 430], repliesRange: [0, 30] });
  }
  function addAutoPost(authorId, content, opts = {}) {
    const [likeMin, likeMax] = opts.likesRange || [0, 20];
    const [replyMin, replyMax] = opts.repliesRange || [0, 3];
    const post = {
      id: 'post_auto_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      authorId,
      content,
      createdAt: Date.now(),
      likes: Math.floor(likeMin + Math.random() * (likeMax - likeMin)),
      replyCount: Math.floor(replyMin + Math.random() * (replyMax - replyMin)),
      replies: [],
    };
    data.posts.unshift(post);
    save();
    return post;
  }
  function toggleLike(postId) {
    const post = data.posts.find(p => p.id === postId);
    if (!post) return null;
    const idx = data.likedPostIds.indexOf(postId);
    if (idx >= 0) {
      data.likedPostIds.splice(idx, 1);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      data.likedPostIds.push(postId);
      post.likes += 1;
    }
    save();
    return { liked: idx < 0, likes: post.likes };
  }
  function isLiked(postId) { return data.likedPostIds.includes(postId); }

  // ----- リツイート -----
  function toggleRetweet(postId) {
    const post = data.posts.find(p => p.id === postId);
    if (!post) return null;
    if (!data.retweets) data.retweets = {};
    if (post.retweetCount == null) post.retweetCount = 0;

    if (data.retweets[postId]) {
      delete data.retweets[postId];
      post.retweetCount = Math.max(0, post.retweetCount - 1);
      save();
      return { retweeted: false, retweetCount: post.retweetCount };
    } else {
      data.retweets[postId] = Date.now();
      post.retweetCount += 1;
      save();
      return { retweeted: true, retweetCount: post.retweetCount };
    }
  }
  function isRetweeted(postId) { return !!(data.retweets && data.retweets[postId]); }
  function getMyRetweetedPosts() {
    if (!data.retweets) return [];
    return Object.keys(data.retweets)
      .map(id => {
        const post = data.posts.find(p => p.id === id);
        return post ? { post, retweetedAt: data.retweets[id] } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.retweetedAt - a.retweetedAt);
  }
  function addReplyToPost(postId, text, authorId = 'player', authorMeta = null) {
    const post = data.posts.find(p => p.id === postId);
    if (!post) return;
    const entry = { authorId, text, createdAt: Date.now() };
    if (authorMeta) {
      entry.authorName = authorMeta.name || null;
      entry.authorHandle = authorMeta.handle || null;
    }
    post.replies.push(entry);
    post.replyCount += 1;
    // 表示が肥大化しすぎないよう、カード内には直近2件だけ保持
    while (post.replies.length > 2) post.replies.shift();
    save();
  }
  // バズ/炎上などで外部からいいね・リプ数・リツイート数だけを増やす（プレイヤー自身のリアクションとは別枠）
  function addPostEngagement(postId, { likes = 0, replies = 0, retweets = 0 } = {}) {
    const post = data.posts.find(p => p.id === postId);
    if (!post) return null;
    post.likes = Math.max(0, (post.likes || 0) + likes);
    post.replyCount = Math.max(0, (post.replyCount || 0) + replies);
    post.retweetCount = Math.max(0, (post.retweetCount || 0) + retweets);
    save();
    return { likes: post.likes, replyCount: post.replyCount, retweetCount: post.retweetCount };
  }
  // バズった/炎上した投稿に見た目でわかるようフラグを立てる
  function setPostStatus(postId, status) {
    const post = data.posts.find(p => p.id === postId);
    if (!post) return;
    post.status = status; // 'buzz' | 'enjou' | null
    save();
  }

  // ----- DM -----
  function getDmThread() { return data.dmThread; }
  function addDmMessage(msg) {
    const full = Object.assign({
      id: 'dm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      createdAt: Date.now(),
      read: false,
    }, msg);
    data.dmThread.push(full);
    if (full.from === 'tapu') {
      data.meta.lastTapuDmAt = full.createdAt;
      data.meta.unreadDm += 1;
    }
    save();
    return full;
  }
  function markDmRead() {
    data.dmThread.forEach(m => { m.read = true; });
    data.meta.unreadDm = 0;
    save();
  }

  // ----- notifications -----
  function getNotifications() {
    return [...data.notifications].sort((a, b) => b.createdAt - a.createdAt);
  }
  function addNotification(n) {
    const full = Object.assign({
      id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      createdAt: Date.now(),
      read: false,
    }, n);
    data.notifications.push(full);
    data.meta.unreadNotify += 1;
    save();
    return full;
  }
  function markNotifRead() {
    data.notifications.forEach(n => { n.read = true; });
    data.meta.unreadNotify = 0;
    save();
  }

  // ----- meta -----
  function getMeta() { return data.meta; }
  function touchLastOpened() {
    data.meta.lastOpenedAt = Date.now();
    save();
  }

  // ----- DMモード -----
  function getDmMode() { return data.dmMode || 'zatsudan'; }
  function setDmMode(mode) {
    data.dmMode = mode;
    save();
  }

  return {
    load, save, reset,
    getProfile, updateProfile,
    getPosts, addPlayerPost, addTapuPost, addAutoPost, toggleLike, isLiked, addReplyToPost, addPostEngagement, setPostStatus,
    toggleRetweet, isRetweeted, getMyRetweetedPosts,
    getDmThread, addDmMessage, markDmRead,
    getNotifications, addNotification, markNotifRead,
    getMeta, touchLastOpened,
    getDmMode, setDmMode,
  };
})();

if (typeof window !== 'undefined') {
  window.TapuSNS_State = TapuSNS_State;
}
