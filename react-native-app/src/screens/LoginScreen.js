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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

/**
 * Login Screen for both Admins and Photographers
 */
export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn } = React.useContext(AuthContext);

    const loginMutation = useMutation({
        mutationFn: async ({ email, password }) => {
            await signIn(email, password);
        },
        onError: (error) => {
            Alert.alert('Login Failed', error.message || 'Please check your credentials');
        },
    });

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        loginMutation.mutate({ email, password });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.inner}>
                    <View style={styles.header}>
                        <MaterialCommunityIcons name="camera-iris" size={80} color="#667eea" />
                        <Text style={styles.title}>Event Photo</Text>
                        <Text style={styles.subtitle}>Face Recognition Platform</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                value={email}
                                onChangeText={setEmail}
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
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loginMutation.isPending && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.footerText}>Don't have an account? <Text style={styles.signupText}>Sign Up</Text></Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    flex: {
        flex: 1,
    },
    inner: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
    form: {
        width: '100%',
        maxWidth: 400,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#333',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        marginTop: 48,
    },
    footerText: {
        color: '#999',
        fontSize: 14,
    },
    signupText: {
        color: '#667eea',
        fontWeight: 'bold',
    },
});
