import { useCallback, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { Trip } from '../../lib/types';

export default function TripList() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api
        .get('/trips')
        .then((data) => {
          if (!cancelled) setTrips(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 여행</Text>
        <Button title="로그아웃" onPress={() => supabase.auth.signOut()} />
      </View>

      {loading && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tripRow} onTouchEnd={() => router.push(`/trips/${item.id}`)}>
            <Text style={styles.tripTitle}>{item.title}</Text>
            {item.sentiment_badge && <Text style={styles.badge}>{item.sentiment_badge}</Text>}
            {(item.start_date || item.end_date) && (
              <Text style={styles.dates}>
                {item.start_date} ~ {item.end_date}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={!loading ? <Text>아직 여행이 없어요.</Text> : null}
      />

      <Button title="새 여행" onPress={() => router.push('/trips/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  error: { color: 'red' },
  tripRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tripTitle: { fontSize: 18, fontWeight: '600' },
  badge: { color: '#666' },
  dates: { color: '#999', fontSize: 12 },
});
