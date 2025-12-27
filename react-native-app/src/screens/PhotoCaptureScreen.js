import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api';

/**
 * Photo Capture Screen for Photographers
 */
export default function PhotoCaptureScreen({ route, navigation }) {
    const { eventId, eventName } = route.params;
    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState('back');
    const [isCapturing, setIsCapturing] = useState(false);
    const [photoCount, setPhotoCount] = useState(0);

    if (!permission) {
        // Camera permissions are still loading.
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <MaterialCommunityIcons name="camera-off" size={48} color="#999" />
                    <Text style={styles.permissionText}>
                        Camera permission is required to capture photos
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={requestPermission}
                    >
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleTakePicture = async () => {
        if (!cameraRef.current || isCapturing) return;

        try {
            setIsCapturing(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            if (!photo) throw new Error('Failed to take picture');

            // Upload photo to backend
            const token = await AsyncStorage.getItem('authToken');
            const formData = new FormData();

            // Standard React Native FormData file object
            const fileData = {
                uri: photo.uri,
                name: `photo_${Date.now()}.jpg`,
                type: 'image/jpeg',
            };

            formData.append('file', fileData);

            const response = await fetch(`${API_BASE_URL}/photographer/events/${eventId}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Upload failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
                } catch (e) {
                    errorMessage = `Upload failed (Status: ${response.status})`;
                }
                throw new Error(errorMessage);
            }

            setPhotoCount(prev => prev + 1);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to capture or upload photo');
            console.error('Camera/Upload error:', error);
        } finally {
            setIsCapturing(false);
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const handleFinish = () => {
        if (photoCount === 0) {
            Alert.alert('Warning', 'Please capture at least one photo');
            return;
        }
        Alert.alert('Success', `${photoCount} photos captured and uploaded!`);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
            />

            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{eventName}</Text>
                    <View style={styles.photoCount}>
                        <Text style={styles.photoCountText}>{photoCount}</Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={toggleCameraFacing}
                    >
                        <MaterialCommunityIcons name="camera-flip" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                        onPress={handleTakePicture}
                        disabled={isCapturing}
                    >
                        {isCapturing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <MaterialCommunityIcons name="camera" size={32} color="white" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.finishButton}
                        onPress={handleFinish}
                    >
                        <MaterialCommunityIcons name="check" size={24} color="white" />
                        <Text style={styles.finishButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
    permissionText: { fontSize: 16, color: '#333', marginVertical: 20, textAlign: 'center', lineHeight: 22 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    backButton: { padding: 8 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
    photoCount: { backgroundColor: '#667eea', minWidth: 40, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    photoCountText: { color: 'white', fontWeight: '700', fontSize: 14 },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    captureButtonDisabled: { opacity: 0.6 },
    secondaryButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    finishButton: { flexDirection: 'row', backgroundColor: '#4caf50', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, alignItems: 'center', minWidth: 90 },
    finishButtonText: { color: 'white', fontWeight: '700', marginLeft: 8 },
    button: { backgroundColor: '#667eea', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, elevation: 3 },
    buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
