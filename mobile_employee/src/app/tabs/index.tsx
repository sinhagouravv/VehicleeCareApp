import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { User, Clock, Calendar, ChevronRight, CheckCircle, AlertCircle, ClipboardList, FileText, ArrowRight, LogIn, LogOut } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;
export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadUser();
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (user) {
        const empId = user.employeeId || user.id || user._id;
        fetchDashboardData(empId, true);
      }
    }, [user])
  );
  const loadUser = async () => {
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      if (storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        setUser(parsedUser);
        const empId = parsedUser.employeeId || parsedUser.id || parsedUser._id;
        if (empId) {
          fetchDashboardData(empId);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };
  const fetchDashboardData = async (empId: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [statusRes, recordsRes, bookingsRes, leavesRes] = await Promise.all([
        axios.get(`${API_URL}/api/attendance/status/${empId}`),
        axios.get(`${API_URL}/api/attendance/employee/${empId}`),
        axios.get(`${API_URL}/api/bookings/employee/${empId}`),
        axios.get(`${API_URL}/api/leaves/employee/${empId}`)
      ]);
      if (statusRes.data.success) {
        setTodayRecord(statusRes.data.data);
      }
      if (recordsRes.data.success) {
        const records = recordsRes.data.data || [];
        const presentCount = records.filter((r: any) => r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime').length;
        const totalCount = records.length;
        setAttendanceRate(totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0);
      }
      if (bookingsRes.data.success) {
        setTasks(bookingsRes.data.data || []);
      }
      if (leavesRes.data.success) {
        setLeaves(leavesRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const onRefresh = useCallback(() => {
    if (user) {
      setRefreshing(true);
      fetchDashboardData(user.employeeId || user.id || user._id, true);
    }
  }, [user]);
  const handleCheckIn = async () => {
    if (!user) return;
    const empId = user.employeeId || user.id || user._id;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/attendance/check-in`, {
        employeeId: empId
      });
      if (res.data.success || res.data.message?.includes('Absent')) {
        fetchDashboardData(empId, true);
        Alert.alert('Success', 'Checked in successfully!');
      } else {
        Alert.alert('Error', res.data.message || 'Check-in failed. Please try again.');
      }
    } catch (err) {
      console.error("Check-in error:", err);
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleCheckOut = async () => {
    if (!todayRecord?._id || !user) return;
    const empId = user.employeeId || user.id || user._id;
    setActionLoading(true);
    try {
      const res = await axios.put(`${API_URL}/api/attendance/check-out/${todayRecord._id}`);
      if (res.data.success) {
        fetchDashboardData(empId, true);
        Alert.alert('Success', 'Checked out successfully!');
      } else {
        Alert.alert('Error', res.data.message || 'Check-out failed. Please try again.');
      }
    } catch (err) {
      console.error("Check-out error:", err);
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '--:--';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${day}-${month}-${year} | ${timeStr}`;
    } catch {
      return '—';
    }
  };

  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  };

  const getTaskStatusStyle = (status: any) => {
    switch (status) {
      case 'Delivered': return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', textColor: '#166534' };
      case 'Completed': return { backgroundColor: '#ccfbf1', borderColor: '#99f6e4', textColor: '#115e59' };
      case 'In Service': return { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe', textColor: '#4338ca' };
      case 'In Progress': return { backgroundColor: '#f3e8ff', borderColor: '#e9d5ff', textColor: '#7e22ce' };
      case 'Pending': return { backgroundColor: '#fef08a', borderColor: '#fde047', textColor: '#92400e' };
      case 'Cancelled': return { backgroundColor: '#ffe4e6', borderColor: '#fecdd3', textColor: '#be123c' };
      default: return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', textColor: '#1e293b' };
    }
  };

  const getLeaveStatusStyle = (status: any) => {
    switch (status) {
      case 'Approved': return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', textColor: '#166534' };
      case 'Rejected': return { backgroundColor: '#ffe4e6', borderColor: '#fecdd3', textColor: '#be123c' };
      case 'Pending': return { backgroundColor: '#fef3c7', borderColor: '#fde68a', textColor: '#92400e' };
      default: return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', textColor: '#1e293b' };
    }
  };
  // Helper variables for UI
  const isCheckedIn = todayRecord && todayRecord.checkIn;
  const isCheckedOut = todayRecord && todayRecord.checkOut;
  const activeTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Delivered');
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  // Calculate today's tasks
  const getLocalDateStrings = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return [
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      `${y}-${m}-${d}`
    ];
  };
  const todayDateStrings = getLocalDateStrings();
  const todayTasks = tasks.filter(t => {
    const taskDate = t.schedule?.date;
    return taskDate && todayDateStrings.includes(taskDate);
  });
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#011023" />
      </View>
    );
  }
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
      bounces={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#011023']} />
      }
    >
      <View className="px-5">

        {/* Stats Grid */}
        {/* Stats Grid - 2x2 Layout */}
        <View style={{ gap: 12, marginTop: 15, marginBottom: 12 }}>
          {/* Row 1 */}
          <View style={{ gap: 12 }} className="flex-row">
            <TouchableOpacity
              onPress={() => router.push('/tabs/task')}
              className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center justify-between"
              style={{
                elevation: 2,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6
              }}
            >
              <View className="flex-1 pr-2">
                <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{activeTasks.length}</Text>
                <Text className="text-slate-400 font-bold uppercase text-[14px]" numberOfLines={1}>Active Tasks</Text>
              </View>
              <View className="w-10 h-10 rounded-xl bg-indigo-50 justify-center items-center">
                <ClipboardList size={20} color="#4f46e5" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/tabs/task')}
              className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center justify-between"
              style={{
                elevation: 2,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6
              }}
            >
              <View className="flex-1 pr-2">
                <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{todayTasks.length}</Text>
                <Text className="text-slate-400 font-bold uppercase text-[14px]" numberOfLines={1}>Today's Task</Text>
              </View>
              <View className="w-10 h-10 rounded-xl bg-sky-50 justify-center items-center">
                <Calendar size={20} color="#0284c7" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={{ gap: 12 }} className="flex-row">
            <TouchableOpacity
              onPress={() => router.push('/tabs/leave')}
              className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center justify-between"
              style={{
                elevation: 2,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6
              }}
            >
              <View className="flex-1 pr-2">
                <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{pendingLeaves.length}</Text>
                <Text className="text-slate-400 font-bold uppercase text-[14px]" numberOfLines={1}>Leave Left</Text>
              </View>
              <View className="w-10 h-10 rounded-xl bg-rose-50 justify-center items-center">
                <FileText size={20} color="#e11d48" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <View
              className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center justify-between"
              style={{
                elevation: 2,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6
              }}
            >
              <View className="flex-1 pr-2">
                <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{attendanceRate}%</Text>
                <Text className="text-slate-400 font-bold uppercase text-[14px]" numberOfLines={1}>Attend. Rate</Text>
              </View>
              <View className="w-10 h-10 rounded-xl bg-emerald-50 justify-center items-center">
                <CheckCircle size={20} color="#059669" strokeWidth={2.5} />
              </View>
            </View>
          </View>
        </View>

        {/* Shift Card */}
        <View
          className="bg-white rounded-2xl border border-slate-200"
          style={{
            elevation: 3,
            paddingVertical: 13,
            paddingHorizontal: 15,
            marginBottom: 12,
            shadowColor: '#64748b',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 8
          }}
        >
          <View style={{ marginBottom: 10 }} className="flex-row justify-between items-center">
            <Text className="font-bold text-slate-800 uppercase tracking-wider text-[14px]">Shift Status</Text>
            {isCheckedOut ? (
              <View
                className="border rounded-full items-center justify-center"
                style={{
                  backgroundColor: '#ccfbf1',
                  borderColor: '#99f6e4',
                  paddingHorizontal: 8,
                  paddingVertical: 1.5,
                  borderWidth: 1
                }}
              >
                <Text
                  className="font-semibold uppercase text-[9px]"
                  style={{ color: '#115e59', fontSize: 10.5 }}
                >
                  Shift Completed
                </Text>
              </View>
            ) : isCheckedIn ? (
              <View
                className="border rounded-full items-center justify-center"
                style={{
                  backgroundColor: '#dcfce7',
                  borderColor: '#bbf7d0',
                  paddingHorizontal: 8,
                  paddingVertical: 1.5,
                  borderWidth: 1
                }}
              >
                <Text
                  className="font-semibold uppercase text-[9px]"
                  style={{ color: '#166534', fontSize: 10.5}}
                >
                  On Duty
                </Text>
              </View>
            ) : (
              <View
                className="border rounded-full items-center justify-center"
                style={{
                  backgroundColor: '#ffe4e6',
                  borderColor: '#fecdd3',
                  paddingHorizontal: 8,
                  paddingVertical: 1.5,
                  borderWidth: 1
                }}
              >
                <Text
                  className="font-semibold uppercase text-[9px]"
                  style={{ color: '#be123c', fontSize: 10.5 }}
                >
                  Off Duty
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-1 items-start justify-center">
              <Text className="text-[12px] text-slate-500 font-semibold uppercase tracking-widest mb-1">Check In</Text>
              <Text className="text-[13px] font-semibold text-[#011023] uppercase truncate" numberOfLines={1}>
                {formatDateTime(todayRecord?.checkIn)}
              </Text>
            </View>
            <View className="flex-1 items-end justify-center">
              <Text className="text-[12px] text-slate-500 font-semibold uppercase tracking-widest mb-1 text-right">Check Out</Text>
              <Text className="text-[13px] font-semibold text-[#011023] uppercase truncate text-right" numberOfLines={1}>
                {formatDateTime(todayRecord?.checkOut)}
              </Text>
            </View>
          </View>
        </View>

        {/* Active Tasks Section */}
        <View style={{ marginBottom: 3 }} >
          <View style={{ marginHorizontal: 0.5 }} className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-slate-800 uppercase tracking-widest text-[12px] ml-1">Pending Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/tabs/task')} className="flex-row items-center">
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">View All</Text>
              <ChevronRight size={13} color="#94a3b8" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {activeTasks.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-2xl p-6 mb-3 items-center justify-center">
              <CheckCircle size={26} color="#94a3b8" strokeWidth={2} />
              <Text className="text-slate-400 font-bold uppercase text-[11px] tracking-wider mt-2.5">No Active Tasks Assigned</Text>
            </View>
          ) : (
            activeTasks.slice(0, 2).map((task) => (
              <TouchableOpacity
                key={task._id}
                onPress={() => router.push('/tabs/task')}
                className="bg-white border border-slate-200 rounded-2xl mb-3"
                style={{
                  elevation: 2,
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  shadowColor: '#64748b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 5
                }}
              >
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="font-bold text-slate-800 text-[15px] uppercase" numberOfLines={1}>{task.bookingId || 'Vehicle Service'}</Text>
                  <View
                    className="border rounded-full items-center justify-center"
                    style={{
                      backgroundColor: getTaskStatusStyle(task.status).backgroundColor,
                      borderColor: getTaskStatusStyle(task.status).borderColor,
                      paddingHorizontal: 8,
                      paddingVertical: 1.5,
                      borderWidth: 1
                    }}
                  >
                    <Text
                      className="font-bold uppercase text-[9px]"
                      style={{ color: getTaskStatusStyle(task.status).textColor, fontSize: 10.5, marginTop: -1.5 }}
                    >
                      {task.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-slate-700 font-semibold text-[12px] uppercase mb-1" numberOfLines={1}>
                  Service: {task.service?.title || 'General Repair'}
                </Text>
                <View className="flex-row items-center gap-1">
                  {/* <Clock size={11} color="#94a3b8" /> */}
                  <Text className="text-slate-500 font-semibold uppercase text-[10px]">
                    Booked at: {task.schedule?.date || formatLocalDate(task.createdAt || task.date)} | {task.schedule?.time || new Date(task.createdAt || task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Leave Status Section */}
        <View className="">
          <View style={{ marginHorizontal: 0.5 }} className="flex-row justify-between items-center">
            <Text className="font-bold text-slate-800 uppercase tracking-widest text-[12px] ml-1">Recent Leaves</Text>
            <TouchableOpacity onPress={() => router.push('/tabs/leave')} className="flex-row items-center">
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">View All</Text>
              <ChevronRight size={13} color="#94a3b8" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {leaves.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-2xl p-6 mt-3 items-center justify-center">
              <FileText size={26} color="#94a3b8" strokeWidth={2} />
              <Text className="text-slate-400 font-bold uppercase text-[11px] tracking-wider mt-2.5">No Leave History Available</Text>
            </View>
          ) : (
            leaves.slice(0, 2).map((leave) => (
              <TouchableOpacity
                key={leave._id}
                onPress={() => router.push('/tabs/leave')}
                className="bg-white border border-slate-200 rounded-2xl p-4 mt-3 flex-row justify-between items-center"
                style={{
                  elevation: 2,
                  shadowColor: '#64748b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 5
                }}
              >
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-slate-800 text-[13.5px] uppercase" numberOfLines={1}>{leave.reason || 'Personal Leave'}</Text>
                  <Text className="text-slate-500 font-semibold uppercase text-[10px] mt-1 tracking-wide">
                    From: {leave.startDate} to {leave.endDate}
                  </Text>
                </View>
                <View
                  className="border rounded-full"
                  style={{
                    backgroundColor: getLeaveStatusStyle(leave.status).backgroundColor,
                    borderColor: getLeaveStatusStyle(leave.status).borderColor,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderWidth: 1
                  }}
                >
                  <Text
                    className="font-semibold uppercase"
                    style={{ color: getLeaveStatusStyle(leave.status).textColor, fontSize: 10.5 }}
                  >
                    {leave.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </View>
    </ScrollView>
  );
}