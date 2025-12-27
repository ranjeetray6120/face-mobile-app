import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '../config/api';

/**
 * Photographer Management Screen for Admins
 */
export default function PhotographerManagementScreen({ navigation }) {
    const { data: photographers, isLoading, refetch } = useQuery({
        queryKey: ['adminPhotographers'],
        queryFn: async () => {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/photographers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch photographers');
            return response.json();
        },
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Photographers</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreatePhotographer')}
                >
                    <MaterialCommunityIcons name="account-plus" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={photographers}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.avatar}>
                            <MaterialCommunityIcons name="account" size={24} color="#fff" />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.email}>{item.email}</Text>
                        </View>
                        <View style={styles.status}>
                            <View style={[styles.indicator, { backgroundColor: item.active ? '#4caf50' : '#ccc' }]} />
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 12, color: '#666' },
    indicator: { width: 10, height: 10, borderRadius: 5 },
});
