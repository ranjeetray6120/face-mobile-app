import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

/**
 * Photo Upload Screen for Photographers
 */
export default function PhotoUploadScreen({ route }) {
    const { eventId } = route?.params || {};
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const handlePickImages = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultiple: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedPhotos([...selectedPhotos, ...result.assets]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick images');
        }
    };

    const handleUpload = async () => {
        if (!eventId) {
            Alert.alert('Error', 'Please select an event first from the Events tab');
            return;
        }

        if (selectedPhotos.length === 0) {
            Alert.alert('Warning', 'Please select at least one photo');
            return;
        }

        try {
            setIsUploading(true);
            const token = await AsyncStorage.getItem('authToken');

            for (const photo of selectedPhotos) {
                const formData = new FormData();
                formData.append('file', {
                    uri: photo.uri,
                    name: photo.fileName || `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                });

                const response = await fetch(`${API_BASE_URL}/photographer/events/${eventId}/photos`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    body: formData,
                });

                if (!response.ok) throw new Error('Upload failed');
            }

            Alert.alert('Success', `${selectedPhotos.length} photos uploaded!`);
            setSelectedPhotos([]);
        } catch (error) {
            Alert.alert('Error', 'Failed to upload photos');
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = (index) => {
        const newPhotos = selectedPhotos.filter((_, i) => i !== index);
        setSelectedPhotos(newPhotos);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Upload Photos</Text>
                <Text style={styles.subtitle}>Select photos from your device</Text>
            </View>

            {selectedPhotos.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="image-multiple" size={48} color="#999" />
                    <Text style={styles.emptyText}>No photos selected</Text>
                    <Text style={styles.emptySubtext}>Tap the button below to select photos</Text>
                </View>
            ) : (
                <FlatList
                    data={selectedPhotos}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <View style={styles.photoItem}>
                            <View style={styles.photoInfo}>
                                <MaterialCommunityIcons name="image" size={32} color="#667eea" />
                                <Text style={styles.photoName} numberOfLines={1}>
                                    {item.filename || `Photo ${index + 1}`}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleRemovePhoto(index)}
                                style={styles.removeButton}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#f44336" />
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.selectButton} onPress={handlePickImages}>
                    <MaterialCommunityIcons name="folder-open" size={20} color="white" />
                    <Text style={styles.selectButtonText}>Select Photos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.uploadButton, selectedPhotos.length === 0 && styles.uploadButtonDisabled]}
                    onPress={handleUpload}
                    disabled={selectedPhotos.length === 0 || isUploading}
                >
                    <MaterialCommunityIcons name="cloud-upload" size={20} color="white" />
                    <Text style={styles.uploadButtonText}>
                        {isUploading ? 'Uploading...' : `Upload (${selectedPhotos.length})`}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 14, color: '#999', marginTop: 4 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 16 },
    emptySubtext: { fontSize: 13, color: '#999', marginTop: 8 },
    photoItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', justifyContent: 'space-between' },
    photoInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    photoName: { fontSize: 14, color: '#333', marginLeft: 12, flex: 1 },
    removeButton: { padding: 4 },
    footer: { flexDirection: 'row', padding: 16, gap: 12 },
    selectButton: { flex: 1, flexDirection: 'row', backgroundColor: '#667eea', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    selectButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
    uploadButton: { flex: 1, flexDirection: 'row', backgroundColor: '#4caf50', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    uploadButtonDisabled: { opacity: 0.5 },
    uploadButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
    listContent: { padding: 16 },
});
