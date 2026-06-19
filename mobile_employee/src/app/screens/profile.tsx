import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Phone, Hash, Briefcase, Building, Store, MapPin, Calendar, FileText, Shield, FileBadge } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      if (storedUserStr) {
        setUser(JSON.parse(storedUserStr));
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
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Profile Section Box */}
          <View className="mx-5 mt-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 items-center relative">
            <View className="absolute top-4 right-4">
               <View className="bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  {/* <Text className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Active</Text> */}
               </View>
            </View>
            
            <View className="w-24 h-24 bg-[#f8fafc] rounded-full justify-center items-center mb-4 border-2 border-slate-100 shadow-sm">
                <User size={70} color="#052558" strokeWidth={1.5} />
            </View>

            <Text style={{fontSize:17}} className="text-[30px] font-bold uppercase text-[#011023] text-center">
                {user?.name || 'Unknown Employee'}
            </Text>
            <View className="flex-row items-center mt-2 px-3 py-1.5 rounded-full w-full">
              
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
                  {user?.status || 'verified'}
                </Text>
              </View>

            </View>
          </View>

          {/* Details Section Box */}
          <View className="mx-5 mt-4 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <View style={{ backgroundColor: '#24292eff', paddingVertical: 13, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Basic Details</Text>
            </View>

            <View style={{ gap: 8, paddingHorizontal:17, paddingVertical:15 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Phone </Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right">{user?.phone || 'N/A'}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Email Id</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right">{user?.email || 'N/A'}</Text>
                </View>
            </View>
          </View>

          {/* Garage Details Box */}
          <View className="mx-5 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <View style={{ backgroundColor: '#24282cff', paddingVertical: 13, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Garage Details</Text>
            </View>
            
            <View style={{ gap: 8, paddingHorizontal:17, paddingVertical:15 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-700 uppercase font-semibold pr-1">Id</Text>
                <Text className="text-[#011023] font-semibold uppercase text-right">{user?.garageId || 'N/A'}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-700 uppercase font-semibold pr-1">Joining Date</Text>
                <Text className="text-[#011023] font-semibold uppercase text-right">{user?.createdAt ? `${new Date(user.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')} | ${new Date(user.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Legal Details Box */}
          <View className="mx-5 mb-8 bg-white rounded-2xl shadow-sm border border-slate-100">
            <View style={{ backgroundColor: '#24282cff', paddingVertical: 13, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Legal Documents</Text>
            </View>
            
            <View style={{ gap: 8, paddingHorizontal:17, paddingVertical:15 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">PAN</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right">{user?.panCard || 'N/A'}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Aadhar</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right">{user?.adharCard || 'N/A'}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Voter Id</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right">{user?.voterId || 'N/A'}</Text>
                </View>
            </View>
          </View>

        </ScrollView>
    </View>
  );
}
