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
  SafeAreaView,
  StatusBar
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// using localhost because we are using adb reverse (USB Debugging)
const API_BASE_URL = 'http://localhost:8080/api';
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const IMAGE_SIZE = width / COLUMN_COUNT;

export default function App() {
  // Default to Event ID 1 for testing
  const eventId = 1;

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState(null);

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
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'search_face.jpg',
        type: 'image/jpeg',
      });

      // Using the GUEST endpoint (Public)
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
  };

  const renderPhoto = ({ item }) => {
    const imageUrl = item.downloadUrl.startsWith('http')
      ? item.downloadUrl
      : `${API_BASE_URL.replace('/api', '')}${item.downloadUrl}`;

    return (
      <TouchableOpacity style={styles.photoContainer}>
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      </TouchableOpacity>
    );
  };

  // 1. Camera View
  if (!capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find My Face (Event {eventId})</Text>
        </View>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
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
        </View>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.resultsHeader}>
        <TouchableOpacity onPress={resetSearch} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.resultsTitle}>Found {matchedPhotos?.length || 0} Photos</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
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
  hintText: {
    position: 'absolute', bottom: 130, alignSelf: 'center',
    color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8
  },
  previewImage: { width: '100%', height: '100%', opacity: 0.5 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  loadingText: { color: 'white', marginTop: 10, fontSize: 18, fontWeight: 'bold' },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  resultsHeader: {
    height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  backButton: { padding: 10 },
  resultsTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: '#333' },
  list: { paddingBottom: 20, backgroundColor: '#fff' },
  photoContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, padding: 1 },
  thumbnail: { width: '100%', height: '100%', backgroundColor: '#eee' },
  text: { fontSize: 16, color: '#333' },
  button: { backgroundColor: '#667eea', padding: 15, borderRadius: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
