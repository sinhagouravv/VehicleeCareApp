import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Cpu, CheckCircle, RefreshCw, Copy, Bug, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AppVersionScreen() {
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    setTimeout(() => {
      setCheckingUpdates(false);
      Alert.alert(
        "Check for Updates",
        "Your application is up to date.\nVersion: 1.0.0 \nBuild: 104",
        [{ text: "OK" }]
      );
    }, 1200);
  };

  const handleCopyInfo = () => {
    const osVer = Platform.OS === 'ios' ? `iOS ${Platform.Version}` : Platform.OS === 'android' ? `Android ${Platform.Version}` : 'Web';
    const infoText = `App Name: VehicleeCare Employee
Version: 1.0.0
API Version: v1.0.0
Background Sync Status: Active
Build Number: 104
Connection Status: Connected
Database Status: Connected
Device Environment: Production
Device OS Version: ${osVer}
Last Sync Time: Today at 03:00 PM
Notification Status: Enabled
Security Status: Secured
Server Status: Online`;
    
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(infoText);
        Alert.alert("Copied", "Build information copied to clipboard!");
        return;
      }
    }

    try {
      const { Clipboard } = require('react-native');
      if (Clipboard && Clipboard.setString) {
        Clipboard.setString(infoText);
        Alert.alert("Copied", "Build information copied to clipboard!");
        return;
      }
    } catch (error) {
      console.log('Clipboard error: ', error);
    }

    Alert.alert("Build Information", infoText);
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
              APP VERSION
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Identity Card */}
        <View className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm items-center mb-5">
          <View className="w-16 h-16 items-center justify-center mb-2">
            <Cpu size={36} color="#000000ff" strokeWidth={2} />
          </View>
          <Text className="text-slate-800 font-bold text-xl uppercase">VehicleeCare App</Text>
          <Text className="text-slate-500 font-semibold uppercase text-sm mt-2 mr-2">Version 1.0.0</Text>
        </View>

        {/* Build & Environment Info Card */}
        <View style={{paddingHorizontal: 18, paddingVertical: 16}} className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-5">
          <Text style={{fontSize: 15}} className="text-[#011023] font-bold uppercase tracking-wider mb-3">Build and System Info</Text>
          
          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">API Version</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold ">v1.0.0</Text>
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Build Number</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">104</Text>
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Background Sync</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Active</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Connection Status</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Connected</Text>
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Device Environment</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Production</Text>
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Device OS Version</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">{Platform.OS === 'ios' ? `iOS ${Platform.Version}` : Platform.OS === 'android' ? `Android ${Platform.Version}` : 'Web'}</Text>
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Notification Status</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Enabled</Text>
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Security Status</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Secured</Text>
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Server Status</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Online</Text>
            </View>
          </View>

          <View className="flex-row justify-between mt-2">
            <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase">Update Status</Text>
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14 }} className="text-slate-800 font-semibold uppercase ml-1">Up to date</Text>
            </View>
          </View>
        </View>

        {/* Actions Card */}
        <View style={{paddingHorizontal: 18, paddingVertical: 17}}  className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Text style={{fontSize: 15}} className="text-[#011023] font-bold uppercase tracking-wider mb-3">Actions</Text>

          {/* Check for Updates */}
          <TouchableOpacity 
            onPress={handleCheckUpdates} 
            disabled={checkingUpdates}
            style={{paddingVertical: 8 }}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center">
              <RefreshCw size={16} color="#000000ff" strokeWidth={2} />
              <Text style={{ fontSize: 14 }} className="text-[#011023] font-semibold uppercase text-xs ml-3">Check for Updates</Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>
          {/* Copy Build Info */}
          <TouchableOpacity 
            onPress={handleCopyInfo} 
            style={{paddingVertical: 8 }}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center">
              <Copy size={16} color="#000000ff" strokeWidth={2} />
              <Text style={{ fontSize: 14 }} className="text-[#011023] font-semibold uppercase ml-3">Copy Build Information</Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>

          {/* Report a Problem */}
          <TouchableOpacity 
            onPress={() => router.push('/screens/report-bug')} 
            style={{paddingTop: 8 }}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center">
              <Bug size={16} color="#000000ff" strokeWidth={2} />
              <Text style={{ fontSize: 14 }} className="text-[#011023] font-semibold uppercase ml-3">Report a Problem</Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
