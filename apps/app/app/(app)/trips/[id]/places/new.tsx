import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../../lib/api';

export default function NewPlace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post(`/trips/${id}/places`, {
        name,
        memo: memo || null,
        rating: rating ? Number(rating) : null,
      });
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>장소 이름</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="예: 성산일출봉" />

      <Text style={styles.label}>메모 (선택)</Text>
      <TextInput style={styles.input} value={memo} onChangeText={setMemo} placeholder="느낀 점을 적어보세요" />

      <Text style={styles.label}>평점 1~5 (선택)</Text>
      <TextInput style={styles.input} value={rating} onChangeText={setRating} keyboardType="number-pad" />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title={loading ? '추가 중...' : '추가'} onPress={handleCreate} disabled={loading || !name} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  error: { color: 'red' },
});
