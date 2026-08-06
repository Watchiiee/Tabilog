import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { api } from '../../../../lib/api';
import type { Place } from '../../../../lib/types';

type Coordinate = { latitude: number; longitude: number };

const DURATION_PER_SEGMENT_MS = 1200;

function interpolatePath(points: Coordinate[], progress: number) {
  const t = progress * (points.length - 1);
  const segmentIndex = Math.min(Math.floor(t), points.length - 2);
  const segmentT = t - segmentIndex;

  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];
  const current: Coordinate = {
    latitude: start.latitude + (end.latitude - start.latitude) * segmentT,
    longitude: start.longitude + (end.longitude - start.longitude) * segmentT,
  };

  return { current, traveled: [...points.slice(0, segmentIndex + 1), current] };
}

export default function TripReplay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView>(null);
  const [points, setPoints] = useState<Coordinate[] | null>(null);
  const [current, setCurrent] = useState<Coordinate | null>(null);
  const [traveled, setTraveled] = useState<Coordinate[]>([]);
  const [playing, setPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.get(`/trips/${id}/places`).then((places: Place[]) => {
        const withCoords = places
          .filter((p) => p.latitude != null && p.longitude != null)
          .sort((a, b) => (a.visit_order ?? 0) - (b.visit_order ?? 0))
          .map((p) => ({ latitude: p.latitude!, longitude: p.longitude! }));
        setPoints(withCoords);
      });

      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }, [id])
  );

  useEffect(() => {
    if (points && points.length >= 2) {
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: false,
      });
    }
  }, [points]);

  const handlePlay = () => {
    if (!points || points.length < 2) return;
    setPlaying(true);

    const totalDuration = (points.length - 1) * DURATION_PER_SEGMENT_MS;
    const startTime = Date.now();

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      const { current: point, traveled: path } = interpolatePath(points, progress);
      setCurrent(point);
      setTraveled(path);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        setPlaying(false);
      }
    };

    animationRef.current = requestAnimationFrame(step);
  };

  if (!points) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (points.length < 2) {
    return (
      <View style={styles.center}>
        <Text>재생할 경로가 부족해요. 위치가 있는 장소가 2개 이상 필요해요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map}>
        <Polyline coordinates={points} strokeColor="#ccc" strokeWidth={3} />
        {traveled.length > 1 && (
          <Polyline coordinates={traveled} strokeColor="#2a7de1" strokeWidth={4} />
        )}
        {points.map((point, i) => (
          <Marker key={i} coordinate={point} pinColor={i === 0 ? 'green' : 'red'} />
        ))}
        {current && <Marker coordinate={current} pinColor="blue" />}
      </MapView>
      <View style={styles.buttonBar}>
        <Button title={playing ? '재생 중...' : '재생'} onPress={handlePlay} disabled={playing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonBar: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});
