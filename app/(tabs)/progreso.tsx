import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStats } from '../../src/hooks/useProgressStats';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function ProgresoScreen() {
  const { stats, loading, frequentExercises, allExercises, refresh } = useProgressStats();
  
  // States
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [mode, setMode] = useState<'Fuerza' | 'Volumen'>('Fuerza');
  const [timeFilter, setTimeFilter] = useState<'30D' | '1A' | 'Todo'>('Todo');

  // Initialization Hack for selecting default exercise
  if (!selectedExercise && frequentExercises.length > 0) {
    setSelectedExercise(frequentExercises[0]);
  } else if (!selectedExercise && allExercises.length > 0) {
    setSelectedExercise(allExercises[0]);
  }

  // Derived Data for UI
  const currentStat = stats[selectedExercise];

  const chartData = useMemo(() => {
    if (!currentStat) return null;

    let dataSource = mode === 'Fuerza' ? currentStat.strengthData : currentStat.volumeData;

    // Filter by Time (simplistic mapping based on string date limits)
    if (timeFilter !== 'Todo') {
      const msLimit = timeFilter === '30D' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
      const thresholdDate = new Date(Date.now() - msLimit).toISOString().split('T')[0];
      dataSource = dataSource.filter(d => d.date >= thresholdDate);
    }

    if (dataSource.length === 0) return null;

    // We only take max 10 points for readability on small screens
    const step = Math.ceil(dataSource.length / 10);
    const sampledData = dataSource.filter((_, idx) => idx % step === 0 || idx === dataSource.length - 1);
    
    // Label logic (format standard YYYY-MM-DD -> DD MMM)
    const labels = sampledData.map(d => {
      const parts = d.date.split('-');
      // E.g. "04 Abr" - Hardcoding month mapping for Spanish 
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]} ${months[mIdx]}`;
    });

    const values = sampledData.map(d => d.value);

    return {
      labels: labels,
      datasets: [ { data: values } ]
    };
  }, [currentStat, mode, timeFilter]);

  // Insight UI Logic
  const getInsightCard = () => {
    if (!currentStat || !chartData) return null;
    const growth = currentStat.growthPercentage;
    const isPositive = growth > 0;
    
    // For Volume, negative is not necessarily "bad" if they just started, but we format universally
    return (
      <View className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex-row items-center mb-6 shadow-xl">
        <View className={`w-12 h-12 rounded-full items-center justify-center ${isPositive ? 'bg-cyan-500/20' : 'bg-red-500/20'}`}>
           <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={24} color={isPositive ? '#06b6d4' : '#ef4444'} />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-white font-bold text-lg">Insight Inteligente</Text>
          <Text className="text-slate-400 text-sm">
            Tus gráficas revelan un {isPositive ? 'aumento' : 'ajuste'} del <Text className={isPositive ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>{Math.abs(growth).toFixed(1)}%</Text> en {selectedExercise}.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 pt-10">
      <View className="px-6 pt-4 pb-2">
         <Text className="text-3xl font-black text-cyan-400 mb-2">Progreso</Text>
         <Text className="text-slate-400">Visualiza cómo has mejorado en tus ejercicios con métodos científicos.</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
           <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      ) : allExercises.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
           <Ionicons name="barbell-outline" size={64} color="#334155" />
           <Text className="text-slate-400 mt-4 text-center">Todavía no hay datos de entrenamientos registrados.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          
          {/* Quick Pills (Recent/Freq) */}
          <View className="mt-4 px-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {frequentExercises.map(ex => (
                <TouchableOpacity 
                  key={ex} 
                  onPress={() => setSelectedExercise(ex)}
                  className={`px-4 py-2 rounded-full mr-2 border ${selectedExercise === ex ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-700 bg-slate-800'}`}
                >
                  <Text className={`font-bold ${selectedExercise === ex ? 'text-cyan-400' : 'text-slate-400'}`}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="px-6">
            {/* The Dropdown selector for all exercises as fallback */}
            <View className="bg-slate-800 border border-slate-700 rounded-xl mb-6 overflow-hidden">
               <Picker
                 selectedValue={selectedExercise}
                 onValueChange={(itemValue) => setSelectedExercise(itemValue)}
                 style={{ color: 'white' }}
                 dropdownIconColor="#06b6d4"
               >
                 {allExercises.map(ex => (
                   <Picker.Item key={ex} label={ex} value={ex} />
                 ))}
               </Picker>
            </View>

            {/* INSIGHT CARD */}
            {getInsightCard()}

            {/* Mode & Time Filters */}
            <View className="bg-slate-800 p-4 rounded-3xl border border-slate-700 mb-6">
               <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white font-bold text-xl flex-1">{selectedExercise}</Text>
                  
                  {/* Mode Toggles */}
                  <View className="flex-row bg-slate-900 rounded-xl p-1 border border-slate-700">
                    {['Fuerza', 'Volumen'].map(m => (
                      <TouchableOpacity 
                        key={m} 
                        onPress={() => setMode(m as any)}
                        className={`px-4 py-1.5 rounded-lg ${mode === m ? 'bg-slate-700' : 'transparent'}`}
                      >
                         <Text className={`font-bold text-xs uppercase tracking-widest ${mode === m ? 'text-white' : 'text-slate-500'}`}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
               </View>

               {/* Time Filters */}
               <View className="flex-row items-center justify-end mb-6 space-x-2">
                 {['30D', '1A', 'Todo'].map(t => (
                   <TouchableOpacity 
                     key={t}
                     onPress={() => setTimeFilter(t as any)}
                     className={`px-3 py-1 ml-2 rounded-full border ${timeFilter === t ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600 bg-transparent'}`}
                   >
                     <Text className={`text-xs font-bold ${timeFilter === t ? 'text-purple-400' : 'text-slate-500'}`}>{t}</Text>
                   </TouchableOpacity>
                 ))}
               </View>

               {/* ACTUAL CHART */}
               {chartData ? (
                 <View className="items-center -ml-4">
                   <Text className="text-slate-400 font-bold mb-2 flex-row items-center">
                     <Ionicons name={mode === 'Fuerza' ? 'barbell' : 'analytics'} size={14} color={mode === 'Fuerza' ? '#a855f7' : '#06b6d4'} />
                     {' '}{mode === 'Fuerza' ? '1RM Estimado (Brzycki)' : 'Volumen Total Levantado'}
                   </Text>
                   <LineChart
                      data={chartData}
                      width={width - 50} // from react-native
                      height={240}
                      yAxisLabel=""
                      yAxisSuffix="kg"
                      withOuterLines={false}
                      withVerticalLines={false}
                      chartConfig={{
                        backgroundColor: "#1e293b",
                        backgroundGradientFrom: "#1e293b",
                        backgroundGradientTo: "#1e293b",
                        decimalPlaces: 1,
                        color: (opacity = 1) => mode === 'Fuerza' ? `rgba(168, 85, 247, ${opacity})` : `rgba(6, 182, 212, ${opacity})`, // Purple vs Cyan
                        labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`, // slate-400
                        style: {
                          borderRadius: 16
                        },
                        propsForDots: {
                          r: "5",
                          strokeWidth: "2",
                          stroke: "#0f172a"
                        }
                      }}
                      bezier
                      style={{
                        marginVertical: 8,
                        borderRadius: 16
                      }}
                    />
                 </View>
               ) : (
                 <View className="h-48 items-center justify-center">
                    <Ionicons name="stats-chart" size={40} color="#334155" />
                    <Text className="text-slate-500 mt-2">Pocos datos para graficar en este periodo</Text>
                 </View>
               )}
            </View>

            <TouchableOpacity 
              onPress={refresh}
              className="py-4 items-center justify-center border border-slate-700 bg-slate-800 rounded-2xl flex-row shadow-xl mb-10"
            >
               <Ionicons name="sync" size={20} color="#64748b" />
               <Text className="text-slate-400 font-bold ml-2">Sincronizar Datos</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
