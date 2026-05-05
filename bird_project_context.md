# Bird Data Visualization Project — Context for Claude Code
*Generated from claude.ai conversation. Hand off to Claude Code.*

---

## プロジェクトの核心テーマ

**「鳥と人間のずれ / The Gap」**

川崎市幸区の公園で観察できる身近な5種を対象に、鳥の客観的特性と人間の評価・感情の間にある非対称性をデータビジュアライゼーションとして表現する。

> 「私たちは鳥を見ているのではなく、鳥に自分を投影しているだけかもしれない」

---

## 対象5種

| 種 | English | Species | ずれの核心 |
|---|---|---|---|
| オナガ | Azure-winged Magpie | Cyanopica cyanus | 見た目◯ 声× 最大の視覚-声ギャップ(+4.3) |
| カラス | Large-billed Crow | Corvus macrorhynchos | 八咫烏→害鳥 文化的逆転が最大 |
| スズメ | Eurasian Tree Sparrow | Passer montanus | 50年で90%減少 親しまれながら気づかれない減少 |
| ドバト | Feral Pigeon | Columba livia | 伝書鳩→嫌悪 歴史と現代の評価逆転 |
| ムクドリ | White-cheeked Starling | Sturnus cineraceus | 集団数最大・生態貢献大 文化的言及が最も薄い |

---

## 可視化する属性（確定）

### 客観層（定量）
- 体長 (cm)
- 体重 (g)
- 声の周波数帯域 low–high (Hz)
- 生息高度 min–max (m)
- 集団規模（典型値）
- 繁殖月数

### 人間の評価層（定量・推定）
- 視覚的魅力スコア (0–10) — iratebirds dataset (Haukka et al. 2023, Scientific Data)
- 声の好感度スコア (0–10) — 文献・定性推定
- 文化的言及スコア (0–10) — ことわざ・文学・絵画への登場推定
- 都市適応度 (0–10)
- 知性スコア (0–10)

### ずれ指標
- 視覚-声ギャップ = visual_score - voice_score
- 文化-実態ギャップ（言及高いのに個体数減少）

---

## データソース

- **iratebirds** (Haukka et al. 2023, Scientific Data / figshare) — 視覚的魅力スコア
- **Xeno-canto API v2** (xeno-canto.org/api/2) — スペクトログラム画像 & 音声、APIキー不要
  - スペクトログラム画像URL: `sono.med` フィールド
  - 音声URL: `file` フィールド
  - Japan録音優先: `query="{species}" cnt:Japan`
- **Cornell Lab AllAboutBirds** — 形態データ
- **日本野鳥の会 / Urban Bird Society of Japan** — 個体数データ
- **Journal of Ethology 2025** — 東京都市鳥の人間接近耐性研究

---

## 現在のプロトタイプ

`bird_gap_explorer_v2.jsx` — React コンポーネント（claude.ai Artifactで作成）

### 実装済み機能
- 5種切り替えボタン
- レーダーチャート（5軸）
- 周波数帯域バー（5種比較）
- スコア比較バーチャート
- 視覚-声ギャップバー
- スペクトログラム（Xeno-canto API動的取得 + 音声プレーヤー）
- 散布図（軸選択可能）

### 既知の制限
- Xeno-canto APIがサンドボックス環境ではCORS/ネットワーク制限で失敗する
- 声の好感度・文化的言及スコアは推定値（要検証・改善）
- スペクトログラムの「美しさ」定量化は未実装

---

## 次にやりたいこと（Claude Codeでやること）

### 優先度高
1. **iratebirdsデータセットから5種の実スコアを取得**
   - figshare: https://figshare.com/articles/dataset/20170082
   - CSVをダウンロードして Cyanopica cyanus, Corvus macrorhynchos, Passer montanus, Columba livia, Sturnus cineraceus を検索

2. **Xeno-canto APIの動作確認とスペクトログラム取得**
   - ローカル環境ならCORS問題なし
   - 各種のquality:A、Japan優先で1録音取得
   - `sono.med` URLの確認

3. **スペクトログラムの定量的特徴抽出**
   - librosa等でpitch range, tonality, noise ratio を計算
   - 「声の美しさ」の客観指標化

4. **Next.js or Viteでのローカル開発環境構築**
   - Reactコンポーネントをファイルベースで整理
   - Xeno-canto画像のプロキシ設定（CORS回避）

### 優先度中
5. **文化的言及スコアの改善**
   - 国立国会図書館API or Google Books APIで「オナガ」「カラス」etc. の出現頻度取得
   - ことわざ辞典データとの照合

6. **ビジュアルデザインの深化**
   - スペクトログラムの形状をSVGで再描画（ノイズ感/純音感を視覚言語に変換）
   - Fragapane参照だが彼女の文法は使わない。このプロジェクト固有の視覚言語を探る

---

## デザイン方針

- **Federicaのsmall multiplesは参照しない** — 目的・属性が異なる
- 断面図的なレイヤー構造（高度 × 時間）は一つの可能性として保留
- 現在の方向: 散布図 + スペクトログラム + ギャップバーの組み合わせ
- カラーパレット: 各種に固有色（オナガ=#7BB8C4, カラス=#C8C0B0, スズメ=#C4956A, ドバト=#8B8FA8, ムクドリ=#6B7C5E）
- 背景: #0c0c0c（ダーク）

---

## 参考文献リスト

- Haukka et al. (2023). "The iratebirds Citizen Science Project." *Scientific Data*. DOI: 10.1038/s41597-023-02169-0
- Journal of Ethology (2025) — Tokyo urban bird flight initiation distance study
- Urban Bird Society of Japan — Tokyo crow census 1985–present
- xeno-canto.org — CC licensed recordings
- BirdLife Datazone — feather cultural history
- Yale "Feathers: A Transcultural Art History" (2025)
