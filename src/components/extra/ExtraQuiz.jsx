// src/components/extra/ExtraQuiz.jsx
import React, { useState, useEffect, useRef } from "react";

// ===== 共通UI (パスはプロジェクト構成に合わせて調整してください) =====
import Timer from "../Timer";
import Lives from "../Lives";
//import DebugPanel from "../DebugPanel";//
import LoadingScreen from "../LoadingScreen";
import ConfirmGiveUp from "../ConfirmGiveUp";
import QuestionCounter from "../QuestionCounter";
import ActionButtons from "../ActionButtons";
import MessageDisplay from "../MessageDisplay";
import GameOverOverlay from "../GameOverOverlay";
import CorrectOverlay from "../CorrectOverlay";
import GameClearScreen from "../GameClearScreen";

// ===== 背景コンポーネント =====
// ★ Stage1は使わないので削除、パスを一つ上(..)に戻ってから参照
import Stage3 from "../background/Stage3";
import BossStage from "../background/BossStage";

// ===== Extra専用データ =====
import { famousPersons } from "./famousPersons";

// ===== スタイル =====
import "../../styles.css";

// =========================================
// 配列シャッフル関数
// =========================================
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function ExtraQuiz({
  questionCount,
  timeLimit,
  onBack,
  bgmVolume,
}) {
  // =========================================
  // State
  // =========================================
  const [normalPool, setNormalPool] = useState([]);
  const [bossPool, setBossPool] = useState([]);

  const [current, setCurrent] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState([]);

  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [messageType, setMessageType] = useState("");

  const [questionNumber, setQuestionNumber] = useState(1);
  const [lives, setLives] = useState(3);

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [skipUsed, setSkipUsed] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);
  const [correctAdvanceMode, setCorrectAdvanceMode] = useState("correct");

  const [correctInfo, setCorrectInfo] = useState({
    kanji: "",
    reading: "",
    meaning: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showGameClear, setShowGameClear] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // =========================================
  // 🎵 BGM
  // =========================================
  const normalBGMRef = useRef(new Audio("/bgm-normal-1.mp3"));
  const bossBGMRef = useRef(new Audio("/bgm-boss.mp3"));
  const normalBGM = normalBGMRef.current;
  const bossBGM = bossBGMRef.current;

  normalBGM.loop = true;
  bossBGM.loop = true;

  useEffect(() => {
    const vol = Number.isFinite(bgmVolume) ? bgmVolume : 0;
    normalBGM.volume = vol;
    bossBGM.volume = vol;
  }, [bgmVolume]);

  // =========================================
  // ★ 背景とBGMの切り替え判定
  // =========================================
  // 最終問題はBOSS、それ以外はNormal(Stage3)
  const isBossTurn = questionNumber === questionCount;

  // BGM切り替え制御
  useEffect(() => {
    if (isGameOver || showGameClear) {
      normalBGM.pause();
      bossBGM.pause();
      return;
    }

    if (isBossTurn) {
      normalBGM.pause();
      bossBGM.play().catch(() => {});
    } else {
      bossBGM.pause();
      normalBGM.play().catch(() => {});
    }
  }, [isBossTurn, isGameOver, showGameClear]);

  // =========================================
  // 初期化
  // =========================================
  useEffect(() => {
    const normals = shuffle(
      famousPersons.filter((q) => q.difficulty === "normal")
    );
    const bosses = shuffle(
      famousPersons.filter((q) => q.difficulty === "boss")
    );

    setNormalPool(normals);
    setBossPool(bosses);
    setUsedQuestions([]);

    if (normals.length > 0) {
      setCurrent(normals[0]);
    } else if (bosses.length > 0) {
      setCurrent(bosses[0]);
    }

    setQuestionNumber(1);
    setLives(3);
    setSkipUsed(false);
    setAnswer("");
    setResult("");
    setMessageType("");
    setIsGameOver(false);
    setShowGameClear(false);
    setIsChecking(false);
    setTimeLeft(timeLimit);

    return () => {
      normalBGM.pause();
      bossBGM.pause();
      normalBGM.currentTime = 0;
      bossBGM.currentTime = 0;
    };
  }, [questionCount, timeLimit]);

  // =========================================
  // タイマー
  // =========================================
  useEffect(() => {
    if (
      !current ||
      showConfirm ||
      isGameOver ||
      isChecking ||
      showCorrectOverlay
    )
      return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current, showConfirm, isGameOver, isChecking, showCorrectOverlay]);

  // =========================================
  // 次の問題へ
  // =========================================
  const advanceToNextProblem = () => {
    const newUsedQuestions = [...usedQuestions, current];
    setUsedQuestions(newUsedQuestions);

    const isCorrect = correctAdvanceMode === "correct";
    const nextQNumber = isCorrect ? questionNumber + 1 : questionNumber;

    if (isCorrect && questionNumber >= questionCount) {
      setShowGameClear(true);
      return;
    }

    setQuestionNumber(nextQNumber);

    const isBossStage = nextQNumber === questionCount;
    const targetPool = isBossStage ? bossPool : normalPool;

    let candidates = targetPool.filter((q) => !newUsedQuestions.includes(q));

    if (candidates.length === 0) {
      candidates = targetPool.filter((q) => q !== current);
      if (candidates.length === 0) candidates = [current];
    }

    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrent(next);

    setAnswer("");
    setResult("");
    setMessageType("");

    setTimeLeft(timeLimit);
  };

  // =========================================
  // CorrectOverlay「次へ」処理
  // =========================================
  const handleNextAfterCorrect = () => {
    setShowCorrectOverlay(false);

    if (correctAdvanceMode === "timeout") {
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setIsGameOver(true);
        return;
      }
    }

    setTimeout(() => {
      advanceToNextProblem();
      setIsChecking(false);
    }, 300);
  };

  // =========================================
  // 回答チェック
  // =========================================
  const checkAnswer = () => {
    if (!current || isChecking) return;
    setIsChecking(true);

    const ans = answer.trim();

    if (/^[a-zA-Z]+$/.test(ans)) {
      setMessageType("warning");
      setResult("⚠️ ひらがなで入力してね");
      setAnswer("");
      setIsChecking(false);
      return;
    }

    const normalize = (s) => s.trim().replace(/\s+/g, "").toLowerCase();
    const isCorrect =
      normalize(ans) === normalize(current.name) ||
      (current.aliases || []).some((a) => normalize(a) === normalize(ans));

    if (isCorrect) {
      setCorrectInfo({
        kanji: "",
        reading: current.display,
        meaning: current.meaning,
        image: current.image,
      });

      setCorrectAdvanceMode("correct");
      setShowCorrectOverlay(true);
      return;
    }

    setMessageType("error");
    setResult("❌ 間違い！もう一度チャレンジ！");
    setTimeout(() => {
      setAnswer("");
      setIsChecking(false);
    }, 800);
  };

  // =========================================
  // 時間切れ
  // =========================================
  const handleTimeout = () => {
    if (isChecking) return;
    setIsChecking(true);

    setCorrectInfo({
      kanji: "",
      reading: current.display,
      meaning: current.meaning,
      image: current.image,
    });

    setCorrectAdvanceMode("timeout");
    setShowCorrectOverlay(true);
  };

  // =========================================
  // スキップ
  // =========================================
  const skipQuestion = () => {
    if (skipUsed || isChecking) return;

    setIsChecking(true);
    setSkipUsed(true);

    setCorrectInfo({
      kanji: "",
      reading: current.display,
      meaning: current.meaning,
      image: current.image,
    });

    setCorrectAdvanceMode("skip");
    setShowCorrectOverlay(true);
  };

  // =========================================
  // ギブアップ
  // =========================================
  const handleGiveUp = () => setShowConfirm(true);

  const confirmGiveUp = (choice) => {
    if (choice === "yes") {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onBack();
      }, 800);
    } else {
      setShowConfirm(false);
    }
  };

  // =========================================
  // レンダー
  // =========================================
  if (loading) return <LoadingScreen message="終了しています..." />;
  if (showConfirm) return <ConfirmGiveUp onConfirm={confirmGiveUp} />;
  if (showGameClear) return <GameClearScreen onBack={onBack} />;

  return (
    <div className="quiz-root" style={{ position: "relative" }}>
      {/* ★ 背景切り替え: BossならBossStage、それ以外はStage3 */}
      {isBossTurn ? <BossStage /> : <Stage3 />}

      {showCorrectOverlay && (
        <CorrectOverlay
          kanji={correctInfo.kanji}
          reading={correctInfo.reading}
          meaning={correctInfo.meaning}
          image={correctInfo.image}
          mode={correctAdvanceMode}
          onNext={handleNextAfterCorrect}
        />
      )}
      {/* ★ DebugPanel をコメントアウト */}
      {/*<DebugPanel
        gameMode="extra"
        questionNumber={questionNumber}
        questionCount={questionCount}
        questionsLength={normalPool.length + bossPool.length}
        usedCount={usedQuestions.length}
        isChecking={isChecking}
        currentDifficulty={current?.difficulty}
      />  */}

      <div className="lives-container">
        <Lives lives={lives} />
      </div>

      <QuestionCounter current={questionNumber} total={questionCount} />

      {/* 背景を透明にして下のCanvasが見えるようにする */}
      <div className="quiz-mode" style={{ background: "transparent" }}>
        <div className="quiz-card">
          <Timer timeLeft={timeLeft} />

          <div style={{ textAlign: "center", margin: "20px 0" }}>
            {current?.image && (
              <img
                src={current.image}
                alt=""
                style={{
                  maxHeight: "280px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                }}
              />
            )}
          </div>

          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="名前を入力してね！"
            className="answer-input"
            onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            readOnly={isGameOver || isChecking}
            autoFocus
          />

          <MessageDisplay message={result} type={messageType} />

          <ActionButtons
            onAnswer={checkAnswer}
            onSwap={skipQuestion}
            onGiveUp={handleGiveUp}
            disabled={skipUsed || isChecking}
          />
        </div>
      </div>

      {isGameOver && <GameOverOverlay onBack={onBack} />}
    </div>
  );
}
