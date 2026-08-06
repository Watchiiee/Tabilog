import { useState } from 'react';
import { View, TextInput, Button, Text, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../../../lib/api';
import { uploadPhoto } from '../../../../../lib/cloudinary';

function parseExifDateTime(value?: string): string | null {
  // EXIF DateTimeOriginal looks like "2026:07:31 14:11:15"
  if (!value) return null;
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2})$/);
  if (!match) return null;
  const [, year, month, day, time] = match;
  return `${year}-${month}-${day}T${time}`;
}

export default function NewPlace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [visitedAt, setVisitedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('사진 접근 권한이 필요해요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      exif: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setVisitedAt(parseExifDateTime(asset.exif?.DateTimeOriginal));
  };

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const place = await api.post(`/trips/${id}/places`, {
        name,
        memo: memo || null,
        rating: rating ? Number(rating) : null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        visited_at: visitedAt,
      });

      if (photoUri) {
        const photoUrl = await uploadPhoto(photoUri);
        await api.post(`/places/${place.id}/photos`, { photo_url: photoUrl });
      }

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

      <Button title="사진 선택" onPress={handlePickPhoto} />
      {photoUri && <Image source={{ uri: photoUri }} style={styles.thumbnail} />}
      {photoUri && (
        <Text style={styles.hint}>
          {visitedAt
            ? `촬영 시각: ${visitedAt.replace('T', ' ')}`
            : '촬영 시각 정보가 없어요.'}{' '}
          위치 정보는 사진에서 지워지는 경우가 많아 아래에 직접 입력해주세요.
        </Text>
      )}

      <Text style={styles.label}>위도 (선택)</Text>
      <TextInput
        style={styles.input}
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numbers-and-punctuation"
        placeholder="예: 33.4587"
      />

      <Text style={styles.label}>경도 (선택)</Text>
      <TextInput
        style={styles.input}
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numbers-and-punctuation"
        placeholder="예: 126.9425"
      />

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
  thumbnail: { width: '100%', height: 200, borderRadius: 8 },
  hint: { color: '#666', fontSize: 12 },
});
