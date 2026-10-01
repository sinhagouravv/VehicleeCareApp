import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform, StatusBar } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { User, Clock, Calendar, ChevronRight, CheckCircle, AlertCircle, ClipboardList, FileText, ArrowRight, LogIn, LogOut } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
import { DashboardSkeleton } from '../../components/Skeleton';

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
    if (todayRecord?.isNewJoiningBlocked) {
      Alert.alert(
        'Account in Process',
        'Since you are a new employee your account is still in process, you can CHECKIN at the time of your respective shift. Thank you.'
      );
      return;
    }
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
        Alert.alert('Check-In', res.data.message || 'Check-in failed. Please try again.');
      }
    } catch (err: any) {
      console.error("Check-in error:", err);
      const serverMessage = err.response?.data?.message || err.message || 'Check-in failed. Please try again.';
      Alert.alert('Check-In', serverMessage);
      fetchDashboardData(empId, true);
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
        Alert.alert('Check-Out', res.data.message || 'Check-out failed. Please try again.');
      }
    } catch (err: any) {
      console.error("Check-out error:", err);
      const serverMessage = err.response?.data?.message || err.message || 'Check-out failed. Please try again.';
      Alert.alert('Check-Out', serverMessage);
      fetchDashboardData(empId, true);
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
  const isCheckedIn = Boolean(todayRecord && todayRecord.checkIn);
  const isCheckedOut = Boolean(todayRecord && todayRecord.checkOut);
  const isMarkedAbsent = Boolean(todayRecord && todayRecord.status === 'Absent');
  const isOnLeave = Boolean(todayRecord && todayRecord.status === 'On Leave');
  const isNewJoiningBlocked = Boolean(todayRecord && todayRecord.isNewJoiningBlocked);
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
    return <DashboardSkeleton />;
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#011023']} />
      }
    >
      <View className="px-5">

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
                <Text className="text-slate-400 font-bold uppercase text-[14px]" numberOfLines={1}>Pending Leaves</Text>
              </View>
              <View className="w-10 h-10 rounded-xl bg-amber-50 justify-center items-center">
                <Clock size={20} color="#d97706" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/tabs/attendance')}
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
                <Text className="text-slate-400 font-bold uppercase text-[14px]" numberOfLines={1}>Attendance</Text>
              </View>
              <View className="w-10 h-10 rounded-xl bg-emerald-50 justify-center items-center">
                <CheckCircle size={20} color="#059669" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Header: Active Shift / Actions */}
        <View className="mt-2 mb-3">
          <Text style={{ fontSize: 15 }} className="text-slate-400 font-semibold uppercase tracking-widest ml-1">Today's Shift</Text>
        </View>

        {/* Today's Shift & Attendance Card */}
        <View
          className="bg-white rounded-2xl border border-slate-200 p-5 mb-4"
          style={{
            elevation: 3,
            shadowColor: '#64748b',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10
          }}
        >
          <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <View>
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Date</Text>
              <Text style={{ fontSize: 15 }} className="font-bold text-[#011023] mt-0.5 uppercase">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</Text>
              <View
                className="px-3 py-1 rounded-full mt-1 border"
                style={{
                  backgroundColor: isCheckedOut ? '#ccfbf1' : isCheckedIn ? '#dcfce7' : isMarkedAbsent ? '#ffe4e6' : isOnLeave ? '#dbeafe' : isNewJoiningBlocked ? '#f1f5f9' : '#fef3c7',
                  borderColor: isCheckedOut ? '#99f6e4' : isCheckedIn ? '#bbf7d0' : isMarkedAbsent ? '#fecdd3' : isOnLeave ? '#bfdbfe' : isNewJoiningBlocked ? '#e2e8f0' : '#fde68a'
                }}
              >
                <Text
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: isCheckedOut ? '#115e59' : isCheckedIn ? '#166534' : isMarkedAbsent ? '#be123c' : isOnLeave ? '#1d4ed8' : isNewJoiningBlocked ? '#475569' : '#92400e' }}
                >
                  {isCheckedOut ? 'Completed' : isCheckedIn ? (todayRecord?.status === 'Late' ? 'Late' : 'Active Shift') : isMarkedAbsent ? 'Absent' : isOnLeave ? 'On Leave' : isNewJoiningBlocked ? 'New Joining' : 'Not Checked In'}
                </Text>
              </View>
            </View>
          </View>

          {/* Time Check-in / Check-out Details */}
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Check In</Text>
              <Text style={{ fontSize: 16 }} className="font-bold text-[#011023]">
                {isCheckedIn ? formatTime(todayRecord.checkIn) : '--:--'}
              </Text>
            </View>
            <View className="h-8 w-[1px] bg-slate-200" />
            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Check Out</Text>
              <Text style={{ fontSize: 16 }} className="font-bold text-[#011023]">
                {isCheckedOut ? formatTime(todayRecord.checkOut) : '--:--'}
              </Text>
            </View>
          </View>

          {/* Punch Button */}
          {/* {isCheckedOut ? (
            <View className="bg-slate-100 py-3.5 rounded-xl items-center">
              <Text className="font-bold text-slate-500 uppercase tracking-widest text-xs">Shift Finished for Today</Text>
            </View>
          ) : isMarkedAbsent ? (
            <View className="bg-red-50 border border-red-100 py-3.5 rounded-xl items-center flex-row justify-center">
              <AlertCircle size={18} color="#ef4444" strokeWidth={2.5} />
              <Text className="font-bold text-red-600 uppercase tracking-wider text-xs ml-2">Marked Absent for Today</Text>
            </View>
          ) : isOnLeave ? (
            <View className="bg-blue-50 border border-blue-100 py-3.5 rounded-xl items-center flex-row justify-center">
              <Calendar size={18} color="#2563eb" strokeWidth={2.5} />
              <Text className="font-bold text-blue-600 uppercase tracking-wider text-xs ml-2">On Approved Leave</Text>
            </View>
          ) : isNewJoiningBlocked ? (
            <View className="bg-slate-100 py-3.5 rounded-xl items-center">
              <Text className="font-bold text-slate-500 uppercase tracking-widest text-xs">Account in Process</Text>
            </View>
          ) : isCheckedIn ? (
            <TouchableOpacity
              onPress={handleCheckOut}
              disabled={actionLoading}
              className="bg-red-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-sm"
              style={{ opacity: actionLoading ? 0.7 : 1 }}
            >
              <LogOut size={18} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white font-bold uppercase tracking-wider text-sm ml-2">
                {actionLoading ? 'Checking Out...' : 'Check Out Now'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCheckIn}
              disabled={actionLoading}
              className="bg-[#1d9871ff] py-3.5 rounded-xl flex-row justify-center items-center shadow-sm"
              style={{ opacity: actionLoading ? 0.7 : 1 }}
            >
              <LogIn size={18} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white font-bold uppercase tracking-wider text-sm ml-2">
                {actionLoading ? 'Checking In...' : 'Check In Now'}
              </Text>
            </TouchableOpacity>
          )} */}
        </View>

        {/* Section Header: Today's Tasks */}
        <View className="flex-row justify-between items-center mb-3 mt-2">
          <Text style={{ fontSize: 15 }} className="text-slate-400 font-semibold uppercase tracking-widest ml-1">Today's Assigned Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/tabs/task')}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">View All</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Task List */}
        {todayTasks.length === 0 ? (
          <View className="bg-white rounded-2xl border border-slate-200 p-6 items-center justify-center mb-4">
            <ClipboardList size={32} color="#94a3b8" strokeWidth={1.5} />
            <Text className="text-slate-400 font-bold uppercase tracking-wider text-xs mt-2">No tasks assigned for today</Text>
          </View>
        ) : (
          todayTasks.slice(0, 3).map((task) => {
            const taskStyle = getTaskStatusStyle(task.status);
            return (
              <TouchableOpacity
                key={task._id}
                onPress={() => router.push({ pathname: '/screens/details', params: { bookingId: task.bookingId } })}
                className="bg-white rounded-2xl border border-slate-200 p-4 mb-3"
                style={{
                  elevation: 2,
                  shadowColor: '#64748b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 5
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-2">
                    <Text style={{ fontSize: 15 }} className="font-bold text-[#011023] uppercase" numberOfLines={1}>
                      {task.service?.title || 'Vehicle Service'}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-400 mt-0.5 uppercase">
                      {task.vehicle?.model ? `${task.vehicle?.make || ''} ${task.vehicle?.model}` : 'Vehicle Care'}
                    </Text>
                  </View>
                  <View
                    className="px-2.5 py-1 rounded-full border"
                    style={{ backgroundColor: taskStyle.backgroundColor, borderColor: taskStyle.borderColor }}
                  >
                    <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: taskStyle.textColor }}>
                      {task.status}
                    </Text>
                  </View>
                </View>

                <View className="pt-2 mt-1 border-t border-slate-100 flex-row justify-between items-center">
                  <Text className="text-[11px] font-semibold text-slate-500 uppercase">
                    ID: {task.bookingId || task._id?.substring(0, 8)}
                  </Text>
                  <Text className="text-[11px] font-bold text-slate-700 uppercase">
                    {task.schedule?.timeSlot || 'Scheduled'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

      </View>
    </ScrollView>
  );
}