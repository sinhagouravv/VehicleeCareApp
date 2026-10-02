import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, ViewStyle, StyleProp, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SkeletonBlockProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Primitive Skeleton Block with smooth pulse animation
 */
export function SkeletonBlock({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  children,
}: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#e2e8f0',
          opacity,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Skeleton Header for Secondary Screens (BackButton + Title)
 */
export function ScreenHeaderSkeleton({ titleWidth = 140 }: { titleWidth?: number }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff' }}>
      <View
        style={{
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          minHeight: 40,
          paddingTop: 0,
          paddingBottom: 6,
          paddingHorizontal: 19,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <SkeletonBlock width={36} height={36} borderRadius={18} />
        <SkeletonBlock width={titleWidth} height={20} borderRadius={6} />
        <View style={{ width: 36 }} />
      </View>
    </SafeAreaView>
  );
}

/**
 * 1. Home / Dashboard Screen Skeleton
 */
export function DashboardSkeleton() {
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View className="px-5">
        {/* 2x2 Stats Grid */}
        <View style={{ gap: 12, marginTop: 15, marginBottom: 12 }}>
          <View style={{ gap: 12 }} className="flex-row">
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <View className="flex-row justify-between items-center mb-3">
                <SkeletonBlock width={70} height={12} borderRadius={4} />
                <SkeletonBlock width={28} height={28} borderRadius={14} />
              </View>
              <SkeletonBlock width={50} height={24} borderRadius={6} />
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <View className="flex-row justify-between items-center mb-3">
                <SkeletonBlock width={70} height={12} borderRadius={4} />
                <SkeletonBlock width={28} height={28} borderRadius={14} />
              </View>
              <SkeletonBlock width={50} height={24} borderRadius={6} />
            </View>
          </View>
          <View style={{ gap: 12 }} className="flex-row">
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <View className="flex-row justify-between items-center mb-3">
                <SkeletonBlock width={70} height={12} borderRadius={4} />
                <SkeletonBlock width={28} height={28} borderRadius={14} />
              </View>
              <SkeletonBlock width={50} height={24} borderRadius={6} />
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <View className="flex-row justify-between items-center mb-3">
                <SkeletonBlock width={70} height={12} borderRadius={4} />
                <SkeletonBlock width={28} height={28} borderRadius={14} />
              </View>
              <SkeletonBlock width={50} height={24} borderRadius={6} />
            </View>
          </View>
        </View>

        {/* Attendance Banner / Active Shift Card Skeleton */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <SkeletonBlock width={120} height={16} borderRadius={6} />
            <SkeletonBlock width={70} height={22} borderRadius={12} />
          </View>
          <View className="flex-row justify-between items-center mt-2 mb-3">
            <View>
              <SkeletonBlock width={60} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonBlock width={80} height={16} borderRadius={4} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <SkeletonBlock width={60} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonBlock width={80} height={16} borderRadius={4} />
            </View>
          </View>
          <SkeletonBlock width="100%" height={42} borderRadius={14} style={{ marginTop: 8 }} />
        </View>

        {/* Section Header: Today's Schedule */}
        <View className="flex-row justify-between items-center mb-3 mt-1">
          <SkeletonBlock width={140} height={18} borderRadius={6} />
          <SkeletonBlock width={60} height={14} borderRadius={4} />
        </View>

        {/* Task Cards Skeleton */}
        {[1, 2].map((key) => (
          <View key={key} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <SkeletonBlock width={130} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                <SkeletonBlock width={100} height={12} borderRadius={4} />
              </View>
              <SkeletonBlock width={75} height={22} borderRadius={12} />
            </View>
            <SkeletonBlock width="100%" height={1} style={{ marginVertical: 8 }} />
            <View className="flex-row justify-between items-center">
              <SkeletonBlock width={90} height={14} borderRadius={4} />
              <SkeletonBlock width={80} height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * 2. Attendance Screen Skeleton
 */
export function AttendanceSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      {/* Top Action Button Placeholder */}
      <View className="mx-5 mt-4 mb-4">
        <SkeletonBlock width="100%" height={48} borderRadius={16} />
      </View>

      {/* Attendance History Cards */}
      <View style={{ flex: 1 }}>
        {[1, 2, 3, 4, 5].map((key) => (
          <View
            key={key}
            style={{ marginHorizontal: 19, paddingTop: 12, paddingBottom: 13 }}
            className="bg-white rounded-2xl px-5 mb-3 shadow-sm border border-slate-100"
          >
            <View className="flex-row justify-between items-center mb-3">
              <SkeletonBlock width={110} height={16} borderRadius={4} />
              <SkeletonBlock width={70} height={22} borderRadius={12} />
            </View>
            <View className="flex-row justify-between items-center">
              <View>
                <SkeletonBlock width={60} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                <SkeletonBlock width={75} height={15} borderRadius={4} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <SkeletonBlock width={60} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                <SkeletonBlock width={75} height={15} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * 3. Task / Bookings Screen Skeleton
 */
export function TaskSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      {/* Search and Filter Row */}
      <View className="px-5 flex-row items-stretch" style={{ marginVertical: 14, marginHorizontal: 1.5 }}>
        <View className="flex-1 bg-white rounded-2xl px-4 border border-slate-100 shadow-sm" style={{ paddingVertical: 14 }}>
          <SkeletonBlock width="70%" height={16} borderRadius={4} />
        </View>
        <View className="ml-3 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm justify-center items-center" style={{ width: 48, height: 48 }}>
          <SkeletonBlock width={22} height={22} borderRadius={6} />
        </View>
      </View>

      {/* Task Cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {[1, 2, 3, 4].map((key) => (
          <View
            key={key}
            style={{ marginHorizontal: 19, padding: 16 }}
            className="bg-white rounded-2xl mb-3.5 shadow-sm border border-slate-100"
          >
            {/* Header: ID & Status */}
            <View className="flex-row justify-between items-center mb-2.5">
              <SkeletonBlock width={90} height={15} borderRadius={4} />
              <SkeletonBlock width={80} height={22} borderRadius={12} />
            </View>

            {/* Service & Customer */}
            <SkeletonBlock width="85%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="55%" height={13} borderRadius={4} style={{ marginBottom: 12 }} />

            {/* Date & Time */}
            <View className="flex-row justify-between items-center pt-2 border-t border-slate-100">
              <SkeletonBlock width={100} height={13} borderRadius={4} />
              <SkeletonBlock width={70} height={13} borderRadius={4} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * 4. Leave Screen Skeleton
 */
export function LeaveSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      {/* Search and Apply Row */}
      <View className="px-5 flex-row items-stretch" style={{ marginVertical: 14, marginHorizontal: 1.5 }}>
        <View className="flex-1 bg-white rounded-2xl px-4 border border-slate-100 shadow-sm" style={{ paddingVertical: 14 }}>
          <SkeletonBlock width="65%" height={16} borderRadius={4} />
        </View>
        <View className="ml-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm justify-center items-center" style={{ width: 48, height: 48 }}>
          <SkeletonBlock width={22} height={22} borderRadius={6} />
        </View>
      </View>

      {/* Leave Application Cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {[1, 2, 3, 4].map((key) => (
          <View
            key={key}
            style={{ marginHorizontal: 19, padding: 16 }}
            className="bg-white rounded-2xl mb-3.5 shadow-sm border border-slate-100"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-3">
              <SkeletonBlock width={110} height={16} borderRadius={4} />
              <SkeletonBlock width={75} height={22} borderRadius={12} />
            </View>

            {/* Reason */}
            <SkeletonBlock width="90%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonBlock width="60%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />

            {/* Date Range */}
            <View className="flex-row justify-between items-center pt-2 border-t border-slate-100">
              <SkeletonBlock width={120} height={13} borderRadius={4} />
              <SkeletonBlock width={55} height={13} borderRadius={4} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * 5. Settings Screen Skeleton
 */
export function SettingsSkeleton() {
  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View className="mx-5 mt-4 bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center">
        <SkeletonBlock width={56} height={56} borderRadius={28} />
        <View className="ml-3.5 flex-1">
          <SkeletonBlock width={130} height={17} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBlock width={90} height={13} borderRadius={4} />
        </View>
        <SkeletonBlock width={20} height={20} borderRadius={10} />
      </View>

      {/* Section 1 */}
      <View className="mt-5 mx-5">
        <SkeletonBlock width={110} height={14} borderRadius={4} style={{ marginBottom: 10, marginLeft: 4 }} />
        <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-3">
          <View className="flex-row items-center py-3 border-b border-slate-100">
            <SkeletonBlock width={32} height={32} borderRadius={8} />
            <SkeletonBlock width={120} height={15} borderRadius={4} style={{ marginLeft: 12 }} />
          </View>
          <View className="flex-row items-center py-3">
            <SkeletonBlock width={32} height={32} borderRadius={8} />
            <SkeletonBlock width={100} height={15} borderRadius={4} style={{ marginLeft: 12 }} />
          </View>
        </View>
      </View>

      {/* Section 2 */}
      <View className="mt-5 mx-5">
        <SkeletonBlock width={90} height={14} borderRadius={4} style={{ marginBottom: 10, marginLeft: 4 }} />
        <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-3">
          <View className="flex-row items-center py-3 border-b border-slate-100">
            <SkeletonBlock width={32} height={32} borderRadius={8} />
            <SkeletonBlock width={130} height={15} borderRadius={4} style={{ marginLeft: 12 }} />
          </View>
          <View className="flex-row items-center py-3 border-b border-slate-100">
            <SkeletonBlock width={32} height={32} borderRadius={8} />
            <SkeletonBlock width={115} height={15} borderRadius={4} style={{ marginLeft: 12 }} />
          </View>
          <View className="flex-row items-center py-3">
            <SkeletonBlock width={32} height={32} borderRadius={8} />
            <SkeletonBlock width={90} height={15} borderRadius={4} style={{ marginLeft: 12 }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * 6. Profile Screen Skeleton
 */
export function ProfileSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeaderSkeleton titleWidth={100} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
        {/* Avatar and Main Info Card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-5 items-center mb-4">
          <SkeletonBlock width={90} height={90} borderRadius={45} style={{ marginBottom: 12 }} />
          <SkeletonBlock width={140} height={18} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBlock width={100} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
          <SkeletonBlock width={80} height={24} borderRadius={12} />
        </View>

        {/* Info Grid Card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <SkeletonBlock width={120} height={15} borderRadius={4} style={{ marginBottom: 14 }} />
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-row justify-between items-center py-2.5 border-b border-slate-100">
              <SkeletonBlock width={90} height={14} borderRadius={4} />
              <SkeletonBlock width={120} height={14} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* Garage Info Card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4">
          <SkeletonBlock width={130} height={15} borderRadius={4} style={{ marginBottom: 14 }} />
          <SkeletonBlock width="80%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="60%" height={14} borderRadius={4} />
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * 7. Details / Task Detail Screen Skeleton
 */
export function DetailsSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeaderSkeleton titleWidth={120} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
        {/* Summary Card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <SkeletonBlock width={110} height={18} borderRadius={4} />
            <SkeletonBlock width={80} height={24} borderRadius={12} />
          </View>
          <SkeletonBlock width="70%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="50%" height={14} borderRadius={4} />
        </View>

        {/* Customer & Vehicle Info */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <SkeletonBlock width={120} height={15} borderRadius={4} style={{ marginBottom: 12 }} />
          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <SkeletonBlock width={70} height={14} borderRadius={4} />
            <SkeletonBlock width={110} height={14} borderRadius={4} />
          </View>
          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <SkeletonBlock width={70} height={14} borderRadius={4} />
            <SkeletonBlock width={120} height={14} borderRadius={4} />
          </View>
          <View className="flex-row justify-between py-2">
            <SkeletonBlock width={70} height={14} borderRadius={4} />
            <SkeletonBlock width={90} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Action Button */}
        <SkeletonBlock width="100%" height={48} borderRadius={16} />
      </ScrollView>
    </View>
  );
}

/**
 * 8. Analytics Screen Skeleton
 */
export function AnalyticsSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeaderSkeleton titleWidth={110} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
        {/* Date Filter */}
        <View className="bg-white rounded-2xl border border-slate-200 p-3 mb-4 flex-row justify-between">
          <SkeletonBlock width="45%" height={32} borderRadius={10} />
          <SkeletonBlock width="45%" height={32} borderRadius={10} />
        </View>

        {/* 2x2 Metric Cards */}
        <View style={{ gap: 12, marginBottom: 16 }}>
          <View style={{ gap: 12 }} className="flex-row">
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <SkeletonBlock width={70} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonBlock width={50} height={22} borderRadius={6} />
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <SkeletonBlock width={70} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonBlock width={50} height={22} borderRadius={6} />
            </View>
          </View>
          <View style={{ gap: 12 }} className="flex-row">
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <SkeletonBlock width={70} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonBlock width={50} height={22} borderRadius={6} />
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
              <SkeletonBlock width={70} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonBlock width={50} height={22} borderRadius={6} />
            </View>
          </View>
        </View>

        {/* Chart Card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <SkeletonBlock width={140} height={16} borderRadius={4} style={{ marginBottom: 16 }} />
          <View className="flex-row justify-between items-end" style={{ height: 120 }}>
            {[35, 60, 45, 80, 65, 90, 50].map((h, i) => (
              <SkeletonBlock key={i} width={24} height={`${h}%`} borderRadius={6} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * 9. ID Card Screen Skeleton
 */
export function IdCardSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeaderSkeleton titleWidth={100} />
      <ScrollView contentContainerStyle={{ padding: 18, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        {/* Main ID Card Preview */}
        <View
          style={{ width: '92%', height: 420 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 items-center justify-between mb-6 shadow-sm"
        >
          {/* Header */}
          <View className="w-full flex-row justify-between items-center">
            <SkeletonBlock width={110} height={24} borderRadius={6} />
            <SkeletonBlock width={40} height={20} borderRadius={10} />
          </View>

          {/* Photo */}
          <SkeletonBlock width={100} height={100} borderRadius={50} />

          {/* Employee Info */}
          <View className="items-center w-full">
            <SkeletonBlock width={150} height={18} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonBlock width={100} height={13} borderRadius={4} style={{ marginBottom: 12 }} />
            <SkeletonBlock width={120} height={22} borderRadius={11} />
          </View>

          {/* QR Code Area */}
          <SkeletonBlock width={70} height={70} borderRadius={8} />
        </View>

        {/* Action Button */}
        <SkeletonBlock width="92%" height={48} borderRadius={16} />
      </ScrollView>
    </View>
  );
}

/**
 * 10. Overtime Screen Skeleton
 */
export function OvertimeSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeaderSkeleton titleWidth={100} />
      <View className="flex-1 px-5 pt-4">
        {/* Apply Button Placeholder */}
        <SkeletonBlock width="100%" height={48} borderRadius={16} style={{ marginBottom: 16 }} />

        {/* Overtime Request Cards */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3.5 shadow-sm">
              <View className="flex-row justify-between items-center mb-2.5">
                <SkeletonBlock width={110} height={16} borderRadius={4} />
                <SkeletonBlock width={75} height={22} borderRadius={12} />
              </View>
              <SkeletonBlock width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonBlock width="50%" height={13} borderRadius={4} style={{ marginBottom: 10 }} />
              <View className="flex-row justify-between pt-2 border-t border-slate-100">
                <SkeletonBlock width={80} height={13} borderRadius={4} />
                <SkeletonBlock width={60} height={13} borderRadius={4} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * 11. Notification / Notification History Screen Skeleton
 */
export function NotificationSkeleton({ isHistory = false }: { isHistory?: boolean }) {
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeaderSkeleton titleWidth={isHistory ? 140 : 120} />
      <View className="flex-1">
        {/* Search Bar */}
        <View className="px-5 flex-row items-stretch" style={{ marginVertical: 14, marginHorizontal: 1.5 }}>
          <View className="flex-1 bg-white rounded-2xl px-4 border border-slate-100 shadow-sm" style={{ paddingVertical: 14 }}>
            <SkeletonBlock width="60%" height={16} borderRadius={4} />
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {[1, 2, 3, 4, 5].map((key) => (
            <View
              key={key}
              style={{ marginHorizontal: 19, padding: 14 }}
              className="bg-white rounded-2xl mb-3 shadow-sm border border-slate-100 flex-row items-start"
            >
              <SkeletonBlock width={38} height={38} borderRadius={19} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-2">
                  <SkeletonBlock width="65%" height={15} borderRadius={4} />
                  <SkeletonBlock width={45} height={12} borderRadius={4} />
                </View>
                <SkeletonBlock width="90%" height={13} borderRadius={4} style={{ marginBottom: 5 }} />
                <SkeletonBlock width="70%" height={13} borderRadius={4} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * 12. Upload Documents Screen Skeleton
 */
export function UploadDocumentsSkeleton() {
  return (
    <View className="flex-1 bg-[#f5f7f9]">
      <ScreenHeaderSkeleton titleWidth={140} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
        {/* Info Box */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <SkeletonBlock width={140} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="90%" height={13} borderRadius={4} />
        </View>

        {/* Document Upload Items */}
        {[1, 2, 3, 4].map((key) => (
          <View key={key} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3.5 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <SkeletonBlock width={40} height={40} borderRadius={10} style={{ marginRight: 12 }} />
              <View className="flex-1">
                <SkeletonBlock width={120} height={15} borderRadius={4} style={{ marginBottom: 5 }} />
                <SkeletonBlock width={70} height={12} borderRadius={4} />
              </View>
            </View>
            <SkeletonBlock width={75} height={32} borderRadius={10} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * 13. Generic Form / Simple Screen Skeleton
 */
export function GenericFormSkeleton({ titleWidth = 120 }: { titleWidth?: number }) {
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeaderSkeleton titleWidth={titleWidth} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
        <View className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={{ marginBottom: 16 }}>
              <SkeletonBlock width={80} height={13} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonBlock width="100%" height={44} borderRadius={12} />
            </View>
          ))}
          <SkeletonBlock width="100%" height={48} borderRadius={14} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </View>
  );
}
