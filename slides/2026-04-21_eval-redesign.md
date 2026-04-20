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

```
Step 1   具体項目を列挙    抽象軸を意識しない
Step 2   クラスタリング    類似項目をまとめる
Step 3   抽象軸を命名      クラスタごとに名前を付ける
Step 4   現行4軸と対応づけ  粒度もここで揃える
Step 5   UI に落とす       実装反映
```

本日は **Step 1〜4** の叩き台を議論します。

---

<!-- _class: part -->

# Part 1: 具体項目を列挙する

Step 1 — 抽象軸を意識せずフラットに並べる

---

# Step 1: 具体項目の列挙（音響レベル）

### A. 発話の音響品質
- ノイズ・歪み・クリッピングがないか
- 音量の安定性（急な音量変化がないか）
- 発音の明瞭さ（子音欠落、母音の不鮮明さ）
- 声質の自然さ（合成音特有の金属音・ざらつき）
- プロソディ（ピッチ・アクセント）の自然さ
- 話速・ポーズ（間）の長さ

### B. 通信品質
- 音切れ・途切れ（パケットロス）
- 遅延

---

# Step 1: 具体項目の列挙（対話レベル）

### C. ターンテイキング
- 発話開始タイミング
- 終話タイミング（被せてこないか）
- 相槌（バックチャネル）の自然さ
- 沈黙・ポーズの扱い
- 割り込み時の挙動

### D. 聴感・人間らしさ
- 人と話している感覚
- 感情表現（抑揚、笑い、驚き）
- 応答速度の人間らしさ
- キャラクターの一貫性

---

# Step 1: 具体項目の列挙（内容レベル）

### E. 意味理解・応答内容
- 発話の意味が聞き取れる
- 質問に対して的確な応答が返る
- 文脈の保持（前の発話を覚えている）
- 話題が噛み合う、論理的に一貫している
- ハルシネーション（根拠なき情報）がない

### F. 対話の有用性
- 目的を達成できた / もう一度話したい
- 会話がスムーズに進んだ / 情報として有益

→ A〜F の 6 カテゴリから計 **27 項目** を候補として抽出

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

| 抽象軸 | 含まれる具体項目 | 粒度 |
|---|---|---|
| Ⅰ. 音響品質 | A1–A6（音・発音・プロソディ） | 低 |
| Ⅱ. 対話進行のタイミング | C1–C5（ターンテイキング） | 低〜中 |
| Ⅲ. 人間らしさ・聴感 | A4, A7, D1–D4 | 中 |
| Ⅳ. 意味・応答の妥当性 | E1–E6 | 中 |
| Ⅴ. 対話としての有用性 | F1–F4 | 高 |

B1–B2（通信品質）は独立した二値項目として継続。

---

# Step 4: 現行 4軸との対応

| 現行 | 新案 | 変更点 |
|---|---|---|
| 音声自然性 | Ⅰ. 音響品質 | A1–A6 に具体化 |
| 聴感自然性 | Ⅲ. 人間らしさ・聴感 | 人間らしさに寄せ直し |
| 意味理解性 | Ⅳ. 意味・応答の妥当性 | E1–E6 で網羅 |
| 対話有用性 | Ⅴ. 対話としての有用性 | 高粒度のまま独立扱い |
| — | Ⅱ. 対話進行のタイミング | **新設** |

現行軸を否定せず、**分解と補強** で再構成する方針。
Ⅱ を新設することで Full-Duplex モデルの特徴を捉える。

---

# 粒度問題への対応: 二段構成

```
Layer 1   コンポーネント評価（低〜中粒度で揃える）
          Ⅰ. 音響品質
          Ⅱ. 対話進行のタイミング
          Ⅲ. 人間らしさ・聴感
          Ⅳ. 意味・応答の妥当性

Layer 2   総合評価（高粒度・独立）
          Ⅴ. 対話としての有用性
```

- Layer 1 の 4軸は **同じ粒度** で揃える
- Layer 2 は独立した軸として分析時も別扱い
- これにより「音が悪くても有用」のような矛盾パターンを許容したまま、相関を論じられる

---

<!-- _class: part -->

# Part 3: UI・論文・議論

Step 5 先取りと、本日の論点整理

---

# Step 5 先取り: UI に載せる質問（案）

```
Q1  音響品質 ..............  ノイズ / 発音 / プロソディ
Q2  タイミング ............  相槌 / ターン交代
Q3  人間らしさ ............  人と話している感覚
Q4  応答内容 ..............  意味 / 文脈 / 妥当性
──────────────────────────────────────────────
Q5  総合（Layer 2）.......  また話したいか
──────────────────────────────────────────────
Q6  会話は成功しましたか？   SUCCESS / FAILURE
Q7  音切れはありましたか？   YES / NO
```

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
