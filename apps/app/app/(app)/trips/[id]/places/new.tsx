import { useState } from 'react';
import { View, TextInput, Button, Text, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../../../../../lib/api';
import { uploadPhoto } from '../../../../../lib/cloudinary';

const SEOUL = { latitude: 37.5663, longitude: 126.9779 };

function parseExifDateTime(value?: string): string | null {
  // EXIF DateTimeOriginal looks like "2026:07:31 14:11:15"
  if (!value) return null;
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2})$/);
  if (!match) return null;
  const [, year, month, day, time] = match;
  return `${year}-${month}-${day}T${time}`;
}

type Coordinate = { latitude: number; longitude: number };

export default function NewPlace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState('');
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [visitedAt, setVisitedAt] = useState('');
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
    setVisitedAt(parseExifDateTime(asset.exif?.DateTimeOriginal) ?? '');
  };

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const place = await api.post(`/trips/${id}/places`, {
        name,
        memo: memo || null,
        rating: rating ? Number(rating) : null,
        latitude: coordinate?.latitude ?? null,
        longitude: coordinate?.longitude ?? null,
        visited_at: visitedAt || null,
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

  if (showMap) {
    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: coordinate?.latitude ?? SEOUL.latitude,
            longitude: coordinate?.longitude ?? SEOUL.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) => setCoordinate(e.nativeEvent.coordinate)}
        >
          {coordinate && <Marker coordinate={coordinate} />}
        </MapView>
        <View style={styles.mapButtonBar}>
          <Button title="확인" onPress={() => setShowMap(false)} disabled={!coordinate} />
        </View>
      </View>
    );
  }

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

      <Text style={styles.label}>방문 시각 (YYYY-MM-DDTHH:MM:SS, 선택)</Text>
      <TextInput
        style={styles.input}
        value={visitedAt}
        onChangeText={setVisitedAt}
        placeholder="2026-08-01T14:11:15"
        autoCapitalize="none"
      />

      <Text style={styles.label}>위치 (선택)</Text>
      <Button title="지도에서 위치 선택" onPress={() => setShowMap(true)} />
      {coordinate && (
        <Text style={styles.hint}>
          선택한 위치: {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
        </Text>
      )}

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
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapButtonBar: { padding: 16 },
});
