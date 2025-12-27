import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';

import { API_BASE_URL } from '../config/api';

/**
 * Photographer Dashboard Screen
 */
export default function PhotographerDashboardScreen({ navigation }) {
    const { signOut } = React.useContext(AuthContext);
    const [userName, setUserName] = useState('');

    const { data: stats, isLoading: statsLoading, refetch } = useQuery({
        queryKey: ['photographerStats'],
        queryFn: async () => {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/photographer/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const name = await AsyncStorage.getItem('userName');
        setUserName(name || 'Photographer');
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: signOut },
        ]);
    };

    if (statsLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.flex}
                refreshControl={
                    <RefreshControl refreshing={statsLoading} onRefresh={refetch} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome back!</Text>
                        <Text style={styles.userName}>{userName}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={24} color="#f44336" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="calendar-check" size={32} color="#667eea" />
                        <Text style={styles.statValue}>{stats?.eventsAvailable || 0}</Text>
                        <Text style={styles.statLabel}>Available Events</Text>
                    </View>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="image-multiple" size={32} color="#4caf50" />
                        <Text style={styles.statValue}>{stats?.photosUploaded || 0}</Text>
                        <Text style={styles.statLabel}>Photos Uploaded</Text>
                    </View>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="cloud-upload" size={32} color="#ff9800" />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Events')}
                    >
                        <View style={styles.actionIcon}>
                            <MaterialCommunityIcons name="calendar" size={24} color="white" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Select Event</Text>
                            <Text style={styles.actionDescription}>Choose an event to upload photos</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Upload')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#4caf50' }]}>
                            <MaterialCommunityIcons name="cloud-upload" size={24} color="white" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Upload Photos</Text>
                            <Text style={styles.actionDescription}>Upload photos from your device</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tips</Text>
                    <View style={styles.tipCard}>
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#ff9800" />
                        <Text style={styles.tipText}>Ensure good lighting for better face recognition.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    flex: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    greeting: { fontSize: 14, color: '#999' },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    logoutButton: { padding: 8 },
    statsContainer: { flexDirection: 'row', padding: 12, gap: 12 },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#333', marginVertical: 4 },
    statLabel: { fontSize: 10, color: '#999', textAlign: 'center' },
    section: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    actionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionContent: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    actionDescription: { fontSize: 12, color: '#666' },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    tipText: { marginLeft: 12, color: '#666', fontSize: 13, flex: 1 },
});
