import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { API_BASE_URL } from '../config/api';

/**
 * Assign Photographer Screen for Admins
 */
export default function AssignPhotographerScreen({ route, navigation }) {
    const { eventId, eventName } = route.params;
    const queryClient = useQueryClient();

    const { data: photographers, isLoading: photographersLoading } = useQuery({
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

    const assignMutation = useMutation({
        mutationFn: async (photographerId) => {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/photographers/${photographerId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to assign photographer');
            }
        },
        onSuccess: () => {
            Alert.alert('Success', 'Photographer assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            navigation.goBack();
        },
        onError: (error) => {
            Alert.alert('Error', error.message);
        },
    });

    if (photographersLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.subtitle}>Assigning to:</Text>
                <Text style={styles.title}>{eventName}</Text>
            </View>

            <FlatList
                data={photographers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.avatar}>
                            <MaterialCommunityIcons name="account" size={24} color="#fff" />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.email}>{item.email}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.assignBtn, assignMutation.isPending && styles.assignBtnDisabled]}
                            onPress={() => assignMutation.mutate(item.id)}
                            disabled={assignMutation.isPending}
                        >
                            {assignMutation.isPending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.assignBtnText}>Assign</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No photographers found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#667eea' },
    listContent: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 12, color: '#666' },
    assignBtn: { backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 70, alignItems: 'center' },
    assignBtnDisabled: { opacity: 0.7 },
    assignBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', fontSize: 16 },
});
