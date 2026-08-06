import { useCallback, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { api } from '../../../../lib/api';
import type { Photo, Place, Trip } from '../../../../lib/types';

type Coordinate = { latitude: number; longitude: number };

function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function durationDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

export default function TripStats() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewShotRef = useRef<ViewShot>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [placeCount, setPlaceCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);

      (async () => {
        try {
          const [tripData, places]: [Trip, Place[]] = await Promise.all([
            api.get(`/trips/${id}`),
            api.get(`/trips/${id}/places`),
          ]);
          if (cancelled) return;

          const photosByPlace: Photo[][] = await Promise.all(
            places.map((p) => api.get(`/places/${p.id}/photos`))
          );
          if (cancelled) return;

          const located = places
            .filter((p) => p.latitude != null && p.longitude != null)
            .sort((a, b) => (a.visit_order ?? 0) - (b.visit_order ?? 0))
            .map((p) => ({ latitude: p.latitude!, longitude: p.longitude! }));

          let distance: number | null = null;
          if (located.length >= 2) {
            distance = 0;
            for (let i = 0; i < located.length - 1; i++) {
              distance += haversineKm(located[i], located[i + 1]);
            }
            await api.patch(`/trips/${id}`, { total_distance: distance });
          }

          setTrip(tripData);
          setPlaceCount(places.length);
          setPhotoCount(photosByPlace.reduce((sum, photos) => sum + photos.length, 0));
          setDistanceKm(distance);
        } catch (e: any) {
          if (!cancelled) setError(e.message);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [id])
  );

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) await Sharing.shareAsync(uri);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const days = durationDays(trip.start_date, trip.end_date);

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={styles.card}>
        <Text style={styles.title}>{trip.title}</Text>
        {trip.sentiment_badge && <Text style={styles.badge}>{trip.sentiment_badge}</Text>}

        <View style={styles.statRow}>
          <Text style={styles.statValue}>{placeCount}</Text>
          <Text style={styles.statLabel}>방문 장소</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{photoCount}</Text>
          <Text style={styles.statLabel}>사진</Text>
        </View>
        {distanceKm != null && (
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{distanceKm.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>이동 거리</Text>
          </View>
        )}
        {days != null && (
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{days}일</Text>
            <Text style={styles.statLabel}>여행 기간</Text>
          </View>
        )}
      </ViewShot>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="이미지로 공유" onPress={handleShare} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  badge: { color: '#666', fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontSize: 18, fontWeight: '600' },
  statLabel: { color: '#666' },
  error: { color: 'red' },
});
