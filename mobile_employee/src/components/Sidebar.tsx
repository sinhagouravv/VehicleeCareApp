import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, Animated, TextInput, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { X, User, LogOut, Settings, Search, CalendarCheck, FileText, ClipboardList, Lock, Edit, FilePlus, UserCheck, Star, History, Bug, FileSignature, Bell, Globe, Fingerprint, Smartphone, BarChart2, Info, Rocket, FileBadge, FileUp, Coins, Clock, Contact } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function Sidebar({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadUser();
    } else {
      setSearchQuery('');
    }
  }, [visible]);

  const loadUser = async () => {
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      if (storedUserStr) {
        setUser(JSON.parse(storedUserStr));
      }
    } catch (e) {
      console.log('Error loading user in sidebar', e);
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('employeeToken');
      await SecureStore.deleteItemAsync('employeeUser');
      await SecureStore.deleteItemAsync('biometricsEnabled');
      onClose();
      router.replace('/auth/login');
    } catch (e) {
      console.log('Logout error', e);
    }
  };

  const MENU_LINKS = [
    { name: 'Analytics', icon: BarChart2, onPress: () => { onClose(); router.push('/screens/analytics'); } },
    { name: 'App Version', icon: Info, onPress: () => { onClose(); router.push('/screens/app-version'); } },
    // { name: 'Apply Leave', icon: FilePlus, onPress: () => { onClose(); router.push({ pathname: '/tabs/leave', params: { action: 'apply' } }); } },
    // { name: 'Attendance', icon: CalendarCheck, onPress: () => { onClose(); router.push('/tabs/attendance'); } },
    // { name: 'Biomatric', icon: Fingerprint, onPress: () => { onClose(); router.push({ pathname: '/tabs/settings', params: { action: 'biometrics' } }); } },
    // { name: 'Change Password', icon: Lock, onPress: () => { onClose(); router.push({ pathname: '/tabs/settings', params: { action: 'change-password' } }); } },
    { name: 'Details', icon: FileBadge, onPress: () => { onClose(); router.push('/screens/details'); } },
    { name: 'Finance', icon: Coins, onPress: () => { onClose(); router.push('/screens/finance'); } },
    // { name: 'Check In', icon: UserCheck, onPress: () => { onClose(); /* router.push(''); */ } },
    // { name: 'History', icon: History, onPress: () => { onClose(); /* router.push(''); */ } },
    // { name: 'Language', icon: Globe, onPress: () => { onClose(); router.push({ pathname: '/screens/update-details', params: { title: 'Language' } }); } },
    // { name: 'Leave', icon: FileText, onPress: () => { onClose(); router.push('/tabs/leave'); } },
    // { name: 'Legal Details', icon: FileSignature, onPress: () => { onClose(); router.push({ pathname: '/screens/update-details', params: { title: 'Legal Details' } }); } },
    // { name: 'MFA', icon: Smartphone, onPress: () => { onClose(); router.push({ pathname: '/tabs/settings', params: { action: 'mfa' } }); } },
    // { name: 'Notification', icon: Bell, onPress: () => { onClose(); router.push({ pathname: '/screens/update-details', params: { title: 'Notifications' } }); } },
    { name: 'Overtime', icon: Clock, onPress: () => { onClose(); router.push('/screens/overtime'); } },
    // { name: 'Personal Details', icon: Edit, onPress: () => { onClose(); router.push({ pathname: '/screens/update-details', params: { title: 'Personal Details' } }); } },
    // { name: 'Profile', icon: User, onPress: () => { router.push('/screens/profile'); setTimeout(() => { onClose(); }, 50); } },
    { name: 'Release Notes', icon: Rocket, onPress: () => { onClose(); router.push('/screens/release-notes'); } },
    { name: 'Report a Bug', icon: Bug, onPress: () => { onClose(); router.push('/screens/report-bug'); } },
    // { name: 'Settings', icon: Settings, onPress: () => { onClose(); router.push('/tabs/settings'); } },
    // { name: 'Task Assigned', icon: ClipboardList, onPress: () => { onClose(); router.push('/tabs/task'); } },
    { name: 'Upload Documents', icon: FileUp, onPress: () => { onClose(); router.push('/screens/upload-documents'); } },
    { name: 'Virtual ID Card', icon: Contact, onPress: () => { onClose(); router.push('/screens/id-card'); } },
    { name: 'View Reviews', icon: Star, onPress: () => { onClose(); /* router.push(''); */ } },
  ];

  const filteredLinks = MENU_LINKS.filter(link => link.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 flex-row justify-start ">
        {/* Backdrop */}
        <TouchableOpacity className="absolute inset-0 bg-[#011023]/40" onPress={onClose} activeOpacity={1} />
        
        {/* Sidebar Content */}
        <View style={{ width: width * 0.75, borderTopRightRadius: 24, borderBottomRightRadius: 23 }} className="bg-white h-full shadow-2xl overflow-hidden rounded-l-[30px]">
          
          {/* Header */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
              router.push('/screens/profile');
              setTimeout(() => { onClose(); }, 50);
            }}
            style={{
              backgroundColor: '#ffffff',
              borderBottomWidth: 2,
              borderBottomColor: '#f1f5f9',
              elevation: 10,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              zIndex: 50,
              paddingTop: 60,
              paddingBottom: 13,
            }} className="items-center px-6">
            <View style={{ marginVertical: 15, width: 90, height: 90, borderRadius: 48 }} className="bg-white justify-center items-center border border-slate-200 shadow-sm overflow-hidden">
              {user?.avatar ? (
                <Image 
                  source={{ uri: user.avatar }} 
                  style={{ width: 92, height: 92, borderRadius: 46 }} 
                  resizeMode="cover"
                />
              ) : (
                <User size={80} color="#011023" strokeWidth={1.5} />
              )}
            </View>
            <View className="items-center">
              <Text className="font-bold text-[#011023] text-[18px] uppercase tracking-[-0.5px] text-center" numberOfLines={1}>{user?.name || 'Unknown Employee'}</Text>
              <Text style={{fontSize:14 }} className="text-slate-800 font-semibold uppercase mt-1.5 text-center" numberOfLines={1}>
                {user?.employeeId || 'N/A'} <Text className="text-slate-300 mx-1"> 
                <Text style={{ marginHorizontal: 5, transform: [{ translateY: -1 }] }} className="text-[#011023] text-[13px] font-semibold">|</Text>
                </Text> {user?.role || 'Staff'}
              </Text>
            </View>
          </TouchableOpacity>


          {/* Search Bar */}
          <View style={{paddingVertical:11, paddingHorizontal:15 }} className="mt-1">
            <View className="flex-row bg-white rounded-2xl px-4 border border-slate-100 shadow-sm" style={{ alignItems: 'center' }}>
              <Search size={20} color="#64748b" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-[15px] font-semibold uppercase text-[#011023]"
                style={{ paddingVertical: 11 }}
                placeholder="SEARCH..."
                placeholderTextColor="#bdc6d1ff"
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor="#011023"
                caretHidden={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1 rounded-full">
                  <X size={14} color="#64748b" strokeWidth={3} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Links */}
          <ScrollView bounces={false} style={{paddingHorizontal:18}} className="flex-1" showsVerticalScrollIndicator={false}>
            {filteredLinks.length > 0 ? (
              filteredLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <TouchableOpacity 
                    key={index}
                    onPress={link.onPress}
                    style={{ gap: 15, paddingVertical: 13 }}
                    className="flex-row items-center border-b border-slate-200">
                    <Icon size={18} color="#052558" strokeWidth={2.5} />
                    <Text style={{fontSize:15}} className="font-semibold uppercase text-slate-800">{link.name}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="py-8 items-center justify-center">
                <Text className="text-slate-400 font-semibold uppercase mt-2">No results found</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer / Logout */}
          <View className="p-5 border-t border-slate-100 bg-slate-50/50 pb-4">
            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center justify-center p-2.5 bg-white border border-red-100 rounded-2xl shadow-sm">
              <LogOut size={18} color="#ef4444" strokeWidth={2.5} />
              <Text className="font-bold text-red-500 ml-2 tracking-wide">LOG OUT</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
