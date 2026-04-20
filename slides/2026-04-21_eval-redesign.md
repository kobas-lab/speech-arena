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
    gap: 6px 8px;
    margin: 14px 0 10px;
    justify-content: center;
  }
  .chip {
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 18px;
    padding: 3px 12px;
    font-size: 0.78em;
    color: #334155;
  }
  .chip-note {
    text-align: center;
    color: var(--gray);
    font-size: 0.82em;
    margin-top: 8px;
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
  <div class="row"><div class="badge">Step 2</div><div><div class="title">クラスタリング</div><div class="desc">類似項目をまとめる</div></div></div>
  <div class="row"><div class="badge">Step 3</div><div><div class="title">抽象軸を命名</div><div class="desc">クラスタごとに名前を付ける</div></div></div>
  <div class="row"><div class="badge">Step 4</div><div><div class="title">現行 4軸と対応づけ</div><div class="desc">粒度もここで揃える</div></div></div>
  <div class="row done"><div class="badge">Step 5</div><div><div class="title">UI に落とす</div><div class="desc">実装反映（次フェーズ）</div></div></div>
</div>

本日は **Step 1〜4** の叩き台を議論します。

---

<!-- _class: part -->

# Part 1: 具体項目を列挙する

Step 1 — 抽象軸を意識せずフラットに並べる

---

# Step 1: とにかく書き出す（27 項目・順不同）

<div class="chips">
<span class="chip">ノイズ</span>
<span class="chip">人と話している感覚</span>
<span class="chip">発話開始タイミング</span>
<span class="chip">意味が聞き取れる</span>
<span class="chip">音量の安定性</span>
<span class="chip">相槌の自然さ</span>
<span class="chip">感情表現（抑揚・笑い）</span>
<span class="chip">文脈の保持</span>
<span class="chip">発音の明瞭さ</span>
<span class="chip">目的達成</span>
<span class="chip">終話タイミング</span>
<span class="chip">ハルシネーション</span>
<span class="chip">声質の自然さ</span>
<span class="chip">沈黙・ポーズの扱い</span>
<span class="chip">応答速度の人間らしさ</span>
<span class="chip">話題が噛み合う</span>
<span class="chip">プロソディ</span>
<span class="chip">割り込み時の挙動</span>
<span class="chip">キャラクター一貫性</span>
<span class="chip">的確な応答</span>
<span class="chip">話速・ポーズ</span>
<span class="chip">音切れ・途切れ</span>
<span class="chip">また話したい</span>
<span class="chip">スムーズな進行</span>
<span class="chip">遅延</span>
<span class="chip">情報として有益</span>
<span class="chip">歪み・クリッピング</span>
</div>

---

<!-- _class: part -->

# Part 2: 抽象軸へ再構成する

Step 2–4 — クラスタリング・軸命名・現行軸との対応

---

# Step 2: 参考にした既存プロトコル

| プロトコル | 対象 | 特徴 |
|---|---|---|
| MOS | 合成音声 | 単一発話・静的 |
| MUSHRA | 合成音声 | 参照あり・多試料比較 |
| SSA | テキスト対話 | sensibleness + specificity |
| Full-Duplex Challenge (IS 2024) | 対話音声 | naturalness / turn-taking / content |

### 対話音声ならではの違い
合成音は静的な 1 発話、対話は **時間軸** を持ち、評価者が **当事者**。
ターンテイキングや沈黙の扱いなど、動的な観点が加わる。

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

<!-- _class: part -->

# Part 3: UI・論文・議論

Step 5 先取りと、本日の論点整理

---

# Step 5 先取り: UI に載せる質問（案）

<div class="qlist">
  <div class="q"><div class="qid">Q1</div><div class="qtitle">音響品質</div><div class="qdesc">ノイズ / 発音 / プロソディ</div></div>
  <div class="q"><div class="qid">Q2</div><div class="qtitle">タイミング</div><div class="qdesc">相槌 / ターン交代</div></div>
  <div class="q"><div class="qid">Q3</div><div class="qtitle">人間らしさ</div><div class="qdesc">人と話している感覚</div></div>
  <div class="q"><div class="qid">Q4</div><div class="qtitle">応答内容</div><div class="qdesc">意味 / 文脈 / 妥当性</div></div>
  <div class="qdivider">— Layer 2 —</div>
  <div class="q total"><div class="qid">Q5</div><div class="qtitle">総合</div><div class="qdesc">また話したいか</div></div>
  <div class="qdivider">— 付帯質問 —</div>
  <div class="q meta"><div class="qid">Q6</div><div class="qtitle">会話は成功しましたか？</div><div class="qdesc">SUCCESS / FAILURE</div></div>
  <div class="q meta"><div class="qid">Q7</div><div class="qtitle">音切れはありましたか？</div><div class="qdesc">YES / NO</div></div>
</div>

各 Q に具体項目を tooltip で表示し、判断基準を揃える。
所要時間は現行と同等（評価入力 30 秒程度）。

---

# 論文での記述プラン

1. **背景** — MOS を Full-Duplex 対話にそのまま適用する困難
2. **Step 1 列挙** — 27 項目（Appendix に全リスト）
3. **Step 2–3 クラスタリング** — 親和図法 + 研究室内レビュー
4. **Step 4 軸命名** — 5軸 + 二段構成の提案
5. **Step 5 検証** — パイロット評価で軸間相関分析
6. **考察** — 当事者評価の限界、リファレンス不在の影響

→ 「なぜこの軸か」を **具体項目から逆算** して説明可能な形にする

---

# 今日議論したいこと

1. **27 項目** の過不足: 漏れや冗長はないか
2. **Ⅱ. 対話進行のタイミング** を新軸として立てるべきか
3. **Ⅳ と Ⅴ の境界** は明確か
4. **KJ 法 / 親和図法** のワークショップを開く価値はあるか

### 次回までのアクション（案）

| タスク | 担当 | 期限 |
|---|---|---|
| 27 項目の確定（本議論の反映） | 阿部 | 4/28 |
| パイロット評価で軸間相関分析 | 阿部 | 5 月前半 |
| 論文ドラフトの評価セクション執筆 | 阿部 | 5 月中旬 |

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
