import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, TrendingDown, CheckCircle, Clock, ClipboardList } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function AnalyticsScreen() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        const empId = user.employeeId || user.id || user._id;
        fetchAnalyticsData(empId, true);
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
          fetchAnalyticsData(empId);
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

  const fetchAnalyticsData = async (empId: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [recordsRes, bookingsRes, leavesRes] = await Promise.all([
        axios.get(`${API_URL}/api/attendance/employee/${empId}`),
        axios.get(`${API_URL}/api/bookings/employee/${empId}`),
        axios.get(`${API_URL}/api/leaves/employee/${empId}`)
      ]);

      if (recordsRes.data.success) {
        const attendanceData = recordsRes.data.data || [];
        setRecords(attendanceData);
        const presentCount = attendanceData.filter((r: any) => r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime').length;
        const totalCount = attendanceData.length;
        setAttendanceRate(totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0);
      }
      if (bookingsRes.data.success) {
        setTasks(bookingsRes.data.data || []);
      }
      if (leavesRes.data.success) {
        setLeaves(leavesRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    if (user) {
      setRefreshing(true);
      fetchAnalyticsData(user.employeeId || user.id || user._id, true);
    }
  }, [user]);

  // Calculations for dynamic statistics
  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Delivered').length;
  const totalTasksCount = tasks.length;

  // Helper to parse serviceDuration string (e.g. "2 hours", "30 mins") to milliseconds
  const parseServiceDuration = (durationStr: string): number => {
    if (!durationStr) return 2 * 60 * 60 * 1000; // default 2 hours fallback
    const str = durationStr.toLowerCase().trim();
    const numMatch = str.match(/[\d.]+/);
    if (!numMatch) return 2 * 60 * 60 * 1000;
    const val = parseFloat(numMatch[0]);

    if (str.includes('min')) {
      return val * 60 * 1000;
    }
    if (str.includes('hour') || str.includes('hr')) {
      return val * 60 * 60 * 1000;
    }
    if (str.includes('day')) {
      return val * 24 * 60 * 60 * 1000;
    }
    return val * 60 * 60 * 1000; 
  };

  // Calculate success rate: on-time completion scores 1.0, late completion gets a penalty of 0.3 (scores 0.7)
  const getTaskCompletionRate = () => {
    if (totalTasksCount === 0) return 0;
    
    // If there is only 1 task and it is completed, success rate is 100%
    if (totalTasksCount === 1 && completedTasks === 1) return 100;

    let totalScore = 0;
    tasks.forEach(task => {
      if (task.status === 'Completed' || task.status === 'Delivered') {
        const assignedMs = parseServiceDuration(task.serviceDuration);
        const createdTime = new Date(task.createdAt).getTime();
        const completedTime = new Date(task.updatedAt).getTime();
        const actualMs = completedTime - createdTime;

        if (actualMs <= assignedMs) {
          totalScore += 1.0; // On time
        } else {
          totalScore += 0.7; // Late completion penalty
        }
      }
    });

    return Math.min(100, Math.max(0, Math.round((totalScore / totalTasksCount) * 100)));
  };

  const taskCompletionRate = getTaskCompletionRate();

  // Calculate completed task growth rate (Current Month vs Previous Month)
  const getGrowthRate = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    // Calculate previous month and year
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }

    let thisMonthCount = 0;
    let prevMonthCount = 0;

    tasks.forEach(task => {
      if (task.status === 'Completed' || task.status === 'Delivered') {
        const dateStr = task.schedule?.date || task.createdAt;
        if (dateStr) {
          const taskDate = new Date(dateStr);
          if (!isNaN(taskDate.getTime())) {
            const y = taskDate.getFullYear();
            const m = taskDate.getMonth();

            if (y === currentYear && m === currentMonth) {
              thisMonthCount++;
            } else if (y === prevYear && m === prevMonth) {
              prevMonthCount++;
            }
          }
        }
      }
    });

    if (prevMonthCount === 0) {
      if (thisMonthCount === 0) {
        return '0%';
      }
      return `+${thisMonthCount * 100}%`;
    }

    const growth = ((thisMonthCount - prevMonthCount) / prevMonthCount) * 100;
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${Math.round(growth)}%`;
  };

  const growthRate = getGrowthRate();
  const isNegativeGrowth = growthRate.startsWith('-');
  const GrowthIcon = isNegativeGrowth ? TrendingDown : TrendingUp;
  const growthColor = isNegativeGrowth ? '#ef4444' : '#10b981';
  const growthBg = isNegativeGrowth ? 'bg-red-50' : 'bg-emerald-50';

  const approvedLeavesCount = leaves.filter(l => l.status === 'Approved').length;
  const presentDaysCount = records.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime').length;

  // Calculation of average work duration per present day (excluding today)
  const getAverageWorkDuration = () => {
    let totalMs = 0;
    
    // Get today's local date string in YYYY-MM-DD format
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    // Exclude today's record from both total hours and the denominator
    const pastPresentRecords = records.filter((r: any) => 
      (r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime') && r.date !== todayStr
    );
    const daysCount = pastPresentRecords.length;

    if (daysCount === 0) return '0 mins';

    pastPresentRecords.forEach((record: any) => {
      const inTime = record.checkIn ? new Date(record.checkIn).getTime() : null;
      let outTime = record.checkOut ? new Date(record.checkOut).getTime() : null;

      if (inTime) {
        if (!outTime) {
          // Fallback to standard 9-hour shift for past days with missing checkout
          outTime = inTime + (9 * 60 * 60 * 1000);
        }

        if (outTime > inTime) {
          totalMs += (outTime - inTime);
        }
      } else {
        // If manually marked present/late/overtime by admin without check-in timestamps, assume standard 9 hours
        totalMs += (9 * 60 * 60 * 1000);
      }
    });

    const avgMins = totalMs / (1000 * 60 * daysCount);
    
    if (avgMins < 60) {
      return `${Math.round(avgMins)} mins`;
    } else {
      const avgHrs = avgMins / 60;
      return `${avgHrs.toFixed(1)} hrs`;
    }
  };

  const avgWorkDuration = getAverageWorkDuration();

  // Category breakdown derivation from tasks
  const getCategoryBreakdown = () => {
    const counts: { [key: string]: number } = {};
    tasks.forEach(task => {
      const serviceTitle = task.service?.title || 'General Repair';
      counts[serviceTitle] = (counts[serviceTitle] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const categoryBreakdown = getCategoryBreakdown();
  const maxCategoryCount = categoryBreakdown.length > 0 ? Math.max(...categoryBreakdown.map(c => c.count)) : 1;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#011023" />
      </View>
    );
  }

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
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs')} className="flex-row items-center">
            <ArrowLeft size={22} color="#011023" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Center: Title */}
          <Text
            style={{ fontSize: 20 }}
            className="font-bold text-[#011023] tracking-[-0.5px] uppercase"
          >
            ANALYTICS
          </Text>

          {/* Right: Dummy View for alignment symmetry */}
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <View className="flex-1 bg-slate-50 px-5" style={{ marginTop: 17, marginBottom: 16 }}>

          {/* 2x2 Stats Grid */}
          <View style={{ gap: 12, marginTop: 0, marginBottom: 12 }}>
            {/* Row 1 */}
            <View style={{ gap: 12 }} className="flex-row">
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
                  <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{taskCompletionRate}%</Text>
                  <Text style={{ fontSize: 13.5 }} className="text-slate-400 font-semibold uppercase" numberOfLines={1}>Success Rate</Text>
                </View>
                <View className="w-10 h-10 rounded-xl bg-emerald-50 justify-center items-center">
                  <CheckCircle size={20} color="#059669" strokeWidth={2.5} />
                </View>
              </View>

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
                  <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{avgWorkDuration}</Text>
                  <Text style={{ fontSize: 13.5 }} className="text-slate-400 font-semibold uppercase text-[14px]" numberOfLines={1}>Avg Duration</Text>
                </View>
                <View className="w-10 h-10 rounded-xl bg-indigo-50 justify-center items-center">
                  <Clock size={20} color="#4f46e5" strokeWidth={2.5} />
                </View>
              </View>
            </View>

            {/* Row 2 */}
            <View style={{ gap: 12 }} className="flex-row">
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
                  <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{totalTasksCount}</Text>
                  <Text style={{ fontSize: 13.5 }} className="text-slate-400 font-semibold uppercase text-[14px]" numberOfLines={1}>Total Tasks</Text>
                </View>
                <View className="w-10 h-10 rounded-xl bg-sky-50 justify-center items-center">
                  <ClipboardList size={20} color="#0284c7" strokeWidth={2.5} />
                </View>
              </View>

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
                  <Text style={{ fontSize: 18, marginBottom: 6 }} className="font-semibold text-[#011023]">{growthRate}</Text>
                  <Text style={{ fontSize: 13.5 }} className="text-slate-400 font-semibold uppercase text-[14px]" numberOfLines={1}>Growth Rate</Text>
                </View>
                <View className={`w-10 h-10 rounded-xl ${growthBg} justify-center items-center`}>
                  <GrowthIcon size={20} color={growthColor} strokeWidth={2.5} />
                </View>
              </View>
            </View>
          </View>

          {/* Work & Attendance Summary Card (Like Shift Status Card) */}
          <View
            className="bg-white rounded-2xl border border-slate-200"
            style={{
              elevation: 3,
              paddingVertical: 15,
              paddingHorizontal: 15,
              marginBottom: 16,
              shadowColor: '#64748b',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8
            }}
          >
            <View style={{ marginBottom: 10 }} className="flex-row justify-between items-center">
              <Text className="font-bold text-slate-800 uppercase tracking-wider text-[14px]">Attendance Summary</Text>
              <View
                className="border rounded-full items-center justify-center"
                style={{
                  backgroundColor: records.length === 0 ? '#f1f5f9' : (attendanceRate >= 85 ? '#dcfce7' : '#ffe4e6'),
                  borderColor: records.length === 0 ? '#e2e8f0' : (attendanceRate >= 85 ? '#bbf7d0' : '#fecdd3'),
                  paddingHorizontal: 8,
                  paddingVertical: 1.5,
                  borderWidth: 1
                }}
              >
                <Text
                  className="font-semibold uppercase text-[10.5px]"
                  style={{ color: records.length === 0 ? '#475569' : (attendanceRate >= 85 ? '#166534' : '#be123c'), fontSize: 10.5 }}
                >
                  {records.length === 0 ? 'No Logs' : (attendanceRate >= 85 ? 'Excellent' : 'Needs Attention')}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-1 items-start justify-center">
                <Text className="text-[12px] text-slate-500 font-semibold uppercase tracking-widest mb-2">Present Days</Text>
                <Text className="text-[14px] font-semibold text-[#011023] uppercase truncate">
                  {presentDaysCount} Days
                </Text>
              </View>
              <View className="flex-1 items-end justify-center">
                <Text className="text-[12px] text-slate-500 font-semibold uppercase tracking-widest mb-2 text-right">Approved Leaves</Text>
                <Text className="text-[14px] font-semibold text-[#011023] uppercase truncate text-right">
                  {approvedLeavesCount} Requests
                </Text>
              </View>
            </View>

            {/* Attendance Progress Bar */}
            <View className="mt-1">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[11.5px] font-semibold text-slate-600 uppercase tracking-wider">Attendance Rate</Text>
                <Text className="text-[12px] font-semibold text-[#011023]">{attendanceRate}%</Text>
              </View>
              <View style={{ flexDirection: 'row' }} className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                {attendanceRate > 0 && (
                  <View
                    style={{ flex: attendanceRate, backgroundColor: '#059669' }}
                    className="h-full rounded-full"
                  />
                )}
                {attendanceRate < 100 && (
                  <View style={{ flex: 100 - attendanceRate }} />
                )}
              </View>
            </View>
          </View>

          {/* Task Categories Breakdown Section (Like Active Tasks list) */}
          <View style={{ flex: 1, marginBottom: 0 }}>
            <View style={{ marginHorizontal: 0.5 }} className="flex-row justify-between items-center mb-3">
              <Text className="font-bold text-slate-800 uppercase tracking-wide text-[13px] ml-1">Task Category Distribution</Text>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              bounces={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#011023']} />
              }
              contentContainerStyle={{ paddingBottom: 0 }}
            >
              {categoryBreakdown.length === 0 ? (
                <View className="bg-white border border-slate-200 rounded-2xl p-6 items-center justify-center">
                  <ClipboardList size={26} color="#94a3b8" strokeWidth={2} />
                  <Text className="text-slate-400 font-bold uppercase text-[11px] tracking-wider mt-2.5">No Task Data Available</Text>
                </View>
              ) : (
                categoryBreakdown.map((item) => {
                  const percentage = Math.round((item.count / totalTasksCount) * 100);
                  return (
                    <View
                      key={item.name}
                      className="bg-white border border-slate-200 rounded-2xl p-4"
                      style={{
                        marginBottom: 10.5,
                        elevation: 2,
                        shadowColor: '#64748b',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.04,
                        shadowRadius: 5
                      }}
                    >
                      <View style={{ marginBottom: 5 }} className="flex-row justify-between items-center ">
                        <Text className="font-bold text-slate-800 text-[14px] uppercase flex-1 mr-2" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={{ width: '15%', textAlign: 'right' }} className="font-semibold text-slate-700 text-[12px]">
                          {item.count} {item.count === 1 ? 'Task' : 'Tasks'}
                        </Text>
                      </View>

                      {/* Horizontal progress bar for distribution */}
                      <View className="flex-row items-center">
                        <View style={{ flexDirection: 'row' }} className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mr-3">
                          {percentage > 0 && (
                            <View
                              style={{ flex: percentage, backgroundColor: '#554ecfff' }}
                              className="h-full rounded-full"
                            />
                          )}
                          {percentage < 100 && (
                            <View style={{ flex: 100 - percentage }} />
                          )}
                        </View>
                        <Text style={{ width: 32 }} className="text-[11px] font-bold text-slate-700 text-right">
                          {percentage}%
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
    </View>
  );
}
