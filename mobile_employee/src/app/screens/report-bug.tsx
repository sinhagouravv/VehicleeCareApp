import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bug, Send } from 'lucide-react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function ReportBugScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a bug subject.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the bug before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      const user = storedUserStr ? JSON.parse(storedUserStr) : { id: 'E001', name: 'Unknown Employee' };

      const response = await axios.post(`${API_URL}/api/bugs`, {
        reporterId: user.employeeId || user.id || user._id || 'E001',
        reporterName: user.name || 'Mobile App User',
        portal: 'app',
        title: title.trim(),
        description: description.trim(),
        severity: severity
      });

      if (response.data && response.data.success) {
        Alert.alert('Success', 'Thank you for your report. Our developers will review the issue.');
        setTitle('');
        setDescription('');
        setSeverity('Medium');
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit bug report.');
      }
    } catch (error) {
      console.error('Error submitting bug:', error);
      Alert.alert('Error', 'Network error. Failed to connect to server.');
    } finally {
      setSubmitting(false);
    }
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
          
          <Text className="text-slate-500 font-semibold text-xs uppercase mb-2">Bug Subject / Title</Text>
          <TextInput
            style={{ height: 50, paddingHorizontal: 15 }}
            className="bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 font-semibold mb-4"
            placeholder="Brief summary of the issue"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />

          <Text className="text-slate-500 font-semibold text-xs uppercase mb-2">Severity Level</Text>
          <View className="flex-row gap-2 mb-4">
            {['Low', 'Medium', 'High', 'Critical'].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setSeverity(level)}
                className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                  severity === level
                    ? 'bg-[#be123c] border-[#be123c]'
                    : 'bg-[#f8fafc] border-slate-200'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    severity === level ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-slate-500 font-semibold text-xs uppercase mb-2">Description / Steps to Reproduce</Text>
          <TextInput
            style={{ height: 120, textAlignVertical: 'top', padding: 15 }}
            className="bg-[#f8fafc] border border-slate-200 rounded-2xl text-slate-800 font-semibold mb-4"
            placeholder="Explain how to trigger the bug and what happened..."
            placeholderTextColor="#94a3b8"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-[#be123c] py-3.5 rounded-2xl flex-row justify-center items-center"
            style={{ elevation: 2, shadowColor: '#be123c' }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Send size={16} color="#ffffff" />
                <Text className="text-white font-bold uppercase text-xs ml-2 tracking-widest">Submit Bug Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
