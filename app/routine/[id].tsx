import React, { useEffect, useState, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, FlatList, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useTimer } from '../../src/context/TimerContext';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

type LogSet = {
  reps: number;
  weight: number;
  completed: boolean;
};

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { time, isRunning, toggleTimer, switchMode } = useTimer();
  const { user } = useAuth();
  
  const [routine, setRoutine] = useState<any>(null);
  const [parsedExercises, setParsedExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  // States to keep track of user logs: { [index]: LogSet[] }
  const [logs, setLogs] = useState<Record<number, LogSet[]>>({});
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchRoutine();
  }, [id]);

  const fetchRoutine = async () => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setRoutine(data);
      
      let exerciseList = [];
      if (typeof data.exercises === 'string') {
        try { exerciseList = JSON.parse(data.exercises); } catch(e) {}
      } else if (Array.isArray(data.exercises)) {
        exerciseList = data.exercises;
      } else {
        exerciseList = data.exercises ? [data.exercises] : [];
      }
      
      // Fetch Catalogs for GIFs
      try {
        const names = exerciseList.map((e: any) => e.name || e.title || e.exercise || e.ejercicio);
        const { data: catalogData } = await supabase.from('exercise_catalog').select('name, video_url').in('name', names);
        if (catalogData) {
          exerciseList = exerciseList.map((ex: any) => {
             const n = ex.name || ex.title || ex.exercise || ex.ejercicio || '';
             const match = catalogData.find(c => c.name.toLowerCase() === n.toLowerCase());
             if (match?.video_url) {
                return { ...ex, video_url: match.video_url };
             }
             return ex;
          });
        }
      } catch (catErr) {
        console.error('Catalog fetch error', catErr);
      }

      setParsedExercises(exerciseList);
      
      // Init logs state (matrix design)
      const initialLogs: any = {};
      exerciseList.forEach((ex: any, idx: number) => {
        const setsCount = parseInt(ex.sets || ex.series || '1') || 1;
        const defaultReps = parseInt(ex.reps || ex.repeticiones || '0') || 0;
        const defaultWeight = parseFloat(ex.weight || ex.peso || '0') || 0;
        
        initialLogs[idx] = Array.from({ length: setsCount }).map(() => ({
          reps: defaultReps,
          weight: defaultWeight,
          completed: false
        }));
      });
      setLogs(initialLogs);

    } catch(e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo cargar la rutina');
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    setIsWorkoutActive(true);
    if (!isRunning) {
      switchMode('stopwatch');
      toggleTimer();
    }
  };

  const updateLog = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', amount: number) => {
    setLogs(prev => {
      const currentSets = [...prev[exerciseIndex]];
      let nextVal = currentSets[setIndex][field] + amount;
      if (nextVal < 0) nextVal = 0;
      currentSets[setIndex] = { ...currentSets[setIndex], [field]: nextVal };
      return { ...prev, [exerciseIndex]: currentSets };
    });
  };

  const toggleComplete = (exerciseIndex: number, setIndex: number) => {
    setLogs(prev => {
      const currentSets = [...prev[exerciseIndex]];
      currentSets[setIndex] = { ...currentSets[setIndex], completed: !currentSets[setIndex].completed };
      return { ...prev, [exerciseIndex]: currentSets };
    });
  };

  const addSet = (exerciseIndex: number) => {
    setLogs(prev => {
      const currentSets = [...prev[exerciseIndex]];
      if (currentSets.length > 0) {
        const lastSet = currentSets[currentSets.length - 1];
        currentSets.push({ ...lastSet, completed: false });
      } else {
        currentSets.push({ reps: 0, weight: 0, completed: false });
      }
      return { ...prev, [exerciseIndex]: currentSets };
    });
  };

  const saveWorkout = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Create Workout Log
      const { data: logData, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          routine_id: id,
          date: new Date().toISOString().split('T')[0],
          notes: `Tiempo total: ${pad(Math.floor(time / 6000))}:${pad(Math.floor((time % 6000) / 100))}`
        })
        .select()
        .single();
        
      if (logError) throw logError;

      // 2. Prepare Entries filtering ONLY completed sets
      const entries = parsedExercises.map((ex, index) => {
        const completedSets = logs[index]?.filter(s => s.completed).map(s => ({ reps: s.reps, weight: s.weight })) || [];
        return {
          workout_log_id: logData.id,
          exercise_name: ex.name || ex.title || ex.exercise || ex.ejercicio || `Ejercicio #${index + 1}`,
          sets_data: completedSets,
          order: index
        };
      }).filter(entry => entry.sets_data.length > 0); // Solo guardamos los ejercicios que el usuario hizo de verdad

      // 3. Insert Entries
      if (entries.length > 0) {
        const { error: entriesError } = await supabase
          .from('workout_log_entries')
          .insert(entries);
        if (entriesError) throw entriesError;
      }

      // Stop global timer
      if (isRunning) toggleTimer();

      Alert.alert('¡Excelente Trabajo! 💪', 'Tu entrenamiento ha sido registrado exitosamente.', [
        { text: 'Ir al Dashboard', onPress: () => router.push('/(tabs)') }
      ]);
    } catch(e) {
      console.error(e);
      Alert.alert('Error', 'Hubo un error al guardar tu progreso.');
    } finally {
      setSaving(false);
    }
  };

  const pad = (num: number, size: number = 2) => num.toString().padStart(size, '0');
  const timerText = `${pad(Math.floor(time / 6000))}:${pad(Math.floor((time % 6000) / 100))}`;

  // --- RENDERING PRE-WORKOUT SUMMARY ---
  const renderSummaryOverview = () => (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-3xl font-black text-cyan-400 tracking-tight leading-tight mb-2">
            {routine.title}
          </Text>
          {routine.description && (
            <Text className="text-slate-300 text-base leading-relaxed">
              {routine.description}
            </Text>
          )}
          <View className="flex-row items-center mt-4">
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text className="text-slate-400 ml-2">
              {routine.scheduled_date ? new Date(routine.scheduled_date).toLocaleDateString() : 'Sin fecha específica'}
            </Text>
          </View>
        </View>

        <Text className="text-white text-xl font-bold mb-4 flex-row items-center">
          <Ionicons name="list" size={20} color="#06b6d4"/> Ejercicios Programados
        </Text>
        <View className="pb-32">
          {parsedExercises.map((ex: any, index: number) => (
             <View key={index} className="bg-slate-800 p-4 rounded-xl mb-3 border border-slate-700 flex-row items-center">
                <Text className="text-cyan-400 font-black text-lg mr-4">{index + 1}</Text>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">{ex.name || ex.title || ex.exercise || ex.ejercicio || `Ejercicio #${index + 1}`}</Text>
                  <Text className="text-slate-400 mt-1">
                    {ex.sets || ex.series || 1} series x {ex.reps || ex.repetitions || ex.repeticiones || '-'} reps
                    {ex.weight && ex.weight !== '0' ? ` @ ${ex.weight}` : ''}
                  </Text>
                </View>
             </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Start Button */}
      <View className="absolute bottom-6 left-6 right-6">
        <TouchableOpacity 
          onPress={startWorkout}
          className="bg-cyan-500 py-4 rounded-2xl flex-row items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          <Ionicons name="flash-outline" size={24} color="#0f172a" />
          <Text className="text-slate-900 text-lg font-black ml-2 uppercase tracking-widest">Iniciar Entrenamiento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- RENDERING SWIPER ACTIVE ---
  const renderSlide = ({ item, index }: { item: any, index: number }) => {
    const exName = item.name || item.title || item.exercise || item.ejercicio || `Ejercicio #${index + 1}`;
    const suggestedReps = item.reps || item.repetitions || item.repeticiones || '-';
    const suggestedWeight = item.weight || item.peso || '-';
    
    const exerciseSets = logs[index] || [];

    return (
      <ScrollView style={{ width }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Media or Neon Image Placeholder Full Bleed */}
        {item.video_url ? (
          <View className="w-full h-56 bg-white mb-6">
             <Image source={{ uri: item.video_url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
        ) : (
          <View className="w-full h-64 bg-slate-800 items-center justify-center relative mb-6">
            <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl opacity-50" />
            <Ionicons name="barbell" size={60} color="#06b6d4" />
            <Text className="text-cyan-600 font-black tracking-widest mt-4 opacity-50 text-xs">PROXIMAMENTE VIDEO</Text>
          </View>
        )}

        {/* Padding container for text and controls */}
        <View className="px-6">
          {/* Info */}
          <Text className="text-white text-3xl font-black mb-2 text-center leading-tight">{exName}</Text>
        <Text className="text-slate-400 text-center mb-6">
          Objetivo Sugerido: <Text className="font-bold text-slate-300">{suggestedReps} Reps</Text>
          {suggestedWeight !== '-' && <Text className="font-bold text-purple-400"> @ {suggestedWeight}</Text>}
        </Text>

        {/* Detailed Interactive Log Controls Per Set */}
        <View className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
           {/* Sets Cards */}
           {exerciseSets.map((setObj, setIdx) => (
             <View key={setIdx} className={`mb-4 rounded-2xl overflow-hidden border ${setObj.completed ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-800 border-slate-700'}`}>
                
                {/* Header of the Set */}
                <View className="bg-slate-900/50 px-4 py-3 flex-row items-center justify-between border-b border-slate-700/50">
                  <View className="flex-row items-center">
                    <Ionicons name="layers" size={16} color="#94a3b8" />
                    <Text className="text-slate-300 font-black text-lg tracking-widest ml-2 uppercase">Serie {setIdx + 1}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => toggleComplete(index, setIdx)}
                    className={`px-4 py-2 rounded-xl flex-row items-center justify-center ${setObj.completed ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                    <Ionicons name="checkmark-sharp" size={20} color={setObj.completed ? "#0f172a" : "#cbd5e1"} />
                    <Text className={`font-black ml-1 ${setObj.completed ? 'text-slate-900' : 'text-slate-300'}`}>
                      {setObj.completed ? 'LISTO' : 'MARCAR'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Body: Inputs Side by Side */}
                <View className="px-2 py-4 flex-row justify-between space-x-2">
                  {/* REPS CONTROL */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-2 text-center tracking-widest">Repeticiones</Text>
                    <View className="flex-row items-center justify-between h-14 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                      <TouchableOpacity onPress={() => updateLog(index, setIdx, 'reps', -1)} className="w-10 md:w-12 h-full items-center justify-center active:bg-slate-800 bg-slate-900/50">
                        <Ionicons name="remove" size={20} color="#f8fafc" />
                      </TouchableOpacity>
                      <View className="flex-1 items-center justify-center bg-slate-900">
                        <Text className="text-white font-black text-2xl">{setObj.reps}</Text>
                      </View>
                      <TouchableOpacity onPress={() => updateLog(index, setIdx, 'reps', 1)} className="w-10 md:w-12 h-full items-center justify-center active:bg-slate-800 bg-slate-900/50">
                        <Ionicons name="add" size={20} color="#06b6d4" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* WEIGHT CONTROL */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-2 text-center tracking-widest">Peso (kg)</Text>
                    <View className="flex-row items-center justify-between h-14 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                      <TouchableOpacity onPress={() => updateLog(index, setIdx, 'weight', -2.5)} className="w-10 md:w-12 h-full items-center justify-center active:bg-slate-800 bg-slate-900/50">
                        <Ionicons name="remove" size={20} color="#f8fafc" />
                      </TouchableOpacity>
                      <View className="flex-1 items-center justify-center bg-slate-900">
                        <Text className="text-white font-black text-2xl">{setObj.weight}</Text>
                      </View>
                      <TouchableOpacity onPress={() => updateLog(index, setIdx, 'weight', 2.5)} className="w-10 md:w-12 h-full items-center justify-center active:bg-slate-800 bg-slate-900/50">
                        <Ionicons name="add" size={20} color="#a855f7" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
             </View>
           ))}

           <TouchableOpacity onPress={() => addSet(index)} className="mt-2 py-3 items-center justify-center border border-dashed border-slate-600 rounded-lg">
              <Text className="text-slate-400 font-bold">+ Añadir Serie</Text>
           </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    );
  };

  const renderSummarySlide = () => (
    <View style={{ width, paddingHorizontal: 24 }} className="justify-center items-center h-full pb-20">
      <Ionicons name="trophy" size={100} color="#eab308" className="mb-4" />
      <Text className="text-white text-4xl font-black text-center mt-6">¡Rutina Completada!</Text>
      <Text className="text-slate-400 text-center mt-2 mx-6">Guerrero, marca tus últimas series. Las que no tengan el tilde ✅ serán descartadas.</Text>

      <TouchableOpacity 
        onPress={saveWorkout}
        disabled={saving}
        className={`w-full mt-10 py-5 rounded-2xl flex-row items-center justify-center ${saving ? 'bg-slate-700' : 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'}`}
      >
        {saving ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={24} color="#0f172a" />
            <Text className="text-slate-900 text-xl font-black ml-3 uppercase tracking-widest">Finalizar y Guardar</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900 pt-10 pb-4">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header Tracker */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-slate-800 rounded-full">
          <Ionicons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
        
        {isWorkoutActive ? (
          <View className="items-center">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">{routine?.title || 'Entrenando'}</Text>
            <Text className="text-cyan-400 font-mono text-xl font-bold">{timerText}</Text>
          </View>
        ) : (
          <Text className="text-white font-bold text-lg">Resumen de Rutina</Text>
        )}
        
        <View className="w-10 flex-row justify-end">
          {isWorkoutActive && (
            <TouchableOpacity onPress={() => router.push('/timer')} className="p-2 -mr-2">
              <Ionicons name="stopwatch-outline" size={28} color="#06b6d4" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
           <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      ) : !isWorkoutActive ? (
         renderSummaryOverview()
      ) : (
        <View className="flex-1">
          {/* Progress Bar */}
          <View className="w-full bg-slate-800 h-1">
            <View 
              className="h-full bg-cyan-500" 
              style={{ width: `${((currentIndex) / parsedExercises.length) * 100}%` }} 
            />
          </View>

          <FlatList
            ref={flatListRef}
            data={[...parsedExercises, { isSummary: true }]}
            keyExtractor={(_, idx) => 'slide_' + idx}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / width);
              if (idx !== currentIndex) setCurrentIndex(idx);
            }}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => {
              if (item.isSummary) return renderSummarySlide();
              return renderSlide({ item, index });
            }}
          />

          {/* Bottom Pagination Controls */}
          {currentIndex < parsedExercises.length && (
            <View className="px-6 pb-8 pt-4 flex-row justify-between items-center bg-slate-900 border-t border-slate-800">
              <Text className="text-slate-500 font-bold">
                {currentIndex + 1} <Text className="font-normal text-slate-600">/ {parsedExercises.length}</Text>
              </Text>

              <TouchableOpacity 
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
                }}
                className="bg-cyan-500 px-6 py-3 rounded-full flex-row items-center"
              >
                <Text className="text-slate-900 font-bold mr-2 text-lg">Siguiente</Text>
                <Ionicons name="arrow-forward" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
