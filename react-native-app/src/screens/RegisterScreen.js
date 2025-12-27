import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'ADMIN' // Default to Admin as per user special request for admin registration
    });

    const registerMutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Registration failed');
            }
            return response.json();
        },
        onSuccess: () => {
            Alert.alert('Success', 'Account created successfully! Please login.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        },
        onError: (error) => {
            Alert.alert('Registration Failed', error.message);
        },
    });

    const handleRegister = () => {
        const { name, email, password, confirmPassword } = formData;
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        registerMutation.mutate(formData);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <MaterialCommunityIcons name="account-plus-outline" size={80} color="#667eea" />
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up as an Administrator</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="account-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-check-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, registerMutation.isPending && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Register</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Login</Text></Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    flex: { flex: 1 },
    scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginTop: 16 },
    subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
    form: { width: '100%', maxWidth: 400 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, height: 56 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#333', fontSize: 16 },
    button: { backgroundColor: '#667eea', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8, elevation: 3 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    linkButton: { marginTop: 24, alignItems: 'center' },
    linkText: { color: '#666', fontSize: 14 },
    linkTextBold: { color: '#667eea', fontWeight: 'bold' },
});
