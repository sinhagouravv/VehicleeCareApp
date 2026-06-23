import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, ScrollView, ActivityIndicator, Dimensions, Modal, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Phone, Hash, Calendar, Clock, Building, Info, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';


const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const year = parts[2];
  
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  if (monthNum >= 1 && monthNum <= 12) {
    return `${day} ${monthNames[monthNum - 1]} ${year}`;
  }
  return dateStr;
};

const NativeDatePicker = ({ visible, onClose, valueStr, minDateStr, onSelect, title }: any) => {
  const getNoon = (d?: Date) => {
    const nd = d ? new Date(d) : new Date();
    nd.setHours(12, 0, 0, 0);
    return nd;
  };

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return getNoon();
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  const minDate = minDateStr ? parseLocalDate(minDateStr) : getNoon();
  const maxDate = getNoon();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const [tempDate, setTempDate] = useState<Date>(valueStr ? parseLocalDate(valueStr) : minDate);

  useEffect(() => {
    if (visible) {
      setTempDate(valueStr ? parseLocalDate(valueStr) : minDate);
    }
  }, [visible, valueStr, minDateStr]);

  if (!visible) return null;

  const handleDone = () => {
    let finalDate = tempDate;
    if (tempDate < minDate) finalDate = minDate;
    if (tempDate > maxDate) finalDate = maxDate;

    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, '0');
    const day = String(finalDate.getDate()).padStart(2, '0');
    
    onSelect(`${day}-${month}-${year}`);
    onClose();
  };

  const handleValueChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      onClose();
      return;
    }
    if (selectedDate) {
      if (Platform.OS === 'android') {
        let finalDate = selectedDate;
        if (selectedDate < minDate) finalDate = minDate;
        
        const year = finalDate.getFullYear();
        const month = String(finalDate.getMonth() + 1).padStart(2, '0');
        const day = String(finalDate.getDate()).padStart(2, '0');
        onSelect(`${day}-${month}-${year}`);
        onClose();
      } else {
        setTempDate(selectedDate);
      }
    }
  };

  const handleDismiss = () => {
    if (Platform.OS === 'android') {
      onClose();
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={{ position: 'absolute', bottom: 0, alignSelf: 'center', width: '97%', zIndex: 9999, elevation: 9999, backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20, paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Text className="font-bold text-slate-800 text-[16px]">{title}</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>DONE</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', width: '100%', paddingTop: 0 }}>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            minimumDate={minDate}
            maximumDate={maxDate}
            onChange={handleValueChange}
            onDismiss={handleDismiss}
            textColor="#000000"
            themeVariant="light"
            locale="en-GB"
            style={{ width: 320, alignSelf: 'center' }}
          />
        </View>
      </View>
    );
  }

  return (
    <DateTimePicker
      value={tempDate}
      mode="date"
      display="default"
      minimumDate={minDate}
      maximumDate={maxDate}
      onChange={handleValueChange}
      onDismiss={handleDismiss}
      locale="en-GB"
    />
  );
};

const { width } = Dimensions.get('window');

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function IdCardScreen() {
  const [user, setUser] = useState<any>(null);
  const [garageName, setGarageName] = useState<string>('');
  const [garageManagerName, setGarageManagerName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Flip Card Animation States
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(false);
    } else {
      Animated.spring(flipAnim, {
        toValue: 1,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(true);
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    position: 'absolute' as const,
    top: 0,
  };
  
  // Duplicate ID Request States
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Appointment states
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [isAppointmentDateModalOpen, setIsAppointmentDateModalOpen] = useState(false);
  const [isAppointmentTimeDropdownOpen, setIsAppointmentTimeDropdownOpen] = useState(false);

  useEffect(() => {
    if (showDuplicateModal) {
      setPurpose('');
      setReason('');
      setAppointmentDate('');
      setAppointmentTime('');
    }
  }, [showDuplicateModal]);

  const handleRequestDuplicate = async () => {
    if (!purpose) {
      Alert.alert('Error', 'Please select a purpose.');
      return;
    }
    if (!appointmentDate) {
      Alert.alert('Error', 'Please select an appointment date.');
      return;
    }
    if (!appointmentTime) {
      Alert.alert('Error', 'Please select an appointment time.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const empId = user?.employeeId || user?.id || user?._id;
      const res = await axios.post(`${API_URL}/api/employees/id-card-request`, {
        employeeId: empId,
        purpose: purpose,
        reason: reason,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime
      }, { validateStatus: () => true });

      if (res.status === 201) {
        Alert.alert('Success', 'Your duplicate ID card request has been successfully submitted for approval.');
        setShowDuplicateModal(false);
        setPurpose('');
        setReason('');
        setAppointmentDate('');
        setAppointmentTime('');
      } else {
        Alert.alert('Error', res.data.message || 'Failed to submit request.');
      }
    } catch (err) {
      console.error('Error submitting duplicate ID request:', err);
      Alert.alert('Error', 'Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      if (storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        setUser(parsedUser);

        // Fetch garage details using initial garageId
        const initialGarageId = parsedUser.garageId;
        if (initialGarageId) {
          try {
            const garageRes = await axios.get(`${API_URL}/api/garages/${initialGarageId}`);
            if (garageRes.data.success && garageRes.data.data) {
              setGarageName(garageRes.data.data.name);
            }
          } catch (garageErr) {
            console.error('Error fetching initial garage details:', garageErr);
          }

          // Fetch garage employees to find the manager
          try {
            const employeesRes = await axios.get(`${API_URL}/api/employees/garage/${initialGarageId}`);
            if (employeesRes.data.success && employeesRes.data.data) {
              const manager = employeesRes.data.data.find(
                (emp: any) => emp.role && emp.role.toLowerCase() === 'manager'
              );
              if (manager) {
                setGarageManagerName(manager.name);
              }
            }
          } catch (empErr) {
            console.error('Error fetching initial garage employees:', empErr);
          }
        }
        
        const empId = parsedUser.employeeId || parsedUser.id || parsedUser._id;
        if (empId) {
          try {
            const empRes = await axios.get(`${API_URL}/api/employees/${empId}`);
            if (empRes.data.success && empRes.data.data) {
              const freshUser = empRes.data.data;
              setUser(freshUser);
              await SecureStore.setItemAsync('employeeUser', JSON.stringify(freshUser));
 
              // Refetch garage and manager if ID changed
              if (freshUser.garageId && freshUser.garageId !== initialGarageId) {
                const freshGarageRes = await axios.get(`${API_URL}/api/garages/${freshUser.garageId}`);
                if (freshGarageRes.data.success && freshGarageRes.data.data) {
                  setGarageName(freshGarageRes.data.data.name);
                }

                try {
                  const employeesRes = await axios.get(`${API_URL}/api/employees/garage/${freshUser.garageId}`);
                  if (employeesRes.data.success && employeesRes.data.data) {
                    const manager = employeesRes.data.data.find(
                      (emp: any) => emp.role && emp.role.toLowerCase() === 'manager'
                    );
                    if (manager) {
                      setGarageManagerName(manager.name);
                    } else {
                      setGarageManagerName('');
                    }
                  }
                } catch (empErr) {
                  console.error('Error fetching fresh garage employees:', empErr);
                }
              }
            }
          } catch (fetchErr) {
            console.error('Error fetching fresh employee details for ID card:', fetchErr);
          }
        }
      }
    } catch (e) {
      console.error('Error loading user in ID card screen', e);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColors = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('mechanic')) return { bg: '#e0f2fe', text: '#0369a1' };
    if (r.includes('manager')) return { bg: '#fef3c7', text: '#b45309' };
    if (r.includes('technician')) return { bg: '#f3e8ff', text: '#6b21a8' };
    if (r.includes('support')) return { bg: '#f0fdf4', text: '#166534' };
    if (r.includes('admin')) return { bg: '#fee2e2', text: '#991b1b' };
    return { bg: '#f1f5f9', text: '#475569' };
  };

  const roleColors = getRoleColors(user?.role);

  const getValidUptoDate = () => {
    if (!user?.createdAt) return 'N/A';
    const date = new Date(user.createdAt);
    date.setDate(date.getDate() + 365);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day} ${monthNames[monthIndex]} ${year}`;
  };

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
              Virtual ID CARD
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <ScrollView 
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ padding: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#052558" />
        ) : (
          <View style={{ alignItems: 'center', width: '100%', paddingBottom: 0 }}>
            {/* Clickable Card Flip Wrapper */}
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={toggleFlip} 
              style={{ width: 365, height: 557, position: 'relative' }}
            >
              {/* Front Side */}
              <Animated.View 
                pointerEvents={isFlipped ? 'none' : 'auto'}
                style={[
                  frontAnimatedStyle,
                  {
                    width: 365,
                    height: 557,
                    backgroundColor: '#ffffff',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    overflow: 'hidden',
                    elevation: 8,
                    shadowColor: '#0f172a',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    backfaceVisibility: 'hidden',
                  }
                ]}
              >
                {/* Top Blue Hemisphere */}
                <View 
                  style={{
                    position: 'absolute',
                    top: -150,
                    left: -35,
                    width: 430,
                    height: 300,
                    borderRadius: 150,
                    backgroundColor: '#dbeafe', // Soft Blue semisphere
                  }}
                />

                {/* Bottom Green Hemisphere */}
                <View 
                  style={{
                    position: 'absolute',
                    bottom: -150,
                    left: -35,
                    width: 430,
                    height: 300,
                    borderRadius: 150,
                    backgroundColor: '#dcfce7', // Soft Green semisphere
                  }}
                />

                {/* ID Card Content (Absolute layout inside card) */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 20, zIndex: 10 }}>
                  
                  {/* Logo / Header section */}
                  <View style={{ alignItems: 'center', marginTop: 10 }}>
                    <Text style={{ fontSize: 20, letterSpacing: 0.5 }} className="font-bold text-[#011023]">
                      VEHICLEECARE
                    </Text>
                    {garageName ? (
                      <Text style={{ fontSize: 13, color: '#64748b', marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 }} className="font-bold text-[#011023]">
                        {garageName}
                      </Text>
                    ) : null}
                  </View>

                  {/* Avatar Section */}
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <View 
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        backgroundColor: '#ffffff',
                        borderWidth: 4,
                        borderColor: '#ffffff',
                        elevation: 5,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        {user?.avatar ? (
                          <Image
                            source={{ uri: user.avatar }}
                            style={{ width: 80, height: 80, borderRadius: 40 }}
                            contentFit="cover"
                          />
                        ) : (
                          <User size={50} color="#052558" strokeWidth={1.5} />
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Employee Basic Info */}
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: '600', color: '#0f172a', textAlign: 'center', textTransform: 'uppercase' }} className='tracking-wider'>
                      {user?.name || 'Unknown Employee'}
                    </Text>
                    
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 13, textTransform: 'uppercase' }} className="font-bold text-[#011023]">
                        {user?.employeeId} | {user?.role} | {user?.shift}
                      </Text>
                    </View>
                  </View>

                  {/* Details List */}
                  <View style={{ width: '80%', gap: 7, marginTop: 30 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Phone No</Text>
                      </View>
                      <Text style={{ fontSize: 13 }} className="font-bold text-[#011023]">{user?.phone || 'N/A'}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Garage id</Text>
                      </View>
                      <Text style={{ fontSize: 13.50 }} className="font-semibold text-[#011023] tracking-wider">{user?.garageId || 'N/A'}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Joined at</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Layout: QR Code and Signature */}
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'flex-end', 
                    justifyContent: 'space-between', 
                    marginTop: 'auto', 
                    marginBottom: 6, 
                    width: '85%',
                    paddingHorizontal: 5
                  }}>
                    {/* Left Side: QR Code */}
                    <View style={{ alignItems: 'center' }}>
                      <QRCode
                        value={JSON.stringify({
                          employeeId: user?.employeeId || ''
                        })}
                        size={70}
                      />
                      <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#25292eff', letterSpacing: .5, marginTop: 5 }} className="uppercase">
                        Scan to verify
                      </Text>
                    </View>

                    {/* Right Side: Signature */}
                    <View style={{ alignItems: 'center', width: 140, paddingBottom: 2 }}>
                      <View style={{ alignItems: 'center', width: '100%', marginBottom: 10 }}>
                        <Text 
                          style={{ 
                            fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive', 
                            fontSize: 18, 
                            color: '#1e293b',
                            textAlign: 'center',
                            marginBottom: 2
                          }}
                          numberOfLines={1}
                        >
                          {user?.name || 'Employee'}
                        </Text>
                        <View style={{ height: 1.5, backgroundColor: '#828d98ff', width: '95%', marginBottom: 4 }} />
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#25292eff', letterSpacing: 0.5 }}>
                          EMPLOYEE SIGNATURE
                        </Text>
                      </View>
                      <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#000000ff', letterSpacing: 0, alignSelf: 'flex-end', marginRight: 4, marginTop: 2 }} className="uppercase">
                        Valid Upto: {getValidUptoDate()}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Back Side */}
              <Animated.View 
                pointerEvents={isFlipped ? 'auto' : 'none'}
                style={[
                  backAnimatedStyle,
                  {
                    width: 365,
                    height: 557,
                    backgroundColor: '#ffffff',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    overflow: 'hidden',
                    elevation: 8,
                    shadowColor: '#0f172a',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    backfaceVisibility: 'hidden',
                  }
                ]}
              >
                {/* Top Blue Hemisphere */}
                <View 
                  style={{
                    position: 'absolute',
                    top: -150,
                    left: -35,
                    width: 430,
                    height: 300,
                    borderRadius: 150,
                    backgroundColor: '#dbeafe', // Soft Blue semisphere
                  }}
                />

                {/* Bottom Green Hemisphere */}
                <View 
                  style={{
                    position: 'absolute',
                    bottom: -150,
                    left: -35,
                    width: 430,
                    height: 300,
                    borderRadius: 150,
                    backgroundColor: '#dcfce7', // Soft Green semisphere
                  }}
                />

                {/* ID Card Content (Back Side) */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 20, paddingHorizontal: 20, zIndex: 10 }}>
                  
                  {/* Logo / Header section */}
                  <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 15 }}>
                    <Text style={{ fontSize: 20, letterSpacing: 0.5 }} className="font-bold text-[#011023]">
                      VEHICLEECARE
                    </Text>
                  </View>

                  {/* Information Points Section */}
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={{ marginTop: 10, width: 309 }}>
                      {/* Point 1 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                        {/* <Info size={16} color="#64748b" style={{ marginTop: 2 }} /> */}
                        <Text style={{ fontSize: 9.75, lineHeight: 13.5, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                          THIS IDENTIFICATION CARD IS THE EXCLUSIVE PROPERTY OF VEHICLEECARE AND IS ISSUED TO THE DESIGNATED EMPLOYEE SOLELY FOR OFFICIAL ACCESS CONTROL AND WORKPLACE SECURITY MANAGEMENT PURPOSES.
                        </Text>
                      </View>

                      {/* Point 2 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                        {/* <Info size={16} color="#64748b" style={{ marginTop: 2 }} /> */}
                        <Text style={{ fontSize: 9.75, lineHeight: 13.5, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                          THE EMPLOYEE IS REQUIRED TO PROMINENTLY DISPLAY AND PRESENT THIS ID CARD AT ALL TIMES AT THE TIME OF DUTY OR UPON REQUESTED BY THE AUTHORIZED SECURITY REPRESENTATIVES AND GARAGE MANAGEMENT STAFF.
                        </Text>
                      </View>

                      {/* Point 3 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                        {/* <Info size={16} color="#64748b" style={{ marginTop: 2 }} /> */}
                        <Text style={{ fontSize: 9.75, lineHeight: 13.5, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                          THIS ACCESS CARD IS STRICTLY NON-TRANSFERABLE AND IS AUTHORIZED FOR WORK-RELATED USE ONLY BY THE ASSIGNED HOLDER. LENDING THIS CARD TO ANY OTHER INDIVIDUAL IS A SERIOUS VIOLATION OF POLICY.
                        </Text>
                      </View>

                      {/* Point 4 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                        {/* <Info size={16} color="#64748b" style={{ marginTop: 2 }} /> */}
                        <Text style={{ fontSize: 9.75, lineHeight: 13.5, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                          IN THE CASE OF LOSS, THEFT, OR DAMAGE OF THIS PHYSICAL ACCESS CARD, THE EMPLOYEE IS REQUIRED TO REPORT IT IMMEDIATELY TO THE GARAGE MANAGER AND SUBMIT THE REQUEST FOR A DUPLICATE ID REPLACEMENT IMMEDIATELY.
                        </Text>
                      </View>

                      {/* Point 5 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                        {/* <Info size={16} color="#64748b" style={{ marginTop: 2 }} /> */}
                        <Text style={{ fontSize: 9.75, lineHeight: 13.5, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                          IF FOUND, PLEASE HAND OVER THIS CARD TO VEHICLEECARE CORPORATE HEAD OFFICE, OR DROP IT OFF AT THE NEAREST GARAGE OUTLET OR CONTACT THE HUMAN RESOURCE team.
                        </Text>
                      </View>

                      {/* Point 6 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                        {/* <Info size={16} color="#64748b" style={{ marginTop: 2 }} /> */}
                        <Text style={{ fontSize: 9.75, lineHeight: 13.5, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                          ANY UNAUTHORIZED ALTERATION, COPYING, OR TAMPERING OF THIS OFFICIAL CARD IS A GRAVE WORKPLACE BREACH AND WILL RESULT IN the STERN DISCIPLINARY PROCEEDING.
                        </Text>
                      </View>

                      {/* Point 7 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        {/* <Info size={16} color="#64748b" style={{ marginTop: 2 }} /> */}
                        <Text style={{ fontSize: 9.75, lineHeight: 13.5, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                          UPON TERMINATION OR CESSATION OF ACTIVE EMPLOYMENT WITH VEHICLEECARE, THE EMPLOYEE IS UNDER OBLIGATION TO RETRUN THIS IDENTITY CARD TO THE GARAGE MANAGER.
                        </Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  {/* Bottom Section: Signature & Security Protocol */}
                  <View style={{ marginTop: 'auto', alignItems: 'center', width: '100%', marginBottom: 5 }}>
                    {/* Manager Signature Section */}
                    <View style={{ alignItems: 'center', width: 140, marginBottom: 1 }}>
                      <Text 
                        style={{ 
                          fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive', 
                          fontSize: 19, 
                          color: '#090a0eff',
                          textAlign: 'center',
                          marginBottom: 2
                        }}
                        numberOfLines={1}
                      >
                        {garageManagerName || 'Garage Manager'}
                      </Text>
                      <View style={{ height: 1.5, backgroundColor: '#828d98ff', width: '90%', marginBottom: 4 }} />
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#25292eff', letterSpacing: 0.5 }} className="uppercase">
                        ISSUED BY MANAGER
                      </Text>
                    </View>

                    {/* Security Protocol Footer */}
                    <View style={{ alignItems: 'center' }}>
                      {/* <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#64748b', letterSpacing: 1 }} className="uppercase">
                        VehicleeCare Security Protocol
                      </Text> */}
                    </View>
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>

            {/* Information Points Section */}
            <View style={{ marginTop: 15, width: 365 }} >
              {/* Point 1 */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                <Info size={16} color="#64748b" style={{ marginTop: 15 }} />
                <Text style={{ fontSize: 12, lineHeight: 16, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                  This virtual ID card serves as official proof of employment at VehicleeCare. Use this when you donot have the physical idcard at work.
                </Text>
              </View>

              {/* Point 2 */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                <Info size={16} color="#64748b" style={{ marginTop: 15 }} />
                <Text style={{ fontSize: 12, lineHeight: 16, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                  The qr code displayed contains your encrypted Employee ID and can be used for quick scanning for the instant verification of employee.
                </Text>
              </View>

              {/* Point 3 */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Info size={16} color="#64748b" style={{ marginTop: 15 }} />
                <Text style={{ fontSize: 12, lineHeight: 16, flex: 1 }} className="text-slate-500 uppercase font-semibold text-justify">
                  In case you loss or damage of physical id card you can apply for{' '}
                  <Text 
                    style={{ color: '#052558' }} 
                    className="font-bold"
                    onPress={() => setShowDuplicateModal(true)}
                  >
                  duplicate 
                  </Text>{' '}
                  id card from your garage.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

    {/* Duplicate ID Request Modal */}
    <Modal visible={showDuplicateModal} transparent animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center px-6">
            <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
            
            {/* Backdrop Click to Close */}
            <TouchableOpacity 
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} 
              activeOpacity={1} 
              onPress={() => {
                if (isAppointmentDateModalOpen) {
                  setIsAppointmentDateModalOpen(false);
                } else if (isAppointmentTimeDropdownOpen) {
                  setIsAppointmentTimeDropdownOpen(false);
                } else {
                  setShowDuplicateModal(false);
                  setPurpose('');
                  setReason('');
                  setAppointmentDate('');
                  setAppointmentTime('');
                }
              }} 
            />
            
            <View 
              style={{
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#cbd5e1',
                borderRadius: 24,
                padding: 20,
                width: '100%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 10,
                zIndex: 10,
                position: 'relative'
              }}
            >
              {/* Modal Header */}
              <View className="flex-row justify-center items-center relative">
                <Text style={{ fontSize: 18, marginBottom: 35, marginTop: 5 }} className="font-bold text-[#011023] uppercase text-center">
                  DUPLICATE ID CARD
                </Text>
              </View>

              {/* Reason Grid */}
              <Text style={{ fontSize: 11.95, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>
                Kindly select a valid Purpose for the Request
              </Text>
              <View className="flex-row mb-4" style={{ gap: 10 }}>
                {['Lost', 'Damaged', 'Stolen'].map((item) => {
                  const isSelected = purpose === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.7}
                      onPress={() => setPurpose(item)}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        backgroundColor: isSelected ? '#e0e7ff' : '#f1f5f9',
                        borderWidth: 0.75,
                        borderColor: isSelected ? '#a5b4fc' : '#cbd5e1',
                        borderRadius: 12,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: isSelected ? '600' : '600',
                        color: isSelected ? '#3730a3' : '#475569',
                        textTransform: 'uppercase'
                      }}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Appointment Section */}
              <Text style={{ fontSize: 11.75, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }} className="tracking-wide">
                Kindly Book an Appointment for the request
              </Text>
              <View className="flex-row mb-4" style={{ gap: 10, zIndex: 100, elevation: 100, position: 'relative' }}>
                {/* Date Selection Box */}
                <View style={{ flex: 1 }}>
                  
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setIsAppointmentDateModalOpen(true);
                      setIsAppointmentTimeDropdownOpen(false);
                    }}
                    style={{
                      height: 32,
                      backgroundColor: '#f1f5f9',
                      borderWidth: 0.75,
                      borderColor: '#cbd5e1',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>
                      {formatDisplayDate(appointmentDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Time Selection Box */}
                <View style={{ flex: 1, position: 'relative' }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setIsAppointmentTimeDropdownOpen(!isAppointmentTimeDropdownOpen);
                    }}
                    style={{
                      height: 32,
                      backgroundColor: '#f1f5f9',
                      borderWidth: 0.75,
                      borderColor: '#cbd5e1',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>
                      {appointmentTime || ''}
                    </Text>
                  </TouchableOpacity>

                  {/* Dropdown for Time Slot (Keep the UI same as leave.tsx:L658-L675) */}
                  {isAppointmentTimeDropdownOpen && (
                    <View 
                      className="bg-white border border-slate-200 rounded-xl mt-1 shadow-sm overflow-hidden absolute top-full left-0 z-[1000]" 
                      style={{ 
                        width: '100%', 
                        maxHeight: 180, 
                        elevation: 1000,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                      }}
                    >
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {['12:00 - 12:30', '12:30 - 13:00', '13:00 - 13:30', '13:30 - 14:00', '14:00 - 14:30', '14:30 - 15:00'].map((time) => (
                          <TouchableOpacity
                            key={time}
                            onPress={() => {
                              setAppointmentTime(time);
                              setIsAppointmentTimeDropdownOpen(false);
                            }}
                            className={`flex-row items-center justify-center relative ${appointmentTime === time ? 'bg-slate-50' : 'bg-white'}`}
                            style={{ paddingVertical: 8 }}
                          >
                            <Text className={`font-semibold uppercase text-[12px] tracking-wide text-center ${appointmentTime === time ? 'text-[#011023]' : 'text-slate-500'}`}>
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Additional Remarks Input */}
              <Text style={{ fontSize: 11.65, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>
                Kindly provide a valid reason for the Request
              </Text>
              <TextInput
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc',
                  borderWidth: 0.75,
                  borderColor: '#cbd5e1',
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 13,
                  color: '#011023',
                  minHeight: 80,
                  textAlignVertical: 'top',
                  marginBottom: 16,
                  fontWeight: '500'
                }}
                multiline
                value={reason}
                onChangeText={setReason}
              />

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRequestDuplicate}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#e0e7ff',
                  borderWidth: 0.75,
                  borderColor: '#a5b4fc',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#3730a3' }}>
                  {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Native Date Picker Component */}
        <NativeDatePicker
          visible={isAppointmentDateModalOpen}
          onClose={() => setIsAppointmentDateModalOpen(false)}
          valueStr={appointmentDate}
          minDateStr={getTomorrowDateString()}
          onSelect={(date: string) => {
            setAppointmentDate(date);
          }}
          title="Select Appointment Date"
        />
      </KeyboardAvoidingView>
    </Modal>
    </View>
);
}
