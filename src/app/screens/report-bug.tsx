import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bug, Send } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ReportBugScreen() {
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the bug before submitting.');
      return;
    }
    Alert.alert('Success', 'Thank you for your report. Our developers will review the issue.');
    setDescription('');
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
              REPORT A BUG
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <View className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Bug size={22} color="#be123c" />
            <Text className="text-slate-800 font-bold text-lg ml-2 uppercase">Report an Issue</Text>
          </View>
          <Text className="text-slate-500 font-semibold text-xs uppercase mb-4">Please describe the problem in detail</Text>
          
          <TextInput
            style={{ height: 120, textAlignVertical: 'top', padding: 15 }}
            className="bg-[#f8fafc] border border-slate-200 rounded-2xl text-slate-800 font-semibold mb-4"
            placeholder="What went wrong? E.g., application crashes, visual alignment issues..."
            placeholderTextColor="#94a3b8"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-[#be123c] py-3.5 rounded-2xl flex-row justify-center items-center"
            style={{ elevation: 2, shadowColor: '#be123c' }}
          >
            <Send size={16} color="#ffffff" />
            <Text className="text-white font-bold uppercase text-xs ml-2 tracking-widest">Submit Bug Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
