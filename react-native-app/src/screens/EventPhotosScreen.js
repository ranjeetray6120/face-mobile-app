import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

import { API_BASE_URL } from '../config/api';
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const IMAGE_SIZE = width / COLUMN_COUNT;

export default function EventPhotosScreen({ route, navigation }) {
    const { eventId, eventName } = route.params;
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isReindexing, setIsReindexing] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);

    const handleReindex = async () => {
        try {
            setIsReindexing(true);
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/reindex`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.text();
            alert(response.ok ? 'Success: ' + data : 'Failed: ' + data);
        } catch (error) {
            alert('Error triggering re-index');
        } finally {
            setIsReindexing(false);
        }
    };

    const handleDownload = async (url) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync(true);
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please grant gallery access to download photos');
                return false;
            }

            const fileName = `event_${eventId}_${Date.now()}.jpg`;
            const fileUri = FileSystem.documentDirectory + fileName;

            const downloadResult = await FileSystem.downloadAsync(url, fileUri);
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync('EventPhotos', asset, false);
            return true;
        } catch (error) {
            console.error('Download error:', error);
            return false;
        }
    };

    const handleBulkDownload = async () => {
        if (selectedIds.size === 0) return;

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync(true);
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please grant gallery access');
                return;
            }

            setIsDownloadingBulk(true);
            const selectedPhotos = photos.filter(p => selectedIds.has(p.id));
            let successCount = 0;

            for (const photo of selectedPhotos) {
                const origin = API_BASE_URL.replace(/\/api$/, '');
                const url = photo.downloadUrl.startsWith('http') ? photo.downloadUrl : `${origin}${photo.downloadUrl}`;
                const success = await handleDownload(url);
                if (success) successCount++;
            }

            Alert.alert('Download Complete', `Successfully saved ${successCount} photos to gallery.`);
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch (error) {
            Alert.alert('Error', 'An error occurred during bulk download.');
        } finally {
            setIsDownloadingBulk(false);
        }
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
            if (newSelected.size === 0) setIsSelectionMode(false);
        } else {
            newSelected.add(id);
            setIsSelectionMode(true);
        }
        setSelectedIds(newSelected);
    };

    const { data: photos, isLoading, error, refetch } = useQuery({
        queryKey: ['eventPhotos', eventId],
        queryFn: async () => {
            console.log(`Fetching photos for eventId: ${eventId}`);
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/photos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            console.log(`Response status: ${response.status}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error response: ${errorText}`);
                throw new Error('Failed to fetch photos');
            }
            const result = await response.json();
            console.log(`Fetched ${result.length} photos for event ${eventId}`);
            return result;
        },
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>Failed to load photos.</Text>
                <Text style={styles.errorText}>{error.message}</Text>
                <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const renderPhoto = ({ item }) => {
        const origin = API_BASE_URL.replace(/\/api$/, '');
        const imageUrl = item.downloadUrl.startsWith('http') ? item.downloadUrl : `${origin}${item.downloadUrl}`;
        const isSelected = selectedIds.has(item.id);

        return (
            <TouchableOpacity
                onPress={() => isSelectionMode ? toggleSelection(item.id) : setSelectedPhoto({ ...item, downloadUrl: imageUrl })}
                onLongPress={() => toggleSelection(item.id)}
            >
                <View style={[styles.thumbnailContainer, isSelected && styles.selectedThumbnail]}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={[styles.thumbnail, isSelected && { opacity: 0.6 }]}
                        resizeMode="cover"
                    />
                    {isSelected && (
                        <View style={styles.checkOverlay}>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#667eea" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => isSelectionMode ? (setIsSelectionMode(false), setSelectedIds(new Set())) : navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name={isSelectionMode ? "close" : "arrow-left"} size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>
                    {isSelectionMode ? `${selectedIds.size} Selected` : eventName}
                </Text>

                {isSelectionMode ? (
                    <TouchableOpacity onPress={handleBulkDownload} style={styles.reindexButton} disabled={isDownloadingBulk}>
                        {isDownloadingBulk ? (
                            <ActivityIndicator size="small" color="#667eea" />
                        ) : (
                            <MaterialCommunityIcons name="download" size={24} color="#667eea" />
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleReindex} style={styles.reindexButton}>
                        <MaterialCommunityIcons name="refresh" size={24} color="#667eea" />
                    </TouchableOpacity>
                )}
            </View>

            {(!photos || photos.length === 0) ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="image-off" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No photos found for this event.</Text>
                    <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
                        <Text style={styles.refreshText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={photos}
                    renderItem={renderPhoto}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={COLUMN_COUNT}
                    contentContainerStyle={styles.grid}
                    onRefresh={() => refetch()}
                    refreshing={isLoading}
                />
            )}

            {/* Full Screen Modal */}
            <Modal visible={!!selectedPhoto} transparent={true} onRequestClose={() => setSelectedPhoto(null)} animationType="fade">
                <View style={styles.modalContainer}>
                    <SafeAreaView style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.modalActionButton}
                            onPress={() => setSelectedPhoto(null)}
                        >
                            <MaterialCommunityIcons name="close" size={30} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalActionButton}
                            onPress={() => handleDownload(selectedPhoto.downloadUrl)}
                        >
                            <MaterialCommunityIcons name="download" size={30} color="white" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {selectedPhoto && (
                        <Image
                            source={{ uri: selectedPhoto.downloadUrl }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { marginRight: 16 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1 },
    grid: { paddingBottom: 20 },
    thumbnailContainer: {
        width: IMAGE_SIZE - 2,
        height: IMAGE_SIZE - 2,
        margin: 1,
        backgroundColor: '#eee',
        overflow: 'hidden',
        position: 'relative',
    },
    selectedThumbnail: {
        borderWidth: 2,
        borderColor: '#667eea',
    },
    checkOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    errorText: { color: 'red', marginBottom: 10 },
    emptyText: { color: '#999', marginTop: 10, fontSize: 16 },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        zIndex: 5,
    },
    modalActionButton: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    fullImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    reindexButton: {
        padding: 8,
    },
    retryButton: {
        marginTop: 10,
        backgroundColor: '#667eea',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    refreshButton: {
        marginTop: 20,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    refreshText: {
        color: '#667eea',
        fontWeight: '600',
    },
});
