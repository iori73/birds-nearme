# birds-nearme — Color Design System

Federica Fragapane の作風から導出した色設計。プロジェクトの題材（川崎市幸区の身近な鳥：オナガ／カラス／スズメ／ドバト／ムクドリ）に合わせて意味付けしている。

---

## 1. Fragapane の色彩観（一次情報からの抽出）

| 出典 | 抽出できる色彩原則 |
|---|---|
| *Shapes of Inequalities* (Triennale Milano, 2025) — Designboom 取材 | 「muted reds / soft greens / cloudy purples」を意図的に採用。**デジタルではなく自然界を想起させる**ためのパレット選択。色は「生きた人間の存在」を符号化する手段だと本人が明言。 |
| *The Stories Behind a Line* (亡命者の旅路, 2017) — 本人 Medium | **Blue = 都市での滞在日数 / Light blue = 移動日数 / Black = 主軸の線 / Red = 語り手が詳細を語った瞬間 / White = 紙の背景**。彩度を抑え意味を厳格に分離。 |
| *La Lettura* (Corriere della Sera 文化面, 2015–) | 新聞紙のクリーム地に乗る前提。線は黒〜炭、付随属性は土系（オーカー、テラコッタ）と鈍色のセージ／ダスティブルー。 |
| 共通する「visual word」(Medium "Alive, Political Visual Words") | "fragile" "imperfect" "organic" — 高彩度・幾何ハードエッジを避ける。透明度・重ね・小さな繰り返しで階層を出す。 |

**3 つの設計原則として要約**：
1. **紙のような背景** — 純白を避け、わずかに温かいクリームを基調とする。
2. **彩度を 1 段階落とす** — 同じ赤でも蛍光ではなく「乾いた赤」。鳥の標本図鑑、植物画、古い博物誌のトーン。
3. **色は装飾ではなく文法** — 1 色 = 1 つの意味カテゴリ（時間・距離・感情の振幅・人間との関与度 など）。

---

## 2. Foundation tokens

### Paper / Ground
紙そのもの。Fragapane が新聞・展示空間で前提にしているクリーム地を基準に。

| token | hex | 用途 |
|---|---|---|
| `paper.base` | `#F4EFE6` | キャンバス（純白を避ける） |
| `paper.warm` | `#EDE4D3` | カード・密度の高い領域 |
| `paper.shadow` | `#E2D8C5` | 重ね・凹み |

### Ink / Skeleton
鳥の骨格、樹形図、軸線、文字。Fragapane の "black" は冷たい黒ではなく深いインク。

| token | hex | 用途 |
|---|---|---|
| `ink.deep` | `#2A2520` | 線・羽軸・凡例のテキスト |
| `ink.mid` | `#4F4840` | 補助線、grid |
| `ink.soft` | `#8C8378` | 注釈、薄い罫 |

---

## 3. Semantic palette（5 色 + アクセント）

各色は Fragapane の「muted reds / soft greens / cloudy purples」+ 紙系を起点に、**鳥固有の生態・文化的意味**へ割り当てる。

### Bird identity（5 種に各 1 色）
鳥の実際の羽色に合わせるのではなく、**「人間との関係性」の質感**で割る（Iori が断面図で議論した非対称性をパレットに反映）。

| 鳥 | token | hex | Fragapane 系列 | 意味の根拠 |
|---|---|---|---|---|
| カラス（ハシブト） | `bird.crow` | `#3A3A52` | cloudy violet/navy | 八咫烏＝神話、現代＝害鳥という両義性。冷たい黒ではなく「夜の紫」で神話側を含意。 |
| オナガ | `bird.azure` | `#7A95A8` | dusty cerulean | 水色の尾羽。ただし鮮やかすぎる空色は避け、曇った青に。 |
| スズメ | `bird.sparrow` | `#B58A5E` | warm ochre | 文化的親密さ（雀百まで）と急減（最大 -90%）。土に近い色で「日常」と「失われつつあるもの」を同時に示す。 |
| ドバト | `bird.dove` | `#9A8B92` | dusty mauve | 鳩の喉の構造色（緑紫）を彩度を落として抽象化。 |
| ムクドリ | `bird.starling` | `#5C6B5A` | sage olive | 群れ・農村起源・夕方の電線。植生側の緑。 |

### Encoding accents（属性軸）
*Stories Behind a Line* の語彙をそのまま継承する。意味の継承で Fragapane 文法に近づく。

| token | hex | 符号化対象 | 由来 |
|---|---|---|---|
| `accent.duration` | `#516C8A` | 滞在・定着（時間の溜まり） | Stories Behind a Line: blue = 滞在日数 |
| `accent.movement` | `#9CB4C2` | 移動・飛行・通過 | 同: light blue = 移動日数 |
| `accent.emphasis` | `#B14A3D` | 「強調すべき瞬間」「個体数の急変」「感情の反転」 | 同: red = 物語の核心。本プロジェクトでは個体数 -90% などの破断点に。 |
| `accent.culture` | `#6E4F6B` | 文化史・象徴・文献量 | cloudy purple — 象徴領域 |
| `accent.life` | `#7C8F5B` | 生態・生息地・自然側 | soft green — 生命側 |
| `accent.warning` | `#C68A3C` | 絶滅危惧・乱獲・記録の空白 | muted ochre — 警鐘 |

---

## 4. プロジェクト固有の運用ルール

1. **断面図（Iori が選んだ構造）の縦軸 = 物理的高度** は必ず `ink.mid` のグリッドで描く。色は属性に使い、空間軸では使わない。
2. **時間軸（横軸）に乗る個体数遷移と文献量** はそれぞれ `bird.{species}` の固有色 + 透明度 0.4 / 0.7 で重ねる。同色 2 透明度で「同じ鳥の生態と文化」の二重奏を表現。
3. **感情の反転点**（カラスの神聖→害鳥など歴史上の評価逆転）は `accent.emphasis` の小さな赤い丸で打点。Fragapane が "narrators decided to share more detailed fragments" を赤で打ったのと同じ文法。
4. **塗りより線** を優先。塗りはすべて 30–60% 透明、輪郭は `ink.deep` 0.5–0.75pt。
5. **彩度上限**：いかなる色も HSL の S を 55% より上にしない。これだけで Fragapane 的な「乾き」が保たれる。

---

## 5. 出典

- Federica Fragapane, *The Stories Behind a Line*, Medium, 2017
- Designboom, "Federica Fragapane's soft forms visualize hard facts on inequalities" (Triennale Milano 取材), 2025-06-08
- Federica Fragapane, *Alive, Political Visual Words*, Medium
- *La Lettura* 連載 (2015–), Wild Mazzini 紹介ページ
- MoMA 収蔵 *Noise Pollution* (2020) 作品ページ

---

## 6. 注意

hex 値は Fragapane が公開している一次資料には**存在しない**。本ドキュメントの hex は、彼女の公開作品の言語的記述（"muted red", "cloudy purple" 等）と作品画像の観察から逆算した推定値である。実装前に印刷物・展示写真と並べて校正することを推奨する。
