import React, { useEffect, useRef } from 'react';
import { useBLEStore } from '../store/useBLEStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

export const SensorStreamSim: React.FC = () => {
  const { isDemoMode, connectedDevice, batteryLevel, setBatteryLevel } = useBLEStore();
  const { addSensorData, currentVitals, updatePrediction, prediction } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { logs, calculateRecoveryScore, recoveryScore } = useDiarrheaStore();

  const ppgIndexRef = useRef(0);
  const vitalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ppgTimerRef = useRef<NodeJS.Timeout | null>(null);
  const predictionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Simulate PPG wave at high speed (e.g., 50ms intervals) for a smooth waveform
  useEffect(() => {
    if (!isDemoMode || !connectedDevice) {
      if (ppgTimerRef.current) clearInterval(ppgTimerRef.current);
      return;
    }

    ppgTimerRef.current = setInterval(() => {
      ppgIndexRef.current += 1;
      const i = ppgIndexRef.current;
      
      // Simulate blood volume pulse wave (combination of primary and secondary reflection peaks)
      const baseVal = 512;
      const wavePrimary = Math.sin(i * 0.15) * 120;
      const waveDichrotic = Math.sin(i * 0.3 + 1.2) * 40;
      const noise = (Math.random() - 0.5) * 5;
      const ppgValue = baseVal + wavePrimary + waveDichrotic + noise;

      const hr = currentVitals.heartRate || 72;
      const hrv = currentVitals.hrv || 60;
      const temp = currentVitals.skinTemp || 36.6;
      const motion = currentVitals.motion || 0.1;
      
      addSensorData(ppgValue, hr, hrv, temp, motion);
    }, 80);

    return () => {
      if (ppgTimerRef.current) clearInterval(ppgTimerRef.current);
    };
  }, [isDemoMode, connectedDevice, currentVitals, addSensorData]);

  // 2. Simulate slower vitals fluctuations and battery drain every 3 seconds
  useEffect(() => {
    if (!isDemoMode || !connectedDevice) {
      if (vitalTimerRef.current) clearInterval(vitalTimerRef.current);
      return;
    }

    vitalTimerRef.current = setInterval(() => {
      // Simulate minor vital fluctuations
      const hrDiff = Math.random() > 0.5 ? 1 : -1;
      const nextHR = Math.max(60, Math.min(120, (currentVitals.heartRate || 72) + (Math.random() > 0.7 ? hrDiff : 0)));
      
      const hrvDiff = Math.random() > 0.5 ? 2 : -2;
      const nextHRV = Math.max(40, Math.min(95, (currentVitals.hrv || 60) + (Math.random() > 0.8 ? hrvDiff : 0)));
      
      const tempDiff = Math.random() > 0.5 ? 0.05 : -0.05;
      const nextTemp = Math.max(35.8, Math.min(37.5, (currentVitals.skinTemp || 36.6) + (Math.random() > 0.8 ? tempDiff : 0)));
      
      const nextMotion = Math.max(0.02, Math.min(4.5, Math.random() > 0.9 ? Math.random() * 3.5 : 0.05 + Math.random() * 0.15));

      // Calculate real-time hydration metrics based on water intake and current time
      const intakeRatio = currentIntake / dailyWaterTarget;
      let hydrationScore = 95;
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      let dehydrationPercent = 5;

      const activeDiarrheaLogs = logs.filter(log => {
        const hoursAgo = (new Date().getTime() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60);
        return hoursAgo < 24; // logs within last 24h
      });

      let totalFluidLoss = activeDiarrheaLogs.reduce((sum, log) => sum + log.fluidLossEstimate, 0);

      // Hydration calculation formula
      const hydrationDepletionRate = 20; // base penalty
      const diarrheaPenalty = totalFluidLoss / 30; // 30ml fluid loss = 1% drop
      dehydrationPercent = Math.min(95, Math.max(2, Math.round(hydrationDepletionRate + diarrheaPenalty - (intakeRatio * 15))));
      hydrationScore = 100 - dehydrationPercent;

      if (hydrationScore < 70) {
        riskLevel = 'High';
      } else if (hydrationScore < 85) {
        riskLevel = 'Medium';
      } else {
        riskLevel = 'Low';
      }

      // Compile AI recommendations dynamically
      const recommendations = [];
      if (riskLevel === 'High') {
        recommendations.push('Critical: Hydration is low. Drink 500ml of electrolytes immediately.');
        recommendations.push('Warning: Diarrhea fluid loss detected. Keep emergency contacts active.');
      } else if (riskLevel === 'Medium') {
        recommendations.push('Action: Hydration dropping. Drink 300ml water in the next 30 mins.');
        recommendations.push('Insight: High motion/activity detected. Increase hydration baseline.');
      } else {
        recommendations.push('Hydration levels are optimal. Great job staying hydrated!');
        recommendations.push('Vitals are stable and within peak recovery boundaries.');
      }

      addSensorData(
        512 + Math.sin(ppgIndexRef.current * 0.15) * 120, // keep PPG within bounds
        nextHR,
        nextHRV,
        nextTemp,
        nextMotion
      );

      // Update predictions
      updatePrediction({
        dehydrationPercent,
        hydrationScore,
        riskLevel,
        confidenceScore: 92 + Math.round(Math.random() * 5),
        recommendations
      });

      // Slowly drain battery (or charge if it goes below 10% in loop to reset)
      if (batteryLevel > 5) {
        if (Math.random() > 0.98) {
          setBatteryLevel(batteryLevel - 1);
        }
      } else {
        setBatteryLevel(95); // Reset battery for demo continuity
      }

    }, 3000);

    return () => {
      if (vitalTimerRef.current) clearInterval(vitalTimerRef.current);
    };
  }, [isDemoMode, connectedDevice, currentVitals, currentIntake, dailyWaterTarget, logs, batteryLevel, setBatteryLevel, addSensorData, updatePrediction]);

  // 3. AI predictions background loop (queries Gemini every 60 seconds)
  useEffect(() => {
    if (!isDemoMode || !connectedDevice) {
      if (predictionTimerRef.current) clearInterval(predictionTimerRef.current);
      return;
    }

    const fetchPredictions = async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return;

      try {
        const promptText = `
        Analyze current biometrics to predict hydration next 24h, recovery tomorrow, and dehydration risk.
        Current metrics:
        - HR: ${currentVitals.heartRate || 72} bpm
        - HRV: ${currentVitals.hrv || 60} ms
        - Temp: ${currentVitals.skinTemp || 36.6}°C
        - Water logged today: ${currentIntake} ml vs daily goal: ${dailyWaterTarget} ml
        - Digestive Recovery Index: ${recoveryScore}%
        
        Respond only with a JSON object:
        {
          "dehydrationPercent": number,
          "hydrationScore": number,
          "riskLevel": "Low" | "Medium" | "High",
          "confidenceScore": number,
          "recommendations": string[]
        }
        Return ONLY raw JSON object.
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = JSON.parse(responseText);
            updatePrediction({
              dehydrationPercent: parsed.dehydrationPercent ?? 10,
              hydrationScore: parsed.hydrationScore ?? 90,
              riskLevel: parsed.riskLevel || 'Low',
              confidenceScore: parsed.confidenceScore || 95,
              recommendations: parsed.recommendations || []
            });
          }
        }
      } catch (e) {
        console.warn('Gemini dynamic predictions calculation failed:', e);
      }
    };

    // Run initially and then every 60s
    fetchPredictions();
    predictionTimerRef.current = setInterval(fetchPredictions, 60000);

    return () => {
      if (predictionTimerRef.current) clearInterval(predictionTimerRef.current);
    };
  }, [isDemoMode, connectedDevice, currentVitals.heartRate, currentVitals.hrv, currentVitals.skinTemp, currentIntake, dailyWaterTarget, recoveryScore]);

  // Recalculate diarrhea recovery score initially
  useEffect(() => {
    calculateRecoveryScore();
  }, [logs, calculateRecoveryScore]);

  return null;
};
