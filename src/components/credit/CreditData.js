// src/components/credit/CreditData.js

export const creditPages = [
  // 1ページ目：制作メンバー
  {
    title: "👥 制作メンバー",
    content: [
      { role: "💻 プログラム / AIコーディング", name: "Kai" },
      { role: "📂 データ収集 / デザイン構成", name: "YUYA" },
      { role: "🎬 背景アニメーション / UI設計", name: "Wada" },
      { role: "📝 全体レイアウト / 規約編集", name: "ARAKI" },
    ],
  },
  // 2ページ目：素材・協力
  {
    title: "🤝 協力・素材",
    content: [
      {
        role: "🖼️ 画像提供・出典",
        name: "国立国会図書館『近代日本人の肖像』(https://www.ndl.go.jp/portrait/)\n国立国会図書館デジタルコレクション\nWikimedia Commons",
      },
      { role: "🤖 AI画像生成協力", name: "Nano Banana" },
      {
        role: "🎵 音源・効果音",
        // ★修正: 出展元とアーティスト名を記述
        name: "出展：HURT RECORD\nYuu\nマユチェル\nsibakoro\nMaya",
      },
    ],
  },
  // 3ページ目：開発環境・ツール
  {
    title: "🛠️ 開発環境・ツール",
    content: [
      { role: "💻 コーディング", name: "VS Code\nReact Sandbox" },
      { role: "🧠 コード制作協力", name: "ChatGPT\nGoogle Gemini" },
      { role: "🚀 デプロイ", name: "Netlify" },
    ],
  },
];

// 規定データ
export const rulesPages = [
  {
    title: "📌 本プロジェクトについて",
    content: [
      "本ゲームは教育および技術学習を目的として制作されました。",
      "開発には ChatGPT および Google Gemini を活用しています。",
      "画像素材には、フリー素材サイトおよびAI生成画像が含まれます。",
    ],
  },
  {
    title: "⛔ 知的財産権と利用制限",
    content: [
      "本ゲームのプログラムおよび独自デザインの著作権は制作者に帰属します。",
      "画像・音源・フォントの無断転載および二次配布を禁止します。",
      "ゲームデータの改変や悪意のある解析行為は控えてください。",
    ],
  },
  {
    title: "🛡️ 免責事項",
    content: [
      "本ゲームの利用により生じたいかなる損害についても、制作者は一切の責任を負いません。",
      "仕様や規約は予告なく変更される場合があります。",
      "全てのプレイヤーに公正で楽しい体験を提供することを目指しています。",
    ],
  },
  // ★追加: 4ページ目（推奨環境・プライバシー）
  // トラブル防止のため、推奨ブラウザや個人情報の扱いについて明記しておくと安全です。
  {
    title: "💻 推奨環境・その他",
    content: [
      "推奨ブラウザ：Google Chrome, Microsoft Edge, Safari, Firefox の最新版。",
      "本ゲームはPCでのプレイを推奨しています。スマートフォン等ではレイアウトが崩れる可能性があります。",
      "本ゲームは、サーバーへの個人情報の送信・保存は一切行っていません。",
    ],
  },
];
