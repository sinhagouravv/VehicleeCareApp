import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, ScrollView, ActivityIndicator, Modal, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Phone, Hash, Briefcase, Building, Store, MapPin, Calendar, FileText, Shield, FileBadge, X, Info, Camera } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [garageAddress, setGarageAddress] = useState<string>('');
  const [garageName, setGarageName] = useState<string>('');

  useEffect(() => {
    loadUser();
  }, []);

  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery permissions to update your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedImage = result.assets[0];
      const imageUri = selectedImage.uri;

      setUploading(true);

      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: filename,
        type,
      } as any);

      const empId = user?._id || user?.id || user?.employeeId;
      if (!empId) {
        throw new Error('Employee ID not found.');
      }

      const response = await axios.post(`${API_URL}/api/employees/${empId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedEmployee = response.data.data;
        const updatedUser = { ...user, avatar: updatedEmployee.avatar };
        setUser(updatedUser);
        
        await SecureStore.setItemAsync('employeeUser', JSON.stringify(updatedUser));
        
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err: any) {
      console.log('Error uploading image:', err);
      Alert.alert('Upload Failed', err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const loadUser = async () => {
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      if (storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        setUser(parsedUser);
        if (parsedUser.garageLocation) {
          setGarageAddress(parsedUser.garageLocation);
        }
        if (parsedUser.garageName) {
          setGarageName(parsedUser.garageName);
        }
        
        const empId = parsedUser.employeeId || parsedUser.id || parsedUser._id;
        if (empId) {
          try {
            const empRes = await axios.get(`${API_URL}/api/employees/${empId}`);
            if (empRes.data.success && empRes.data.data) {
              const freshUser = empRes.data.data;
              setUser(freshUser);
              await SecureStore.setItemAsync('employeeUser', JSON.stringify(freshUser));
              
              if (freshUser.garageId) {
                try {
                  const garageRes = await axios.get(`${API_URL}/api/garages/${freshUser.garageId}`);
                  if (garageRes.data.success && garageRes.data.data) {
                    const garageData = garageRes.data.data;
                    const addressStr = garageData.address || `${garageData.district || ''} ${garageData.state || ''}`.trim() || 'N/A';
                    setGarageAddress(addressStr);
                    setGarageName(garageData.name || 'N/A');
                  }
                } catch (garageErr) {
                  console.log('Error fetching garage details in profile:', garageErr);
                }
              }
            }
          } catch (fetchErr) {
            console.log('Error fetching fresh employee details for profile:', fetchErr);
          }
        }
      }
    } catch (e) {
      console.log('Error loading user', e);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header with White Safe Area */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, zIndex: 50 }}>
        <View style={{
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
            height: Platform.OS === 'ios' ? 50 : 35,
            paddingBottom: Platform.OS === 'ios' ? 10 : 5,
            paddingHorizontal: 15.6,
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
            <View style={{ width: 70, alignItems: 'flex-start' }}>
              <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/task')} className="flex-row items-center">
                <ArrowLeft size={22} color="#011023" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            
            {/* Center: Title */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text 
                style={{ fontSize: 20 }} 
                className="font-bold text-[#011023] tracking-[-0.5px] uppercase"
              >
                MY PROFILE
              </Text>
            </View>

            {/* Right: QR Button */}
            <View style={{ width: 70, alignItems: 'flex-end' }}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setShowQRModal(true)}
                className="rounded-xl items-center justify-center bg-slate-50 border border-slate-200" 
                style={{ 
                  paddingHorizontal: 12, 
                  paddingVertical: 4.5,
                  elevation: 4,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 0.5,
                }}
              >
                <Text className="text-[13.5px] font-bold uppercase tracking-widest text-[#011023]">QR</Text>
              </TouchableOpacity>
            </View>
        </View>
      </SafeAreaView>
      
      {/* Profile Section Box */}
      <View style={{padding: 8, marginTop: 17 }} className="mx-5 bg-white rounded-2xl shadow-sm border border-slate-100 items-center relative">
            <View className="absolute top-4 right-4">
               <View className="bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  {/* <Text className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Active</Text> */}
               </View>
            </View>
            
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={pickAndUploadImage}
              disabled={uploading}
              className="w-24 h-24 mt-3 bg-[#f8fafc] rounded-full justify-center items-center mb-4 border-2 border-slate-100 shadow-sm relative"
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#052558" />
              ) : user?.avatar ? (
                <Image 
                  source={{ uri: user.avatar }} 
                  style={{ width: 95, height: 95, borderRadius: 46 }} 
                  resizeMode="cover"
                />
              ) : (
                <User size={70} color="#052558" strokeWidth={1.5} />
              )}
              
              {/* Camera Badge */}
              <View 
                style={{ 
                  position: 'absolute', 
                  bottom: -7, 
                  right: -7.5, 
                  backgroundColor: '#011023', 
                  borderRadius: 14, 
                  padding: 5, 
                  borderWidth: 2, 
                  borderColor: '#ffffff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  elevation: 5
                }}
              >
                <Camera size={13} color="#ffffff" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <Text style={{fontSize:20, marginTop: 6}} className="text-[30px] font-bold uppercase text-[#011023] text-center">
                {user?.name || 'Unknown Employee'}
            </Text>
            <View className="flex-row items-center px-3 py-1.5 rounded-full w-full">
              
              <View className="flex-1 flex-row justify-end items-center">
                <Text className="text-[#011023] font-semibold text-[13.5px]">
                  {user?.employeeId || user?.id || user?._id || 'N/A'}
                </Text>
                <Text style={{ marginHorizontal: 5, transform: [{ translateY: -1 }] }} className="text-[#011023] text-[13px] font-semibold">|</Text>
              </View>

              <View className="items-center justify-center">
                <Text className="text-[#011023] uppercase font-semibold text-[13.5px]">
                  {user?.role || 'Staff Member'}
                </Text>
              </View>

              <View className="flex-1 flex-row justify-start items-center">
                <Text style={{ marginHorizontal: 5, transform: [{ translateY: -1 }] }} className="text-[#011023] text-[13px] font-semibold">|</Text>
                <Text className="text-[#011023] uppercase font-semibold text-[13.5px]">
                  {user?.shift || 'Morning'}
                </Text>
              </View>

            </View>
          </View>

          {/* Scrollable details section */}
          <ScrollView bounces={false} style={{ marginTop: 15, marginBottom: 12 }} className="flex-grow" showsVerticalScrollIndicator={false}>
            {/* Details Section Box */}
            <View className="mx-5 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <View style={{ backgroundColor: '#f0f5fbff', paddingVertical: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                  <Text style={{ color: '#052558', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Basic Details</Text>
              </View>

              <View style={{ gap: 5, paddingHorizontal:17, paddingVertical:10 }}>
                <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">DOB </Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.dob || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Phone </Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.phone || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Email Id</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.email ? user.email.replace(/gmail\.com/i, '') : 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Address</Text>
                    <Text numberOfLines={1} style={{ maxWidth: '60%' }} className="text-[#011023] font-semibold uppercase text-right">{user?.address || 'N/A'}</Text>
                  </View>
                  
              </View>
            </View>

            {/* Legal Details Box */}
            <View className="mx-5 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <View style={{ backgroundColor: '#f0f5fbff', paddingVertical: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                  <Text style={{ color: '#05193aff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Legal Documents</Text>
              </View>
              
              <View style={{ gap: 5, paddingHorizontal:17, paddingVertical:10 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">PAN CARD</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.panCard || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Aadhar Card</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.adharCard || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Voter Id Card</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.voterId || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Driving License</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.drivingLicense || 'N/A'}</Text>
                  </View>
              </View>
            </View>

            {/* Garage Details Box */}
            <View className="mx-5 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <View style={{ backgroundColor: '#f0f5fbff', paddingVertical: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                  <Text style={{ color: '#052558', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Garage Details</Text>
              </View>
              
              <View style={{ gap: 5, paddingHorizontal:17, paddingVertical:11 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Garage Id</Text>
                  <Text numberOfLines={1} style={{ maxWidth: '60%' }} className="text-[#011023] font-semibold uppercase text-right">{user?.garageId || 'N/A'}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Garage Name</Text>
                  <Text numberOfLines={1} style={{ maxWidth: '55%' }} className="text-[#011023] font-semibold uppercase text-right">{garageName || 'N/A'}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Joined At</Text>
                  <Text numberOfLines={1} style={{ maxWidth: '60%' }} className="text-[#011023] font-semibold uppercase text-right">
                    {user?.createdAt ? (() => {
                      const d = new Date(user.createdAt);
                      const day = d.getDate();
                      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                      const month = monthNames[d.getMonth()];
                      const year = d.getFullYear();
                      return `${day} ${month} ${year}`;
                    })() : 'N/A'} <Text style={{ marginHorizontal: 4, transform: [{ translateY: -1 }] }} className="text-[#011023] text-[13px] font-semibold">|</Text> {user?.createdAt ? new Date(user.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, ':') : 'N/A'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Address</Text>
                  <Text numberOfLines={1} style={{ maxWidth: '60%' }} className="text-[#011023] font-semibold uppercase text-right">{garageAddress || 'N/A'}</Text>
                </View>
              </View>
            </View>

              {/* Legal Details Box */}
            <View className="mx-5 mb-1 bg-white rounded-2xl shadow-sm border border-slate-100">
              <View style={{ backgroundColor: '#f0f5fbff', paddingVertical: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                  <Text style={{ color: '#05193aff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}> Emergency Details</Text>
              </View>
                    
              <View style={{ gap: 5, paddingHorizontal:17, paddingVertical:10.5 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">PAN CARD</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.panCard || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Aadhar Card</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.adharCard || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Voter Id Card</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.voterId || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-700 uppercase font-semibold pr-1">Driving License</Text>
                    <Text className="text-[#011023] font-semibold uppercase text-right">{user?.drivingLicense || 'N/A'}</Text>
                  </View>
              </View>
            </View>
            
          </ScrollView>

      {/* QR Code View Modal */}
      <Modal visible={showQRModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          
          {/* Backdrop Click to Close */}
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} 
            activeOpacity={1} 
            onPress={() => setShowQRModal(false)} 
          />

          <View 
            className="bg-white shadow-2xl overflow-hidden" 
            style={{ 
              height: '65%', 
              width: '97%', 
              borderRadius: 40, 
              padding: 10,
              alignItems: 'center'
            }}
          >
            {/* Modal Header */}
            <View style={{ paddingTop: 15, paddingBottom: 0, paddingHorizontal: 10, width: '100%' }} className="flex-row justify-between items-center relative">
              <View style={{ width: 20 }} />
              <Text className="text-[18px] font-bold text-[#011023] text-center uppercase tracking-wide flex-1">
                Verification QR
              </Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <X size={20} color="#011023" />
              </TouchableOpacity>
            </View>

            {/* QR Code Container */}
            <View style={{ 
              marginTop: 28,
              marginBottom: 16,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QRCode
                value={JSON.stringify({
                  employeeId: user?.employeeId || ''
                })}
                size={250}
              />
            </View>

            {/* <Text style={{ fontSize: 16, fontWeight: '700', color: '#011023', textTransform: 'uppercase', marginBottom: 4 }}>
              {user?.name || 'Employee'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', letterSpacing: 1.5, marginBottom: 20 }}>
              {user?.employeeId || '000000000'}
            </Text> */}

            {/* Information Points Section */}
            <View style={{ marginTop: 12, width: '92%', alignSelf: 'center' }}>
              {/* Point 1 */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                <Info size={16} color="#64748b" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 11.5, lineHeight: 16, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                  This verification QR code dynamically encodes your unique Employee ID. You can Use this for scanning and real-time validation by security personnel at the gate.
                </Text>
              </View>

              {/* Point 2 */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                <Info size={16} color="#64748b" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 11.5, lineHeight: 16, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                  The encoded data is securely verified against our database to prevent any kind of tampering and guarantee only authorized employee has gained the entry.
                </Text>
              </View>

              {/* Point 3 */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
                <Info size={16} color="#64748b" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 11.5, lineHeight: 16, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                  Ensure your profile details are correct and always up to date. As Any kind of changes in your details will instantly reflect during the QR verification process.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
