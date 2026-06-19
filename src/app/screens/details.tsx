import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { ArrowLeft, Check, UserCheck, Clock, Zap, Calendar, UserX, Info, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function DetailsScreen() {
  const [tempFilterStatus, setTempFilterStatus] = useState('Select ');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          fetchDetailsData(empId);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Error loading user in details', e);
      setLoading(false);
    }
  };

  const fetchDetailsData = async (empId: string) => {
    try {
      setLoading(true);
      const [recordsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/attendance/employee/${empId}`),
        axios.get(`${API_URL}/api/bookings/employee/${empId}`)
      ]);
      if (recordsRes.data.success) {
        setRecords(recordsRes.data.data || []);
      }
      if (bookingsRes.data.success) {
        setTasks(bookingsRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch details data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for dynamic statistics
  const presentCount = records.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const overtimeCount = records.filter(r => r.status === 'Overtime').length;
  const standardPresentCount = records.filter(r => r.status === 'Present').length;
  const leaveRecordsCount = records.filter(r => r.status === 'On Leave').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const totalCount = records.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const getConsistencyStatus = (rate: number) => {
    if (totalCount === 0) {
      return {
        title: 'No Workdays Tracked',
        desc: 'Your attendance consistency will calculate after your first shift.',
        badgeBg: 'bg-slate-50',
        badgeBorder: 'border-slate-100',
        text: 'text-slate-500'
      };
    }
    if (rate >= 90) {
      return {
        title: 'Excellent Consistency',
        desc: 'Your attendance rating is currently in high standing.',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-100',
        text: 'text-emerald-600'
      };
    } else if (rate >= 75) {
      return {
        title: 'Good Standing',
        desc: 'Your attendance is in good standing, keep it up.',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-100',
        text: 'text-amber-600'
      };
    } else {
      return {
        title: 'Requires Attention',
        desc: 'Your attendance rating is below target thresholds.',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-100',
        text: 'text-rose-600'
      };
    }
  };

  // Average Duration Calculations
  const getAverageMins = () => {
    let totalMs = 0;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const pastPresentRecords = records.filter((r: any) => 
      (r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime') && r.date !== todayStr
    );
    const daysCount = pastPresentRecords.length;

    if (daysCount === 0) return 0;

    pastPresentRecords.forEach((record: any) => {
      const inTime = record.checkIn ? new Date(record.checkIn).getTime() : null;
      let outTime = record.checkOut ? new Date(record.checkOut).getTime() : null;

      if (inTime) {
        if (!outTime) {
          outTime = inTime + (9 * 60 * 60 * 1000);
        }
        if (outTime > inTime) {
          totalMs += (outTime - inTime);
        }
      } else {
        totalMs += (9 * 60 * 60 * 1000);
      }
    });

    return totalMs / (1000 * 60 * daysCount);
  };

  const avgMins = getAverageMins();
  const pastPresentRecordsCount = records.filter((r: any) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    return (r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime') && r.date !== todayStr;
  }).length;

  const getDurationString = (mins: number) => {
    if (mins === 0) return '0h';
    if (mins < 60) {
      return `${Math.round(mins)}m`;
    } else {
      const hrs = mins / 60;
      return `${hrs.toFixed(1)}h`;
    }
  };

  const avgDurationStr = getDurationString(avgMins);

  const getDurationStatus = (mins: number) => {
    if (mins === 0) {
      return {
        title: 'No Work Duration',
        desc: 'No past workday logs available to calculate duration.',
        badgeBg: 'bg-slate-50',
        badgeBorder: 'border-slate-100',
        text: 'text-slate-500',
        indicatorBg: 'bg-slate-400'
      };
    } else if (mins >= 540) { // >= 9 hours
      return {
        title: 'Optimal Duration',
        desc: 'Your average daily shift duration meets target expectations.',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-100',
        text: 'text-emerald-600',
        indicatorBg: 'bg-emerald-500'
      };
    } else if (mins >= 480) { // >= 8 hours
      return {
        title: 'Standard Duration',
        desc: 'Your average daily shift duration is in standard standing.',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-100',
        text: 'text-amber-600',
        indicatorBg: 'bg-amber-500'
      };
    } else {
      return {
        title: 'Short Duration',
        desc: 'Your average daily shift duration is below target expectations.',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-100',
        text: 'text-rose-600',
        indicatorBg: 'bg-rose-500'
      };
    }
  };

  const durationStatusStyle = getDurationStatus(avgMins);

  // Success Rate Calculations
  const completedTasks = tasks.filter((t: any) => t.status === 'Completed' || t.status === 'Delivered').length;
  const totalTasksCount = tasks.length;

  const parseServiceDuration = (durationStr: string): number => {
    if (!durationStr) return 2 * 60 * 60 * 1000;
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

  const getTaskCompletionRate = () => {
    if (totalTasksCount === 0) return 0;
    if (totalTasksCount === 1 && completedTasks === 1) return 100;

    let totalScore = 0;
    tasks.forEach((task: any) => {
      if (task.status === 'Completed' || task.status === 'Delivered') {
        const assignedMs = parseServiceDuration(task.serviceDuration);
        const createdTime = new Date(task.createdAt).getTime();
        const completedTime = new Date(task.updatedAt).getTime();
        const actualMs = completedTime - createdTime;

        if (actualMs <= assignedMs) {
          totalScore += 1.0;
        } else {
          totalScore += 0.7; // Late completion penalty
        }
      }
    });

    return Math.min(100, Math.max(0, Math.round((totalScore / totalTasksCount) * 100)));
  };

  const taskCompletionRate = getTaskCompletionRate();

  const getSuccessRateStatus = (rate: number) => {
    if (rate >= 90) {
      return {
        title: 'Excellent Efficiency',
        desc: 'Task delivery metrics indicate extremely high efficiency.',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-100',
        text: 'text-emerald-600',
        indicatorBg: 'bg-emerald-500'
      };
    } else if (rate >= 75) {
      return {
        title: 'Good Performance',
        desc: 'Most tasks are completed within expected timeframe targets.',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-100',
        text: 'text-amber-600',
        indicatorBg: 'bg-amber-500'
      };
    } else {
      return {
        title: 'Requires Improvement',
        desc: 'A significant number of tasks were completed late or remain pending.',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-100',
        text: 'text-rose-600',
        indicatorBg: 'bg-rose-500'
      };
    }
  };

  const successStatusStyle = getSuccessRateStatus(taskCompletionRate);

  const getTaskStatusStyle = (status: any) => {
    switch (status) {
      case 'Delivered': return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' };
      case 'Completed': return { backgroundColor: '#ccfbf1', borderColor: '#99f6e4' };
      default: return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' };
    }
  };

  const getTaskStatusTextColor = (status: any) => {
    switch (status) {
      case 'Delivered': return '#166534';
      case 'Completed': return '#115e59';
      default: return '#1e293b';
    }
  };

  const getRecordBadgeInfo = (status: string) => {
    switch (status) {
      case 'Present':
        return {
          label: 'Present',
          backgroundColor: '#dcfce7',
          borderColor: '#bbf7d0',
          textColor: '#166534'
        };
      case 'Late':
        return {
          label: 'Late',
          backgroundColor: '#ffedd5',
          borderColor: '#fed7aa',
          textColor: '#c2410c'
        };
      case 'Overtime':
        return {
          label: 'Overtime',
          backgroundColor: '#e0e7ff',
          borderColor: '#c7d2fe',
          textColor: '#4338ca'
        };
      default:
        return {
          label: status || 'Unknown',
          backgroundColor: '#f1f5f9',
          borderColor: '#e2e8f0',
          textColor: '#475569'
        };
    }
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
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

    console.log(`[getRecordDurationMins] date=${record.date} inTime=${record.checkIn} outTime=${record.checkOut} durationMs=${durationMs} mins=${durationMs / (1000 * 60)}`);
    return durationMs / (1000 * 60);
  };

  const formatRecordDuration = (record: any) => {
    const totalMins = getRecordDurationMins(record);
    let result = '';
    if (totalMins < 60) {
      result = `${Math.round(totalMins)} ${Math.round(totalMins) !== 1 ? 'mins' : 'min'}`;
    } else {
      const hrs = Math.floor(totalMins / 60);
      const mins = Math.floor(totalMins % 60);
      const formattedMins = String(mins).padStart(2, '0');
      result = `${hrs}.${formattedMins} ${hrs !== 1 ? 'hrs' : 'hr'}`;
    }
    console.log(`[formatRecordDuration] result=${result}`);
    return result;
  };

  const statusStyle = getConsistencyStatus(attendanceRate);

  const renderContent = () => {
    switch (tempFilterStatus) {
      case 'Attendance Rate':
        return (
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }} className="flex-1 px-5">
            {/* Header Score Card */}
            <View style={{paddingVertical: 12, paddingHorizontal: 18 }} className="bg-white rounded-2xl mb-4 shadow-sm border border-slate-100">
              <View className="flex-row items-center">
                {/* Score Text details */}
                <View className="mr-5 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text style={{fontSize: 17 }} className="text-[#011023] font-semibold uppercase tracking-widest">{statusStyle.title}</Text>
                  </View>
                  <Text className="text-slate-500 text-xs mt-1 uppercase leading-[13px]">{statusStyle.desc}</Text>
                  
                  {/* Simple text info metric count */}
                  <Text style={{fontSize: 12 }} className="text-slate-700 font-semibold uppercase tracking-wide mt-2">
                    {presentCount} of {totalCount} workdays present
                  </Text>
                </View>

                {/* Visual Circle Gauge */}
                <View className="w-20 h-20 justify-center items-center relative shadow-sm">
                  <Svg width={80} height={80}>
                    {/* Track Circle */}
                    <Circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke={totalCount === 0 ? '#f1f5f9' : (attendanceRate >= 90 ? '#e6fbf4' : attendanceRate >= 75 ? '#fffbeb' : '#fff1f2')}
                      strokeWidth="5"
                      fill={totalCount === 0 ? '#f1f5f9' : (attendanceRate >= 90 ? '#e6fbf4' : attendanceRate >= 75 ? '#fffbeb' : '#fff1f2')}
                    />
                    {/* Fill Circle */}
                    <Circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke={totalCount === 0 ? '#94a3b8' : (attendanceRate >= 90 ? '#10b981' : attendanceRate >= 75 ? '#f59e0b' : '#f43f5e')}
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={213.6}
                      strokeDashoffset={213.6 - (213.6 * attendanceRate) / 100}
                      strokeLinecap="round"
                      origin="40, 40"
                      rotation="-90"
                    />
                  </Svg>
                  <View className="justify-center items-center absolute">
                    <Text className={`${statusStyle.text} font-semibold text-xl`}>{attendanceRate}%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tracked Days Grid */}
            <Text style={{fontSize: 13 }} className="text-slate-400 font-semibold uppercase tracking-wider mb-3 ml-1">Tracked Days Breakdown</Text>
            
            <View style={{ gap: 12, marginTop: 0, marginBottom: 12 }}>
              {/* Row 1 */}
              <View style={{ gap: 12 }} className="flex-row">
                {/* Standard Present */}
                <View
                  className="flex-1 bg-white rounded-2xl border border-slate-200 flex-row items-center justify-between"
                  style={{
                    elevation: 2,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06, 
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    shadowRadius: 6
                  }}
                >
                  <View className="flex-1 pr-2">
                    <Text style={{ fontSize: 16, marginBottom: 6 }} className="font-semibold text-[#011023]">
                      {standardPresentCount} {standardPresentCount > 1 ? 'DAYS' : 'DAY'}
                    </Text>
                    <Text style={{ fontSize: 13 }} className="text-slate-400 font-semibold uppercase" numberOfLines={1}>
                      Present
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-xl bg-emerald-50 justify-center items-center">
                    <UserCheck size={20} color="#10b981" strokeWidth={2.5} />
                  </View>
                </View>

                {/* Late Arrivals */}
                <View
                  className="flex-1 bg-white rounded-2xl border border-slate-200 flex-row items-center justify-between"
                  style={{
                    elevation: 2,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    shadowOpacity: 0.06,
                    shadowRadius: 6
                  }}
                >
                  <View className="flex-1 pr-2">
                    <Text style={{ fontSize: 16, marginBottom: 6 }} className="font-semibold text-[#011023]">
                      {lateCount} {lateCount > 1 ? 'DAYS' : 'DAY'}
                    </Text>
                    <Text style={{ fontSize: 13 }} className="text-slate-400 font-semibold uppercase" numberOfLines={1}>
                      Late 
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-xl bg-amber-50 justify-center items-center">
                    <Clock size={20} color="#f59e0b" strokeWidth={2.5} />
                  </View>
                </View>
              </View>

              {/* Row 2 */}
              <View style={{ gap: 12 }} className="flex-row">
                {/* Overtime */}
                <View
                  className="flex-1 bg-white rounded-2xl border border-slate-200 flex-row items-center justify-between"
                  style={{
                    elevation: 2,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    shadowOpacity: 0.06,
                    shadowRadius: 6
                  }}
                >
                  <View className="flex-1 pr-2">
                    <Text style={{ fontSize: 16, marginBottom: 6 }} className="font-semibold text-[#011023]">
                      {overtimeCount} {overtimeCount > 1 ? 'DAYS' : 'DAY'}
                    </Text>
                    <Text style={{ fontSize: 13 }} className="text-slate-400 font-semibold uppercase" numberOfLines={1}>
                      Overtime
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-xl bg-indigo-50 justify-center items-center">
                    <Zap size={20} color="#6366f1" strokeWidth={2.5} />
                  </View>
                </View>

                {/* Excused Leave */}
                <View
                  className="flex-1 bg-white rounded-2xl border border-slate-200 flex-row items-center justify-between"
                  style={{
                    elevation: 2,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    shadowOpacity: 0.06,
                    shadowRadius: 6
                  }}
                >
                  <View className="flex-1 pr-2">
                    <Text style={{ fontSize: 16, marginBottom: 6 }} className="font-semibold text-[#011023]">
                      {leaveRecordsCount} {leaveRecordsCount > 1 ? 'DAYS' : 'DAY'}
                    </Text>
                    <Text style={{ fontSize: 13 }} className="text-slate-400 font-semibold uppercase" numberOfLines={1}>
                      On Leave
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-xl bg-blue-50 justify-center items-center">
                    <Calendar size={20} color="#3b82f6" strokeWidth={2.5} />
                  </View>
                </View>
              </View>
            </View>

            {/* Unexcused Absences */}
            <View
              className="bg-white rounded-2xl border border-slate-200 flex-row items-center justify-between"
              style={{
                elevation: 2,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                paddingVertical: 10,
                paddingHorizontal: 15,
                shadowRadius: 6,
                marginBottom: 12
              }}
            >
              <View className="flex-1 pr-2">
                <Text style={{ fontSize: 16, marginBottom: 6 }} className="font-semibold text-[#011023]">
                  {absentCount} {absentCount > 1 ? 'DAYS' : 'DAY'}
                </Text>
                <Text style={{ fontSize: 13 }} className="text-slate-400 font-semibold tracking-wider uppercase">
                  Absent (Unexcused)
                </Text>
              </View>
              <View className={`rounded-full px-3 py-1 border ${absentCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <Text className={`${absentCount > 0 ? 'text-rose-600' : 'text-emerald-600'} text-[11px] font-semibold uppercase`}>
                  {absentCount > 0 ? 'Penalty Applied' : 'No Penalties'}
                </Text>
              </View>
            </View>

            {/* Justification Text Info */}
            <Text style={{fontSize: 13 }} className="text-slate-400 font-semibold uppercase tracking-wider mb-3 ml-1">Justification Details</Text>
            
            <View style={{ paddingVertical: 12, paddingHorizontal: 15,}} className="bg-white rounded-3xl border border-slate-100 shadow-sm gap-4">
              <View className="flex-row items-start">
                <View className="flex-1">
                  <Text style={{ fontSize: 15.5, paddingBottom: 10 }} className="text-[#011023] font-semibold uppercase">Excused Absence Policy</Text>
                  <Text className="text-slate-500 text-[12px] mt-1  text-justify uppercase leading-[18px]">
                    Approved leave days are tracked in the database to maintain workplace records, but they are not calculated as active 'Present' days. Taking leave increases total tracked days, meaning it will show as an excused absence.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start border-t border-slate-100 pt-">
                <View className="flex-1">
                  <Text style={{ fontSize: 15.5, paddingBottom: 10 }} className="text-[#011023] font-semibold text-[13px] uppercase">Late & Overtime Inclusion</Text>
                  <Text className="text-slate-500 text-[12px] mt-1 text-justify uppercase leading-[18px]">
                    To support flexible shifts and reward extra effort, both 'Late' check-ins and 'Overtime' check-outs count fully as positive presence toward your attendance rate, protecting your consistency rating.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      case 'Average Duration':
        const durationStrokeColor = avgMins === 0 ? '#94a3b8' : (avgMins >= 540 ? '#10b981' : (avgMins >= 480 ? '#f59e0b' : '#f43f5e'));
        const durationTrackColor = avgMins === 0 ? '#f1f5f9' : (avgMins >= 540 ? '#e6fbf4' : (avgMins >= 480 ? '#fffbeb' : '#fff1f2'));
        const durationPercentage = Math.min(100, Math.max(0, (avgMins / 1440) * 100));

        return (
          <View className="flex-1 px-5">
            {/* Header Score Card */}
            <View style={{paddingVertical: 12, paddingHorizontal: 18 }} className="bg-white rounded-2xl mb-3 shadow-sm border border-slate-100">
              <View className="flex-row items-center">
                {/* Score Text details */}
                <View className="mr-5 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text style={{fontSize: 16 }} className="text-[#011023] font-semibold uppercase tracking-widest">{durationStatusStyle.title}</Text>
                  </View>
                  <Text className="text-slate-500 text-xs mt-1 uppercase leading-[13px]">{durationStatusStyle.desc}</Text>
                  
                  {/* Simple text info metric count */}
                  <Text style={{fontSize: 12 }} className="text-slate-700 font-semibold uppercase tracking-wide mt-2">
                    Average across {pastPresentRecordsCount} {pastPresentRecordsCount > 1 ? 'workdays' : 'workday'}
                  </Text>
                </View>

                {/* Visual Circle Gauge */}
                <View className="w-20 h-20 justify-center items-center relative shadow-sm">
                  <Svg width={80} height={80}>
                    {/* Track Circle */}
                    <Circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke={durationTrackColor}
                      strokeWidth="5"
                      fill={durationTrackColor}
                    />
                    {/* Fill Circle */}
                    <Circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke={durationStrokeColor}
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={213.6}
                      strokeDashoffset={213.6 - (213.6 * durationPercentage) / 100}
                      strokeLinecap="round"
                      origin="40, 40"
                      rotation="-90"
                    />
                  </Svg>
                  <View className="justify-center items-center absolute">
                    <Text className={`${durationStatusStyle.text} font-semibold text-lg`}>{avgDurationStr}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* List of Attendance Records */}
            <Text style={{fontSize: 13 }} className="text-slate-400 font-semibold uppercase tracking-wider mb-3 ml-1">Daily Log Details</Text>
            
            <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ marginBottom: 1 }} className="flex-1">
              <View style={{ gap: 12, paddingBottom: 15 }}>
                {[...records]
                  .filter((r: any) => r.status === 'Present' || r.status === 'Late' || r.status === 'Overtime')
                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record: any) => {
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
            </ScrollView>
          </View>
        );
      case 'Growth Rate':
        return (
          <View className="flex-1 p-5 w-full">
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[150px] justify-center items-center">
              <Text className="text-[#011023] font-bold text-lg uppercase tracking-wide mb-2">Growth Rate Section</Text>
              <Text className="text-slate-400 text-sm text-center">Place your growth rate details content here.</Text>
            </View>
          </View>
        );
      case 'Success Rate':
        const filteredTasks = [...tasks]
          .filter((t: any) => t.status === 'Completed' || t.status === 'Delivered')
          .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

        return (
          <View className="flex-1 px-5">
            {/* Header Score Card */}
            <View style={{paddingVertical: 12, paddingHorizontal: 18 }} className="bg-white rounded-2xl mb-3 shadow-sm border border-slate-100">
              <View className="flex-row items-center">
                {/* Score Text details */}
                <View className="mr-5 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text style={{fontSize: 16 }} className="text-[#011023] font-semibold uppercase tracking-wider">{successStatusStyle.title}</Text>
                  </View>
                  <Text className="text-slate-500 text-xs mt-1 uppercase leading-[11px]">{successStatusStyle.desc}</Text>
                  
                  {/* Simple text info metric count */}
                  <Text style={{fontSize: 12 }} className="text-slate-700 font-semibold uppercase tracking-wide mt-2">
                    Completed {completedTasks} of {totalTasksCount} {totalTasksCount > 1 ? 'tasks' : 'task'}
                  </Text>
                </View>

                {/* Visual Circle Gauge */}
                <View className="w-20 h-20 justify-center items-center relative shadow-sm">
                  <Svg width={80} height={80}>
                    {/* Track Circle */}
                    <Circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke={taskCompletionRate >= 90 ? '#e6fbf4' : taskCompletionRate >= 75 ? '#fffbeb' : '#fff1f2'}
                      strokeWidth="5"
                      fill={taskCompletionRate >= 90 ? '#e6fbf4' : taskCompletionRate >= 75 ? '#fffbeb' : '#fff1f2'}
                    />
                    {/* Fill Circle */}
                    <Circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke={taskCompletionRate >= 90 ? '#10b981' : taskCompletionRate >= 75 ? '#f59e0b' : '#f43f5e'}
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={213.6}
                      strokeDashoffset={213.6 - (213.6 * taskCompletionRate) / 100}
                      strokeLinecap="round"
                      origin="40, 40"
                      rotation="-90"
                    />
                  </Svg>
                  <View className="justify-center items-center absolute">
                    <Text className={`${successStatusStyle.text} font-semibold text-lg`}>{taskCompletionRate}%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* List of Tasks */}
            <Text style={{fontSize: 13 }} className="text-slate-400 font-semibold uppercase tracking-wider mb-3 ml-1">Task Details</Text>
            
            <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }} style={{ marginBottom: 15 }} className="flex-1">
              {filteredTasks.length === 0 ? (
                <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 justify-center items-center">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">No completed or delivered tasks</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {filteredTasks.map((task: any) => {
                    const badgeBgBorder = getTaskStatusStyle(task.status);
                    const badgeTextColor = getTaskStatusTextColor(task.status);
                    const assignedMs = parseServiceDuration(task.serviceDuration);
                    const createdTime = new Date(task.createdAt).getTime();
                    const completedTime = new Date(task.updatedAt).getTime();
                    const actualMs = completedTime - createdTime;
                    const isTaskHelpful = actualMs <= assignedMs;
                    const isOverride = totalTasksCount === 1 && completedTasks === 1;
                    const taskPercentage = (isTaskHelpful || isOverride) ? 100 : 30;
                    const showTrendingUp = isTaskHelpful || isOverride;

                    return (
                      <View
                        key={task.id || task._id || task.bookingId}
                        className="bg-white rounded-2xl border border-slate-200"
                        style={{
                          elevation: 2,
                          shadowColor: '#64748b',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.06,
                          paddingVertical: 11,
                          paddingHorizontal: 15,
                          shadowRadius: 6,
                        }}
                      >
                        {/* Top Row: Booking ID & Status Badge */}
                        <View className="flex-row items-center justify-between" style={{ marginBottom: 7 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600' }} className="font-semibold text-[#011023] uppercase tracking-wider">
                            {task.bookingId}
                          </Text>
                          <View className="flex-row items-center" style={{ gap: 8 }}>
                            {/* Trend/Percentage Indicator */}
                            <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: showTrendingUp ? '#e6fbf4' : '#fff1f2',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 12,
                              gap: 4
                            }}>
                              {showTrendingUp ? (
                                <>
                                  <TrendingUp size={14} color="#10b981" />
                                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#10b981' }}>{taskPercentage}%</Text>
                                </>
                              ) : (
                                <>
                                  <TrendingDown size={14} color="#f43f5e" />
                                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#f43f5e' }}>-{taskPercentage}%</Text>
                                </>
                              )}
                            </View>

                            {/* Status Badge */}
                            <View style={{ borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2.5, backgroundColor: badgeBgBorder.backgroundColor, borderColor: badgeBgBorder.borderColor }} className="rounded-full">
                              <Text style={{ color: badgeTextColor }} className="text-[11px] font-semibold uppercase">
                                {task.status}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Customer & Vehicle Info */}
                        <View style={{ marginBottom: 5 }} className="flex-row justify-between">
                          <View className="flex-1 border-r border-slate-200 pr-3 items-start justify-center">
                            <Text className="text-[13.5px] font-semibold text-[#011023] uppercase truncate mb-1" numberOfLines={1}>
                              {task.user?.name}
                            </Text>
                            <Text className="text-[12px] text-slate-500 font-semibold">
                              {task.user?.phone}
                            </Text>
                          </View>

                          <View className="flex-1 pl-3 justify-center" style={{ alignItems: 'flex-end' }}>
                            <Text className="text-[13px] font-semibold text-[#011023] uppercase truncate mb-1" numberOfLines={1}>
                              {task.vehicle?.make}
                            </Text>
                            <Text className="text-[11px] text-slate-500 font-semibold uppercase">
                              {task.vehicle?.model} | {task.vehicle?.year}
                            </Text>
                          </View>
                        </View>

                        {/* Service Info */}
                        <View style={{ marginTop: 2 }}>
                          <Text className="text-[13.5px] font-semibold text-[#011023] uppercase" numberOfLines={1}>
                            {task.service?.title}
                          </Text>
                          <Text className="text-[12px] text-slate-500 uppercase mt-1 font-medium">
                            {task.schedule?.date} at {task.schedule?.time}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        );
      default:
        return (
          <View className="flex-1 justify-center items-center p-8">
            {/* <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest text-center">Please select a metric to view details</Text> */}
          </View>
        );
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {isStatusDropdownOpen && (
        <TouchableWithoutFeedback onPress={() => setIsStatusDropdownOpen(false)}>
          <BlurView
            intensity={20}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 90
            }}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Header with White Safe Area */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, zIndex: 110, position: 'relative' }}>
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
            zIndex: 110,
            position: 'relative'
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
              DETAILS
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {/* Row containing Dropdown matching task.tsx style */}
      <View className="px-5 flex-row items-center" style={{ marginTop: 14, marginBottom: 14, zIndex: 100, height: 40, position: 'relative' }}>
        {/* Dropdown Container */}
        <View className="flex-1" style={{ position: 'relative', height: 40 }}>
          <TouchableOpacity 
            onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            className="flex-row bg-white rounded-2xl px-4 border border-slate-100 shadow-sm"
            style={{ alignItems: 'center', height: 40 }}
          >
            <Text className="flex-1 text-[15px] font-semibold text-center uppercase text-[#011023]">
              {tempFilterStatus}
            </Text>
          </TouchableOpacity>

          {isStatusDropdownOpen && (
            <View className="bg-white border border-slate-200 rounded-xl mt-1 shadow-md overflow-hidden absolute top-full left-0 z-50" style={{ width: '100%', maxHeight: 180 }}>
              <ScrollView bounces={false} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {['Select ', 'Attendance Rate', 'Average Duration', 'Success Rate' ].map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption}
                    onPress={() => {
                      setTempFilterStatus(statusOption);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`flex-row items-center justify-center ${tempFilterStatus === statusOption ? 'bg-slate-50' : 'bg-white'}`}
                    style={{ paddingVertical: 7 }}
                  >
                    <Text className={`font-semibold uppercase text-[14px] tracking-wide text-center ${tempFilterStatus === statusOption ? 'text-[#011023]' : 'text-slate-500'}`}>
                      {statusOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Filter Button (20% / ml-3 wrapper) */}
        {/* <TouchableOpacity 
          onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)} 
          className="ml-3 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm justify-center items-center"
          style={{ height: 40 }}
        >
          <Check size={20} color="#011023" strokeWidth={2} />
        </TouchableOpacity> */}
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#011023" />
        </View>
      ) : (
        <View className="flex-1" style={{ zIndex: 10 }}>
          {renderContent()}
        </View>
      )}
    </View>
  );
}
