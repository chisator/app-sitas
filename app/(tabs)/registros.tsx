import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutHistory, WorkoutLog } from '../../src/hooks/useWorkoutHistory';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function RegistrosScreen() {
  const { logs, loading, trainedDates, refresh } = useWorkoutHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  // Generate last 21 days for the calendar ring
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoString = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isoString,
        dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNum: d.getDate()
      });
    }
    return days;
  }, []);

  const flatListRef = useRef<FlatList>(null);

  // Auto scroll to today when loaded
  useEffect(() => {
    if (calendarDays.length > 0 && flatListRef.current) {
        setTimeout(() => {
           flatListRef.current?.scrollToEnd({ animated: true });
        }, 300);
    }
  }, [calendarDays]);

  const renderCalendarDay = ({ item }: { item: any }) => {
    const hasTrained = trainedDates.has(item.isoString);
    const isToday = item.isoString === new Date().toISOString().split('T')[0];

    return (
      <View className="items-center justify-center mr-3 w-14">
        <Text className={`text-xs uppercase mb-2 ${isToday ? 'text-cyan-400 font-black' : 'text-slate-500 font-bold'}`}>{item.dayName}</Text>
        <View className={`w-12 h-12 rounded-full items-center justify-center border-2 ${hasTrained ? 'border-cyan-500 bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'border-slate-800 bg-slate-900'} ${isToday ? 'border-dashed' : 'border-solid'}`}>
           {hasTrained ? (
             <Ionicons name="flame" size={20} color="#06b6d4" />
           ) : (
             <Text className="text-slate-500 font-bold text-lg">{item.dayNum}</Text>
           )}
        </View>
      </View>
    );
  };

  const renderLogCard = ({ item }: { item: WorkoutLog }) => {
    const isExpanded = expandedId === item.id;
    const dateObj = new Date(item.created_at || item.date);
    const timeFormatted = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dayFormatted = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => toggleAccordion(item.id)}
        className="bg-slate-800 rounded-3xl mb-5 border border-slate-700 overflow-hidden"
      >
        {/* Card Header (Summary) */}
        <View className="p-5 flex-row">
           <View className="bg-slate-700/50 w-16 h-16 rounded-2xl items-center justify-center mr-4">
              <Text className="text-white font-black text-xl">{dayFormatted.split(' ')[0]}</Text>
              <Text className="text-cyan-400 text-xs font-bold uppercase">{dayFormatted.split(' ')[1]}</Text>
           </View>

           <View className="flex-1 justify-center">
             <Text className="text-white font-black text-xl leading-tight mb-1">{item.routineTitle}</Text>
             <Text className="text-slate-400 text-sm">{timeFormatted} • {item.entries.length} Ejercicios</Text>

             {/* Badges Flow */}
             <View className="flex-row items-center mt-3 space-x-2">
                {item.duration ? (
                  <View className="flex-row items-center bg-slate-900 px-2 py-1 rounded-md border border-slate-700 mr-2">
                    <Ionicons name="timer" size={14} color="#06b6d4" />
                    <Text className="text-xs font-bold text-slate-300 ml-1">{item.duration}</Text>
                  </View>
                ) : null}
                <View className="flex-row items-center bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
                  <Ionicons name="layers" size={14} color="#a855f7" />
                  <Text className="text-xs font-bold text-slate-300 ml-1">{item.totalSets} Series</Text>
                </View>
             </View>
           </View>
        </View>

        {/* Card Accordion Body (Details) */}
        {isExpanded && (
          <View className="px-5 pb-5 pt-2 bg-slate-900/50">
             <View className="h-[1px] w-full bg-slate-700 mb-4" />
             {item.entries.map((entry, idx) => (
                <View key={entry.id} className="mb-4">
                   <Text className="text-cyan-400 font-bold text-base mb-2">{(idx + 1)}. {entry.exercise_name}</Text>
                   
                   <View className="bg-slate-800 rounded-xl p-3 border border-slate-700/50">
                     {entry.sets_data.length === 0 ? (
                        <Text className="text-slate-500 italic text-sm text-center">No se loguearon series.</Text>
                     ) : (
                       entry.sets_data.map((set: any, sIdx: number) => (
                         <View key={sIdx} className="flex-row items-center justify-between py-1 border-b border-slate-700/30 last:border-0">
                            <Text className="text-slate-400 text-sm w-16">Set {sIdx + 1}</Text>
                            <Text className="text-white font-bold text-center flex-1">{set.reps} Reps</Text>
                            <Text className="text-white font-bold text-right flex-1">{set.weight} kg</Text>
                         </View>
                       ))
                     )}
                   </View>
                </View>
             ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 pt-10">
      <View className="px-6 pt-4 pb-2">
         <Text className="text-3xl font-black text-cyan-400 mb-1">Tu Actividad</Text>
         <Text className="text-slate-400">Celebra cada entrenamiento guardado.</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
           <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      ) : (
        <View className="flex-1">
          {/* Top Calendar Heatmap */}
          <View className="h-28 border-b border-slate-800 mb-4">
             <FlatList
                ref={flatListRef}
                data={calendarDays}
                keyExtractor={(item) => item.isoString}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center' }}
                renderItem={renderCalendarDay}
             />
          </View>

          {/* Timeline Feed */}
          {logs.length === 0 ? (
             <View className="flex-1 items-center justify-center p-6">
                <Ionicons name="folder-open-outline" size={64} color="#334155" />
                <Text className="text-slate-400 mt-4 text-center">Todavía no tienes registros de entrenamientos.</Text>
             </View>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              renderItem={renderLogCard}
              refreshing={loading}
              onRefresh={refresh}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
