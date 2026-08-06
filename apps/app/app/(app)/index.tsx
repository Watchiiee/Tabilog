import { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{email}로 로그인됨</Text>
      <Button title="로그아웃" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
  },
});
