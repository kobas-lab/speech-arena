---
marp: true
theme: default
paginate: true
style: |
  @auto-scaling true;
  :root {
    --accent: #2563eb;
    --accent-light: #dbeafe;
    --accent2: #7c3aed;
    --accent3: #059669;
    --warn: #b45309;
    --warn-light: #fef3c7;
    --gray: #64748b;
    --gray-light: #f1f5f9;
  }
  section {
    font-family: "Noto Sans CJK JP", "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", "Inter", sans-serif;
    color: #1e293b;
    padding: 40px 60px;
    font-size: 26px;
    line-height: 1.6;
  }
  h1 {
    color: var(--accent);
    font-size: 1.5em;
    font-weight: 800;
    border-bottom: 3px solid var(--accent);
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  h3 {
    color: var(--accent2);
    font-size: 0.95em;
    margin-top: 14px;
    margin-bottom: 4px;
  }
  strong { color: var(--accent); }
  .warn { color: var(--warn); font-weight: 700; }
  table { font-size: 0.78em; border-collapse: collapse; width: 100%; }
  th {
    background: var(--accent);
    color: white;
    font-weight: 600;
    padding: 6px 10px;
  }
  td { padding: 5px 10px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: var(--gray-light); }
  code { font-size: 0.9em; }
  ul, ol { margin: 4px 0; }
  li { margin: 2px 0; }
  blockquote {
    border-left: 4px solid var(--accent);
    background: var(--gray-light);
    padding: 10px 16px;
    margin: 8px 0;
    font-style: normal;
    color: #1e293b;
  }
  section.title {
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
  }
  section.title h1 {
    font-size: 2.2em; border: none; color: var(--accent);
  }
  section.title p { color: var(--gray); font-size: 1.05em; }
  footer { color: var(--gray) !important; font-size: 0.65em !important; }
  section::after { color: var(--gray); font-size: 0.65em; }
  .diff {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin: 10px 0;
  }
  .diff .col {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .diff .col.before { border-top: 4px solid var(--gray); }
  .diff .col.after { border-top: 4px solid var(--accent3); }
  .diff .col .label {
    font-size: 0.78em;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--gray);
    margin-bottom: 6px;
  }
  .diff .col.after .label { color: var(--accent3); }
  .diff .col .body { font-size: 0.92em; }
  .qbox {
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 5px solid var(--accent);
    border-radius: 8px;
    padding: 14px 20px;
    margin: 10px 0;
  }
  .qbox .head {
    display: flex; align-items: baseline; gap: 10px;
    margin-bottom: 6px;
  }
  .qbox .qid {
    background: var(--accent);
    color: white;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 5px;
    font-size: 0.8em;
  }
  .qbox .qtitle {
    font-weight: 700;
    font-size: 1.05em;
    color: #1e293b;
  }
  .qbox .qmain {
    font-size: 0.95em;
    color: var(--accent);
    font-weight: 700;
    margin-bottom: 6px;
  }
  .qbox .sub {
    font-size: 0.78em;
    color: var(--gray);
    letter-spacing: 0.06em;
    margin: 6px 0 3px;
  }
  .qbox ul { margin: 2px 0 0 18px; }
  .qbox li { font-size: 0.9em; margin: 1px 0; }
  .qbox .scale {
    display: inline-block;
    background: var(--warn-light);
    color: var(--warn);
    border-radius: 5px;
    padding: 2px 10px;
    font-size: 0.82em;
    font-weight: 700;
    margin-top: 4px;
  }
  .qbox.q2 { border-left-color: var(--accent); }
  .qbox.q3 { border-left-color: var(--accent2); }
  .qbox.q3 .qid { background: var(--accent2); }
  .qbox.q3 .qmain { color: var(--accent2); }
  .qbox.total { border-left-color: var(--accent3); }
  .qbox.total .qid { background: var(--accent3); }
  .qbox.total .qmain { color: var(--accent3); }
  .checklist { list-style: none; padding-left: 0; margin: 8px 0; }
  .checklist li {
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 4px solid var(--accent);
    border-radius: 6px;
    padding: 6px 14px;
    margin-bottom: 5px;
    font-size: 0.92em;
  }
  .checklist li.done { border-left-color: var(--accent3); color: var(--gray); }
  .checklist li.done::before { content: "✓ "; color: var(--accent3); font-weight: 700; }
  .checklist li.todo::before { content: "□ "; color: var(--accent); font-weight: 700; }
  .ui { display: flex; flex-direction: column; gap: 5px; margin: 10px 0 6px; }
  .ui .card {
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 4px solid var(--accent);
    border-radius: 6px;
    padding: 5px 12px;
    display: grid;
    grid-template-columns: 44px 1fr auto;
    gap: 12px;
    align-items: center;
    font-size: 0.82em;
  }
  .ui .card .qid {
    background: var(--accent);
    color: white;
    text-align: center;
    font-weight: 700;
    border-radius: 4px;
    padding: 2px 0;
    font-size: 0.8em;
  }
  .ui .card .q { font-weight: 700; color: #1e293b; }
  .ui .card .hint { color: var(--gray); font-size: 0.82em; margin-top: 1px; }
  .ui .card .scale { display: flex; gap: 4px; }
  .ui .card .opt {
    width: 24px; height: 24px;
    border: 1px solid #cbd5e1;
    border-radius: 50%;
    display: inline-flex;
    align-items: center; justify-content: center;
    font-size: 0.78em;
    color: var(--gray);
    background: white;
  }
  .ui .card .bin {
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 2px 12px;
    font-size: 0.82em;
    color: var(--gray);
    background: white;
    font-weight: 600;
  }
  .ui .card.q3card { border-left-color: var(--accent2); }
  .ui .card.q3card .qid { background: var(--accent2); }
  .ui .card.total { border-left-color: var(--accent3); }
  .ui .card.total .qid { background: var(--accent3); }
  .ui .card.meta { border-left-color: var(--accent3); }
  .ui .card.meta .qid { background: var(--accent3); }
  .ui-divider {
    text-align: center;
    color: var(--gray);
    font-size: 0.7em;
    margin: 3px 0 2px;
    letter-spacing: 0.2em;
  }
---

<!-- _class: title -->

# 評価指標の再設計 v2

Q3 の再設計とブレイクダウン文

**阿部 雄斗** — SpeechArena
2026/04/28

---

# 前回 (4/21) の指摘まとめ

### Q3「人と話している感じがしましたか」が他を包含してしまう
- タイミングが悪くても「人と話している感じ」はしない
- 音質が悪くても「人と話している感じ」はしない
- → Q3 が Q1 (音声品質) / Q2 (タイミング) / Q4 (応答内容) をまるごと吸い込んでしまう

### その他の指摘
- Q1〜Q4 で **文型がバラバラ**（「〜でしたか」「どう感じましたか」等）
- 各 Q は**補助文でブレイクダウン**すべき
- 「音響品質」は**ノイズ寄り**の印象 → 言い換えたい
- Q2 のスケールで「早/遅」どちらも悪い → **単調 1–5** で統一したい
- 発表で「キャラ」は若者言葉、「最適化」は評価語でない

---

# 本日のアップデート

<ul class="checklist">
  <li class="done">Q3 を「対話としての話し方」に再設計し、Q1/Q2/Q4 の包含を解消</li>
  <li class="done">各 Q にブレイクダウンした補助文を追加（4 項目ずつ）</li>
  <li class="done">Q1〜Q4 の文型を「<strong>〜はどうでしたか</strong>」に統一</li>
  <li class="done">「音響品質」→「<strong>音声の品質</strong>」に改称</li>
  <li class="done">Q2 のスケール注記を「1 = 悪い（早すぎ/遅すぎ両方）〜 5 = 良い」で明示</li>
  <li class="done">「キャラ」→「キャラクター」、「最適化」系の評価語を中立な語へ</li>
  <li class="todo">100 名クラウドソーシングの実施設計（質問確定後）</li>
</ul>

---

# Q3 の何が問題だったか（構造図）

| 要素 | Q1 音声品質 | Q2 タイミング | Q4 応答内容 | **旧 Q3 人らしさ** |
|---|:---:|:---:|:---:|:---:|
| ノイズ・発音 | ● | | | ● |
| 応答の間 | | ● | | ● |
| 話題の妥当性 | | | ● | ● |
| 感情・テンション | | | | ● |
| キャラクター | | | | ● |

**旧 Q3 は全部を含んでしまう** → 評価者は他 3 軸の影響も Q3 に載せてしまい、軸として独立しない。

---

# Q3 再設計の指針

### 包含を避け、Q3 を「**対話としての話し方**」に限定する

<div class="diff">
  <div class="col before">
    <div class="label">BEFORE (4/21)</div>
    <div class="body">
      <strong>Q3. 人と話している感じがしましたか？</strong><br/>
      <span style="color:var(--gray); font-size:0.88em;">感情表現・応答速度・キャラの一貫性</span>
    </div>
  </div>
  <div class="col after">
    <div class="label">AFTER (4/28)</div>
    <div class="body">
      <strong>Q3. 対話としての話し方は自然でしたか？</strong><br/>
      <span style="color:var(--gray); font-size:0.88em;">韻律・感情表現・テンション・キャラクターの一貫性</span>
    </div>
  </div>
</div>

### 根拠（4/21 議論より）
- 東芝システムの例: **完全にロボット音声でも、話し方が状況にマッチすれば人格として受容される**
- → Q3 の本質は「人間らしさ」ではなく **対話としての話し方** の自然さ
- プロソディ・パラ言語的な自然さは Q1（音質）とは別次元

---

# Q3 の踏み込み度 — どこまで書くか

### 案A (保守) と 案B (一歩先) を併記

<div class="diff">
  <div class="col before">
    <div class="label">案 A — 保守的（推奨）</div>
    <div class="body">
      <strong>話し方は自然でしたか？</strong><br/>
      <span style="font-size:0.82em; color:var(--gray);">Gemini 的な一本調子との差を拾うレベル。評価が安定しやすい。</span>
    </div>
  </div>
  <div class="col after">
    <div class="label">案 B — 一歩先</div>
    <div class="body">
      <strong>話し方はこちらと噛み合っていましたか？</strong><br/>
      <span style="font-size:0.82em; color:var(--gray);">整合性まで踏み込む。ただし評価者ごとに基準が揺れやすい懸念。</span>
    </div>
  </div>
</div>

### 今回は **案 A（話し方が自然か）** で進める
- 4/21 で「整合は一歩先に踏み出しすぎ」の懸念あり
- ブレイクダウン補助文で「噛み合い」の観点も拾う
- 100 名パイロット後、案 B に寄せるかは結果を見て判断

---

# Q1. 音声の品質はどうでしたか？

<div class="qbox">
  <div class="head"><span class="qid">Q1</span><span class="qtitle">音声の品質</span></div>
  <div class="qmain">音声の品質はどうでしたか？</div>
  <div class="sub">BREAKDOWN（補助文・参考観点）</div>
  <ul>
    <li>ノイズは気になりませんでしたか？</li>
    <li>発音は明瞭でしたか？</li>
    <li>音量は安定していましたか？</li>
    <li>声質は不自然に感じませんでしたか？</li>
  </ul>
  <span class="scale">1 = 悪い ／ 5 = 良い</span>
</div>

### 変更点
- 「音響品質」はノイズ寄りに聞こえる → **「音声の品質」** に改称
- 対話的なプロソディ（韻律の整合）は Q3 に分離（**音質単体**に絞る）

---

# Q2. 対話のタイミングはどうでしたか？

<div class="qbox q2">
  <div class="head"><span class="qid">Q2</span><span class="qtitle">対話のタイミング</span></div>
  <div class="qmain">対話のタイミングはどうでしたか？</div>
  <div class="sub">BREAKDOWN（補助文・参考観点）</div>
  <ul>
    <li>応答の間（ま）は自然でしたか？</li>
    <li>相槌のタイミングは自然でしたか？</li>
    <li>ターン交代（話し始め・話し終わり）は自然でしたか？</li>
    <li>沈黙や割り込みへの反応は自然でしたか？</li>
  </ul>
  <span class="scale">1 = 悪い（早すぎ／遅すぎの両方）　5 = 良い</span>
</div>

### スケールの取り扱い
- 早すぎ・遅すぎを**どちらも「悪い」**として単調 1–5 に統一
- MOS 系と同じ方向性でそろえ、他軸との分析で混乱しないようにする

---

# Q3. 対話としての話し方はどうでしたか？

<div class="qbox q3">
  <div class="head"><span class="qid">Q3</span><span class="qtitle">対話としての話し方</span></div>
  <div class="qmain">対話としての話し方は自然でしたか？</div>
  <div class="sub">BREAKDOWN（補助文・参考観点）</div>
  <ul>
    <li>抑揚（イントネーション）は自然でしたか？</li>
    <li>感情表現はこの場面にふさわしい度合いでしたか？</li>
    <li>話す速さやテンションはこちらの喋り方に噛み合っていましたか？</li>
    <li>キャラクター（口調・人格）は会話を通して一貫していましたか？</li>
  </ul>
  <span class="scale">1 = 悪い ／ 5 = 良い</span>
</div>

### 狙い
- **音質ではない** プロソディ・パラ言語的な自然さ
- **タイミングではない** テンション・速度の**噛み合い**
- **応答内容ではない** キャラクターの一貫性

---

# Q4. 応答内容はどうでしたか？

<div class="qbox">
  <div class="head"><span class="qid">Q4</span><span class="qtitle">応答内容</span></div>
  <div class="qmain">応答内容は妥当でしたか？</div>
  <div class="sub">BREAKDOWN（補助文・参考観点）</div>
  <ul>
    <li>質問に対して的確な応答が返りましたか？</li>
    <li>話題は噛み合っていましたか？</li>
    <li>事実に反する発言（ハルシネーション）はありませんでしたか？</li>
    <li>前の話の流れを踏まえた応答でしたか？</li>
  </ul>
  <span class="scale">1 = 悪い ／ 5 = 良い</span>
</div>

### 変更点
- 前回と同じ意味だが、**文型を「〜はどうでしたか」** に揃えた
- 文脈保持・ハルシネーションを補助文に明示

---

# Q5 (Layer 2) と 付帯質問

<div class="qbox total">
  <div class="head"><span class="qid">Q5</span><span class="qtitle">総合評価</span></div>
  <div class="qmain">もう一度このモデルと話したいと思いましたか？</div>
  <div class="sub">BREAKDOWN（参考観点）</div>
  <ul>
    <li>会話の目的は達成できましたか？</li>
    <li>情報として役に立ちましたか？</li>
    <li>会話はスムーズに進みましたか？</li>
  </ul>
  <span class="scale">1 = 思わない ／ 5 = また話したい</span>
</div>

### 付帯質問（二値）
- **Q6**: 会話は成功しましたか？（成功 / 失敗）
- **Q7**: 音切れはありましたか？（あり / なし）

---

# UI モック（更新版）

<div class="ui">
  <div class="card"><div class="qid">Q1</div><div><div class="q">音声の品質はどうでしたか？</div><div class="hint">ノイズ・発音・音量・声質</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="card"><div class="qid">Q2</div><div><div class="q">対話のタイミングはどうでしたか？</div><div class="hint">間・相槌・ターン交代・沈黙</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="card q3card"><div class="qid">Q3</div><div><div class="q">対話としての話し方は自然でしたか？</div><div class="hint">韻律・感情・テンション・キャラクター一貫性</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="card"><div class="qid">Q4</div><div><div class="q">応答内容は妥当でしたか？</div><div class="hint">的確さ・話題一致・ハルシネーション・文脈</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="ui-divider">— Layer 2 —</div>
  <div class="card total"><div class="qid">Q5</div><div><div class="q">もう一度このモデルと話したいと思いましたか？</div><div class="hint">総合評価</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="ui-divider">— 付帯質問 —</div>
  <div class="card meta"><div class="qid">Q6</div><div><div class="q">会話は成功しましたか？</div></div><div class="scale"><span class="bin">成功</span><span class="bin">失敗</span></div></div>
  <div class="card meta"><div class="qid">Q7</div><div><div class="q">音切れはありましたか？</div></div><div class="scale"><span class="bin">あり</span><span class="bin">なし</span></div></div>
</div>

---

# 変更サマリー（前回 → 今回）

| 項目 | 4/21 | 4/28 |
|---|---|---|
| Q1 タイトル | 音響品質 | **音声の品質** |
| Q1 文型 | どう感じましたか | **〜はどうでしたか** |
| Q2 スケール注記 | （なし） | **1 = 悪い（早/遅両方）〜 5 = 良い** |
| Q3 タイトル | 人と話している感じ | **対話としての話し方** |
| Q3 焦点 | 人間らしさ全般（包含的） | **韻律・感情・テンション・キャラ一貫性** に限定 |
| ブレイクダウン | hint 1 行のみ | **各 Q に 3–4 項目の補助文** |
| 用語 | キャラ | **キャラクター** |

---

# 評価の安定性への配慮（4/21 議論より）

### 懸念
- 「趣味の話をしてください」レベルの指示だと、ユーザーがシステムに求めるものが人ごとにバラバラ
- → 特に Q3（話し方）の評価が不安定になりそう

### 対応案
- ワーカー向けに**話題と想定状況**を軽く固定する（例: 趣味の話、気楽な雑談）
- 参照用に**最低／最高例のクリップ**を事前に 1 度だけ提示（Step 5 の MUSHRA ライト運用）
- 100 名パイロットで軸間相関・被験者一致度を測定し、文言調整の判断材料に

---

# 残っているタスク

<ul class="checklist">
  <li class="todo"><strong>UI への反映</strong> — <code>apps/web/src/components/wizard/steps/trial-step.tsx</code> の質問文を更新</li>
  <li class="todo"><strong>ブレイクダウンの表示方法</strong> — ツールチップ／常時展開／折りたたみ、どれにするか</li>
  <li class="todo"><strong>参照クリップの選定</strong> — 各軸の低品質／高品質サンプルを 1 本ずつ</li>
  <li class="todo"><strong>100 名クラウドソーシング設計</strong> — 話題指示、試料数、1 人あたり評価数</li>
  <li class="todo"><strong>スキーマ更新</strong> — <code>apps/web/prisma/schema.prisma</code> の評価カラム調整</li>
</ul>

### SLT 2026 までのマイルストーン
- **2026-04-28**: 評価軸 v2 確定（本日）
- **2026-05-15**: パイロット 50 名収集完了
- **2026-05-31**: Bradley-Terry 分析・ドラフト v1
- **2026-06-17**: SLT 投稿

---

# 今日議論したいこと

### 1. Q3 の文言
- 案A「**対話としての話し方は自然でしたか**」で良いか
- 「噛み合い」まで踏み込む案B との比較

### 2. 各 Q のブレイクダウン補助文
- 4 項目ずつに過不足はないか
- UI 上の**表示方法**（常時展開 / ツールチップ / 折りたたみ）

### 3. Q2 のスケール注記
- 「早すぎ／遅すぎどちらも悪い」で単調 1–5 にする方針で OK か

### 4. 100 名パイロット時の話題設計
- 「趣味の話」で固定するか、もう少し具体化するか

---

# 関連資料

### プロジェクト内
- `slides/2026-04-21_eval-redesign.md` 前回スライド（5軸 + 二段構成の導出）
- `slides/2026-04-21_meeting-notes.md` **4/21 議論ログ**（本スライドの根拠）
- `slides/2026-04-21_submission-plan.md` SLT 2026 投稿プラン

### 実装対象
- `apps/web/src/components/wizard/steps/trial-step.tsx` 評価 UI（質問文）
- `apps/web/prisma/schema.prisma` 評価データスキーマ
