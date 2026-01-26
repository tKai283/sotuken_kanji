// src/components/Quiz.jsx
import React, { useState, useEffect } from "react";
import Timer from "./Timer";
import Lives from "./Lives";
//import DebugPanel from "./DebugPanel";//
import LoadingScreen from "./LoadingScreen";
import ConfirmGiveUp from "./ConfirmGiveUp";
import QuestionCounter from "./QuestionCounter";
import ActionButtons from "./ActionButtons";
import MessageDisplay from "./MessageDisplay";
import LevelIntroOverlay from "./LevelIntroOverlay";
import GameOverOverlay from "./GameOverOverlay";
import CorrectOverlay from "./CorrectOverlay";
import GameClearScreen from "./GameClearScreen";
import { questionSets } from "./questions";

// ★ BossStage, Stage3, Stage1 をインポート
import BossStage from "./background/BossStage";
import Stage3 from "./background/Stage3";
import Stage2 from "./background/stage2";
import Stage1 from "./background/stage1"; // ★追加: ファイル名小文字注意

import "../styles.css";

// =========================================
// 配列シャッフル関数
// =========================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({
  level,
  questionCount,
  timeLimit,
  onBack,
  bgmVolume,
  bgm,
}) {
  const selectedQuestions = questionSets[level];

  // =========================================
  // State
  // =========================================
  const [rankPools, setRankPools] = useState({});
  const [questionsRemaining, setQuestionsRemaining] = useState({});

  const [current, setCurrent] = useState(null);
  const [answer, setAnswer] = useState("");

  const [lives, setLives] = useState(3);
  const [result, setResult] = useState("");
  const [messageType, setMessageType] = useState("");

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [skipUsed, setSkipUsed] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [questionNumber, setQuestionNumber] = useState(1);

  const [warning, setWarning] = useState("");

  const [stage, setStage] = useState(1);
  const [showLevelIntro, setShowLevelIntro] = useState(true);

  const [isGameOver, setIsGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [showGameClear, setShowGameClear] = useState(false);
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);
  const [correctAdvanceMode, setCorrectAdvanceMode] = useState("correct");

  const [correctInfo, setCorrectInfo] = useState({
    kanji: "",
    reading: "",
    meaning: "",
  });

  // =========================================
  // 🎵 BGM 管理
  // =========================================
  const normalBGMRef = React.useRef(
    new Audio(
      `/bgm-normal-${bgm === "normal1" ? 1 : bgm === "normal2" ? 2 : 3}.mp3`
    )
  );
  const bossBGMRef = React.useRef(new Audio("/bgm-boss.mp3"));
  const clearBGMRef = React.useRef(new Audio("/bgm-clear.mp3"));
  const playingRef = React.useRef("none");

  const normalBGM = normalBGMRef.current;
  const bossBGM = bossBGMRef.current;
  const clearBGM = clearBGMRef.current;

  const stopAllBgm = () => {
    normalBGM.pause();
    normalBGM.currentTime = 0;

    bossBGM.pause();
    bossBGM.currentTime = 0;

    clearBGM.pause();
    clearBGM.currentTime = 0;
  };

  normalBGM.loop = true;
  bossBGM.loop = true;
  clearBGM.loop = false;

  useEffect(() => {
    const vol = Number.isFinite(bgmVolume) ? bgmVolume : 0;
    normalBGM.volume = vol;
    bossBGM.volume = vol;
    clearBGM.volume = vol;
  }, [bgmVolume, normalBGM, bossBGM, clearBGM]);

  // =========================================
  // ★ ステージ判定
  // =========================================
  const getLevelStage = (qNum) => {
    const idx = qNum - 1;
    if (idx === questionCount - 1) return "BOSS";

    let interval = 2;
    if (questionCount === 10) interval = 3;
    if (questionCount === 16) interval = 5;

    return Math.min(3, Math.floor(idx / interval) + 1);
  };

  // =========================================
  // 初期化
  // =========================================
  useEffect(() => {
    const selected = questionSets[level];

    const rank1 = shuffle(selected.filter((q) => q.rank === "1"));
    const rank2 = shuffle(selected.filter((q) => q.rank === "2"));
    const rank3 = shuffle(selected.filter((q) => q.rank === "3"));
    const boss = shuffle(selected.filter((q) => q.rank === "BOSS"));

    setRankPools({ 1: rank1, 2: rank2, 3: rank3, BOSS: boss });

    setQuestionsRemaining({
      1: rank1.slice(1),
      2: rank2,
      3: rank3,
      BOSS: boss,
    });

    setCurrent(rank1[0]);

    setQuestionNumber(1);
    setLives(3);
    setSkipUsed(false);
    setIsGameOver(false);
    setAnswer("");
    setResult("");
    setWarning("");
    setMessageType("");

    setStage(1);
    setShowLevelIntro(true);

    setTimeLeft(timeLimit);
    setIsChecking(false);

    normalBGM.volume = Number.isFinite(bgmVolume) ? bgmVolume : 0;

    if (normalBGM.paused) {
      normalBGM.play().catch(() => {});
    }
    playingRef.current = "normal";
  }, [level, questionCount, timeLimit]);

  // =========================================
  // ★ BGM 切替
  // =========================================
  useEffect(() => {
    if (isGameOver || showGameClear) return;

    const want = stage === "BOSS" ? "boss" : "normal";
    if (playingRef.current === want) return;

    if (want === "boss") {
      if (!normalBGM.paused) normalBGM.pause();
      bossBGM.currentTime = 0;
      bossBGM.play().catch(() => {});
    } else {
      if (!bossBGM.paused) bossBGM.pause();
      normalBGM.play().catch(() => {});
    }

    playingRef.current = want;
  }, [stage, isGameOver, showGameClear, normalBGM, bossBGM]);

  useEffect(() => {
    return () => {
      stopAllBgm();
    };
  }, []);

  // =========================================
  // ★ タイマー
  // =========================================
  useEffect(() => {
    if (
      !current ||
      showConfirm ||
      showLevelIntro ||
      showCorrectOverlay ||
      isGameOver ||
      isChecking
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    current,
    showConfirm,
    showLevelIntro,
    showCorrectOverlay,
    isGameOver,
    isChecking,
  ]);

  // =========================================
  // ★ 次の問題へ
  // =========================================
  const advanceToNextProblem = (isCorrect = false) => {
    if (isCorrect && questionNumber === questionCount) {
      normalBGM.pause();
      bossBGM.pause();
      normalBGM.currentTime = 0;
      bossBGM.currentTime = 0;

      clearBGM.currentTime = 0;
      clearBGM.play().catch(() => {});

      setShowGameClear(true);
      return;
    }

    const nextQuestionNum = isCorrect ? questionNumber + 1 : questionNumber;
    const nextStage = getLevelStage(nextQuestionNum);

    const rankKey = nextStage === "BOSS" ? "BOSS" : nextStage;

    const pool = questionsRemaining[rankKey];
    if (!pool || pool.length === 0) {
      setCurrent(null);
      return;
    }

    const [next, ...rest] = pool;
    setCurrent(next);

    setQuestionsRemaining((prev) => ({
      ...prev,
      [rankKey]: rest,
    }));

    if (isCorrect) setQuestionNumber(nextQuestionNum);

    setAnswer("");
    setWarning("");
    setResult("");
    setMessageType("");
    setTimeLeft(timeLimit);

    if (nextStage !== stage) {
      setStage(nextStage);
      setShowLevelIntro(true);
    }
  };

  // =========================================
  // ★ 回答チェック
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

    const readings = current.reading
      .replace(/、/g, ",")
      .split(",")
      .map((r) => r.trim());

    const isNearMatch = (input, correct) => {
      if (input === correct) return false;
      if (Math.abs(input.length - correct.length) > 1) return false;

      let diff = 0,
        i = 0,
        j = 0;

      while (i < input.length && j < correct.length) {
        if (input[i] !== correct[j]) {
          diff++;
          if (diff > 1) return false;

          if (input.length > correct.length) i++;
          else if (input.length < correct.length) j++;
          else {
            i++;
            j++;
          }
        } else {
          i++;
          j++;
        }
      }

      if (i < input.length || j < correct.length) diff++;
      return diff === 1;
    };

    if (readings.includes(ans)) {
      setMessageType("success");
      setResult("");

      setCorrectInfo({
        kanji: current.kanji,
        reading: current.reading,
        meaning: current.meaning || "",
      });
      setCorrectAdvanceMode("correct");
      setShowCorrectOverlay(true);

      setIsChecking(false);
      return;
    }

    if (readings.some((r) => isNearMatch(ans, r))) {
      setMessageType("near");
      setResult("🤏 おしい！もう一度チャレンジ！");
      setAnswer("");
      setIsChecking(false);
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
  // ★ 時間切れ
  // =========================================
  const handleTimeUp = () => {
    if (!current) return;

    setCorrectInfo({
      kanji: current.kanji,
      reading: current.reading,
      meaning: current.meaning || "",
    });

    setCorrectAdvanceMode("timeout");
    setShowCorrectOverlay(true);
  };

  const handleNextAfterCorrect = () => {
    setShowCorrectOverlay(false);

    if (correctAdvanceMode === "timeout") {
      const newLives = lives - 1;
      setLives(newLives);

      setMessageType("error");
      setResult(`❌ 時間切れ！（残り${newLives}機）`);

      if (newLives <= 0) {
        setTimeout(() => {
          stopAllBgm();
          setIsGameOver(true);
        }, 800);
        return;
      }

      setTimeout(() => {
        advanceToNextProblem(false);
      }, 800);

      return;
    }

    if (correctAdvanceMode === "skip") {
      advanceToNextProblem(false);
      return;
    }

    advanceToNextProblem(true);
  };

  // =========================================
  // ★ スキップ
  // =========================================
  const skipQuestion = () => {
    if (skipUsed || isChecking) return;

    setIsChecking(true);
    setSkipUsed(true);

    setCorrectInfo({
      kanji: current?.kanji || "",
      reading: current?.reading || "",
      meaning: current?.meaning || "",
    });

    setCorrectAdvanceMode("skip");
    setShowCorrectOverlay(true);

    setIsChecking(false);
  };

  // =========================================
  // ★ ギブアップ
  // =========================================
  const handleGiveUp = () => setShowConfirm(true);

  const confirmGiveUp = (choice) => {
    if (choice === "yes") {
      stopAllBgm();
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
  // ★ 背景スタイル
  // =========================================
  const getBackgroundStyle = () => {
    switch (stage) {
      case 1:
        return { background: "transparent" };
      case 2:
        // ★変更: Stage2を表示するので透明に
        return { background: "transparent" };
      case 3:
        return { background: "transparent" };
      case "BOSS":
        return { background: "transparent" };
      default:
        return { background: "#000" };
    }
  };

  // =========================================
  // ★ レンダー
  // =========================================
  if (loading) return <LoadingScreen message="終了しています..." />;
  if (showConfirm) return <ConfirmGiveUp onConfirm={confirmGiveUp} />;

  if (showGameClear) {
    return (
      <GameClearScreen
        onBack={() => {
          stopAllBgm();
          onBack();
        }}
      />
    );
  }

  return (
    <div
      className="quiz-root"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* ★ Stage2 背景 (Level 2時のみ表示) */}
      {stage === 1 && <Stage1 />}
      {stage === 2 && <Stage2 />}
      {stage === 3 && <Stage3 />}
      {stage === "BOSS" && <BossStage />}

      {/* CorrectOverlay */}
      {showCorrectOverlay && (
        <CorrectOverlay
          kanji={correctInfo.kanji}
          reading={correctInfo.reading}
          meaning={correctInfo.meaning}
          mode={correctAdvanceMode}
          onNext={handleNextAfterCorrect}
        />
      )}

      {showLevelIntro && (
        <LevelIntroOverlay
          levelText={
            stage === "BOSS" ? "⚔️ BOSS STAGE ⚔️" : `LEVEL ${stage} 漢検4・5級`
          }
          onFinish={() => setShowLevelIntro(false)}
        />
      )}

      {/* ★ DebugPanel をコメントアウト */}
      {/*<DebugPanel
        gameMode="main"
        questionNumber={questionNumber}
        questionCount={questionCount}
        questionsLength={
          questionsRemaining[stage === "BOSS" ? "BOSS" : stage]?.length || 0
        }
        isChecking={isChecking}
      />  */}

      <div className="lives-container">
        <Lives lives={lives} />
      </div>

      <QuestionCounter current={questionNumber} total={questionCount} />

      {/* 背景色を設定するコンテナ */}
      <div className="quiz-mode" style={getBackgroundStyle()}>
        <div className="quiz-card">
          <Timer timeLeft={timeLeft} />

          {/* ★修正: 条件分岐で中身を空にするのではなく、visibilityで制御する */}
          <div
            className="question-text"
            style={{
              // オーバーレイが出ている時は「非表示(hidden)」にするが、場所は確保する
              visibility: showCorrectOverlay ? "hidden" : "visible",
            }}
          >
            {current?.kanji}
          </div>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="ひらがなで答えてね"
            className="answer-input"
            onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            readOnly={
              isGameOver || isChecking || showLevelIntro || showCorrectOverlay
            }
          />

          <MessageDisplay message={warning || result} type={messageType} />

          <ActionButtons
            onAnswer={checkAnswer}
            onSwap={skipQuestion}
            onGiveUp={handleGiveUp}
            disabled={
              skipUsed || isChecking || showLevelIntro || showCorrectOverlay
            }
          />
        </div>
      </div>

      {isGameOver && (
        <GameOverOverlay
          onBack={() => {
            stopAllBgm();
            onBack();
          }}
        />
      )}
    </div>
  );
}
