import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      // The auth observer in _layout or index will redirect. Or we can force:
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-12">
          <Text className="text-4xl font-extrabold text-white text-center tracking-tight">SITAS</Text>
          <Text className="text-xl font-bold text-cyan-400 text-center tracking-widest mt-1">FITNESS CENTER</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-slate-400 mb-2 font-medium ml-1">Correo Electrónico</Text>
            <TextInput
              onChangeText={(text) => setEmail(text)}
              value={email}
              placeholder="tu@email.com"
              placeholderTextColor="#64748b"
              autoCapitalize={'none'}
              keyboardType="email-address"
              className="bg-slate-800 text-white rounded-xl px-4 py-4 border border-slate-700 font-medium"
            />
          </View>

          <View>
            <Text className="text-slate-400 mb-2 font-medium ml-1">Contraseña</Text>
            <TextInput
              onChangeText={(text) => setPassword(text)}
              value={password}
              secureTextEntry={true}
              placeholder="********"
              placeholderTextColor="#64748b"
              autoCapitalize={'none'}
              className="bg-slate-800 text-white rounded-xl px-4 py-4 border border-slate-700 font-medium"
            />
          </View>
        </View>

        <TouchableOpacity className="mt-4 pb-2">
          <Text className="text-cyan-400 font-semibold text-right">¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={signInWithEmail} 
          disabled={loading}
          className="bg-cyan-500 rounded-xl py-4 items-center mt-6 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:bg-cyan-600"
        >
          <Text className="text-slate-900 font-bold text-lg">{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
