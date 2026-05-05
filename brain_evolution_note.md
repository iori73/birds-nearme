# 鳥の脳はどんな進化を辿ってきたのか — リサーチノート
*birds-nearme / 第二章「The Gap」拡張テーマ。Figma node 42:230 のリファレンスから派生。*

---

## 0. 一言で

**鳥の脳は「退化した爬虫類の脳」ではなく、哺乳類とは別ルートで高度化した独立進化の認知システムである。**
2004 年の鳥類脳命名法改訂（Avian Brain Nomenclature Consortium）以降、この理解は神経科学の標準になった。
本企画はこの「ずれの修正史」自体を視覚化する。

> 100 年信じられてきた「鳥は本能だけで生きる線条体生物」像と、
> 21 世紀の「鳥は哺乳類に匹敵する pallium 認知系を持つ」像のあいだに、
> もう一つの The Gap がある。

---

## 1. 脳部位リスト（Figma 42:230 の英語ラベル＋日本語定義の写し）

| 部位 | 英語 | Figma 内定義（写し） | 機能の核 | 進化的ハイライト |
|---|---|---|---|---|
| 嗅球 | Olfactory bulb | においを感じ取る感覚 | 化学受容 | 古い系統。鳥では多くの種で縮小。一方ハゲワシ・キーウィでは発達 |
| 大脳皮質（外套） | Pallium | 思考や感覚を司る脳の外層 | 高次認知・学習・道具使用 | **2004 年改訂の主役**。哺乳類皮質と独立に発達した「ニドパリウム」が認知の中核 |
| 線条体 | Striatum | 運動や報酬に関わる脳の部分 | 運動・強化学習 | 旧説では「鳥脳のほぼ全部」と誤解されていた領域 |
| 中脳 | Midbrain | 視覚や聴覚の情報処理を行う脳の中部 | 視覚優位（視蓋＝Optic tectum） | 鳥は視覚特化 — 視蓋が哺乳類より相対的に巨大 |
| 視床 | Thalamus | 感覚情報を大脳に伝える中継点 | 感覚中継 | 哺乳類と相同。pallium への投射ルートが鳥独自 |
| 視交叉 | Optic chiasm | 視神経が交差する部分 | 視野の左右分配 | ほぼ完全交差。両眼視より単眼視（広視野）戦略の証拠 |
| 後脳 | Hindbrain | 運動やバランスを調整する脳の後部 | 呼吸・心拍・基本運動 | 古層。系統間で保守的 |
| 小脳 | Cerebellum | 運動の調整やバランス維持を担当する脳の部分 | 運動学習・飛行制御 | 飛行ぶんだけ哺乳類より相対的に大きい。葉間溝も深い |

---

## 2. 進化の軸（縦軸候補）

| 時期 | 出来事 | 脳側で起きたこと |
|---|---|---|
| 〜2.5 億年前 | 双弓類（爬虫類祖先）の標準的な前脳 | 線条体優位、pallium は薄い |
| 1.5 億年前 | 獣脚類恐竜 → 始祖鳥 | 飛翔のための小脳・視覚系拡大 |
| 0.66 億年前 | K-Pg 大量絶滅 | 大型恐竜消滅。**小型・脳化指数の高い系統**だけが生き残る（ボトルネック） |
| 〜0.5 億年前 | 現生鳥類の放散 | 神経密度の極端な高密度化（小さい脳に多くのニューロン） |
| 現在 | カラス科・オウム科の認知革命 | NCL（nidopallium caudolaterale）= 鳥の「前頭前野」相当が独立進化 |

**鍵となる発見（出典）：**

- Jarvis et al. 2005, *Nat Rev Neurosci* — 鳥脳命名法大改訂。「primitive striatum」誤解の終焉
- Olkowicz et al. 2016, *PNAS* — カラス・オウムは霊長類並みのニューロン数を pallium に詰める
- Stacho et al. 2020, *Science* — 鳥 pallium は哺乳類大脳皮質と類似の柱状構造を持つ
- Güntürkün & Bugnyar 2014 — NCL = 鳥の前頭前野相当、平行進化
- Iwaniuk & Hurd 2005 — 鳥類脳サイズの系統比較データベース

---

## 3. 5 種への接続（横軸候補）

既存の `src/App.jsx` の 5 種と直接接続する。「身近な 5 種の脳の中で何が違うのか」が物語の入口。

| 種 | 体重 (g) | 推定脳重 (g) | EQ 系列 | 認知の特徴 | 進化的位置づけ |
|---|---|---|---|---|---|
| カラス（ハシブト） | 600 | ~9 | 高（霊長類域） | 道具使用、心の理論的行動、計画 | NCL 拡大の代表例 |
| オナガ | 75 | ~1.8 | 高（カラス科） | 協同繁殖、社会学習 | カラス科の認知系を中型で備える |
| ムクドリ | 85 | ~1.5 | 中 | 群行動、音声模倣 | 音声学習系（HVC, Area X）が発達 |
| ドバト | 350 | ~2.2 | 中 | 視覚弁別・帰巣（地磁気） | 視蓋・海馬が代表的に発達 |
| スズメ | 22 | ~0.8 | 中 | 都市学習、警戒行動の柔軟性 | 小型ながら密度の高い pallium |

