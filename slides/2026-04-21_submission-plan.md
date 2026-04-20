---
marp: true
paginate: true
theme: default
header: "SpeechArena 論文投稿プラン"
footer: "2026-04-21"
style: |
  :root {
    --fg: #1b1f23;
    --bg: #ffffff;
    --muted: #6b7280;
    --line: #e5e7eb;
    --accent: #1f4e79;
    --accent-soft: #eef2f7;
    --warn: #b45309;
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
  .warn { color: var(--warn); font-weight: 700; }

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

  section::after { color: var(--muted); font-size: 0.65em; }
  header, footer { color: var(--muted); font-size: 0.72em; }

  .lead { color: var(--muted); font-size: 0.92em; margin-top: -0.4em; }
---

# SpeechArena 論文投稿プラン

<p class="lead">できるだけ良い学会へ、現実的なスケジュールで</p>

2026-04-21 — 阿部

---

# 想定する貢献

SpeechArena の論文化にあたって主張できる 3 つの貢献:

1. **評価フレームワーク FD-DMOS** の設計方法論
   具体項目 27 から 5軸 + 二段構成へ導く再現可能なプロセス
2. **評価プラットフォーム** の実装と運用知見
   Web + WebSocket + GPU 基盤、A/B 比較、Bradley-Terry ランキング
3. **収集データ** による日本語フルデュプレックスモデル比較
   LLM-jp Moshi 6 系統のクラウドソーシング評価結果

この 3 点のどこを主題にするかで最適な投稿先が変わる。

---

# 候補会議のフィット度

| 会議 | フィット | 特徴 |
|---|---|---|
| **Interspeech 2027** | ★★★★★ | FD 対話評価の本丸。Interspeech 2025 でも FD-Bench, Full-Duplex-Bench など関連論文多数 |
| **IEEE SLT 2026** | ★★★★☆ | IEEE の spoken language workshop。評価・対話・FD にフィット |
| **NeurIPS 2026 E&D** | ★★★★☆ | Evaluations & Datasets Track。Chatbot Arena 系と構造が近い |
| ICASSP 2027 | ★★★☆☆ | 信号処理寄りの reviewer に刺さりにくい |
| SIGDIAL 2026 | ★★★☆☆ | 対話専門だが音声は弱い、締切も過ぎた |
| ACL/EMNLP | ★★☆☆☆ | NLP 寄りで音声評価は薄い |

---

# 推奨戦略: 三段構え

```
Stage 1   SLT 2026          会議版（最初の発信）
          2026-06-17 締切    Dec 2026 発表

Stage 2   Interspeech 2027  本丸（完全版）
          2027-02 頃締切    Aug 2027 発表

Stage 3   IEEE/ACM TASLP    ジャーナル（拡張版）
          常時受付           2027 年中に投稿
```

まず SLT で早期に発信し、得られた反応とデータ量を踏まえて Interspeech 2027 で本丸版を出す。最終的にジャーナル版で記録化。

---

# 一次ターゲット: IEEE SLT 2026

### 会議情報
- **会期**: 2026年12月13–16日（イタリア・パレルモ）
- **論文締切**: **2026年6月17日**（約 2ヶ月後）
- **フォーマット**: 4 ページ（+ 参考文献）

### フィット理由
- IEEE の spoken language technology 特化 workshop
- Evaluation / Dialog / FD モデルが定番トピック
- Interspeech より査読が早く、**2026年内に発表実績を作れる**

### 必要なもの
- FD-DMOS 設計の確定（今日の議論で詰める）
- パイロット評価 50–100 ワーカー規模のデータ
- Bradley-Terry ランキング結果

---

# 二次ターゲット: Interspeech 2027

### 会議情報
- **会期**: 2027年8月頃（Rotterdam 予定）
- **論文締切**: 2027年2–3月頃（例年通りなら）
- **フォーマット**: 4 ページ + 1 参考文献

### フィット理由
- 日本語フルデュプレックス音声対話評価の **ど真ん中**
- Interspeech 2025 の採択例:
  - FD-Bench, Full-Duplex-Bench, SOVA-Bench
  - "Towards a Japanese Full-duplex Spoken Dialogue System" (Ohashi et al.)
- Special Session / ベンチマーク系セッションとも親和

### 位置づけ
- SLT 版を拡張した**完全版**
- データ規模を 300–500 ワーカーまで拡大し、統計的に頑健な結論を提示

---

# ストレッチ: NeurIPS 2026 E&D

### 会議情報
- **会期**: 2026年12月（SLT とほぼ同時期）
- **Abstract 締切**: **2026年5月4日**（約 2 週間後）<span class="warn">⚠ 厳しい</span>
- **Full paper 締切**: 2026年5月6日 (AoE)

### 新設トラック
2026 年から「Evaluations & Datasets」に改称され、評価そのものを科学対象として位置づけ。

### フィット理由
- LMSYS Chatbot Arena（ICML 2024）の構造と近い
- Bradley-Terry + クラウドソーシング + プラットフォーム論文

### 実現可能性
- 2 週間で Abstract を出すのは可能だが、本提出までにデータと分析が必要
- **挑戦するならデータ収集を前倒しで開始する必要あり**

---

# 会議 vs 会議: 出し分けの論点

| 観点 | SLT 2026 | Interspeech 2027 | NeurIPS E&D |
|---|---|---|---|
| フィット | 評価・対話系 | FD音声のど真ん中 | 方法論・データセット |
| 査読の重さ | 中 | 重 | 重 |
| 投稿締切 | 2ヶ月後 | 10ヶ月後 | **2 週間後** |
| 到達難度 | 中 | 中〜高 | 高 |
| 読者層 | 音声研究者 | 音声研究者 | ML 全般 |
| ダブル投稿 | — | SLT 後の拡張 OK | — |

→ 論文の**スコープと完成度**で、まず SLT を狙うかを決める。

---

# スケジュール（案）

| 期限 | マイルストーン | 対応タスク |
|---|---|---|
| 2026-04-28 | 評価軸 5 軸 + 二段構成の確定 | 本日以降の議論で詰める |
| 2026-05-15 | パイロット評価 50 名分の収集完了 | 学内クラウドソーシング |
| 2026-05-31 | Bradley-Terry 分析・論文ドラフト v1 | Issue #8 実装含む |
| **2026-06-17** | **SLT 2026 投稿** | 4 ページ版を提出 |
| 2026-10 | SLT 採否通知 → 発表準備 or Interspeech 拡張 | |
| 2027-02 | Interspeech 2027 投稿（完全版） | 追加データ含む |
| 2027-Q3–Q4 | TASLP 投稿（ジャーナル拡張版） | |

---

# リスクと対応

| リスク | 影響 | 対応 |
|---|---|---|
| 評価軸がまだ叩き台段階 | 論文の中核が弱い | 4/21 以降で確定、5月初旬にフィックス |
| データ規模が小さい（SLT まで 2 ヶ月） | 統計的主張が弱くなる | 学内 50 名で必要最小規模を確保、Interspeech で拡張 |
| プラットフォーム論文としては実装情報が薄い | D&B 系で弱い | 実装詳細を Appendix / GitHub リポジトリで補強 |
| 関連論文が多い（先行 FD-Bench 等） | 差別化が必要 | 「日本語」「導出プロセス」「当事者評価」で切り分け |

---

# 今日決めたいこと

1. **一次ターゲットを SLT 2026 にロックしてよいか**
   （6/17 締切、2ヶ月で書き切る覚悟）
2. **NeurIPS E&D へのストレッチを狙うか**
   （2 週間で Abstract、データ前倒しが必要）
3. **論文の主題**
   - A. 評価フレームワーク中心（方法論として）
   - B. プラットフォーム + データセット中心（D&B として）
   - C. モデル比較結果中心（評価は手段）

→ 主題によって必要なデータ規模と分析手法が変わる。

---

# 関連資料

- `slides/2026-04-21_eval-redesign.md` 評価指標の再設計案
- `slides/2026-04-14_meeting-tasks.md` 4/14 議事のタスク化
- `slides/2026-04-14_infra-report.md` インフラ運用報告

### 参考先行研究

- FD-Bench / Full-Duplex-Bench (Interspeech 2025)
- "Towards a Japanese Full-duplex Spoken Dialogue System", Ohashi et al. (Interspeech 2025)
- Chatbot Arena (ICML 2024, LMSYS)
- MUSHRA / MOS 系主観評価プロトコル
