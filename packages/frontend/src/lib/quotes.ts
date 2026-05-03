export type MeetingQuote = {
  body: string;
  author: string;
};

export const meetingQuotes: readonly MeetingQuote[] = [
  {
    body: '会議は、何もしたくない時に欠かせないものである。',
    author: 'ジョン・K・ガルブレイス',
  },
  {
    body: '会議は、組織の不備を補うための妥協である。会議か仕事か、人は同時にどちらもこなせない。',
    author: 'ピーター・ドラッカー',
  },
  {
    body: '自分が価値を加えられないと分かった会議や電話からは、迷わず離脱しなさい。失礼ではない。相手の時間を奪う方がよほど失礼だ。',
    author: 'イーロン・マスク ( テスラ社内メモ )',
  },
  {
    body: '過剰な会議は大企業の宿痾であり、放っておけば必ず悪化する。',
    author: 'イーロン・マスク ( テスラ社内メモ )',
  },
  {
    body: '人類が潜在能力をいまだ発揮できない理由を一語で言い表せと言われたら、それは「会議」だ。',
    author: 'デイブ・バリー',
  },
  {
    body: 'ビジネス会議で最大の問題は、それがしばしば退屈である、ということだ。',
    author: 'パトリック・レンシオーニ ( Death by Meeting )',
  },
  {
    body: '会議を好む人を、要職に就けてはいけない。',
    author: 'トーマス・ソウェル',
  },
  {
    body: 'チームを 2 枚のピザで養えないなら、そのチームは大きすぎる。',
    author: 'ジェフ・ベゾス',
  },
  {
    body: 'ほとんどの人は、相手を理解するためではなく、返答するために聞いている。',
    author: 'スティーブン・R・コヴィー',
  },
  {
    body: '優秀な人を雇うのは、彼らに指示を出すためではない。彼らから教わるためだ。',
    author: 'スティーブ・ジョブズ',
  },
  {
    body: 'もし会議の参加者全員が、自分が次に何をすべきか分からないまま終わったなら、その会議は失敗だ。',
    author: 'アンディ・グローブ ( High Output Management )',
  },
  {
    body: '重要なことが緊急であることはまれであり、緊急なことが重要であることもまた、ほとんどない。',
    author: 'ドワイト・D・アイゼンハワー',
  },
] as const;

export const selectQuote = (seed: number): MeetingQuote => {
  if (!Number.isFinite(seed)) {
    return meetingQuotes[0];
  }
  const safeSeed = Math.abs(Math.floor(seed));
  const index = safeSeed % meetingQuotes.length;
  return meetingQuotes[index];
};
