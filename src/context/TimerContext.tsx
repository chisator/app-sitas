import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus, Vibration } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type TimerMode = 'stopwatch' | 'countdown';

interface TimerContextProps {
  mode: TimerMode;
  time: number; // in hundredths of a second
  isRunning: boolean;
  countdownStart: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  switchMode: (newMode: TimerMode) => void;
  adjustTime: (amount: number) => void;
}

const TimerContext = createContext<TimerContextProps>({} as TimerContextProps);

export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [time, setTime] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [countdownStart, setCountdownStart] = useState(6000); 
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Real world tracking to fix background freeze
  const lastTickTime = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  // Background state recovery
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground! Note: this is primarily for catching up.
        // It's handled gracefully in the interval anyway since we calculate Date.now() 
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      lastTickTime.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaMs = now - (lastTickTime.current || now);
        lastTickTime.current = now;
        
        // roughly convert ms to hundredths of a second (1000ms = 100 hundredths, so / 10)
        const ticks = Math.round(deltaMs / 10);

        setTime((prev) => {
          if (mode === 'countdown') {
            const nextTime = prev - ticks;
            if (nextTime <= 1) {
              clearInterval(timerRef.current!);
              setIsRunning(false);
              Vibration.vibrate([0, 1000, 500, 1000, 500, 1000]);
              return 0;
            }
            return nextTime;
          } else {
            return prev + ticks;
          }
        });
      }, 50); // Using 50ms interval is smoother and less CPU intensive
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      lastTickTime.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const scheduleNotification = async (hundredths: number) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Request permission if not granted
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    const seconds = Math.floor(hundredths / 100);
    if (seconds > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏱️ ¡Tiempo Terminado!',
          body: 'Tu descanso de Sitas Fitness finalizó. ¡De vuelta al trabajo!',
          sound: true,
        },
        trigger: {
          seconds: seconds,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
        },
      });
    }
  };

  const cancelNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const toggleTimer = () => {
    if (!isRunning) {
      // Start
      let startTime = time;
      if (mode === 'countdown' && time === 0) {
        setTime(countdownStart);
        startTime = countdownStart;
      }
      
      if (mode === 'countdown' && startTime > 0) {
        scheduleNotification(startTime);
      }
    } else {
      // Pause
      cancelNotifications();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    cancelNotifications();
    setTime(mode === 'stopwatch' ? 0 : countdownStart);
  };

  const switchMode = (newMode: TimerMode) => {
    if (newMode === mode) return;
    setIsRunning(false);
    cancelNotifications();
    setMode(newMode);
    setTime(newMode === 'stopwatch' ? 0 : countdownStart);
  };

  const adjustTime = (amount: number) => {
    let newTime = countdownStart + amount;
    if (newTime < 0) newTime = 0;
    setCountdownStart(newTime);
    setTime(newTime);
    cancelNotifications();
  };

  return (
    <TimerContext.Provider value={{
      mode, time, isRunning, countdownStart, 
      toggleTimer, resetTimer, switchMode, adjustTime
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
