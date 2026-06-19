import React, { useRef, useState, useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { LayoutDashboard, CalendarClock, FileText, Settings, CheckSquare, User, Bell } from 'lucide-react-native';
import { Platform, TouchableOpacity, View, PanResponder, DeviceEventEmitter } from 'react-native';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Dock() {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('openSidebar', () => {
      setSidebarVisible(true);
    });
    return () => {
      subscription.remove();
    };
  }, []);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy, x0 } = gestureState;
        // Strictly capture horizontal swipes starting from the extreme left edge (within 30px)
        // Require a clear horizontal swipe intent (dx > 20 and mostly horizontal)
        return x0 < 30 && dx > 20 && dx > Math.abs(dy) * 2.5;
      },
      onPanResponderGrant: () => {
        // Open the sidebar instantly upon swipe recognition for maximum responsiveness
        DeviceEventEmitter.emit('openSidebar');
      },
    })
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }} {...panResponder.panHandlers}>
      <Tabs
        screenOptions={{
          header: () => <Navbar />,
          tabBarActiveTintColor: '#2d343dff',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            marginTop: 15, // Creates a global gap above the dock for all screens
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            height: Platform.OS === 'ios' ? 90 : 65,
          paddingBottom: Platform.OS === 'ios' ? 35 : 10,
          paddingTop: 14,
          paddingHorizontal: 12,
          elevation: 10,
          shadowColor: '#000000ff',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'ATTEND',
          tabBarIcon: ({ color, size }) => <CalendarClock size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: 'TASK',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'LEAVE',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTING',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
    <Sidebar visible={isSidebarVisible} onClose={() => setSidebarVisible(false)} />
    </View>
  );
}
