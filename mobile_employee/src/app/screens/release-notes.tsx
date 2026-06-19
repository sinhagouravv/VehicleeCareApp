import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Rocket } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ReleaseNotesScreen() {
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
              RELEASE NOTES
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ marginTop: 17, marginBottom: 16 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 1 }}>
        <View style={{paddingHorizontal: 15, paddingVertical: 12}} className="bg-white border border-slate-200 rounded-2xl mb- shadow-sm">
          <View className="flex-row items-center mb-5">
            <Rocket size={16} color="#011023" />
            <Text className="text-slate-800 font-bold text-lg ml-2 uppercase">v1.0.0 (Initial Launch)</Text>
          </View>
          
          <View className="gap-3">
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Added comprehensive sidebar options with an alphabetized list of menu items for quick navigation, linking route targets to profile settings, shift stats, and diagnostic tools.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Implemented real-time interactive shift status check-in and check-out logs on the main dashboard, featuring automatic timing formatting and date indicator fallbacks.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Introduced secure local biometric authentication (Fingerprint/FaceID) settings toggle integration alongside multi-factor authentication preferences storage.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Optimized mobile viewport UI layouts, using harmonized color palettes such as emerald green check-in triggers and teal shift-completed status cards.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Added a dynamic diagnostic system card displaying database connection status, active sync, device OS version, API properties, and memory storage usage metrics.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Configured an OTP verification secure modal system that layers correctly on top of settings forms, with background blur views and independent close-button behaviors.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Developed a highly precise edge-swipe gesture detector inside the root container allowing users to open the side menu with a swipe, with automated transition dismissals.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Patched backend request validation rules to verify MongoDB ObjectId parameters before querying, eliminating server-side internal errors on invalid ID lookups.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Structured real-time user notification streams matching employee tasks, utilizing regular backend polling to display push alerts and custom calendars.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Integrated React Native SecureStore capabilities to persist employee authentication profiles, role states, and localized configurations across application launches.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Built customized navigation headers for secondary features with responsive safe-area paddings matching both iOS devices and Android status bars.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Disabled iOS-specific elastic scroll bounce behaviors across settings and system information views to ensure a smooth scrolling experience.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Added dynamic local time-aware greetings (Good Morning/Afternoon/Evening) matching the user's role and display initials avatar badges.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Migrated to the secondary navigation configurations out of the core bottom layout dock to maximize spacing for vital day-to-day shift views.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Constructed localizations preferences layouts covering nine native subtitles scripts within the activated persistences handlers.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Wrapped outgoing API query parameters inside automated authentication authorization structures dynamically derived from local state variables.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Implemented fallback strings ('-') for missing attendance check-in/out logs on both the home dashboard and attendance screens to prevent blank data values.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Adjusted shift status badge spacing alignments with micro-margin tuning overrides to match the surrounding dashboard cards.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Linked biometrics toggle parameters to LocalAuthentication state checks to ensure device capability compliance before loading authentication.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Refactored sub-screen headers to dynamically call router.back() or fallback replace parameters, preventing routing locking behaviors on web target viewports.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Standardized card container margins and vertical padding properties across secondary information screens to match the master notifications system list spacing.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Designed standardized diagnostic alerts on copy details and update checking states with clean styling across iOS, Android, and Web browsers.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Integrated SafeAreaView structural hooks mapping to Android device status bars and iOS top notches, preventing UI clipping bugs.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Added support for modern high-contrast Lucide icons mapping to diagnostic status parameters, actions controls, and sidebar links.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Standardized SafeAreaView usage across all secondary screens to ensure padding matches standard system layout wrappers.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Set up parent ScrollView components to hide vertical scroll bars globally across profile settings and list menus.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Added unified vertical margins ('mb-5' and 'mb-4') between system identification details and actions lists to improve interface breathing space.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Standardized font family styling using native bold configurations and customized text tracking properties.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Added responsive activity timers simulating network updates check actions without UI freezes or resource leaks.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Updated booking retrieval controllers to prevent CastError triggers by checking parameters format ahead of querying.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Defined flexible flexbox parameters inside list rows to accommodate narrow screens and multi-line item layouts.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-slate-800 font-bold mr-2">•</Text>
              <Text style={{ fontSize: 13 }} className="text-justify text-slate-600 font-semibold flex-1 uppercase">Styled card components with high-contrast borders ('border border-slate-200') and subtle drop shadows ('shadow-sm') matching the notification panel layouts.</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11.5 }} className="text-slate-600 text-justify font-semibold uppercase mt-5">Released on 07 June 2026.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
