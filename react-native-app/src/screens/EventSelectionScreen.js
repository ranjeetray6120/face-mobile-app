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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

/**
 * Event Selection Screen for Photographers
 */
export default function EventSelectionScreen({ navigation }) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/photographer/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch events');

            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
            Alert.alert('Error', 'Failed to load events');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectEvent = (event) => {
        navigation.navigate('PhotoCapture', { eventId: event.id, eventName: event.name });
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
                <Text style={styles.title}>Select Event</Text>
                <Text style={styles.subtitle}>Choose an event to upload photos</Text>
            </View>

            <FlatList
                data={events}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadEvents} />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.eventCard}
                        onPress={() => handleSelectEvent(item)}
                    >
                        <View style={styles.eventIcon}>
                            <MaterialCommunityIcons name="calendar" size={32} color="#667eea" />
                        </View>
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventName}>{item.name}</Text>
                            <Text style={styles.eventDate}>{item.date}</Text>
                            <Text style={styles.eventLocation}>{item.location}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
    listContent: {
        padding: 15,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    eventIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    eventInfo: {
        flex: 1,
    },
    eventName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    eventDate: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    eventLocation: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
});
