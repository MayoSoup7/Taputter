/*
 * topics.js
 * -----------------------------------------------------------------------
 * プレイヤーのDM入力からどの「話題」に該当するかを判定するための
 * キーワード辞書です。
 *
 * ■ 話題を追加したいとき
 *   1. data/replies/ に新しい txt ファイルを追加する（例: onsen.txt）
 *   2. 下の TOPIC_KEYWORDS に話題IDとキーワード配列を追加する
 *   3. REPLY_TOPIC_FILES にファイル名を追加する
 *   これだけで自動的に会話エンジンが使ってくれます。
 * -----------------------------------------------------------------------
 */

const TOPIC_KEYWORDS = {
  hokkaido: ['北海道', 'ほっかいどう', '道民', '道産子', '札幌', '函館', '旭川', '雪国'],
  ramen: ['ラーメン', 'らーめん', '味噌ラーメン', '醤油ラーメン', '豚骨', 'つけ麺', '二郎'],
  game: ['ゲーム', 'げーむ', 'プレイ', '攻略', 'ボス戦', 'コントローラー', 'switch', 'スイッチ', 'ps5', 'steam'],
  haishin: ['配信', '生放送', 'アーカイブ', 'コラボ', '視聴'],
  nemui: ['眠い', 'ねむい', '眠たい', 'ねむたい', '寝不足', '睡眠不足', 'ねむ'],
  gohan: ['ご飯', 'ごはん', '飯', '食事', '夜ご飯', '朝ご飯', '昼ご飯', '自炊', '外食'],
  fan: ['ファン', '応援', '推し', '大好き', '好きです', 'いつも見てます', 'ありがとう'],
  conveni: ['コンビニ', 'こんびに', 'セブン', 'ローソン', 'ファミマ', 'コンビニ飯'],
  tenki: ['天気', 'てんき', '雨', '晴れ', '曇り', '台風', '気温', '暑い', '寒い', '雪'],
  animal: ['動物', 'どうぶつ', '犬', '猫', 'ねこ', 'いぬ', 'ペット', 'もふもふ'],
  okashi: ['お菓子', 'おかし', 'スイーツ', 'ポテチ', 'チョコ', 'アイス', 'ケーキ'],
  nebou: ['寝坊', 'ねぼう', '二度寝', '寝過ごし', 'アラーム'],
  doji: ['ドジ', 'どじ', 'やらかし', 'うっかり', '失敗した', 'ミスった'],
  haishin_ura: ['裏話', '裏側', '舞台裏', '本当は', 'ここだけの話'],
  nichijou: ['今日', '最近', '日常', 'あるある', '休日', '週末'],
  manga: ['漫画', 'マンガ', 'アニメ', 'ジャンプ', 'ワンピース', 'ゾロ', '鬼滅', '猗窩座', 'ヒロアカ', '爆豪', 'すたく', 'オタク'],
  aisatsu: ['おはよ', 'おは', 'こんにちは', 'こんちは', 'こんばんは', 'やっほ', 'やあ', 'はじめまして', 'よろしく', 'おつかれ', 'お疲れ'],
};

// 話題ID -> reply txt ファイル名
const REPLY_TOPIC_FILES = {
  hokkaido: 'hokkaido.txt',
  ramen: 'ramen.txt',
  game: 'game.txt',
  haishin: 'haishin.txt',
  nemui: 'nemui.txt',
  gohan: 'gohan.txt',
  fan: 'fan.txt',
  conveni: 'conveni.txt',
  tenki: 'tenki.txt',
  animal: 'animal.txt',
  okashi: 'okashi.txt',
  nebou: 'nebou.txt',
  doji: 'doji.txt',
  haishin_ura: 'haishin_ura.txt',
  nichijou: 'nichijou.txt',
  manga: 'manga.txt',
  aisatsu: 'aisatsu.txt',
  zatsudan: 'zatsudan.txt', // フォールバック（どれにも一致しないとき）
};

// ブラウザ / Node どちらでも読めるように window に生やしておく
// DMの「ワード一覧」パネルに表示する、たぷが反応する単語の一覧
// （実際にTOPIC_KEYWORDSに含まれている単語を選んでいるので、そのまま送信すればちゃんと反応します）
const WORD_HINTS = [
  { emoji: '🏔️', word: '北海道' },
  { emoji: '🍜', word: 'ラーメン' },
  { emoji: '🎮', word: 'ゲーム' },
  { emoji: '📺', word: '配信' },
  { emoji: '😴', word: '眠い' },
  { emoji: '🍚', word: 'ご飯' },
  { emoji: '💕', word: 'ファン' },
  { emoji: '🏪', word: 'コンビニ' },
  { emoji: '☀️', word: '天気' },
  { emoji: '🐾', word: '動物' },
  { emoji: '📅', word: '最近' },
  { emoji: '🍪', word: 'お菓子' },
  { emoji: '😪', word: '寝坊' },
  { emoji: '😅', word: 'ドジ' },
  { emoji: '🤫', word: '裏話' },
  { emoji: '📖', word: 'ワンピース' },
  { emoji: '📖', word: 'ゾロ' },
  { emoji: '📖', word: '鬼滅' },
  { emoji: '📖', word: 'ヒロアカ' },
  { emoji: '👋', word: 'おはよう' },
  { emoji: '👋', word: 'こんばんは' },
  { emoji: '🎙️', word: 'ボイスメッセージ' },
];

if (typeof window !== 'undefined') {
  window.TOPIC_KEYWORDS = TOPIC_KEYWORDS;
  window.REPLY_TOPIC_FILES = REPLY_TOPIC_FILES;
  window.WORD_HINTS = WORD_HINTS;
}
