---
marp: true
paginate: true
theme: default
header: "SpeechArena 評価指標の再設計"
footer: "2026-04-21"
style: |
  :root {
    --fg: #1b1f23;
    --bg: #ffffff;
    --muted: #6b7280;
    --line: #e5e7eb;
    --accent: #1f4e79;
    --accent-soft: #eef2f7;
  }

  section {
    font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Noto Sans CJK JP', 'Noto Sans JP', sans-serif;
    color: var(--fg);
    background: var(--bg);
    padding: 56px 68px;
    line-height: 1.65;
    letter-spacing: 0.01em;
    font-feature-settings: "palt";
    font-size: 23px;
  }

  h1, h2, h3 {
    color: var(--accent);
    line-height: 1.35;
    font-weight: 700;
  }

  h1 {
    font-size: 1.55em;
    border-bottom: 2px solid var(--accent);
    padding-bottom: 0.25em;
    margin: 0 0 0.7em 0;
  }
  h2 { font-size: 1.15em; color: var(--fg); margin: 0.9em 0 0.3em; }
  h3 { font-size: 1em; color: var(--fg); margin: 0.7em 0 0.2em; }

  strong { color: var(--accent); font-weight: 700; }

  ul, ol { padding-left: 1.2em; margin: 0.3em 0; }
  li { margin: 0.15em 0; }
  li::marker { color: var(--muted); }

  table {
    font-size: 0.88em;
    border-collapse: collapse;
    width: 100%;
    margin: 0.5em 0;
  }
  th, td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  th {
    border-bottom: 2px solid var(--accent);
    color: var(--accent);
    font-weight: 600;
  }

  blockquote {
    border-left: 3px solid var(--accent);
    background: var(--accent-soft);
    padding: 10px 16px;
    margin: 0.8em 0;
    color: var(--fg);
    font-style: normal;
  }

  code {
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 0.88em;
  }
  pre {
    background: #f9fafb;
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 14px 18px;
    font-size: 0.8em;
    line-height: 1.55;
  }

  section::after {
    color: var(--muted);
    font-size: 0.65em;
  }
  header, footer {
    color: var(--muted);
    font-size: 0.72em;
  }

  .lead { color: var(--muted); font-size: 0.92em; margin-top: -0.4em; }
---

# 評価指標の再設計

<p class="lead">具体項目の列挙から抽象軸への導出プロセス</p>

2026-04-21 — 阿部

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

A〜F の 6 カテゴリから計 **27 項目**を候補として抽出。

---

# Step 2: 参考にした既存プロトコル

| プロトコル | 対象 | 特徴 |
|---|---|---|
| MOS | 合成音声 | 単一発話・静的 |
| MUSHRA | 合成音声 | 参照あり・多試料比較 |
| SSA | テキスト対話 | sensibleness + specificity |
| Full-Duplex Challenge (IS 2024) | 対話音声 | naturalness / turn-taking / content |

### 対話音声ならではの違い

合成音は静的な 1 発話、対話は**時間軸**を持ち、評価者が**当事者**。
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

現行軸を否定せず、**分解と補強**で再構成する方針。
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

- Layer 1 の 4軸は**同じ粒度**で揃える
- Layer 2 は独立した軸として分析時も別扱い
- これにより「音が悪くても有用」のような矛盾パターンを許容したまま、相関を論じられる

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

「なぜこの軸か」を**具体項目から逆算**して説明可能な形にする。

---

# 今日議論したいこと

1. **27 項目**の過不足: 漏れや冗長はないか
2. **Ⅱ. 対話進行のタイミング**を新軸として立てるべきか
3. **Ⅳ と Ⅴ の境界**は明確か
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
