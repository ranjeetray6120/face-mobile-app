import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config/api';

export default function EventQrCodeScreen({ route, navigation }) {
    const { eventId, eventName } = route.params;
    const [qrImage, setQrImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchQrCode();
    }, []);

    const fetchQrCode = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/qr`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to load QR code');

            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrImage(reader.result);
                setIsLoading(false);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error fetching QR code:', error);
            Alert.alert('Error', 'Failed to load QR code');
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Event QR Code</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.eventName}>{eventName}</Text>
                <Text style={styles.instruction}>Scan this QR code to access photos</Text>

                <View style={styles.qrContainer}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#667eea" />
                    ) : qrImage ? (
                        <Image source={{ uri: qrImage }} style={styles.qrImage} />
                    ) : (
                        <View style={styles.errorContainer}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#f44336" />
                            <Text style={styles.errorText}>Failed to load QR Code</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchQrCode}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.infoCard}>
                    <MaterialCommunityIcons name="information-outline" size={24} color="#667eea" />
                    <Text style={styles.infoText}>
                        Guests can scan this code with their phone camera to instantly access the event gallery and find their photos using face recognition.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { padding: 8 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { flex: 1, alignItems: 'center', padding: 24 },
    eventName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
    instruction: { fontSize: 16, color: '#666', marginBottom: 32 },
    qrContainer: {
        width: 300,
        height: 300,
        backgroundColor: '#fff',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 32,
        padding: 20,
    },
    qrImage: { width: '100%', height: '100%' },
    errorContainer: { alignItems: 'center' },
    errorText: { color: '#666', marginTop: 8, marginBottom: 16 },
    retryButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#667eea', borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: 'bold' },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    infoText: { flex: 1, marginLeft: 12, color: '#1565c0', lineHeight: 20 },
});
