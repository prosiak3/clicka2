import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FishingSession } from '../types';
import { loadSessions } from '../utils/db';
import { SessionCard } from '../components/SessionCard';
import { CatchForm } from '../components/CatchForm';

export function SessionsScreen() {
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [activeSession, setActiveSession] = useState<FishingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const loadedSessions = await loadSessions();
      setSessions(loadedSessions);
      
      const active = loadedSessions.find(s => !s.endTime);
      if (active) {
        setActiveSession(active);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Fishing Sessions</Text>
        </View>

        <View style={styles.content}>
          {!activeSession ? (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => {/* Start new session */}}
            >
              <View style={styles.startButtonIcon}>
                <Feather name="anchor" size={32} color="#fff" />
              </View>
              <Text style={styles.startButtonTitle}>Start Fishing Session</Text>
              <Text style={styles.startButtonSubtitle}>
                Track your catches and weather conditions
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeSession}>
              <SessionCard session={activeSession} isActive />
              <View style={styles.catchForm}>
                <Text style={styles.formTitle}>Add Catch</Text>
                <CatchForm onSave={() => {}} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  content: {
    padding: 16
  },
  startButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center'
  },
  startButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  startButtonTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  startButtonSubtitle: {
    color: '#bfdbfe',
    fontSize: 14
  },
  activeSession: {
    gap: 16
  },
  catchForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 16
  }
});