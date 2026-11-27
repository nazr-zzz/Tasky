import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ERR = {
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/missing-email': 'Email wajib diisi.',
  'auth/user-not-found': 'Email belum terdaftar.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
  'auth/network-request-failed': 'Koneksi internet bermasalah.',
};

export default function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!email.trim()) return Alert.alert('Email wajib diisi');
    setBusy(true);
    try {
      await resetPassword(email);
      Alert.alert('Terkirim', 'Cek inbox atau folder Spam untuk tautan reset kata sandi.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Gagal', ERR[e.code] || `${e.code || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>Email akun</Text>
      <TextInput
        value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12 }}
      />
      <TouchableOpacity onPress={send} disabled={busy}
        style={{ marginTop: 16, backgroundColor: '#4F46E5', padding: 14, borderRadius: 12, opacity: busy ? 0.5 : 1 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
          {busy ? 'Mengirim...' : 'Kirim Tautan Reset'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}