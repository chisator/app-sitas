import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';

const COLORS = [
  'bg-teal-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-orange-600',
  'bg-cyan-700',
];

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupedClasses, setGroupedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [routines, setRoutines] = useState<any[]>([]);
  const [showClasses, setShowClasses] = useState(true);

  // fetch every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchClasses();
      fetchRoutines();
    }, [user])
  );

  const fetchRoutines = async () => {
    if (!user) return;
    try {
      // Intentamos recuperar rutinas asignadas al usuario mediante la tabla de asignaciones
      const { data, error } = await supabase
        .from('routine_user_assignments')
        .select(`
          routines (*)
        `)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      const mappedRoutines = (data || [])
         .map((assignment: any) => assignment.routines)
         .filter((r: any) => r !== null);
         
      setRoutines(mappedRoutines);
    } catch(e) {
      console.error(e);
    }
  };

  const fetchClasses = async () => {
    try {
      const today = new Date();
      // start at beginning of today
      today.setHours(0, 0, 0, 0); 
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from('gym_classes')
        .select(`
          *,
          reservations:reservations ( id, user_id )
        `)
        .gte('start_time', today.toISOString())
        .lt('start_time', endOfWeek.toISOString())
        .eq('is_cancelled', false)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      const groups = processClasses(data || []);
      setGroupedClasses(groups);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const processClasses = (classes: any[]) => {
    const rawGroups: Record<string, Record<string, any>> = {};

    classes.forEach((c) => {
      const title = c.title || 'Clase';
      const dateObj = new Date(c.start_time);
      // Generate a string that is sorting friendly but we will use human readable names
      const dateKey = `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      const dayName = DAYS_ES[dateObj.getDay()];
      
      if (!rawGroups[title]) rawGroups[title] = {};
      if (!rawGroups[title][dateKey]) rawGroups[title][dateKey] = { dayName, classes: [] };
      
      rawGroups[title][dateKey].classes.push(c);
    });

    // Convert object to array for flatlist
    const finalArray = Object.keys(rawGroups).map((title, index) => {
      const days = Object.keys(rawGroups[title])
        .sort() // sort by date string yyyy-mm-dd
        .map(dateKey => rawGroups[title][dateKey]);
        
      return {
        title,
        colorClass: COLORS[index % COLORS.length],
        days
      };
    });

    return finalArray;
  };

  const findUserReservation = (classItem: any) => {
    if (!user || !classItem.reservations) return null;
    return classItem.reservations.find((r: any) => r.user_id === user.id);
  };

  const handleClassAction = async (classItem: any) => {
    if (!user || actionLoading) return;
    const now = new Date();
    const classTime = new Date(classItem.start_time);
    if (classTime < now) return; // Cannot modify past classes

    const existingReservation = findUserReservation(classItem);
    const totalReservations = classItem.reservations?.length || 0;
    const isFull = totalReservations >= (classItem.capacity || 20);

    try {
      setActionLoading(true);
      if (existingReservation) {
        // Desanotar
        Alert.alert('Desanotarse', '¿Seguro que quieres cancelar tu reserva?', [
          { text: 'Cancelar', style: 'cancel', onPress: () => setActionLoading(false) },
          { text: 'Confirmar', style: 'destructive', onPress: async () => {
              const { error } = await supabase.from('reservations').delete().eq('id', existingReservation.id);
              setActionLoading(false);
              if (error) Alert.alert('Error', error.message);
              else fetchClasses();
            }
          }
        ]);
        return;
      } else {
        // Anotar
        if (isFull) {
          Alert.alert('Clase Completa', 'No hay más cupos disponibles.');
          setActionLoading(false);
          return;
        }

        const { error } = await supabase.from('reservations').insert({
          user_id: user.id,
          class_id: classItem.id
        });
        
        if (error) {
           Alert.alert('Error', error.message);
        } else {
           fetchClasses();
        }
      }
    } catch(e) {
      console.error(e);
    } finally {
      if(!existingReservation) setActionLoading(false);
    }
  };

  const renderTimeBadge = (classItem: any) => {
    const time = new Date(classItem.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isPast = new Date(classItem.start_time) < new Date();
    const userReservation = findUserReservation(classItem);
    const isFull = (classItem.reservations?.length || 0) >= (classItem.capacity || 20);

    let mainStyle = "bg-white/20 border border-transparent";
    let textStyle = "text-white opacity-90";
    let showWarning = false;

    if (isPast) {
      mainStyle = "bg-black/30 opacity-50"; 
      textStyle = "text-white/60 line-through";
    } else if (userReservation) {
      // Anotado! 
      mainStyle = "bg-slate-900 border border-slate-700 shadow";
      textStyle = "text-cyan-400 font-bold";
    } else if (isFull) {
      // Lleno
      mainStyle = "bg-black/40";
      textStyle = "text-red-300 opacity-80";
      showWarning = true;
    }

    return (
      <TouchableOpacity 
        key={classItem.id}
        activeOpacity={isPast ? 1 : 0.7}
        onPress={() => !isPast && handleClassAction(classItem)}
        className={`px-3 py-2 rounded-xl flex-row items-center mr-2 mb-2 ${mainStyle}`}
      >
        {!userReservation && !isPast && !showWarning && <Ionicons name="time-outline" size={14} color="white" />}
        {userReservation && <Ionicons name="checkmark-circle" size={14} color="#22d3ee" />} 
        {showWarning && <Ionicons name="warning" size={14} color="#fca5a5" />}
        <Text className={`ml-2 text-sm ${textStyle}`}>{time}</Text>
      </TouchableOpacity>
    );
  };

  const renderDisciplineCard = ({ item }: { item: any }) => {
    return (
      <View className={`${item.colorClass} rounded-3xl p-6 mr-4 w-72 h-80 shadow-lg relative overflow-hidden`}>
        {/* Dekor */}
        <View className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        
        <Text className="text-white text-3xl font-extrabold mb-4 tracking-tight">{item.title}</Text>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          <View className="pb-4">
            {item.days.map((dayGroup: any, idx: number) => (
              <View key={idx} className="mb-4">
                <View className="bg-white/20 self-start px-4 py-1 rounded-full mb-3">
                  <Text className="text-white font-bold">{dayGroup.dayName}</Text>
                </View>
                
                <View className="flex-row flex-wrap">
                  {dayGroup.classes.map((c: any) => renderTimeBadge(c))}
                </View>
                
                {/* Separator line */}
                {idx < item.days.length - 1 && <View className="h-[1px] bg-white/20 mt-2 w-full" />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 pt-10">
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-3xl font-extrabold mb-1">Bienvenido</Text>
          <Text className="text-slate-400 text-base">Tus rutinas y progreso</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/mas')}
          className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center border border-slate-700 shadow-lg"
        >
          <Ionicons name="person" size={24} color="#06b6d4" />
        </TouchableOpacity>
      </View>

      <View className="mt-4 pl-6">
        <View className="flex-row items-center justify-between mb-2 pr-6">
          <Text className="text-white text-xl font-bold">Clases Semanales</Text>
          <TouchableOpacity onPress={() => setShowClasses(!showClasses)} className="p-2">
            <Ionicons name={showClasses ? "chevron-up" : "chevron-down"} size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        
        {showClasses && (
          <View className="h-80">
            {loading ? (
              <ActivityIndicator size="large" color="#06b6d4" />
            ) : (
              <FlatList
                data={groupedClasses}
                keyExtractor={(item, idx) => item.title + idx}
                renderItem={renderDisciplineCard}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24, paddingBottom: 24 }}
                ListEmptyComponent={
                  <Text className="text-slate-500 italic">No hay clases programadas esta semana.</Text>
                }
              />
            )}
          </View>
        )}
      </View>

      <View className="px-6 mt-12 flex-1">
        <Text className="text-white text-xl font-bold mb-4">Próximas Rutinas</Text>
        {routines.length === 0 ? (
          <View className="bg-slate-800 p-6 rounded-2xl items-center border border-slate-700">
            <Text className="text-slate-400 text-center">No tienes rutinas próximas programadas</Text>
          </View>
        ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View className="bg-slate-800 p-5 rounded-2xl mb-4 border border-slate-700 shadow-sm flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-cyan-400 font-extrabold text-lg mb-1">{item.title}</Text>
                  <Text className="text-slate-300 text-sm mb-2" numberOfLines={2}>
                    {item.description || 'Entrenamiento del día'}
                  </Text>
                  <View className="flex-row items-center space-x-2">
                     <View className="bg-slate-700 px-2 py-1 rounded-md">
                       <Text className="text-slate-300 text-xs font-bold">
                         {item.exercises ? (Array.isArray(item.exercises) ? item.exercises.length : Object.keys(item.exercises).length) : 0} Ejercicios
                       </Text>
                     </View>
                     {item.scheduled_date && (
                        <Text className="text-slate-400 text-xs">
                          Para: {new Date(item.scheduled_date).toLocaleDateString()}
                        </Text>
                     )}
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => router.push(`/routine/${item.id}` as any)}
                  className="bg-cyan-500/20 p-3 rounded-full ml-4"
                >
                  <Ionicons name="play" size={20} color="#06b6d4" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity 
        onPress={() => router.push('/timer')}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 bg-cyan-400 w-16 h-16 rounded-full items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] z-50">
        <Ionicons name="timer-outline" size={32} color="#0f172a" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
