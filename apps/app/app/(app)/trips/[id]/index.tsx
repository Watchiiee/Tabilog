import { useCallback, useState } from 'react';
import { View, Text, Button, FlatList, Image, Share, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../lib/api';
import type { Photo, Place, Trip } from '../../../../lib/types';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripData, placesData] = await Promise.all([
        api.get(`/trips/${id}`),
        api.get(`/trips/${id}/places`),
      ]);
      setTrip(tripData);
      setPlaces(placesData);

      const photosByPlace = await Promise.all(
        placesData.map((place: Place) => api.get(`/places/${place.id}/photos`))
      );
      const firstPhotos: Record<string, string> = {};
      placesData.forEach((place: Place, i: number) => {
        const photos: Photo[] = photosByPlace[i];
        if (photos[0]) firstPhotos[place.id] = photos[0].photo_url;
      });
      setThumbnails(firstPhotos);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setError(null);
    try {
      const updated = await api.post(`/trips/${id}/summary`);
      setTrip(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleShare = () => {
    if (!trip) return;
    const lines = [trip.title];
    if (trip.sentiment_badge) lines.push(`🏷️ ${trip.sentiment_badge}`);
    if (trip.start_date || trip.end_date) lines.push(`${trip.start_date} ~ ${trip.end_date}`);
    if (trip.solar_summary) lines.push('', trip.solar_summary);
    Share.share({ message: lines.join('\n') });
  };

  if (loading || !trip) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{trip.title}</Text>
      {(trip.start_date || trip.end_date) && (
        <Text style={styles.dates}>
          {trip.start_date} ~ {trip.end_date}
        </Text>
      )}

      {trip.sentiment_badge && <Text style={styles.badge}>{trip.sentiment_badge}</Text>}
      {trip.solar_summary && <Text style={styles.summary}>{trip.solar_summary}</Text>}

      {error && <Text style={styles.error}>{error}</Text>}

      {!trip.solar_summary && (
        <Button
          title={summaryLoading ? '생성 중...' : 'Solar 요약 생성'}
          onPress={handleGenerateSummary}
          disabled={summaryLoading}
        />
      )}

      <Text style={styles.sectionTitle}>장소</Text>
      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.placeRow}>
            {thumbnails[item.id] && (
              <Image source={{ uri: thumbnails[item.id] }} style={styles.placeThumbnail} />
            )}
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{item.name}</Text>
              {item.memo && <Text style={styles.placeMemo}>{item.memo}</Text>}
              {item.rating && <Text style={styles.placeRating}>평점 {item.rating}</Text>}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>아직 장소가 없어요.</Text>}
      />

      <Button title="장소 추가" onPress={() => router.push(`/trips/${id}/places/new`)} />
      <Button title="경로 재생" onPress={() => router.push(`/trips/${id}/replay`)} />
      <Button title="공유" onPress={handleShare} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  dates: { color: '#999', fontSize: 12 },
  badge: { color: '#666', fontWeight: '600' },
  summary: { fontSize: 14, lineHeight: 20 },
  error: { color: 'red' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  placeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeThumbnail: { width: 56, height: 56, borderRadius: 8 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '600' },
  placeMemo: { color: '#666' },
  placeRating: { color: '#999', fontSize: 12 },
});
