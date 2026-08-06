import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../../lib/api';

export default function NewTrip() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const trip = await api.post('/trips', {
        title,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      router.replace(`/trips/${trip.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>여행 제목</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="예: 제주도 여행" />

      <Text style={styles.label}>시작일 (YYYY-MM-DD, 선택)</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-08-01" />

      <Text style={styles.label}>종료일 (YYYY-MM-DD, 선택)</Text>
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2026-08-04" />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title={loading ? '생성 중...' : '생성'} onPress={handleCreate} disabled={loading || !title} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  error: { color: 'red' },
});
