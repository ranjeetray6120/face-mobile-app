import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Dimensions,
    ActivityIndicator,
    Alert,
    Modal,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

import { API_BASE_URL } from '../config/api';
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const IMAGE_SIZE = width / COLUMN_COUNT;

export default function FaceSearchScreen({ route, navigation }) {
    const { eventId, eventName } = route.params;
    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState('front');
    const [capturedImage, setCapturedImage] = useState(null);
    const [isMatching, setIsMatching] = useState(false);
    const [matchedPhotos, setMatchedPhotos] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);

    // Initial permission check
    useEffect(() => {
        if (permission && !permission.granted) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#667eea" /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Camera permission is required to search by face.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
            });
            setCapturedImage(photo.uri);
            matchFace(photo.uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to capture image');
        }
    };

    const matchFace = async (imageUri) => {
        try {
            setIsMatching(true);
            // We use the guest endpoint which is public/accessible
            // NOTE: Using the guest controller endpoint as planned
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                name: 'search_face.jpg',
                type: 'image/jpeg',
            });

            const response = await fetch(`${API_BASE_URL}/guest/events/${eventId}/match-face`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Match request failed');
            }

            const photos = await response.json();
            setMatchedPhotos(photos);

        } catch (error) {
            console.error(error);
            Alert.alert('Search Failed', 'Could not match face. Try again with better lighting.');
            setCapturedImage(null); // Reset to camera
        } finally {
            setIsMatching(false);
        }
    };

    const resetSearch = () => {
        setCapturedImage(null);
        setMatchedPhotos(null);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    const handleDownload = async (url) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync(true);
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please grant gallery access');
                return false;
            }
            const fileName = `search_${eventId}_${Date.now()}.jpg`;
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
            const selectedPhotos = matchedPhotos.filter(p => selectedIds.has(p.id));
            let successCount = 0;
            for (const photo of selectedPhotos) {
                const origin = API_BASE_URL.replace(/\/api$/, '');
                const url = photo.downloadUrl.startsWith('http') ? photo.downloadUrl : `${origin}${photo.downloadUrl}`;
                const success = await handleDownload(url);
                if (success) successCount++;
            }
            Alert.alert('Download Complete', `Successfully saved ${successCount} photos.`);
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch (error) {
            Alert.alert('Error', 'Bulk download failed.');
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

    const renderPhoto = ({ item }) => {
        const origin = API_BASE_URL.replace(/\/api$/, '');
        const imageUrl = item.downloadUrl.startsWith('http') ? item.downloadUrl : `${origin}${item.downloadUrl}`;
        const isSelected = selectedIds.has(item.id);

        return (
            <TouchableOpacity
                style={[styles.photoContainer, isSelected && styles.selectedPhotoContainer]}
                onPress={() => isSelectionMode ? toggleSelection(item.id) : setSelectedPhoto({ ...item, downloadUrl: imageUrl })}
                onLongPress={() => toggleSelection(item.id)}
            >
                <Image source={{ uri: imageUrl }} style={[styles.thumbnail, isSelected && { opacity: 0.6 }]} />
                {isSelected && (
                    <View style={styles.checkOverlay}>
                        <MaterialCommunityIcons name="check-circle" size={24} color="#667eea" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // 1. Camera View
    if (!capturedImage) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" />
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                />
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="close" size={30} color="white" />
                </TouchableOpacity>
                <View style={styles.controls}>
                    <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
                        <MaterialCommunityIcons name="camera-flip" size={28} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <MaterialCommunityIcons name="face-recognition" size={40} color="white" />
                    </TouchableOpacity>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={styles.hintText}>Align your face and tap to search</Text>
            </SafeAreaView>
        );
    }

    // 2. Loading / Processing View
    if (isMatching) {
        return (
            <View style={styles.center}>
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Analyzing Face...</Text>
                </View>
            </View>
        );
    }

    // 3. Results View
    return (
        <SafeAreaView style={styles.resultsContainer} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => isSelectionMode ? (setIsSelectionMode(false), setSelectedIds(new Set())) : resetSearch()}>
                    <MaterialCommunityIcons name={isSelectionMode ? "close" : "arrow-left"} size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isSelectionMode ? `${selectedIds.size} Selected` : `Found ${matchedPhotos?.length || 0} Photos`}
                </Text>
                {isSelectionMode && (
                    <TouchableOpacity onPress={handleBulkDownload} style={{ marginLeft: 'auto' }} disabled={isDownloadingBulk}>
                        {isDownloadingBulk ? <ActivityIndicator size="small" color="#667eea" /> : <MaterialCommunityIcons name="download" size={24} color="#667eea" />}
                    </TouchableOpacity>
                )}
            </View>

            {!matchedPhotos || matchedPhotos.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.text}>No matching photos found.</Text>
                    <TouchableOpacity onPress={resetSearch} style={[styles.button, { marginTop: 20 }]}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={matchedPhotos}
                    renderItem={renderPhoto}
                    keyExtractor={item => item.id.toString()}
                    numColumns={COLUMN_COUNT}
                    contentContainerStyle={styles.list}
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
    container: { flex: 1, backgroundColor: '#000' },
    resultsContainer: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    camera: { flex: 1 },
    controls: {
        position: 'absolute', bottom: 40, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'
    },
    captureButton: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#667eea',
        justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)'
    },
    flipButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
    closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
    hintText: {
        position: 'absolute', bottom: 130, alignSelf: 'center',
        color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8
    },
    previewImage: { width: '100%', height: '100%', opacity: 0.5 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    loadingText: { color: 'white', marginTop: 10, fontSize: 18, fontWeight: 'bold' },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20 },
    list: { paddingBottom: 20, backgroundColor: '#fff' },
    photoContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, padding: 1, position: 'relative' },
    selectedPhotoContainer: { borderWidth: 2, borderColor: '#667eea' },
    checkOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
    },
    thumbnail: { width: '100%', height: '100%', backgroundColor: '#eee' },
    text: { fontSize: 16, color: '#333' },
    button: { backgroundColor: '#667eea', padding: 15, borderRadius: 10 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
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
});
