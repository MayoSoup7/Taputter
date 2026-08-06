/*
 * seed_posts.js
 * -----------------------------------------------------------------------
 * ゲーム開始時にタイムラインへ最初から並んでいる投稿データです。
 * minutesAgo は「今から何分前の投稿か」を表し、読み込み時に実際の
 * タイムスタンプへ変換されます。
 *
 * ■ 投稿を追加したいとき
 *   配列の好きな位置に { id, authorId, content, minutesAgo, likes, replies }
 *   を追加してください。id はユニークであれば自由な文字列でOKです。
 * -----------------------------------------------------------------------
 */

const TapuSNS_SeedPosts = [
  {
    id: 'seed_1', authorId: 'tapu',
    content: 'みんなおはよ〜！今日も配信するよ〜！楽しみにしてね🍡 #たぷたぷぷ #配信',
    minutesAgo: 5, likes: 342, replies: 58,
  },
  {
    id: 'seed_2', authorId: 'sada',
    content: `ラーメン屋で\n「おすすめのラーメンは？」\n\nって聞いておいて\n\nチャーハン頼んだ`,
    minutesAgo: 9, likes: 52, replies: 4,
  },
  {
    id: 'seed_3', authorId: 'other1',
    content: `ラーメン屋で\n「普通盛りですか？」\n\nって聞かれると\nちょっと傷つく`,
    minutesAgo: 11, likes: 48, replies: 3,
  },
  {
    id: 'seed_4', authorId: 'sada',
    content: `上司から飲み会誘われたので\n\n「親戚が倒れて…」\n\nって断った\n\n親戚は元気\n\nおれの名はモンキー・D・元気`,
    minutesAgo: 16, likes: 44, replies: 3,
  },
  {
    id: 'seed_5', authorId: 'mayo',
    content: `Taputter、\n楽しんでもらえてますか＾＾\n\n作者は深夜テンションで作っています`,
    minutesAgo: 19, likes: 201, replies: 38,
  },
  {
    id: 'seed_6', authorId: 'sada',
    content: `若い頃は\n徹夜しても元気だった\n\n今は寝不足だと\n人格が終わる`,
    minutesAgo: 27, likes: 31, replies: 1,
  },
  {
    id: 'seed_7', authorId: 'niki',
    content: `爆発してない電子レンジ、\nちょっと物足りない`,
    minutesAgo: 35, likes: 82, replies: 9,
  },
  {
    id: 'seed_8', authorId: 'trivia_bot',
    content: `【たぷたぷ豆知識】\n\nたぷたぷぷの夢は\n\n"でかくてもふもふな犬を飼うこと"\n\nかなってほしい。`,
    minutesAgo: 42, likes: 111, replies: 14,
  },
  {
    id: 'seed_9', authorId: 'manu',
    content: `酒飲みながら見る冷蔵庫、\n\nだいたい全部うまそう`,
    minutesAgo: 55, likes: 69, replies: 4,
  },
  {
    id: 'seed_10', authorId: 'kaoru',
    content: `ちゃんとご飯食べててえらい🌸\n\n水飲めてもっとえらい🌸`,
    minutesAgo: 80, likes: 52, replies: 3,
  },
  {
    id: 'seed_11', authorId: 'other8',
    content: `スマホ落としたと思って焦ったら\n\nポケットに入ってた\n\n命拾いした`,
    minutesAgo: 93, likes: 72, replies: 6,
  },
  {
    id: 'seed_12', authorId: 'mayo',
    content: `最近、\n変な人が増えてきました＾＾\n\n作者はうれしいです`,
    minutesAgo: 106, likes: 188, replies: 41,
  },
  {
    id: 'seed_13', authorId: 'other3',
    content: `"あと1本だけ動画見る"\n\n↑\n寝る気ゼロの発言`,
    minutesAgo: 132, likes: 58, replies: 4,
  },
  {
    id: 'seed_14', authorId: 'niki',
    content: `"なんかよくわからんけど良い"\n\nって感情、\nもっと大事にしたい`,
    minutesAgo: 146, likes: 77, replies: 8,
  },
  {
    id: 'seed_15', authorId: 'trivia_bot',
    content: `【たぷたぷ豆知識】\n\n高校時代、\nオタクを隠して生きていたらしい。\n\nなお現在。`,
    minutesAgo: 158, likes: 71, replies: 8,
  },
  {
    id: 'seed_16', authorId: 'dokozo',
    content: `馬、\n走るだけで偉いよほんと`,
    minutesAgo: 173, likes: 21, replies: 1,
  },
  {
    id: 'seed_17', authorId: 'kaoru',
    content: `今日もちゃんと生きててえらい🌸`,
    minutesAgo: 190, likes: 49, replies: 3,
  },
  {
    id: 'seed_18', authorId: 'manu',
    content: `「今日は飲まない」\n\n↑\n開始5分だけ存在した意思`,
    minutesAgo: 205, likes: 76, replies: 7,
  },
];

if (typeof window !== 'undefined') {
  window.TapuSNS_SeedPosts = TapuSNS_SeedPosts;
}
