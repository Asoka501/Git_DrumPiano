# Git_DrumPiano

## 概要
ドラムとピアノをクリック（タップ）で鳴らせる楽器ページです。外部の音声サンプルは使わず、音はすべて Web Audio API でその場で合成します。

- ドラム：ドラマー視点（座った画角）のキット配置。キック／スネア／ハイハット／タム／フロアタム／クラッシュ／ライドをクリック、またはキーボードで演奏できます。
- ピアノ：2オクターブ以上の鍵盤。鍵を叩くと音と一緒に光のバーが上へ伸びて消えていきます。
- 楽器の切替：画面上部のタブでドラム／ピアノを切り替えます。

カテゴリ：instrument（楽器）

## 公開URL
https://asoka501.github.io/Git_DrumPiano/

## 構成
- Vite + TypeScript + Tailwind CSS + Lucide（標準スタック）
- `src/main.ts` が入口、`src/style.css` にスタイル、`public/` に素材を置きます
- 音源は Web Audio API の合成のみ（外部サンプルなし）
- main へマージされると GitHub Actions が自動でビルドして GitHub Pages へ公開します

## ローカル確認
    npm install
    npm run dev

nextgear 側で確認する場合の clone はこちらです。

    git clone https://github.com/Asoka501/Git_DrumPiano.git

## 開発の進め方
- 指示ごとにブランチを切り、確認が取れたら PR 経由で main へマージします
- 段階1：`feat/drums` — 楽器切替UI＋ドラム画面
- 段階2：`feat/piano` — ピアノ画面

## 進捗メモ（検証プロジェクトとしての実測）
- 段階0で記録します：リポジトリ作成の経路、VM clone から git push できるかどうか、Pages 有効化に必要な操作
