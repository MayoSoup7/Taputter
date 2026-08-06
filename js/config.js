/*
 * config.js
 * -----------------------------------------------------------------------
 * アプリの見た目・キャラクター・初期データを定義する設定ファイルです。
 * RPGツクールMZ版のプラグインパラメータに相当する部分をここに集約しています。
 *
 * ■ キャラクターを増やしたいとき
 *   CHARACTERS オブジェクトに追加してください。
 *   id はプレイヤーの投稿やDMの authorId / from と一致させます。
 * -----------------------------------------------------------------------
 */

const TapuSNS_Config = {
  // ===== 見た目 =====
  accentColor: '#e91e8c',
  bgColor: '#f0f2f5',

  // ===== キャラクター定義 =====
  CHARACTERS: {
    tapu: {
      id: 'tapu',
      name: 'たぷたぷぷ',
      handle: '@taputapupu',
      icon: 'assets/img/tapu.jpg',
      bio: '配信者🍡道産子｜たぷたぷしてます！フォローよろしく〜！',
      followers: '24.8万',
      role: 'tapu',
      color: '#ff4fa3',
    },
    player: {
      id: 'player',
      name: 'おもち', // デフォルト。マイページから変更可能
      handle: '@omochi_fan',
      icon: '', // 未設定時は絵文字アイコン
      bio: 'たぷたぷぷの大ファンです🍡',
      role: 'player',
      color: '#ff8dc7',
    },

    // ----- タイムラインを賑わせるモブキャラクター -----
    other1: { id: 'other1', name: 'ラーメン限界太郎', handle: '@ramen_love', role: 'other', color: '#ff6b6b' },
    other2: { id: 'other2', name: '並び替え職人', handle: '@retsu_help', role: 'other', color: '#4dabf7' },
    other3: { id: 'other3', name: '深夜のバケモノ', handle: '@sleep_3am', role: 'other', color: '#845ef7' },
    other4: { id: 'other4', name: '5分だけ寝る男', handle: '@5more_min', role: 'other', color: '#51cf66' },
    other5: { id: 'other5', name: '半額ハンター', handle: '@sale_seal', role: 'other', color: '#fcc419' },
    other6: { id: 'other6', name: '気圧だめ人間', handle: '@lowpressure_man', role: 'other', color: '#ffa94d' },
    other7: { id: 'other7', name: 'エアコン迷い侍', handle: '@hot_or_cold', role: 'other', color: '#f06595' },
    other8: { id: 'other8', name: 'スマホどこ協会', handle: '@where_phone', role: 'other', color: '#20c997' },
    sada:   { id: 'sada',   name: 'サダ',   handle: '@sada_dayoo',  role: 'other', color: '#495057', icon: 'assets/img/sada.png' },
    mayo:   { id: 'mayo',   name: 'まよ',   handle: '@mayo_dev',   role: 'other', color: '#e64980', icon: 'assets/img/mayo.png' },
    manu:   { id: 'manu',   name: 'まぬ',   handle: '@manu_nemu',  role: 'other', color: '#7048e8', icon: 'assets/img/manu.png' },
    niki:   { id: 'niki',   name: 'ニキ',   handle: '@niki_2525',  role: 'other', color: '#f76707', icon: 'assets/img/niki.png' },
    kaoru:  { id: 'kaoru',  name: 'カオル', handle: '@kaoru_room', role: 'other', color: '#12b886', icon: 'assets/img/kaoru.png' },
    dokozo: { id: 'dokozo', name: 'どこぞ', handle: '@dokozodayo', role: 'other', color: '#5c7cfa', icon: 'assets/img/dokozo.png' },
    trivia_bot: { id: 'trivia_bot', name: 'たぷたぷ豆知識bot', handle: '@tapu_mame', role: 'other', color: '#868e96', icon: 'assets/img/trivia_bot.png' },
    cry_bot: { id: 'cry_bot', name: 'たぷ鳴き声bot', handle: '@tapu_cry', role: 'other', color: '#ff6fa5' },
  },

  // デフォルトのスタンプ一覧
  stamps: ['🍡', '💕', '✨', '🎉', '😊', '🥰', '😭', '😂', '🙏', '👍', '❤️', '🌸', '🐱', '🦄', '🌈', '🍰', '🎀', '🌟', '💫', '🫶'],

  // 話題判定に使うキーワード辞書・返信txtファイルはtopics.jsで定義
};

if (typeof window !== 'undefined') {
  window.TapuSNS_Config = TapuSNS_Config;
}
