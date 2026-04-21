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
  table { font-size: 0.74em; border-collapse: collapse; width: 100%; }
  th {
    background: var(--accent);
    color: white;
    font-weight: 600;
    padding: 6px 10px;
  }
  td { padding: 5px 10px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: var(--gray-light); }
  pre {
    font-size: 0.68em;
    background: var(--gray-light) !important;
    border-radius: 8px;
    border-left: 4px solid var(--accent);
    padding: 12px 16px !important;
    line-height: 1.45;
  }
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
  section.part {
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  }
  section.part h1 {
    font-size: 2em; border: none; color: var(--accent);
  }
  section.part p { color: var(--gray); font-size: 1.2em; }
  .tag {
    display: inline-block;
    background: var(--accent-light);
    color: var(--accent);
    border-radius: 16px;
    padding: 2px 12px;
    font-size: 0.7em;
    font-weight: 600;
    margin: 2px;
  }
  footer { color: var(--gray) !important; font-size: 0.65em !important; }
  section::after { color: var(--gray); font-size: 0.65em; }
  .steps { display: flex; flex-direction: column; gap: 5px; margin: 8px 0; }
  .steps .row {
    display: grid;
    grid-template-columns: 76px 1fr;
    align-items: center;
    gap: 14px;
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 4px solid var(--accent);
    border-radius: 6px;
    padding: 5px 14px;
    font-size: 0.9em;
  }
  .steps .badge {
    background: var(--accent);
    color: white;
    font-weight: 700;
    font-size: 0.82em;
    text-align: center;
    padding: 3px 0;
    border-radius: 4px;
  }
  .steps .row.done { border-left-color: var(--accent2); }
  .steps .row.done .badge { background: var(--accent2); }
  .steps .title { font-weight: 700; color: #1e293b; }
  .steps .desc { color: var(--gray); font-size: 0.82em; }
  .layers { display: flex; flex-direction: column; gap: 14px; margin: 18px 0; }
  .layer {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 20px;
  }
  .layer.l1 { border-top: 4px solid var(--accent); }
  .layer.l2 { border-top: 4px solid var(--accent2); }
  .layer .head {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 8px;
  }
  .layer .name { font-weight: 700; font-size: 1.05em; color: var(--accent); }
  .layer.l2 .name { color: var(--accent2); }
  .layer .note { color: var(--gray); font-size: 0.82em; }
  .layer .items {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .layer .item {
    background: var(--accent-light);
    color: var(--accent);
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 0.88em;
    font-weight: 600;
  }
  .layer.l2 .item { background: #ede9fe; color: var(--accent2); }
  .qlist { margin: 6px 0; }
  .qlist .q {
    display: grid;
    grid-template-columns: 48px 1fr 1.3fr;
    align-items: center;
    gap: 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 4px solid var(--accent);
    border-radius: 6px;
    padding: 4px 12px;
    margin-bottom: 3px;
    font-size: 0.88em;
  }
  .qlist .qid {
    background: var(--accent);
    color: white;
    text-align: center;
    font-weight: 700;
    border-radius: 4px;
    padding: 2px 0;
    font-size: 0.82em;
  }
  .qlist .qtitle { font-weight: 700; }
  .qlist .qdesc { color: var(--gray); font-size: 0.82em; }
  .qlist .q.total { border-left-color: var(--accent2); }
  .qlist .q.total .qid { background: var(--accent2); }
  .qlist .q.meta { border-left-color: var(--accent3); }
  .qlist .q.meta .qid { background: var(--accent3); }
  .qdivider {
    text-align: center;
    color: var(--gray);
    font-size: 0.7em;
    margin: 3px 0 2px;
    letter-spacing: 0.2em;
  }
  .chips {
    display: flex; flex-wrap: wrap;
    gap: 5px 6px;
    margin: 10px 0 8px;
    justify-content: center;
  }
  .chip {
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    padding: 3px 11px;
    font-size: 0.72em;
    color: #334155;
  }
  .chip-note {
    text-align: center;
    color: var(--gray);
    font-size: 0.82em;
    margin-top: 8px;
  }
  .flow {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 12px 0 14px;
    position: relative;
  }
  .flow .stage {
    background: white;
    border: 1px solid #e2e8f0;
    border-top: 3px solid var(--accent);
    border-radius: 8px;
    padding: 10px 8px;
    text-align: center;
  }
  .flow .stage .num {
    color: var(--accent);
    font-weight: 700;
    font-size: 0.78em;
    letter-spacing: 0.05em;
  }
  .flow .stage .name {
    font-weight: 700;
    color: #1e293b;
    margin: 4px 0 3px;
    font-size: 0.95em;
  }
  .flow .stage .note {
    color: var(--gray);
    font-size: 0.78em;
  }
  .flow .stage.current {
    background: var(--accent-light);
    border-color: var(--accent);
  }
  .flow .stage.future {
    opacity: 0.45;
  }
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
  .ui .card.total { border-left-color: var(--accent2); }
  .ui .card.total .qid { background: var(--accent2); }
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

# 評価指標の再設計

具体項目の列挙から抽象軸への導出プロセス

**阿部 雄斗** — SpeechArena
2026/04/21

---

# 前回（4/14）の指摘

> 4軸が抽象的すぎて、なぜその軸なのかを説明できない。

- 現行 4軸: **音声自然性 / 聴感自然性 / 意味理解性 / 対話有用性**
- 3軸は「低品質前提」、対話有用性だけ粒度が一段高い
- 「音は悪い・会話できていない、でも有用」という矛盾が起きうる

### 今日の目的

- 具体的な評価観点をまずフラットに並べる
- そこから抽象軸へ再構成する案を提示する
- 論文に書ける「導出プロセス」の輪郭を固める

---

# プロセス全体像

<div class="steps">
  <div class="row"><div class="badge">Step 1</div><div><div class="title">具体項目を列挙</div><div class="desc">抽象軸を意識せずフラットに並べる</div></div></div>
  <div class="row"><div class="badge">Step 2</div><div><div class="title">既存プロトコルを参照</div><div class="desc">ITU 標準の発展段階と対話音声の現在地を確認</div></div></div>
  <div class="row"><div class="badge">Step 3</div><div><div class="title">クラスタリング → 抽象軸</div><div class="desc">類似項目をまとめて軸名を付ける</div></div></div>
  <div class="row"><div class="badge">Step 4</div><div><div class="title">現行 4軸との対応づけ</div><div class="desc">粒度もここで揃える</div></div></div>
  <div class="row done"><div class="badge">Step 5</div><div><div class="title">UI に落とす</div><div class="desc">実装反映（次フェーズ）</div></div></div>
</div>

本日は **Step 1〜4** の叩き台を議論します。

---

# Step 1: とにかく書き出す（27 項目・順不同）

<div class="chips">
<span class="chip">ノイズは気になりましたか？</span>
<span class="chip">人と話している感じがしましたか？</span>
<span class="chip">発話を始めるタイミングは自然でしたか？</span>
<span class="chip">発話の意味は聞き取れましたか？</span>
<span class="chip">音量は安定していましたか？</span>
<span class="chip">相槌は自然でしたか？</span>
<span class="chip">感情表現は豊かでしたか？</span>
<span class="chip">前の話を覚えていましたか？</span>
<span class="chip">発音は明瞭でしたか？</span>
<span class="chip">会話の目的は達成できましたか？</span>
<span class="chip">終話のタイミングは自然でしたか？</span>
<span class="chip">根拠のない発言はありませんでしたか？</span>
<span class="chip">声質は自然でしたか？</span>
<span class="chip">沈黙の扱いは自然でしたか？</span>
<span class="chip">応答速度は人間らしかったですか？</span>
<span class="chip">話題は噛み合っていましたか？</span>
<span class="chip">抑揚・アクセントは自然でしたか？</span>
<span class="chip">割り込んだ時の反応は自然でしたか？</span>
<span class="chip">キャラクターは一貫していましたか？</span>
<span class="chip">質問に的確な応答が返りましたか？</span>
<span class="chip">話す速さや間は自然でしたか？</span>
<span class="chip">音が途切れませんでしたか？</span>
<span class="chip">また話したいと思いましたか？</span>
<span class="chip">会話はスムーズに進みましたか？</span>
<span class="chip">応答に遅延はありませんでしたか？</span>
<span class="chip">情報として役に立ちましたか？</span>
<span class="chip">音に歪みはありませんでしたか？</span>
</div>

---

# Step 2: プロトコル標準化の発展段階

<div class="flow">
  <div class="stage"><div class="num">段階 1</div><div class="name">個別研究</div><div class="note">単発論文で提案</div></div>
  <div class="stage"><div class="num">段階 2</div><div class="name">複数論文で再現</div><div class="note">他者追試・収束</div></div>
  <div class="stage"><div class="num">段階 3</div><div class="name">ベストプラクティス化</div><div class="note">推奨手法に収束</div></div>
  <div class="stage"><div class="num">段階 4</div><div class="name">ITU 等で標準化</div><div class="note">公式プロトコル</div></div>
</div>

### 合成音声は段階 4 まで到達している
- **ITU-T P.800** — ラボ環境での主観音声品質評価
- **ITU-T P.808** — クラウドソーシング版
- **ITU-R BS.1534** — MUSHRA（参照付き多試料比較）
- 各研究室の MOS 的手法が、再現→ベストプラクティス化を経て ITU 標準へ

### 対話音声は段階 1〜2 付近
- **対話版 P.800 / P.808 は未成立**
- SSA（テキスト対話）、FD-Bench 等のベンチマーク提案が散発的にある段階
- → 本研究は **段階 1 の個別提案** として FD-DMOS を位置づける

---

# Step 2 (続): 対話音声ならではの違い

なぜ対話音声は標準化が遅れているのか:

### 静的な 1 発話ではなく、時間軸を持つ
ターンの切り替え、沈黙、相槌、割り込みなど **動的な挙動** を評価対象に含む必要がある。

### 評価者が「聴衆」ではなく「当事者」
P.800 系は録音済み音声を聴いて採点するが、対話は **評価者自身が話し手** になる。
→ 試料ごとに体験が変わり、参照音声の置き方も単純ではない。

### リアルタイム性
P.800 の遅延測定は通信品質としてあるが、**応答生成の遅延** は別概念。


---

# Step 3: クラスタリング → 抽象軸

| 抽象軸 | 主な具体項目 | 粒度 |
|---|---|---|
| Ⅰ. 音響品質 | ノイズ・発音・プロソディ・音量・話速 | 低 |
| Ⅱ. 対話進行のタイミング | 発話開始/終話・相槌・沈黙・割り込み | 低〜中 |
| Ⅲ. 人間らしさ・聴感 | 人と話している感覚・感情表現・応答速度・キャラ一貫性 | 中 |
| Ⅳ. 意味・応答の妥当性 | 意味聞き取り・的確な応答・文脈保持・ハルシネーション | 中 |
| Ⅴ. 対話としての有用性 | 目的達成・また話したい・情報有益・スムーズ進行 | 高 |

音切れ・遅延は独立した二値項目（通信品質）として継続。

---

# Step 4: 現行 4軸との対応

| 現行 | 新案 | 変更点 |
|---|---|---|
| 音声自然性 | Ⅰ. 音響品質 | 音響項目を具体化 |
| 聴感自然性 | Ⅲ. 人間らしさ・聴感 | 人間らしさに寄せ直し |
| 意味理解性 | Ⅳ. 意味・応答の妥当性 | 文脈保持・ハルシネーションまで網羅 |
| 対話有用性 | Ⅴ. 対話としての有用性 | 高粒度のまま独立扱い |
| — | Ⅱ. 対話進行のタイミング | **新設** |

現行軸を否定せず、**分解と補強** で再構成する方針。
Ⅱ を新設することで Full-Duplex モデルの特徴を捉える。

---

# 粒度問題への対応: 二段構成

<div class="layers">
  <div class="layer l1">
    <div class="head"><div class="name">Layer 1 — コンポーネント評価</div><div class="note">低〜中粒度で揃える</div></div>
    <div class="items">
      <div class="item">Ⅰ. 音響品質</div>
      <div class="item">Ⅱ. 対話進行のタイミング</div>
      <div class="item">Ⅲ. 人間らしさ・聴感</div>
      <div class="item">Ⅳ. 意味・応答の妥当性</div>
    </div>
  </div>
  <div class="layer l2">
    <div class="head"><div class="name">Layer 2 — 総合評価</div><div class="note">高粒度・独立</div></div>
    <div class="items">
      <div class="item">Ⅴ. 対話としての有用性</div>
    </div>
  </div>
</div>

- Layer 1 の 4軸は **同じ粒度** で揃える
- Layer 2 は独立した軸として分析時も別扱い
- これにより「音が悪くても有用」のような矛盾パターンを許容したまま、相関を論じられる

---

# Step 5 先取り: UI に載せる質問（案）

<div class="ui">
  <div class="card"><div class="qid">Q1</div><div><div class="q">音響品質はどう感じましたか？</div><div class="hint">ノイズ・発音・プロソディ</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="card"><div class="qid">Q2</div><div><div class="q">対話のタイミングはどう感じましたか？</div><div class="hint">相槌・ターン交代・沈黙</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="card"><div class="qid">Q3</div><div><div class="q">人と話している感じがしましたか？</div><div class="hint">感情表現・応答速度・キャラの一貫性</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="card"><div class="qid">Q4</div><div><div class="q">応答内容は妥当でしたか？</div><div class="hint">意味・文脈・ハルシネーション</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="ui-divider">— Layer 2 —</div>
  <div class="card total"><div class="qid">Q5</div><div><div class="q">もう一度このモデルと話したいと思いましたか？</div><div class="hint">総合評価</div></div><div class="scale"><span class="opt">1</span><span class="opt">2</span><span class="opt">3</span><span class="opt">4</span><span class="opt">5</span></div></div>
  <div class="ui-divider">— 付帯質問 —</div>
  <div class="card meta"><div class="qid">Q6</div><div><div class="q">会話は成功しましたか？</div></div><div class="scale"><span class="bin">成功</span><span class="bin">失敗</span></div></div>
  <div class="card meta"><div class="qid">Q7</div><div><div class="q">音切れはありましたか？</div></div><div class="scale"><span class="bin">あり</span><span class="bin">なし</span></div></div>
</div>

---

# 論文での記述プラン（SLT 4 ページ構成）

1. **背景** — ITU-T P.800/P.808 は対話音声未カバー、標準化の段階論
2. **評価軸の導出** — 27 項目列挙 → 親和図法 → 5軸 + 二段構成（全工程を 1 章に集約）
3. **評価プラットフォーム実装** — UI / Bradley-Terry / クラウドソーシング設計
4. **100 名パイロット評価** — 軸間相関・モデル間順位・被験者一致度
5. **考察** — 当事者評価の限界、リファレンス不在、次段階への布石

→ 導出プロセス（章 2）は **1 章に圧縮**、実装と運用結果（章 3–4）に紙幅を割いて差別化

---

# 残っているタスク

### 1. 質問事項の変更（UI 反映）
- 本日の議論を踏まえ、5軸 + Layer 2 の質問文を確定
- 付帯質問（成功/失敗・音切れ有無）のラベル調整

### 2. 100 名規模のクラウドソーシング評価
- SLT 投稿に向けた必要最小規模のデータ収集
- パイロット運用で軸間相関・モデル間順位を検証

### 運用規模とインフラの関係

| 規模 | 運営形態 | インフラ要件 |
|---|---|---|
| 〜100 名（SLT 向け） | **人数を絞って運営主導でクローズド運用** | 現行構成で対応可 |
| 常時公開（本番運用） | 誰でも参加できる開放型 | **GPU 同時接続・負荷分散・認証含め再設計が必要** |

→ 当面は 100 名クローズド運用に集中し、インフラ再設計は SLT 投稿後に着手

---

# 補足: リファレンス音声の扱い

| 案 | 内容 | コメント |
|---|---|---|
| A | リファレンスなし（現行） | 実装簡、当事者の主観基準 |
| B | 高品質リファレンス付き | MUSHRA 風、判断軸が揃う |
| **C** | 極端例のみ提示（推奨） | ワーカー導入時に最低 / 最高のサンプルを一度だけ |

C 案の実装コスト: 各軸 2 サンプル × 5軸 = **10 クリップ** の選定のみ。

### 関連資料

- `slides/2026-04-14_meeting-tasks.md` 前回議事のタスク化
- `slides/2026-04-14_infra-report.md` インフラ運用報告
- `apps/web/prisma/schema.prisma:95-100` 現行スキーマ
- `apps/web/src/components/wizard/steps/trial-step.tsx:175-198` 評価 UI
