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
 * Event Management Screen for Admins
 */
export default function EventManagementScreen({ navigation }) {
    const { data: events, isLoading, refetch } = useQuery({
        queryKey: ['adminEvents'],
        queryFn: async () => {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch events');
            return response.json();
        },
    });

    const [selectedEventId, setSelectedEventId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEventName, setSelectedEventName] = useState('');

    const openMenu = (event) => {
        setSelectedEventId(event.id);
        setSelectedEventName(event.name);
        setModalVisible(true);
    };

    const closeMenu = () => {
        setModalVisible(false);
        setSelectedEventId(null);
        setSelectedEventName('');
    };

    const handleAction = (action, screen) => {
        closeMenu();
        if (selectedEventId) {
            navigation.navigate(screen, { eventId: selectedEventId, eventName: selectedEventName });
        }
    };

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
                <Text style={styles.title}>Manage Events</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreateEvent')}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={events}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                renderItem={({ item }) => (
                    <View style={styles.eventCard}>
                        <TouchableOpacity
                            style={styles.eventInfo}
                            onPress={() => navigation.navigate('EventPhotos', { eventId: item.id, eventName: item.name })}
                        >
                            <Text style={styles.eventName}>{item.name}</Text>
                            <Text style={styles.eventDate}>{item.date} • {item.location}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => openMenu(item)}
                        >
                            <MaterialCommunityIcons name="dots-vertical" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />

            {modalVisible && (
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeMenu}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Actions for {selectedEventName}</Text>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('photos', 'EventPhotos')}>
                            <MaterialCommunityIcons name="image-multiple" size={24} color="#667eea" />
                            <Text style={styles.menuText}>View Photos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('capture', 'PhotoCapture')}>
                            <MaterialCommunityIcons name="camera" size={24} color="#667eea" />
                            <Text style={styles.menuText}>Capture Photos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('qr', 'EventQrCode')}>
                            <MaterialCommunityIcons name="qrcode" size={24} color="#667eea" />
                            <Text style={styles.menuText}>Show QR Code</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('face', 'FaceSearch')}>
                            <MaterialCommunityIcons name="face-recognition" size={24} color="#667eea" />
                            <Text style={styles.menuText}>Face Search</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('assign', 'AssignPhotographer')}>
                            <MaterialCommunityIcons name="account-plus" size={24} color="#667eea" />
                            <Text style={styles.menuText}>Assign Photographer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            closeMenu();
                            Alert.alert(
                                "Delete Event",
                                `Are you sure you want to delete "${selectedEventName}"? This will delete all photos and data permanently.`,
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Delete",
                                        style: "destructive",
                                        onPress: async () => {
                                            try {
                                                const token = await AsyncStorage.getItem('authToken');
                                                await fetch(`${API_BASE_URL}/admin/events/${selectedEventId}`, {
                                                    method: 'DELETE',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                refetch(); // Refresh the list
                                            } catch (error) {
                                                console.error(error);
                                                Alert.alert("Error", "Failed to delete event");
                                            }
                                        }
                                    }
                                ]
                            );
                        }}>
                            <MaterialCommunityIcons name="delete" size={24} color="red" />
                            <Text style={[styles.menuText, { color: 'red' }]}>Delete Event</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, styles.cancelButton]} onPress={closeMenu}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    listContent: { padding: 16 },
    eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 },
    eventInfo: { flex: 1 },
    eventName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    eventDate: { fontSize: 13, color: '#666', marginTop: 4 },
    menuButton: { padding: 8 },
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    menuText: { fontSize: 16, color: '#333', marginLeft: 15 },
    cancelButton: { borderBottomWidth: 0, justifyContent: 'center', marginTop: 10 },
    cancelText: { color: 'red', fontSize: 16, fontWeight: 'bold' }
});
