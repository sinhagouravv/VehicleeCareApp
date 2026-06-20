import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Plus, ChevronUp, CheckSquare, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function OvertimeScreen() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isApplyExpanded, setIsApplyExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [requestedHours, setRequestedHours] = useState<number | null>(null);
  const [overtimeReason, setOvertimeReason] = useState('');
  const [isSubmittingOvertime, setIsSubmittingOvertime] = useState(false);

  const resetForm = () => {
    setSelectedDate(null);
    setRequestedHours(null);
    setOvertimeReason('');
  };

  useEffect(() => {
    if (isApplyExpanded) {
      resetForm();
    }
  }, [isApplyExpanded]);

  const getFormattedDateString = (dayOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD — used for attendance comparison & API submission
  };

  // Returns DD-MM-YYYY for comparing against stored overtime dates
  const getDDMMYYYY = (dayOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const handleApplyOvertime = async () => {
    const hasPending = overtimeRequests.some((req: any) => req.status === 'Pending');
    if (hasPending) {
      Alert.alert('Info', 'Kindly ask the manager to approve or reject your pending overtime request to apple for new one today.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date.');
      return;
    }
    if (selectedDate === 'Today' && user?.shift?.toLowerCase() === 'evening') {
      Alert.alert('Error', 'Overtime for Today is not available for Evening shift employees.');
      return;
    }
    if (selectedDate === 'Today') {
      const isAbsentToday = records.some((r: any) => 
        r.date === getFormattedDateString(0) && r.status === 'Absent'
      );
      if (isAbsentToday) {
        Alert.alert('Info', 'You are absent today, so you cannot apply for a overtime today.');
        return;
      }
      const todayDateStr = getDDMMYYYY(0);
      const hasApprovedToday = overtimeRequests.some((req: any) => 
        req.date === todayDateStr && req.status === 'Approved'
      );
      if (hasApprovedToday) {
        Alert.alert('Info', 'You have already a overtime approved for today, so you cannot apply for another one today.');
        return;
      }
    }
    if (selectedDate === 'Tomorrow') {
      const tomorrowDateStr = getDDMMYYYY(1);
      const hasApprovedTomorrow = overtimeRequests.some((req: any) => 
        req.date === tomorrowDateStr && req.status === 'Approved'
      );
      if (hasApprovedTomorrow) {
        Alert.alert('Info', 'You have already a overtime approved for tomorrow, so you cannot apply for another one today.');
        return;
      }
    }
    if (!requestedHours) {
      Alert.alert('Error', 'Please select the requested hours.');
      return;
    }
    if (!overtimeReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for the overtime request.');
      return;
    }
    
    setIsSubmittingOvertime(true);
    try {
      const targetDate = selectedDate === 'Today' ? getFormattedDateString(0) : getFormattedDateString(1);
      const postData = {
        employeeId: user.employeeId || user.id || user._id,
        employeeName: user.name,
        employeePhone: user.phone || '',
        employeeEmail: user.email || '',
        date: targetDate,
        hours: requestedHours,
        reason: overtimeReason,
        garageId: user.garageId
      };

      const res = await axios.post(`${API_URL}/api/overtime/request`, postData);
      if (res.data.success) {
        resetForm();
        setIsApplyExpanded(false);
        if (user) {
          const empId = user.employeeId || user.id || user._id;
          fetchOvertimeRequests(empId);
        }
        Alert.alert(
          'Success',
          `Your request for ${requestedHours} hours of overtime on ${selectedDate} has been submitted for approval.`
        );
      } else {
        Alert.alert('Error', res.data.message || 'Failed to submit request.');
      }
    } catch (err) {
      console.error('Failed to submit overtime request:', err);
      Alert.alert('Error', 'Failed to connect to server.');
    } finally {
      setIsSubmittingOvertime(false);
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
        const empId = parsedUser.employeeId || parsedUser.id || parsedUser._id;
        if (empId) {
          await Promise.all([
            fetchAttendance(empId),
            fetchOvertimeRequests(empId)
          ]);
          try {
            const empRes = await axios.get(`${API_URL}/api/employees/${empId}`);
            if (empRes.data.success && empRes.data.data) {
              const freshUser = empRes.data.data;
              setUser(freshUser);
              await SecureStore.setItemAsync('employeeUser', JSON.stringify(freshUser));
            }
          } catch (fetchErr) {
            console.error('Error fetching fresh employee details:', fetchErr);
          }
        }
      }
    } catch (e) {
      console.error('Error loading user in overtime', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (empId: string) => {
    try {
      const recordsRes = await axios.get(`${API_URL}/api/attendance/employee/${empId}`);
      if (recordsRes.data.success) {
        setRecords(recordsRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch overtime attendance records:", err);
    }
  };

  const fetchOvertimeRequests = async (empId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/overtime/employee/${empId}`);
      if (res.data.success) {
        setOvertimeRequests(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch overtime requests:", err);
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    const empId = user.employeeId || user.id || user._id;
    if (empId) {
      await Promise.all([
        fetchAttendance(empId),
        fetchOvertimeRequests(empId)
      ]);
    }
    setRefreshing(false);
  };

  const getRecordBadgeInfo = (status: string) => {
    return {
      label: 'Overtime',
      backgroundColor: '#e0e7ff',
      borderColor: '#c7d2fe',
      textColor: '#4338ca'
    };
  };

  const getRequestBadgeInfo = (status: string) => {
    switch (status) {
      case 'Approved':
        return {
          label: 'Approved',
          backgroundColor: '#dcfce7',
          borderColor: '#bbf7d0',
          textColor: '#166534'
        };
      case 'Rejected':
        return {
          label: 'Rejected',
          backgroundColor: '#ffe4e6',
          borderColor: '#fecdd3',
          textColor: '#be123c'
        };
      default: // Pending
        return {
          label: 'Pending',
          backgroundColor: '#fef3c7',
          borderColor: '#fde68a',
          textColor: '#b45309'
        };
    }
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // DD-MM-YYYY (stored overtime dates)
      if (parts[2].length === 4) {
        const dd = parseInt(parts[0], 10);
        const mm = parseInt(parts[1], 10) - 1;
        const yyyy = parts[2];
        if (mm >= 0 && mm < 12 && !isNaN(dd)) {
          return `${dd} ${months[mm]} ${yyyy}`;
        }
      }
      // YYYY-MM-DD (attendance record dates)
      if (parts[0].length === 4) {
        const yyyy = parts[0];
        const mm = parseInt(parts[1], 10) - 1;
        const dd = parseInt(parts[2], 10);
        if (mm >= 0 && mm < 12 && !isNaN(dd)) {
          return `${dd} ${months[mm]} ${yyyy}`;
        }
      }
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTimeString = (dateTimeStr: string) => {
    if (!dateTimeStr) return '—';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '—';
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  const getRecordDurationMins = (record: any) => {
    const inTime = record.checkIn ? new Date(record.checkIn).getTime() : null;
    let outTime = record.checkOut ? new Date(record.checkOut).getTime() : null;
    let durationMs = 0;

    if (inTime) {
      if (!outTime) {
        durationMs = 9 * 60 * 60 * 1000;
      } else if (outTime > inTime) {
        durationMs = outTime - inTime;
      }
    } else {
      durationMs = 9 * 60 * 60 * 1000;
    }
    return durationMs / (1000 * 60);
  };

  const formatRecordDuration = (record: any) => {
    const totalMins = getRecordDurationMins(record);
    const hrs = Math.floor(totalMins / 60);
    const mins = Math.floor(totalMins % 60);
    const formattedMins = String(mins).padStart(2, '0');
    return `${hrs}.${formattedMins} ${hrs !== 1 ? 'hrs' : 'hr'}`;
  };

  const overtimeRecords = [...records]
    .filter((r: any) => r.status === 'Overtime')
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View className="flex-1 bg-[#f5f7f9]">
      {/* Header with White Safe Area */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, zIndex: 50 }}>
        <View style={{
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
            height: 50,
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
              OVERTIME
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <View className="flex-1 px-5 pt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#011023" />
          </View>
        ) : (
          <View className="flex-1">
            {/* Apply Overtime Button */}
            <TouchableOpacity
              onPress={() => {
                const hasPending = overtimeRequests.some((req: any) => req.status === 'Pending');
                if (hasPending) {
                  Alert.alert('Info', 'Kindly ask the manager to approve or reject your pending overtime request to apple for new one.');
                  return;
                }
                const isEvening = user?.shift?.toLowerCase() === 'evening';
                const isMorning = user?.shift?.toLowerCase() === 'morning';
                const todayDateStr = getFormattedDateString(0);
                const tomorrowDateStr = getFormattedDateString(1);
                const hasApprovedToday = overtimeRequests.some((req: any) => 
                  req.date === todayDateStr && req.status === 'Approved'
                );
                const hasApprovedTomorrow = overtimeRequests.some((req: any) => 
                  req.date === tomorrowDateStr && req.status === 'Approved'
                );
                const isAbsentToday = records.some((r: any) => 
                  r.date === todayDateStr && r.status === 'Absent'
                );
                if (isEvening && hasApprovedTomorrow) {
                  Alert.alert('Info', 'You have already a overtime approved for tomorrow, so you cannot apply for another one.');
                  return;
                }
                if (isMorning && hasApprovedTomorrow && (hasApprovedToday || isAbsentToday)) {
                  if (isAbsentToday) {
                    Alert.alert('Info', 'You are absent today and have tomorrow\'s overtime approved, so you cannot apply for more.');
                  } else {
                    Alert.alert('Info', 'You have already overtime approved for both today and tomorrow, so you cannot apply for more.');
                  }
                  return;
                }
                setIsApplyExpanded(true);
              }}
              style={{ paddingVertical: 12, marginTop: 1, borderWidth: 1, backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' }}
              className="rounded-2xl flex-row justify-center items-center mb-4"
            >
              <Text className="font-semibold text-[#4338ca] uppercase tracking-widest text-[14px]">APPLY FOR OVERTIME</Text>
            </TouchableOpacity>

            {/* Overtime Request Modal Pop-up */}
            <Modal visible={isApplyExpanded} transparent animationType="fade">
              <View className="flex-1 justify-center items-center px-6">
                <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                {/* Backdrop Click to Close */}
                <TouchableOpacity 
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} 
                  activeOpacity={1} 
                  onPress={() => setIsApplyExpanded(false)} 
                />

                {/* Modal Container */}
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
                    elevation: 10
                  }}
                >
                  {/* Form Header */}
                  <View className="flex-row justify-center items-center relative">
                    <Text style={{ fontSize: 18, marginBottom: 35, marginTop: 5 }} className="font-bold text-[#011023] uppercase text-center">Apply Overtime</Text>
                    <TouchableOpacity 
                      onPress={() => setIsApplyExpanded(false)}
                      style={{ position: 'absolute', right: 0 }}
                    >
                      {/* <X size={20} color="#64748b" /> */}
                    </TouchableOpacity>
                  </View>

                  {/* Date Selection */}
                  {/* <Text style={{fontSize: 12.14 }} className="text-slate-600 font-semibold tracking-wider uppercase mb-3">Kindly select the Day and hours you want</Text> */}
                  <View className="flex-row" style={{ gap: 10, marginBottom: 12 }}>
                    {['Today', 'Tomorrow'].map((dateOpt) => {
                      const isAbsentToday = records.some((r: any) => 
                        r.date === getFormattedDateString(0) && r.status === 'Absent'
                      );
                      const isTodayDisabled = (dateOpt === 'Today' && user?.shift?.toLowerCase() === 'evening') || 
                        (dateOpt === 'Today' && user?.shift?.toLowerCase() === 'morning' && overtimeRequests.some((req: any) => 
                          req.date === getFormattedDateString(0) && req.status === 'Approved'
                        )) ||
                        (dateOpt === 'Today' && isAbsentToday);
                      const isTomorrowDisabled = dateOpt === 'Tomorrow' && overtimeRequests.some((req: any) => 
                        req.date === getFormattedDateString(1) && req.status === 'Approved'
                      );
                      return (
                        <TouchableOpacity
                          key={dateOpt}
                          onPress={() => {
                            if (isTodayDisabled) {
                              if (isAbsentToday && dateOpt === 'Today') {
                                Alert.alert('Info', 'You are absent today, so you cannot apply for a overtime today.');
                              } else if (user?.shift?.toLowerCase() === 'evening') {
                                Alert.alert('Info', 'Today is not available for Evening shift employees as their shift completes at 9 PM.');
                              } else {
                                Alert.alert('Info', 'You have already a overtime approved for today, so you cannot apply for another one today.');
                              }
                              return;
                            }
                            if (isTomorrowDisabled) {
                              Alert.alert('Info', 'You have already a overtime approved for tomorrow, so you cannot apply for another one.');
                              return;
                            }
                            setSelectedDate(dateOpt);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 8.5,
                            backgroundColor: selectedDate === dateOpt ? '#e0e7ff' : '#f1f5f9',
                            borderWidth: 0.75,
                            borderColor: selectedDate === dateOpt ? '#a5b4fc' : '#cbd5e1',
                            borderRadius: 12,
                            alignItems: 'center',
                            opacity: (isTodayDisabled || isTomorrowDisabled) ? 0.4 : 1
                          }}
                        >
                          <Text style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: selectedDate === dateOpt ? '#3730a3' : '#475569'
                          }}>{dateOpt.toUpperCase()}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Hours Selection */}
                  {/* <Text className="text-slate-400 font-semibold text-[12px] tracking-wider uppercase mb-3">Hours Requested</Text> */}
                  <View className="flex-row mb-4" style={{ gap: 10 }}>
                    {[2, 4, 6].map((hr) => (
                      <TouchableOpacity
                        key={hr}
                        onPress={() => setRequestedHours(hr)}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          backgroundColor: requestedHours === hr ? '#e0e7ff' : '#f1f5f9',
                          borderWidth: 0.75,
                          borderColor: requestedHours === hr ? '#a5b4fc' : '#cbd5e1',
                          borderRadius: 12,
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: requestedHours === hr ? '#3730a3' : '#475569'
                        }}>{hr} {hr === 1 ? 'HR' : 'HRS'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Reason Input */}
                  <Text style={{fontSize: 11.95 }} className="text-slate-600 font-semibold tracking-wider uppercase mb-3">Kindly provide a valid reason for Overtime</Text>
                  <TextInput
                    placeholderTextColor="#94a3b8"
                    value={overtimeReason}
                    onChangeText={setOvertimeReason}
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
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleApplyOvertime}
                    disabled={isSubmittingOvertime}
                    style={{
                      backgroundColor: '#e0e7ff',
                      borderWidth: 0.75,
                      borderColor: '#a5b4fc',
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      opacity: isSubmittingOvertime ? 0.7 : 1
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#3730a3' }}>
                      {isSubmittingOvertime ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View className="flex-1">
              {/* Requested Overtime Section */}
              <Text style={{ fontSize: 12.75, marginBottom: 11, marginLeft: 1.5 }} className="text-slate-400 font-semibold uppercase">Requested overtime Details for your attendance </Text>
              
              {overtimeRequests.length === 0 ? (
                <View style={{padding: 19 }} className="bg-white rounded-3xl border border-slate-200 items-center shadow-xs mb-3">
                  <Text className="text-[#011023] font-semibold text-base uppercase tracking-wide text-center mb-1">
                    No Requests
                  </Text>
                  <Text className="text-slate-400 font-semibold text-[11.5px] uppercase tracking-wider text-center">
                    You have no requested overtime records.
                  </Text>
                </View>
              ) : (
                <View style={{ marginBottom: 10 }}>
                  <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                    <View style={{ gap: 10 }}>
                      {overtimeRequests.map((req: any) => {
                        const badgeInfo = getRequestBadgeInfo(req.status);
                        return (
                          <View
                            key={req.id || req._id || req.date}
                            className="bg-white rounded-2xl border border-slate-200"
                            style={{
                              elevation: 2,
                              shadowColor: '#64748b',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.06,
                              paddingVertical: 10,
                              paddingHorizontal: 15,
                              shadowRadius: 6,
                            }}
                          >
                            {/* Top Row: Date & Status Badge */}
                            <View className="flex-row items-center justify-between" style={{ marginBottom: 5 }}>
                              <View className="flex-row items-center">
                                <Text style={{ fontSize: 15 }} className="font-semibold text-[#011023] uppercase">
                                  {formatDateString(req.date)}
                                </Text>
                                <Text style={{ fontSize: 15, marginHorizontal: 6, transform: [{ translateY: -1 }] }} className="font-semibold text-[#011023]">
                                  |
                                </Text>
                                <Text style={{ fontSize: 15 }} className="font-semibold text-[#011023] uppercase">
                                  {req.hours} {req.hours === 1 ? 'hr' : 'hrs'}
                                </Text>
                              </View>
                              <View style={{ borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2.5, backgroundColor: badgeInfo.backgroundColor, borderColor: badgeInfo.borderColor }} className="rounded-full">
                                <Text style={{ color: badgeInfo.textColor }} className="text-[11px] font-semibold uppercase">
                                  {badgeInfo.label}
                                </Text>
                              </View>
                            </View>

                            {/* Bottom Row: Reason and Remarks */}
                            <View>
                              {req.status === 'Pending' ? (
                                <>
                                  <Text className="text-slate-400 font-semibold text-[11px] tracking-wider uppercase">
                                    Reason 
                                  </Text>
                                  <Text style={{ fontSize: 13 }} className="text-[#011023] uppercase font-medium mt-1" numberOfLines={1}>
                                    {req.reason}
                                  </Text>
                                </>
                              ) : (req.status === 'Approved' || req.status === 'Rejected') && req.remarks ? (
                                <>
                                  <Text className="text-slate-400 font-semibold text-[11px] tracking-wider uppercase">
                                    Manager Remarks
                                  </Text>
                                  <Text style={{ fontSize: 13 }} className="text-[#011023] uppercase font-medium mt-1" numberOfLines={1}>
                                    {req.remarks}
                                  </Text>
                                </>
                              ) : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Approved Overtime Section */}
              <Text style={{ fontSize: 13, marginBottom: 10, marginLeft: 1.5 }} className="text-slate-400 font-semibold uppercase">Approved overtime Details for your attendance</Text>

              <ScrollView 
                bounces={false} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#011023"]} tintColor="#011023" />
                }
                contentContainerStyle={{ paddingBottom: 25 }}
                style={{ marginBottom: 12 }}
                className="flex-1"
              >
                {overtimeRecords.length === 0 ? (
                  <View className="bg-white rounded-3xl border border-slate-200 p-8 items-center shadow-sm">
                    <View className="bg-slate-100 p-4 rounded-full mb-3">
                      <Clock size={32} color="#011023" />
                    </View>
                    <Text className="text-[#011023] font-bold text-base uppercase tracking-wide text-center mb-1">
                      No Overtime Logged
                    </Text>
                    <Text className="text-slate-400 font-semibold text-xs uppercase tracking-wider text-center">
                      You have not logged any overtime shifts yet.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    {overtimeRecords.map((record: any) => {
                      const badgeInfo = getRecordBadgeInfo(record.status);
                      return (
                        <View
                          key={record.id || record._id || record.date}
                          className="bg-white rounded-2xl border border-slate-200"
                          style={{
                            elevation: 2,
                            shadowColor: '#64748b',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            shadowRadius: 6,
                          }}
                        >
                          {/* Top Row: Date & Status Badge */}
                          <View className="flex-row items-center justify-between" style={{ marginBottom: 6 }}>
                            <View className="flex-row items-center">
                              <Text style={{ fontSize: 15 }} className="font-semibold text-[#011023] uppercase">
                                {formatDateString(record.date)}
                              </Text>
                              {record.checkOut ? (
                                <>
                                  <Text style={{ fontSize: 15, marginHorizontal: 6, transform: [{ translateY: -1 }] }} className="font-semibold text-[#011023]">
                                    |
                                  </Text>
                                  <Text style={{ fontSize: 15 }} className="font-semibold text-[#011023] uppercase">
                                    {formatRecordDuration(record)}
                                  </Text>
                                </>
                              ) : null}
                            </View>
                            <View style={{ borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2.5, backgroundColor: badgeInfo.backgroundColor, borderColor: badgeInfo.borderColor }} className="rounded-full">
                              <Text style={{ color: badgeInfo.textColor }} className="text-[11px] font-semibold uppercase">
                                {badgeInfo.label}
                              </Text>
                            </View>
                          </View>

                          {/* Bottom Row: Check-in / Check-out Times */}
                          <View className="flex-row items-center justify-between">
                            {/* Left: Check-in */}
                            <View className="flex-1">
                              <Text className="text-slate-400 font-semibold text-[10px] tracking-wider uppercase">
                                Check In
                              </Text>
                              <Text style={{ fontSize: 14 }} className="text-[#011023] font-semibold mt-1">
                                {formatTimeString(record.checkIn)}
                              </Text>
                            </View>

                            {/* Right: Check-out */}
                            <View className="flex-1 items-end">
                              <Text className="text-slate-400 font-semibold text-[10px] tracking-wider uppercase text-right">
                                Check Out
                              </Text>
                              <Text style={{ fontSize: 14 }} className="text-[#011023] font-semibold mt-1 text-right">
                                {formatTimeString(record.checkOut)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
