export type MeetingTip = {
  practice: string;
  body: string;
  source: string;
};

// 出典が確認できる、経営者・実務書ベースの会議プラクティス。
// 内容は要約 / 意訳。原文はソース欄を参照。
export const meetingTips: readonly MeetingTip[] = [
  {
    practice: 'ナラティブメモを 30 分黙読してから議論',
    body: 'PowerPoint を禁止して 6 ページの構造化メモを配り、最初の 30 分は全員で黙読してから本題に入る。読まないまま喋り出さない。',
    source:
      'Jeff Bezos / Amazon 株主への手紙 ( 2017 ) と Forum on Leadership ( UT Austin, 2018 )。Working Backwards (Bryar & Carr, 2021) でも詳述。',
  },
  {
    practice: 'チームは 2 枚のピザで足りる人数に',
    body: '会議のメンバーが「ピザ 2 枚で足りない」サイズになったら多すぎ。意思決定は小さな単位で速く回す。',
    source:
      'Jeff Bezos の Two-Pizza Rule ( Forbes / Business Insider など複数のインタビュー / The Everything Store, Brad Stone, 2013 )。',
  },
  {
    practice: '価値を出せない会議は即離脱してよい',
    body: '自分が貢献していないと分かった会議や電話からは、迷わず離れる。失礼ではない。相手の時間を奪う方が失礼。',
    source:
      'Elon Musk / Tesla 社内メモ「Productivity」( 2018 年漏洩、Tesla が真正性を確認 )。Electrek / The Verge 各記事に全文掲載。',
  },
  {
    practice: '過剰な会議は大企業の宿痾',
    body: '頻繁な会議は大企業の宿痾。緊急で巨大な議題以外は廃止し、定例も時間をかけて減らす。',
    source: '同じく Tesla 社内メモ「Productivity」( Elon Musk, 2018 )。',
  },
  {
    practice: '会議は組織不備への妥協であって、仕事ではない',
    body: '人は会議か仕事のどちらかしかできない。会議の総量を減らすのが効果的な経営者の仕事。',
    source:
      'Peter Drucker, The Effective Executive ( 1967 ) 第 2 章 ( Know Thy Time )。',
  },
  {
    practice: '会議は終了時に「次の行動」が決まっていなければ失敗',
    body: '出席者全員が「自分は次に何をするか」を理解せずに退室した会議は、ムダになっている。',
    source:
      'Andy Grove, High Output Management ( 1983 ) 第 4 章 Meetings - The Medium of Managerial Work。',
  },
  {
    practice: '会議を 4 種類に分ける',
    body: '日次チェックイン / 週次戦術 / 月次戦略 / 四半期オフサイトの 4 種類に分け、混ぜない。混ぜると全部退屈になる。',
    source: 'Patrick Lencioni, Death by Meeting ( 2004 )。',
  },
  {
    practice: '緊急ではないが重要なことに時間を割く',
    body: '私には 2 種類の問題しかない。緊急なものと重要なもの。緊急なものはたいてい重要ではなく、重要なものはたいてい緊急ではない。',
    source:
      'Dwight D. Eisenhower, Northwestern University 創立 100 周年記念講演 ( 1954 年 8 月 19 日 )。Stephen Covey の 7 Habits ( 1989 ) で時間管理マトリクスとして体系化。',
  },
  {
    practice: '会議に必要のない人を抜く勇気を持つ',
    body: '面識のない出席者には「あなたは何の人？」と聞き、議題に関係なければその場で帰ってもらう。会議は人数を絞った方が速い。',
    source:
      'Steve Jobs の有名な逸話。Walter Isaacson, Steve Jobs ( 2011 ) Chapter 30 およびオバマ大統領との会食での逸話 ( Adam Lashinsky, Inside Apple, 2012 ) 。',
  },
  {
    practice: '会議は基本的に有害',
    body: '会議は他人の時間を奪い、まとまった作業時間を分断し、議題が漂流する。前提として「やらない」ことから設計する。',
    source:
      'Jason Fried & David Heinemeier Hansson, REWORK ( 2010 ) 章「Meetings are toxic」。',
  },
  {
    practice: '週の真ん中に「会議なしの日」を作る',
    body: '水曜は社内会議を一切入れない。集中できる連続したまとまった時間を、人為的に確保する。',
    source:
      'Asana の No Meeting Wednesday。Dustin Moskovitz, Asana 公式ブログ ( 2013 ) および Justin Rosenstein 講演。',
  },
  {
    practice: '書くことが思考を強制する',
    body: '会議で口頭で曖昧に共有する代わりに、提案 / 決定をドキュメントに先に書く。書けない案は通さない。',
    source:
      'Patrick Collison ( Stripe CEO ) のインタビュー多数 ( Stripe Press 関連 )。Amazon の memo 文化と同根。',
  },
  {
    practice: 'A3 一枚で問題を整理する',
    body: '背景・現状・原因・対策・効果検証を A3 一枚に収める。会議は A3 を読む時間にし、「もっと書け」「もっと縮めろ」だけが指示。',
    source:
      'Toyota Production System の A3 Report。Jeffrey Liker, The Toyota Way ( 2004 ) Chapter 13、John Shook, Managing to Learn ( 2008 )。',
  },
  {
    practice: '会議の最後 5 分で「決まったこと / 宿題 / 期限」を読み合わせる',
    body: '本題の議論より、最後の 5 分の合意確認の方が成果を残す。担当と期限が無い宿題は宿題ではない。',
    source:
      'David Allen, Getting Things Done ( 2001 ) の "next action" 概念、および Cameron Herold, Meetings Suck ( 2016 ) の closing recap 推奨。',
  },
  {
    practice: '事前資料を読まない人は出席しない',
    body: '会議は資料を読む場ではなく、議論する場。読んでこない参加者は会議から外し、別途キャッチアップしてもらう。',
    source:
      'Jeff Bezos の Amazon 6-page memo 運用と同思想。Bain & Co の Time, Talent, Energy ( Mankins & Garton, 2017 ) でも、参加者の事前準備不足が会議生産性を最も損なう要因として挙げられている。',
  },
];

export const pickMeetingTip = (seed: number): MeetingTip => {
  if (!Number.isFinite(seed) || meetingTips.length === 0) {
    return meetingTips[0];
  }
  const index = Math.abs(Math.floor(seed)) % meetingTips.length;
  return meetingTips[index];
};
