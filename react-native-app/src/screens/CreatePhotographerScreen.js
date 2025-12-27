import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api';

/**
 * Create Photographer Screen for Admins
 */
export default function CreatePhotographerScreen({ navigation }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const createPhotographerMutation = useMutation({
        mutationFn: async (userData) => {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/photographers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create photographer');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPhotographers'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            Alert.alert('Success', 'Photographer created successfully');
            navigation.goBack();
        },
        onError: (error) => {
            Alert.alert('Error', error.message);
        },
    });

    const handleCreate = () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        createPhotographerMutation.mutate({
            name,
            email,
            password,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.flex}>
                <View style={styles.form}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. John Doe"
                        value={name}
                        onChangeText={setName}
                        editable={!createPhotographerMutation.isPending}
                    />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. john@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!createPhotographerMutation.isPending}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="At least 6 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!createPhotographerMutation.isPending}
                    />

                    <TouchableOpacity
                        style={[styles.button, createPhotographerMutation.isPending && styles.buttonDisabled]}
                        onPress={handleCreate}
                        disabled={createPhotographerMutation.isPending}
                    >
                        {createPhotographerMutation.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Register Photographer</Text>
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
    form: { padding: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    button: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
