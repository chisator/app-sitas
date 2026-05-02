import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTimer } from '../src/context/TimerContext';

export default function TimerScreen() {
  const router = useRouter();
  const { mode, time, isRunning, countdownStart, switchMode, resetTimer, toggleTimer, adjustTime } = useTimer();

  // Format time (mm:ss:S)
  const pad = (num: number, size: number = 2) => num.toString().padStart(size, '0');
  
  const minutes = pad(Math.floor(time / 6000));
  const seconds = pad(Math.floor((time % 6000) / 100));
  // In context we use ticks of 10ms but convert roughly to hundredths
  const milliseconds = pad(time % 100);

  return (
    <SafeAreaView className="flex-1 bg-slate-900 border-t-4 border-cyan-500">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-6 mb-8">
        <Text className="text-white text-2xl font-bold">Timer Pro</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-slate-800 p-2 rounded-full"
        >
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Mode Selectors */}
      <View className="flex-row justify-center space-x-4 mb-20">
        <TouchableOpacity 
          onPress={() => switchMode('stopwatch')}
          className={`px-6 py-2 rounded-full border ${mode === 'stopwatch' ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-700 bg-slate-800'}`}
        >
          <Text className={`font-bold ${mode === 'stopwatch' ? 'text-cyan-400' : 'text-slate-400'}`}>Cronómetro</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => switchMode('countdown')}
          className={`px-6 py-2 rounded-full border ${mode === 'countdown' ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-700 bg-slate-800'}`}
        >
          <Text className={`font-bold ${mode === 'countdown' ? 'text-cyan-400' : 'text-slate-400'}`}>Cuenta Regresiva</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Display */}
      <View className="items-center justify-center flex-1">
        <View className="relative">
          <Text 
            className="text-white font-black text-center"
            style={{ 
              fontSize: 90, 
              lineHeight: 110,
              includeFontPadding: false,
              textShadowColor: isRunning ? 'rgba(6, 182, 212, 0.4)' : 'transparent', 
              textShadowOffset: {width: 0, height: 0}, 
              textShadowRadius: 30 
            }}
          >
            {minutes}:{seconds}<Text className="text-slate-500 text-6xl" style={{ lineHeight: 110, includeFontPadding: false }}>.{milliseconds}</Text>
          </Text>
        </View>

        {mode === 'countdown' && !isRunning && (
          <View className="flex-row mt-6 space-x-2">
            <TouchableOpacity 
              onPress={() => adjustTime(-6000)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              <Text className="text-slate-300 font-bold">-1m</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => adjustTime(6000)}
              className="px-3 py-2 rounded-lg bg-cyan-900/40 border border-cyan-700"
            >
              <Text className="text-cyan-400 font-bold">+1m</Text>
            </TouchableOpacity>

            <View className="w-4" />

            <TouchableOpacity 
              onPress={() => adjustTime(-1000)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              <Text className="text-slate-300 font-bold">-10s</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => adjustTime(1000)}
              className="px-3 py-2 rounded-lg bg-cyan-900/40 border border-cyan-700"
            >
              <Text className="text-cyan-400 font-bold">+10s</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      <View className="flex-row justify-center items-center pb-20 space-x-8">
        <TouchableOpacity 
          onPress={resetTimer}
          className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 items-center justify-center mr-6"
        >
          <Ionicons name="refresh" size={28} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={toggleTimer}
          activeOpacity={0.8}
          className={`w-24 h-24 rounded-full items-center justify-center shadow-lg  ${isRunning ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]' : 'bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]'}`}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={40} color={isRunning ? '#fff' : '#0f172a'} style={{ marginLeft: isRunning ? 0 : 5 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
