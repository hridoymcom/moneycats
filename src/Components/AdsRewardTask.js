import React, { useState, useEffect, useCallback } from "react";
import { Play, CheckCircle } from "lucide-react";
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/firestore";
import { useUser } from "../context/userContext";
import CountdownCircle from "./CountdownCircle";

const MAX_DAILY_ADS = 5;
const COOLDOWN_PERIOD = 60 * 60 * 1000*2; // 1 hour in milliseconds
const STORAGE_KEYS = {
  DAILY_COUNT: "adReward_dailyCount",
  LAST_AD_DATE: "adReward_lastAdDate",
  LAST_CLAIM_TIME: "adReward_lastClaimTime",
};

const getTimeUntilMidnight = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow - now;
};

const AdRewardComponent = () => {
  const { id, setBalance, setTaskPoints, completedTasks, setCompletedTasks } =
    useUser();

  const [adWatched, setAdWatched] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [congrats, setCongrats] = useState(false);
  const [dailyAdCount, setDailyAdCount] = useState(0);
  const [showClaimButton, setShowClaimButton] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isScriptInitialized, setIsScriptInitialized] = useState(false);

  const task = {
    bonus: 1000,
  };

  const generateTaskId = () => `adTask_${new Date().getTime()}`;
  const [taskId, setTaskId] = useState(generateTaskId());

  const checkAndResetDaily = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const storedDate = localStorage.getItem(STORAGE_KEYS.LAST_AD_DATE);

    if (storedDate !== today) {
      localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, "0");
      localStorage.setItem(STORAGE_KEYS.LAST_AD_DATE, today);
      return 0;
    }

    return parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_COUNT) || "0");
  }, []);

  const calculateCooldown = useCallback(() => {
    if(dailyAdCount >= 5){
    const now = Date.now();
    const lastClaimTime = parseInt(
      localStorage.getItem(STORAGE_KEYS.LAST_CLAIM_TIME) || "0"
    );
    const timeSinceLastClaim = now - lastClaimTime;

    if (timeSinceLastClaim < COOLDOWN_PERIOD) {
      return COOLDOWN_PERIOD - timeSinceLastClaim;
    }}
    return 0;
  }, [dailyAdCount]);

  useEffect(() => {
    const currentCount = checkAndResetDaily();
    setDailyAdCount(currentCount);

    const timeUntilMidnight = getTimeUntilMidnight();
    const midnightTimer = setTimeout(() => {
      setDailyAdCount(0);
      localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, "0");
      localStorage.setItem(
        STORAGE_KEYS.LAST_AD_DATE,
        new Date().toISOString().slice(0, 10)
      );
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, [checkAndResetDaily]);

  useEffect(() => {
    const updateCooldown = () => {
      const remaining = calculateCooldown();
      setCooldownRemaining(remaining);
    };

    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    const savedShowClaim = localStorage.getItem("SHOW_CLAIM_BUTTON") === "true";
    setShowClaimButton(savedShowClaim);

    return () => clearInterval(timer);
  }, [calculateCooldown]);

  const loadAdScript = () => {
    return new Promise((resolve, reject) => {
      if (isScriptLoaded && isScriptInitialized) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "//whephiwums.com/vignette.min.js";
      script.dataset.zone = "8978173";
      script.dataset.sdk = "show_8978173";

      script.onload = () => {
        setIsScriptLoaded(true);
        // Wait for the ad SDK to be initialized
        const checkInterval = setInterval(() => {
          if (window.show_8978173) {
            clearInterval(checkInterval);
            setIsScriptInitialized(true);
            resolve();
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Ad initialization timeout"));
        }, 5000);
      };

      script.onerror = () => {
        reject(new Error("Failed to load ad script"));
      };

      document.body.appendChild(script);
    });
  };

  const canWatchAd = () => {
    const currentCount = checkAndResetDaily();
    const currentCooldown = calculateCooldown();
    return currentCount < MAX_DAILY_ADS && currentCooldown === 0;
  };

  const handleAdCompletion = () => {
    if (!canWatchAd()) {
      const remaining = calculateCooldown();
      if (remaining > 0) {
        alert(
          `Please wait ${formatTimeRemaining(
            remaining
          )} before watching another ad.`
        );
      } else {
        alert("You've reached your daily limit of ads.");
      }
      return;
    }

    setAdWatched(true);
    setShowClaimButton(true); // Show claim button immediately after ad completion
    localStorage.setItem("SHOW_CLAIM_BUTTON", "true"); // ✅ Save state in localStorage
  };

  const showAd = async () => {
    if (!isScriptLoaded || !isScriptInitialized) {
      try {
        await loadAdScript();
      } catch (error) {
        console.error("Error loading ad system:", error);
        alert("Failed to load ad system. Please try again.");
        return;
      }
    }

    if (!canWatchAd()) {
      const remaining = calculateCooldown();
      if (remaining > 0) {
        alert(
          `Please wait ${formatTimeRemaining(
            remaining
          )} before watching another ad.`
        );
      } else {
        alert("You've reached your daily limit of ads.");
      }
      return;
    }

    try {
      await window.show_8978173();
      handleAdCompletion();
    } catch (error) {
      console.error("Error showing ad:", error);
      alert("Error showing ad. Please try again.");
    }
  };

  const claimReward = async () => {
    if (!canWatchAd()) return;
    
    setClaiming(true);
    try {
      const currentTime = Date.now();
      const userDocRef = doc(db, "telegramUsers", id);
      
      await updateDoc(userDocRef, {
        balance: increment(task.bonus),
        dailyTasksCompleted: arrayUnion(taskId),
        taskPoints: increment(task.bonus),
      });
      
      const newCount = dailyAdCount + 1;
      localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, newCount.toString());
      localStorage.setItem(
        STORAGE_KEYS.LAST_CLAIM_TIME,
        currentTime.toString()
      );

      setBalance((prev) => prev + task.bonus);
      setCompletedTasks((prev) => [...prev, taskId]);
      setTaskPoints((prev) => prev + task.bonus);
      setDailyAdCount(newCount);

      setAdWatched(false);
      setCongrats(true);
      setTimeout(() => setCongrats(false), 4000);
      setTaskId(generateTaskId());
      setShowClaimButton(false);
      localStorage.removeItem("SHOW_CLAIM_BUTTON"); // ✅ Remove after claiming
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Error claiming reward. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  const formatTimeRemaining = (ms) => {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  return (
    <div className="w-full rounded-[16px] py-3 flex items-center justify-between space-x-1">
      <div className="w-fit pr-2">
        <div className="flex items-center justify-center bg-[#1f2023] h-[45px] w-[45px] rounded-full p-1">
          <Play className="w-[20px] text-white" />
        </div>
      </div>

      <div className={`flex flex-1 h-full flex-col justify-center relative`}>
        <div
          className={`${
            adWatched ? "w-[90%]" : "w-full"
          } flex flex-col justify-between h-full space-y-1`}
        >
          <h1 className="text-[15px] line-clamp-1 font-medium text-white">
            Watch Ads
          </h1>
          <span className="flex text-secondary items-center w-fit text-[15px]">
            +{task.bonus} 💰MCATS
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Ads Watched: {dailyAdCount}/{MAX_DAILY_ADS}
          {/* {cooldownRemaining > 0 &&
            ` (Cooldown: ${formatTimeRemaining(cooldownRemaining)})`} */}
        </p>
      </div>
      <div className="w-fit flex items-center space-x-1 justify-end flex-wrap text-[14px] relative">
  {completedTasks.includes(taskId) ? (
    <CheckCircle className="text-green-500" size={24} />
  ) : dailyAdCount >= MAX_DAILY_ADS && cooldownRemaining > 0 ? (
    <CountdownCircle
      remainingTime={cooldownRemaining}
      totalTime={COOLDOWN_PERIOD}
    />
  ) : showClaimButton ? (
    <button
      onClick={claimReward}
      disabled={claiming || !canWatchAd()}
      className="w-[78px] py-[10px] text-center font-semibold rounded-[30px] px-3 bg-[#1f2023] hover:bg-[#36373c] text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {claiming ? "Claiming..." : "Claim"}
    </button>
  ) : (
    <button
      onClick={showAd}
      disabled={!canWatchAd()}
      className="w-[78px] py-[10px] text-center font-semibold rounded-[30px] px-3 bg-[#1f2023] hover:bg-[#36373c] text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Start
    </button>
  )}
</div>


      {congrats && (
        <div className="w-full absolute top-[50px] left-0 right-0 flex justify-center z-50 pointer-events-none select-none">
          <img src="/congrats.gif" alt="congrats" className="w-[80%]" />
        </div>
      )}
    </div>
  );
};

export default AdRewardComponent;
