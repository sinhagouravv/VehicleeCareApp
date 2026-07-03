import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Coins } from 'lucide-react-native';
import { router } from 'expo-router';

export default function FinanceScreen() {
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
            shadowOffset: { width: 0, height: 6 },
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
              FINANCE
            </Text>

            {/* Right: Dummy View for alignment symmetry */}
            <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      {/* Content */}
      
    </View>
  );
}