> 5 種は「鳥脳の進化の異なる枝の代表」として読める。
> カラス＝認知極、ドバト＝視覚-空間極、ムクドリ＝音声学習極、スズメ＝小型高密度極、オナガ＝社会極。

数値（脳重・EQ）はプロトタイプ段階では文献の代表値を入れて
`confidence: estimate` バッジで示す（既存 App.jsx の MetricCard ルールを継承）。

---

## 4. ビジュアライゼーションの構造案

既存企画の「断面図」文法（縦＝物理的高度、横＝時間、色＝属性）を**脳に転写**する：

| 軸 | 既存（5 種比較） | 本章（脳の進化） |
|---|---|---|
| 縦軸 | 物理的高度 (m) | **進化的時間** (爬虫類祖先 → 現生鳥) または **脳の解剖学的層**（Hindbrain → Pallium） |
| 横軸 | 時間軸（個体数遷移） | **脳部位** 8 区分（Olfactory … Cerebellum） |
| 色 | 鳥種 / 属性カテゴリ | `bird.{species}` の 5 色を「どの種でその部位が突出しているか」のハイライトに使う |
| 強調点 | accent.emphasis（赤） | **2004 年の命名改訂**（線条体支配 → pallium 認知）を赤で打点 |

**「ずれの核心」のスロット**（既存と同じ語彙）：
- 線条体支配説の終焉（科学史のずれ）
- 「鳥の脳は小さい」感覚 vs 単位体積あたりニューロン数最高クラス（直観のずれ）
- 「鳥頭 / bird-brained」という蔑称 vs カラスの認知能力（言語と実態のずれ）

---

## 5. 配色マッピング（暫定 — design-system/colors.md 準拠）

部位 → 色の暫定割り当て。Fragapane 文法（彩度 S<55%、紙地、線優先）を維持。

