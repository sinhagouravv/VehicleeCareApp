import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, StatusBar, ActivityIndicator, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileUp, ShieldCheck, AlertCircle, Camera, ImageIcon, Eye, Upload, Trash2, X, FileText } from 'lucide-react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

interface DocumentItem {
  key: 'adharCard' | 'voterId' | 'panCard' | 'drivingLicense' | 'agreement' | 'signature';
  label: string;
  description: string;
}

const DOCUMENTS: DocumentItem[] = [
  { key: 'adharCard', label: 'Aadhar Card', description: 'Kindly upload the clear image of the documnent' },
  { key: 'voterId', label: 'Voter Card', description: 'Kindly upload the clear image of the documnent' },
  { key: 'panCard', label: 'PAN Card', description: 'Kindly upload the clear image of the documnent' },
  { key: 'drivingLicense', label: 'Driving License', description: 'Kindly upload the clear image of the documnent' },
  { key: 'agreement', label: 'Employment Agreement', description: 'Kindly upload the clear image of the documnent' },
  { key: 'signature', label: 'Signature', description: 'Kindly upload the clear image of the signature' },
];

export default function UploadDocumentsScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedDocKey, setSelectedDocKey] = useState<DocumentItem['key'] | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      if (storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        setUser(parsedUser);
        
        // Fetch fresh employee details from backend to get latest document URLs
        const empId = parsedUser._id || parsedUser.id || parsedUser.employeeId;
        const empRes = await axios.get(`${API_URL}/api/employees/${empId}`);
        if (empRes.data.success) {
          const freshUser = empRes.data.data;
          const mergedUser = { ...parsedUser, ...freshUser };
          setUser(mergedUser);
          await SecureStore.setItemAsync('employeeUser', JSON.stringify(mergedUser));
        }
      }
    } catch (e) {
      console.log('Error loading user documents:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (key: DocumentItem['key']) => {
    setSelectedDocKey(key);
    setActionSheetVisible(true);
  };

  const pickImage = async (useCamera: boolean) => {
    setActionSheetVisible(false);
    if (!selectedDocKey) return;

    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to take photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Media library permission is required to choose image.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;
      uploadDocument(selectedDocKey, imageUri);
    } catch (error) {
      console.log('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const uploadDocument = async (key: DocumentItem['key'], uri: string) => {
    setUploadingDoc(key);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || `${key}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('document', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type,
      } as any);
      formData.append('documentType', key);

      const empId = user?._id || user?.id || user?.employeeId;
      if (!empId) {
        throw new Error('Employee ID not found.');
      }

      const response = await axios.post(`${API_URL}/api/employees/${empId}/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedEmployee = response.data.data;
        const updatedUser = { ...user, ...updatedEmployee };
        setUser(updatedUser);
        await SecureStore.setItemAsync('employeeUser', JSON.stringify(updatedUser));
        Alert.alert('Success', `${DOCUMENTS.find(d => d.key === key)?.label} uploaded successfully!`);
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.log('Error uploading document:', error);
      Alert.alert('Upload Failed', error.message || 'An error occurred during upload.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const deleteDocument = async (key: DocumentItem['key']) => {
    Alert.alert(
      'Remove Document',
      `Are you sure you want to remove your ${DOCUMENTS.find(d => d.key === key)?.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploadingDoc(key);
            try {
              // Simply set the document URL to empty string on the backend employee profile
              const empId = user?._id || user?.id || user?.employeeId;
              const response = await axios.put(`${API_URL}/api/employees/${empId}`, {
                [key]: ''
              });
              if (response.data.success) {
                const updatedUser = { ...user, [key]: '' };
                setUser(updatedUser);
                await SecureStore.setItemAsync('employeeUser', JSON.stringify(updatedUser));
                Alert.alert('Removed', 'Document removed successfully.');
              }
            } catch (err: any) {
              console.log('Error deleting document:', err);
              Alert.alert('Error', 'Failed to remove document.');
            } finally {
              setUploadingDoc(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f5f7f9]">
        <ActivityIndicator size="large" color="#011023" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f5f7f9]">
      {/* Header with White Safe Area */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, zIndex: 50 }}>
        <View style={{
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
            height: Platform.OS === 'ios' ? 50 : 35,
            paddingBottom: Platform.OS === 'ios' ? 10 : 5,
            paddingHorizontal: 19,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            elevation: 10,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            zIndex: 50
          }}>
            {/* Left: Back Arrow */}
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} className="flex-row items-center">
              <ArrowLeft size={22} color="#011023" strokeWidth={2.5} />
            </TouchableOpacity>
            
            {/* Center: Title */}
            <Text 
              style={{ fontSize: 20 }} 
              className="font-bold text-[#011023] tracking-[-0.5px] uppercase"
            >
              UPLOAD DOCUMENTS
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, marginTop: 7 }}>
        {/* <View className="bg-[#011023] rounded-2xl p-5 mb-5 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white font-bold text-base uppercase tracking-tight mb-1">Document verification</Text>
            <Text className="text-slate-300 text-xs font-semibold leading-4">Please upload original digital copies or clear photographs of your identity cards. Allowed formats are JPEG/PNG files up to 5MB.</Text>
          </View>
          <FileUp size={36} color="#38bdf8" />
        </View> */}

        {DOCUMENTS.map((doc) => {
          const docUrl = user?.[doc.key];
          const isUploading = uploadingDoc === doc.key;
          const isDocVerified = false; // To be linked with admin approval/verification status later

          return (
            <View style={{paddingVertical: 10, paddingHorizontal: 16 }} key={doc.key} className="bg-white border border-slate-200 rounded-2xl p-2 mt-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ transform: [{ translateY: 2 }], fontSize: 16.50 }} className="text-slate-800 font-semibold text-[17px] uppercase">{doc.label}</Text>
                {docUrl ? (
                  isDocVerified ? (
                    <View style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1 }} className="rounded-full px-3 py-1 flex-row items-center">
                      <Text style={{ color: '#059669' }} className="font-bold text-[10px] uppercase">Verified</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1 }} className="rounded-full px-3 py-1 flex-row items-center">
                      <Text style={{ color: '#2563eb' }} className="font-bold text-[10px] uppercase">Uploaded</Text>
                    </View>
                  )
                ) : (
                  <View style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1 }} className="rounded-full px-3 py-1 flex-row items-center">
                    <Text style={{ color: '#d97706' }} className="font-bold text-[10px] uppercase">Pending</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 11.50 }} className="text-slate-500 font-semibold uppercase mb-3">{doc.description}</Text>

              {docUrl ? (
                <View style={{paddingVertical: 5, paddingHorizontal: 15 }} className=" bg-slate-50 border border-slate-200 rounded-xl flex-row items-center justify-between">
                  <TouchableOpacity 
                    onPress={() => setViewerUrl(docUrl)}
                    className="flex-row items-center flex-1"
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 11.5 }} className="text-slate-700 font-bold uppercase flex-1" numberOfLines={1}>
                      {doc.label}.jpg
                    </Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, height: 22, backgroundColor: '#c8d5e4ff', marginHorizontal: 13 }} />
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    {/* <TouchableOpacity 
                      onPress={() => setViewerUrl(docUrl)}
                      style={{ paddingVertical: 5, paddingHorizontal: 2 }}
                      className=" hover:bg-slate-200 rounded-xl justify-center items-center"
                    >
                      <Eye size={16} color="#475569" strokeWidth={2.5} />
                    </TouchableOpacity> */}
                    <TouchableOpacity 
                      disabled={isUploading}
                      onPress={() => deleteDocument(doc.key)}
                      style={{ paddingVertical: 3.1 }}
                      className="hover:bg-red-100 rounded-xl justify-center items-center"
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Trash2 size={15} color="#ef4444" strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  disabled={isUploading}
                  onPress={() => handleDocumentSelect(doc.key)}
                  style={{paddingVertical: 9, paddingHorizontal: 15 }}
                  className="bg-slate-50 border border-slate-200 rounded-xl flex-row justify-center items-center active:bg-slate-100"
                >
                  <Text style={{ fontSize: 11.5 }} className="text-[#052558] font-semibold uppercase tracking-wide">
                    {isUploading ? 'Uploading...' : `Upload ${doc.label}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Action Sheet Modal */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1} 
            onPress={() => setActionSheetVisible(false)} 
          />
          <View className="bg-white rounded-t-[28px] p-6 shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full align-self-center mx-auto mb-5" />
            <Text className="text-slate-800 font-bold text-[17px] uppercase text-center mb-6 tracking-wide">
              Select Document Source
            </Text>

            <TouchableOpacity
              onPress={() => pickImage(true)}
              className="flex-row items-center bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl mb-3 active:bg-slate-100"
            >
              <View className="w-10 h-10 rounded-full bg-sky-50 justify-center items-center mr-4">
                <Camera size={20} color="#0284c7" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-bold text-sm uppercase">Take Photo</Text>
                <Text className="text-slate-400 font-semibold text-[11px] uppercase mt-0.5">Use camera to capture document</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickImage(false)}
              className="flex-row items-center bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl mb-6 active:bg-slate-100"
            >
              <View className="w-10 h-10 rounded-full bg-purple-50 justify-center items-center mr-4">
                <ImageIcon size={20} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-bold text-sm uppercase">Choose from Gallery</Text>
                <Text className="text-slate-400 font-semibold text-[11px] uppercase mt-0.5">Select image from photo album</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActionSheetVisible(false)}
              className="bg-slate-100 py-3.5 rounded-2xl items-center"
            >
              <Text className="text-slate-700 font-bold uppercase text-xs tracking-wider">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Document Viewer Modal */}
      <Modal
        visible={!!viewerUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerUrl(null)}
      >
        <View className="flex-1 bg-black justify-center items-center p-4">
          <TouchableOpacity 
            style={{ position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, right: 20, zIndex: 100 }}
            onPress={() => setViewerUrl(null)}
            className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
          >
            <X size={20} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          {viewerUrl && (
            <Image 
              source={{ uri: viewerUrl }} 
              style={{ width: '100%', height: '80%' }} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
