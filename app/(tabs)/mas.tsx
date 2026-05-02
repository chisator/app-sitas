import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function MasScreen() {
  const { user, role } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ workouts: 0, classes: 0 });
  const [loading, setLoading] = useState(true);

  // Time logic for "next 5th of the month"
  const getExpiryDate = () => {
    const d = new Date();
    let year = d.getFullYear();
    let month = d.getMonth() + 1; // Next month

    if (month > 11) {
      month = 0;
      year++;
    }

    const date = new Date(year, month, 5);
    const monthsEs = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    return `5 de ${monthsEs[date.getMonth()]}`;
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (profileErr) throw profileErr;
      setProfile(profileData);

      // 2. Fetch Monthly Stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Workouts this month
      const { count: workoutCount } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      // Reservations this month (attended/upcoming)
      const { count: classCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        workouts: workoutCount || 0,
        classes: classCount || 0
      });

    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Salir', 
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 pt-10">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-4">
         <View className="flex-row items-center justify-between mb-8">
            <Text className="text-3xl font-black text-white">Perfil</Text>
            <TouchableOpacity onPress={fetchData} className="p-2 bg-slate-800 rounded-full">
               <Ionicons name="refresh" size={18} color="#06b6d4" />
            </TouchableOpacity>
         </View>

         {loading ? (
             <ActivityIndicator size="large" color="#06b6d4" className="mt-10" />
         ) : (
           <>
             {/* Header Perfil */}
             <View className="flex-row items-center bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl mb-8 relative overflow-hidden">
                <View className="absolute top-0 right-0 p-2">
                   <View className="bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
                      <Text className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">{role === 'athlete' ? 'Atleta Sitas' : role}</Text>
                   </View>
                </View>
                <View className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-full items-center justify-center border-2 border-cyan-400/50 mr-4 shadow-lg shadow-cyan-500/20">
                   <Text className="text-white text-2xl font-black">
                     {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                   </Text>
                </View>
                <View className="flex-1">
                   <Text className="text-white text-xl font-bold">{profile?.full_name || 'Miembro Sitas'}</Text>
                   <Text className="text-slate-400 text-sm">{user?.email}</Text>
                </View>
             </View>

             {/* RESUMEN MENSUAL - Badges */}
             <View className="flex-row justify-between mb-8">
                <View className="flex-1 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/50 mr-2 items-center">
                   <View className="bg-orange-500/10 p-2 rounded-full mb-2">
                      <Ionicons name="flame" size={20} color="#f97316" />
                   </View>
                   <Text className="text-white text-xl font-black">{stats.workouts}</Text>
                   <Text className="text-slate-500 text-xs font-bold uppercase tracking-tight">Rutinas / Mes</Text>
                </View>
                <View className="flex-1 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/50 ml-2 items-center">
                   <View className="bg-cyan-500/10 p-2 rounded-full mb-2">
                      <Ionicons name="calendar" size={20} color="#06b6d4" />
                   </View>
                   <Text className="text-white text-xl font-black">{stats.classes}</Text>
                   <Text className="text-slate-500 text-xs font-bold uppercase tracking-tight">Reservas / Mes</Text>
                </View>
             </View>

             {/* Billetera Premium */}
             <Text className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-3 ml-2">Mi Billetera Sitas</Text>
             <View className="bg-slate-800 rounded-3xl p-6 border border-slate-700 mb-2 relative overflow-hidden shadow-2xl">
                {/* Visual Glassmorphism effects */}
                <View className="absolute -top-10 -right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                <View className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
                
                <View className="flex-row items-center justify-between mb-6 z-10">
                  <View className="flex-row items-center">
                    <Ionicons name="wallet-outline" size={24} color="#a855f7" />
                    <Text className="text-white font-bold text-lg ml-2">Tickets Disponibles</Text>
                  </View>
                  <Text className="text-purple-400 font-black text-xs uppercase tracking-tighter">Gold Plan</Text>
                </View>

                <View className="z-10 mt-2">
                   {/* Render credits dynamically */}
                   {(() => {
                      const resCredits = profile?.reservation_credits;
                      if (resCredits && typeof resCredits === 'object' && !Array.isArray(resCredits)) {
                         return Object.entries(resCredits).map(([key, val]: [string, any], i) => (
                           <View key={key} className={`flex-row justify-between items-center py-3 ${i > 0 ? 'border-t border-slate-700/50' : ''}`}>
                              <View className="flex-row items-center">
                                 <View className="w-2 h-2 rounded-full bg-cyan-400 mr-3" />
                                 <Text className="text-slate-200 font-bold text-base">{key}</Text>
                              </View>
                              <View className="bg-slate-900 px-4 py-1 rounded-full border border-slate-700 shadow-sm">
                                 <Text className="text-white font-black text-lg">{String(val)}</Text>
                              </View>
                           </View>
                         ));
                      }
                      return (
                        <View className="flex-row justify-between items-center py-2">
                           <Text className="text-slate-300 font-bold text-lg">Clases Disponibles</Text>
                           <View className="bg-slate-900 px-6 py-2 rounded-2xl border border-slate-700">
                              <Text className="text-white text-3xl font-black">{String(resCredits ?? 0)}</Text>
                           </View>
                        </View>
                      );
                   })()}
                </View>

                {/* Separator if needed for Activity Credits */}
                <View className="h-[1px] w-full bg-slate-700/50 my-4 z-10" />

                <View className="z-10">
                   {(() => {
                      const actCredits = profile?.activity_credits;
                      if (actCredits && typeof actCredits === 'object' && !Array.isArray(actCredits)) {
                         return Object.entries(actCredits).map(([key, val]: [string, any], i) => (
                           <View key={key} className={`flex-row justify-between items-center py-3 ${i > 0 ? 'border-t border-slate-700/50' : ''}`}>
                              <View className="flex-row items-center">
                                 <View className="w-2 h-2 rounded-full bg-purple-400 mr-3" />
                                 <Text className="text-slate-200 font-bold text-base">{key}</Text>
                              </View>
                              <View className="bg-slate-900 px-4 py-1 rounded-full border border-slate-700">
                                 <Text className="text-white font-black text-lg">{String(val)}</Text>
                              </View>
                           </View>
                         ));
                      }
                      return (
                        <View className="flex-row justify-between items-center py-2">
                           <Text className="text-slate-300 font-bold text-lg">Pases Musculación</Text>
                           <View className="bg-slate-900 px-6 py-2 rounded-2xl border border-slate-700">
                              <Text className="text-white text-3xl font-black">{String(actCredits ?? 0)}</Text>
                           </View>
                        </View>
                      );
                   })()}
                </View>

                {/* Expiry Banner */}
                <View className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 z-10 mt-4">
                   <View className="flex-row items-center mb-1">
                      <Ionicons name="information-circle-outline" size={16} color="#94a3b8" />
                      <Text className="text-slate-300 font-bold text-sm ml-2">Vencimiento Próximo</Text>
                   </View>
                   <Text className="text-slate-500 text-xs leading-relaxed">
                     Tus créditos expiran el <Text className="text-cyan-400 font-bold">{getExpiryDate()}</Text>. Recuerda que puedes gastarlos hasta el día 5 del mes entrante.
                   </Text>
                </View>
             </View>

             <View className="h-[1px] w-full bg-slate-800 my-8" />

             {/* Section: CLUB MENU */}
             <Text className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-3 ml-2">Club & Soporte</Text>
             <View className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden mb-12 shadow-xl">
                {[
                  { icon: 'help-buoy-outline', label: 'Contacto y Soporte', color: '#06b6d4', extra: 'WhatsApp' },
                  { icon: 'document-text-outline', label: 'Reglamento Interno', color: '#94a3b8' },
                  { icon: 'notifications-outline', label: 'Notificaciones', color: '#94a3b8' },
                ].map((item, i) => (
                  <TouchableOpacity 
                    key={i} 
                    className={`flex-row items-center justify-between p-5 ${i < 2 ? 'border-b border-slate-700/50' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <View className="bg-slate-900 w-10 h-10 rounded-full items-center justify-center mr-3">
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <Text className="text-white font-bold text-lg">{item.label}</Text>
                    </View>
                    {item.extra ? (
                      <Text className="text-cyan-500 font-bold text-xs">{item.extra}</Text>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#475569" />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity 
                  onPress={handleSignOut}
                  className="flex-row items-center p-5 bg-red-500/5"
                >
                  <View className="bg-red-500/20 w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                  </View>
                  <Text className="text-red-400 font-bold text-lg">Cerrar Sesión</Text>
                </TouchableOpacity>
             </View>
           </>
         )}
      </ScrollView>
    </SafeAreaView>
  );
}