| 部位 | token 候補 | 根拠 |
|---|---|---|
| Olfactory | `accent.warning` (#C68A3C) | 縮小・退行の領域 |
| Pallium | `accent.culture` (#6E4F6B) | 認知・象徴領域。命名改訂の主役 |
| Striatum | `bird.crow` (#3A3A52) | 旧誤解の中心。神話的な誤読の色 |
| Midbrain (Optic tectum) | `accent.movement` (#9CB4C2) | 視覚＝動きの処理 |
| Thalamus | `ink.mid` (#4F4840) | 中継。骨格色で控えめに |
| Optic chiasm | `accent.duration` (#516C8A) | 視野の継続性 |
| Hindbrain | `paper.shadow` (#E2D8C5) | 古層・基層 |
| Cerebellum | `accent.life` (#7C8F5B) | 飛行＝生命側の運動 |

---

## 6. 「ずれの核心」候補（章タイトル案）

1. **「鳥の脳は退化していない、ただ別の道を行っただけだ」**
2. 「200 年信じられた誤読」（Edinger 1908 → Jarvis 2005）
3. 「小ささは未熟さではない — 単位体積あたりの密度の話」
4. 「カラスがチンパンジーに見える日」

採用は実装段階で 1 つに絞る。本企画の通底テーマ「The Gap」の脳バージョンとして、**1** を第一候補に置く。

---

## 7. 次の作業

- [ ] このノートをもとに `data/brain_parts.json`（部位 × 機能 × 色 × 進化エピソード）を作る
- [ ] `src/App.jsx` の流儀でプロトタイプ画面を 6 割版で（task #2）
- [ ] Figma に断面図レイアウトを反映（task #3）
- [ ] 数値（脳重・ニューロン数）の出典を後追いで `confidence` バッジ運用に乗せる

---

## 8. 出典メモ

- Jarvis ED et al. (2005). Avian brains and a new understanding of vertebrate brain evolution. *Nat Rev Neurosci* 6, 151–159.
- Olkowicz S et al. (2016). Birds have primate-like numbers of neurons in the forebrain. *PNAS* 113, 7255–7260.
- Stacho M et al. (2020). A cortex-like canonical circuit in the avian forebrain. *Science* 369, eabc5534.
- Güntürkün O, Bugnyar T (2016). Cognition without Cortex. *Trends Cogn Sci* 20, 291–303.
- Iwaniuk AN, Hurd PL (2005). The evolution of cerebrotypes in birds. *Brain Behav Evol* 65, 215–230.
- Edinger L (1908) — 旧学説の代表として参照（鳥脳＝線条体ベース説の起点）。

---

## 9. 実装ノート — `BrainSpecimenPlate` の系譜

第二章「The Misread Brain」の web 実装は、以下の経過で v3 まで進めた。各版の差分・残課題を一次ソースとして残す。

### 9.1 v1 (`BirdBrainExplorer.jsx` — 旧)
ダッシュボード型。タブ・カード・MetricCard・暗背景。設計ノート (Section 1–8) の文法が借りた配色だけになっていた。`src/_archive/BirdBrainExplorer.legacy.jsx` に退避。

### 9.2 v2 (`BrainSpecimenPlate.jsx` — `brain-plate-final.png` 時点)
1 枚の specimen plate に再構築。クリーム紙地、5 鳥同サイズパネル、Edinger 1908 / Jarvis 2005 のミスレジ（12/8px）、2004 命名改訂赤点、K-Pg 赤点、pattern + glyph + 色の 3 重符号化。

設計仕様一次ソース：`/Users/iorikawano/.claude/plans/magical-giggling-trinket.md`。データ中立性ルール（`eq` と `highlight_part` を描画に使わない、すべて range 表示、5 パネル等面積、赤は 2 箇所予約）はここで確立した。

v2 で残った弱点：
1. 中央：8 部位ラベルのリーダー線・1908/2005 注記・2004 赤点・キャプションが同じ垂直帯に集積。
2. 5 標本列：skull / aura / filament が小さく、filament が頭蓋外にほぼ抜けない。下部に死に余白。
3. 時間軸：帯が間延び、K-Pg と 2004 の双子性が弱い。
4. 凡例：8 部位の対応が 2 列で縦走査しにくい。
5. 1908 striatum クロスハッチが 2004 赤点と干渉。

### 9.3 v3 (現状)
設計仕様：`/Users/iorikawano/.claude/plans/birds-nearme-chapter-tender-flurry.md`。

実装した変更：

- **中央 (`TwinBrain`)** —
  - 8 部位ラベルを廃し、skull 内に **番号バッジ ①–⑧** を打ち、右マージンに `PartKeyColumn`（番号 + stroke sample + glyph + JP/EN）を新設。リーダー線全廃。
  - 1908 / 2005 の date 注記を **左マージン 1 列に縦配置**（上が古い読み、下が新しい読み）。間に細い縦罫。
  - 1908 striatum クロスハッチを **5 本 / opacity 0.28** に減らし、y 範囲を狭めて 2004 赤点を逃がした。
  - 2004 命名改訂テキストを **skull 上端外（y=-262 anchor=middle）** に移し、jittered 縦カラウトで赤点に降ろす。
  - ミスレジ `OFFSET_X = 12 / OFFSET_Y = 8` は維持。
- **5 標本列 (`SpeciesPanel`)** —
  - `baseR` 60→72、skull scale 0.42→0.50、ローブ scale 同。
  - `filamentLengths.toPx` を `14 + sqrt(d) * 3.6` → `22 + sqrt(d) * 5.4`（filament が頭蓋外に確実に放射する長さ）。
  - aura `fillOpacity` 0.05→0.10、stroke 0.7→0.9、半径 +30→+38。
  - glyph に `size` prop を追加し、tip サイズを 5→6。
  - パネル下部の死に余白に **「脳重 g」「ニューロン M」二段ラダー** を追加（既存 `ladderRungs` を双方に活用）。
- **時間軸 (`TimelineRail`)** —
  - 中生代 (`PAPER_WARM` opacity 0.6) / 新生代 (paper) の地質帯を rail 背景に追加。
  - K-Pg 境界で色が切り替わって見える。
  - K-Pg と 2004 を結ぶ **jittered 細弧**（`EMPHASIS` dashed 0.5 opacity 0.55）を rail 上方に追加し、中央に italic で *"two ruptures, 66 Myr apart"*。
  - ティック追加（200, 30, 5 Mya）。major / minor 区別。
  - eyebrow 改稿（"Geological rail · 二つの転回点"）。
- **凡例 + フットノート (`Footnotes`)** —
  - 12-col grid 再配分。Col B を 8 行 1 列の縦凡例（stroke + glyph + 番号 + JP + EN）に展開。中央キーカラムと 1:1 対応。
  - 出典を **番号付き脚注 [1]–[4]** 化、caveat 本文に [1][2] 参照を埋め込み。
- **canvas** — `VB_H` 2200→2280（タイムライン拡張ぶんを下流に渡した）。

### 9.4 検証状況

- `npm run build` パス（vite production build OK）。
- データ中立性 grep 0 件（`eq` / `highlight_part` がコードパスに現れない）。
- `EMPHASIS` (#B14A3D) は K-Pg dot, 2004 dot, K-Pg↔2004 連結弧, 2004 callout テキスト、2 つの "two ruptures" italic のみ — `magical-giggling-trinket.md` の予約ルール内。
- **画面検証は未実施**（chrome-devtools / playwright MCP セッションがハングしてスクリーンショット取得に失敗。次セッションで `npm run dev` → ブラウザ確認）。

### 9.5 残課題 (v3 → v4 候補)

- 番号バッジが skull 内ローブと重なる場合、ローブ pattern の視認性を損なう可能性あり → 実画面確認後に位置微調整。
- 右マージン `PartKeyColumn` が `TwinBrain` ローカル座標系に置かれているため、SVG viewBox 端との余白が狭い場合がある → 描画後に DevTools で bbox 確認。
- 1908 注記と 2005 注記の縦罫が長すぎる場合は短縮、または罫を破線に変える案。
- 時間軸の linking arc の高さ (archTopY = y - 70) が、Mesozoic / Cenozoic 帯ラベルと干渉する可能性 → 重なれば arc を高めに、ラベルを帯内側に押し込む。

