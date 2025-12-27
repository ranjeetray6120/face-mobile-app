import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api';

/**
 * Create Event Screen for Admins
 */
export default function CreateEventScreen({ navigation }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dateString, setDateString] = useState(new Date().toISOString().split('T')[0]);
    const [location, setLocation] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    const createEventMutation = useMutation({
        mutationFn: async (eventData) => {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create event');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            Alert.alert('Success', 'Event created successfully');
            navigation.goBack();
        },
        onError: (error) => {
            Alert.alert('Error', error.message);
        },
    });

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowPicker(Platform.OS === 'ios');
        setDate(currentDate);

        // Format to YYYY-MM-DD
        const formattedDate = currentDate.toISOString().split('T')[0];
        setDateString(formattedDate);
    };

    const handleCreate = () => {
        if (!name || !dateString || !location) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        createEventMutation.mutate({
            name,
            date: dateString,
            location,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.flex}>
                <View style={styles.form}>
                    <Text style={styles.label}>Event Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Smith Wedding"
                        value={name}
                        onChangeText={setName}
                        editable={!createEventMutation.isPending}
                    />

                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowPicker(true)}
                        disabled={createEventMutation.isPending}
                    >
                        <MaterialCommunityIcons name="calendar" size={24} color="#667eea" />
                        <Text style={styles.dateText}>{dateString}</Text>
                    </TouchableOpacity>

                    {showPicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}

                    <Text style={styles.label}>Location</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Grand Hall"
                        value={location}
                        onChangeText={setLocation}
                        editable={!createEventMutation.isPending}
                    />

                    <TouchableOpacity
                        style={[styles.button, createEventMutation.isPending && styles.buttonDisabled]}
                        onPress={handleCreate}
                        disabled={createEventMutation.isPending}
                    >
                        {createEventMutation.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Create Event</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    flex: { flex: 1 },
    form: { padding: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#f5f5f5', borderRadius: 8, height: 50, paddingHorizontal: 16, fontSize: 16 },
    dateSelector: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        height: 50,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    button: { backgroundColor: '#667eea', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
