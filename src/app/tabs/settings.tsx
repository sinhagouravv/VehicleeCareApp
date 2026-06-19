import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Modal, KeyboardAvoidingView, Platform, TextInput, TouchableWithoutFeedback, Alert, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';
import { Bell, Moon, Lock, Fingerprint, Shield, HelpCircle, FileText, ChevronRight, ChevronUp, ChevronDown, LogOut, X, Smartphone, Edit, FileSignature, Eye, EyeOff, Globe } from 'lucide-react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import Constants from 'expo-constants';
import OTPModal from '../../components/OTPModal';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function SettingsScreen() {
  // const [pushEnabled, setPushEnabled] = useState(true);
  // const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  // const [mfaEnabled, setMfaEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isSubmittingOTP, setIsSubmittingOTP] = useState(false);

  useEffect(() => {
    const loadSettingsAndUser = async () => {
      try {
        const bioState = await SecureStore.getItemAsync('biometricsEnabled');
        if (bioState === 'true') {
          setBiometricsEnabled(true);
        }

        const userStr = await SecureStore.getItemAsync('employeeUser');
        if (userStr) {
          setEmployee(JSON.parse(userStr));
        }
      } catch (e) {
        console.log('Error loading settings and user info', e);
      }
    };
    loadSettingsAndUser();
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string, text: string, showEnable?: boolean, showPasswordBtn?: boolean } | null>(null);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePasswordClick = async () => {
    Keyboard.dismiss();
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (passwordForm.new.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return;
    }

    const empId = employee?._id || employee?.id;
    if (!empId) {
      Alert.alert('Error', 'Unable to retrieve employee account info');
      return;
    }

    // Show the OTP Modal instantly so it comes up without any network delay
    setShowOTPModal(true);
    setIsSubmittingOTP(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/send-settings-otp`, {
        userId: empId,
        purpose: 'change-password',
        currentPassword: passwordForm.current
      }, { validateStatus: () => true });

      if (res.status === 200) {
        Alert.alert('Success', 'A verification OTP has been sent to your email. Kindly enter the OTP to change the password successfully.');
      } else {
        setShowOTPModal(false);
        Alert.alert('Error', res.data.msg || 'Failed to send verification OTP');
      }
    } catch (err) {
      console.error('Send settings OTP failed:', err);
      setShowOTPModal(false);
      Alert.alert('Error', 'Connection error. Please try again.');
    } finally {
      setIsSubmittingOTP(false);
    }
  };

  const handleVerifyOTP = async (otp: string): Promise<boolean> => {
    Keyboard.dismiss();
    const cleanOtp = otp.replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return false;
    }

    setIsSubmittingOTP(true);
    try {
      const empId = employee?._id || employee?.id;
      if (!empId) {
        Alert.alert('Error', 'Unable to retrieve employee account info');
        return false;
      }

      const res = await axios.patch(`${API_URL}/api/auth/change-password-otp`, {
        userId: empId,
        otp: cleanOtp,
        newPassword: passwordForm.new
      }, { validateStatus: () => true });

      if (res.status === 200) {
        Alert.alert('Success', 'OTP has been updated successfully. You can now use you new password to access you account');
        setShowOTPModal(false);
        setIsPasswordFormVisible(false);
        setModalVisible(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
        return true;
      } else {
        Alert.alert('Error', 'Kindly enter the correct OTP');
        return false;
      }
    } catch (err) {
      console.error('OTP verification failed:', err);
      Alert.alert('Error', 'Kindly enter the correct OTP');
      return false;
    } finally {
      setIsSubmittingOTP(false);
    }
  };

  const openSupportModal = (title: string, text: string, showEnable = false, showPasswordBtn = false) => {
    setIsPasswordFormVisible(false);
    setModalContent({ title, text, showEnable, showPasswordBtn });
    setModalVisible(true);
  };

  const SettingItem = ({ icon: Icon, title, rightElement, onPress, borderBottom = true }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ paddingVertical: 9.75 }}
      className={`flex-row items-center px-5 ${borderBottom ? 'border-b border-slate-100' : ''}`}
    >
      <View className="w-8 h-8 items-center justify-center mr-4">
        <Icon size={16} color="#052558" strokeWidth={2.5} />
      </View>
      <Text style={{ fontSize: 14, paddingHorizontal: 0, paddingVertical: 4 }} className="flex-1 font-semibold text-slate-800 uppercase tracking-wide">{title}</Text>
      {rightElement ? rightElement : (
        onPress && <ChevronDown size={18} color="#94a3b8" />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView bounces={false} className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 1, paddingTop: 10, flexGrow: 1 }}>

        {/* Preferences Section */}
        <View className="mt-2 mx-5">
          <Text style={{ fontSize: 15, marginBottom: 10 }} className="text-slate-400 font-semibold uppercase tracking-widest ml-1">Preferences</Text>
          <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            style={{
              elevation: 3,
              shadowColor: '#64748b',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8
            }}>

            <SettingItem
              icon={Bell}
              title="Notifications"
              rightElement={<ChevronRight size={18} color="#94a3b8" />}
              onPress={() => router.push({ pathname: '/screens/update-details', params: { title: 'Notifications' } })}
            />
            <SettingItem
              icon={Globe}
              title="Language"
              rightElement={<ChevronRight size={18} color="#94a3b8" />}
              borderBottom={false}
              onPress={() => router.push({ pathname: '/screens/update-details', params: { title: 'Language' } })}
            />
          </View>
        </View>

        {/* Update Details Section */}
        <View className="mt-4 mx-5">
          <Text style={{ fontSize: 15, marginBottom: 10 }} className="text-slate-400 font-semibold uppercase tracking-widest ml-1">Update Details</Text>
          <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ elevation: 3, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
            <SettingItem
              icon={Edit}
              title="Personal Details"
              rightElement={<ChevronRight size={18} color="#94a3b8" />}
              onPress={() => router.push({ pathname: '/screens/update-details', params: { title: 'Personal Details' } })}
            />
            <SettingItem
              icon={FileSignature}
              title="Legal Details"
              rightElement={<ChevronRight size={18} color="#94a3b8" />}
              borderBottom={false}
              onPress={() => router.push({ pathname: '/screens/update-details', params: { title: 'Legal Details' } })}
            />
          </View>
        </View>

        <View style={{ marginTop: 'auto' }}>
          {/* Security Section */}
          <View className="mt-3.75 mx-5">
            <Text style={{ fontSize: 15, marginBottom: 10 }} className="text-slate-400 font-semibold uppercase tracking-widest ml-1">Security</Text>
            <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ elevation: 3, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
              <SettingItem
                icon={Lock}
                title="Change Password"
                onPress={() => openSupportModal('Change Password', `Changing your password protects your employee account from unauthorized access, keeping company information and personal data secure. To update it, you must verify your identity first. This additional verification step prevents unauthorized users from making changes to your account.

When you proceed, a 6-digit one-time passcode (OTP) will be sent to your registered company email. The OTP is valid for a limited time to ensure maximum security during the password reset process. This code verifies that you are the legitimate owner. Check your inbox and spam folder if it doesn't arrive.

Ensure your new password is at least six characters, combining letters, numbers, and symbols, and is different from the current one. Kindly avoid using the easily guessable information such as your name, birthdate, employee ID or any easy password.`, false, true)}
              />
              <SettingItem
                icon={Fingerprint}
                title="Biometric Login"
                onPress={() => openSupportModal('Biometric Login', `Biometric login allows you to securely access the VehicleeCare Employee App using your device's fingerprint or facial recognition scanner. This feature provides a faster, more convenient, and highly secure alternative to typing your password every time.

When you enable this feature, the app will prompt you to authenticate using your registered biometric data. Please note that VehicleeCare does not store your biometric data on our servers; the authentication is processed locally by your device's security system.

If your biometric authentication ever fails or your device scanner malfunctions, you will always be able to fall back to your standard password login. You can also disable the biometric feature at any time from your security settings if you prefer to use traditional login methods.`, true)}
              />
              <SettingItem
                icon={Smartphone}
                title="Enable MFA"
                borderBottom={false}
                onPress={() => openSupportModal('Enable MFA', `Multi-Factor Authentication (MFA) adds an extra layer of security to your VehicleeCare Employee account. When enabled, logging in will require not only your password but also a secondary verification step, such as a one-time passcode sent to your registered email or phone.

This ensures that even if someone manages to obtain your password, they will not be able to access your account without your secondary device. We strongly recommend enabling MFA to keep your personal and professional data safe from unauthorized access.

Setting up MFA will log you out of your current session momentarily to finalize the security upgrade. Once activated, you will be prompted for your secondary passcode on all new logins and unrecognized devices, ensuring complete control over who accesses your employee profile.`, true)}
              />
            </View>
          </View>

          {/* Support Section */}
          <View className="mt-4 mb-0 mx-5">
            <Text style={{ fontSize: 15, marginBottom: 10 }} className="text-slate-400 font-semibold uppercase tracking-widest ml-1">About & Support</Text>
            <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ elevation: 3, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
              <SettingItem
                icon={HelpCircle}
                title="Help Center"
                onPress={() => openSupportModal('Help Center', `Welcome to the Help Center. Here, you can find support and guidance for using the VehicleeCare Employee App smoothly and efficiently. As an employee, you can use the app to manage your attendance, apply for leave, receive important notifications, and update your profile information. If you face any issues while using the application, the Help Center is available to assist you with common problems and provide quick solutions.

If you are unable to log in, please make sure your employee credentials are entered correctly and your internet connection is stable. In case you forget your password, you can use the “Forgot Password” option to reset it securely. For attendance-related issues, ensure that the required permissions and connectivity are enabled before marking attendance. You can also check your attendance history anytime from the app.

The leave management section allows you to apply for leave, track approval status, and view leave history directly within the application. You will receive notifications whenever your leave request is approved or rejected by the management. VehicleeCare also provides regular updates regarding announcements, attendance alerts, and other important company information to help you stay informed.

You can manage your profile details and change your password anytime through the settings section. If the app is running slowly or not functioning properly, try restarting the app, updating it to the latest version, or clearing the app cache. For any unresolved issues or additional support, you can contact the HR or support team during official working hours.

Our goal at VehicleeCare is to provide you with a simple, secure, and user-friendly platform that makes your daily work management easier and more convenient.`)}
              />
              <SettingItem
                icon={Shield}
                title="Privacy Policy"
                onPress={() => openSupportModal('Privacy Policy', `Your privacy is important to us. This Privacy Policy explains how VehicleeCare collects, uses, stores, and protects your information while you use the application. By accessing and using the app, you agree to the collection and use of information in accordance with this policy.

VehicleeCare may collect personal and professional information such as your name, employee ID, email address, department details, attendance records, leave information, and other work-related data required for organizational purposes. This information is collected only to provide employee services, manage workplace operations, improve communication, and maintain accurate company records.

All information provided within the app is securely stored and accessed only by authorized personnel such as HR administrators or company management. We take appropriate security measures to protect your data from unauthorized access, misuse, loss, or disclosure. However, employees are also responsible for keeping their login credentials confidential and secure.

The application may use certain device permissions, such as internet access, notifications, and location services, to enable features like attendance marking, alerts, and real-time updates. These permissions are used strictly for app functionality and organizational requirements.

Your information will not be shared, sold, or distributed to third parties except when required by company policies, legal obligations, or authorized administrative purposes. VehicleeCare reserves the right to update or modify this Privacy Policy whenever necessary to improve services or comply with legal and organizational requirements.

By continuing to use the VehicleeCare Employee App, you acknowledge and accept the terms outlined in this Privacy Policy. If you have any concerns or questions regarding your data or privacy, you may contact the HR or support team for assistance.`)}
              />
              <SettingItem
                icon={FileText}
                title="Terms of Service"
                borderBottom={false}
                onPress={() => openSupportModal('Terms of Service', `Welcome to the VehicleeCare Employee App. This app is designed to help you manage your daily work activities easily and efficiently. Through this application, you can mark your attendance, apply for leave, receive important company notifications, and manage your profile details anytime and anywhere. The dashboard provides quick access to all major features so you can stay updated with your work-related information in one place.

To access the app, simply log in using your employee credentials. If you ever face issues while logging in, make sure your internet connection is stable and your login details are correct. In case you forget your password, you can use the “Forgot Password” option to securely reset it and regain access to your account.

The attendance feature allows you to mark your daily attendance and check your attendance history whenever needed. If your attendance is not updated properly, you can refresh the app, log in again, or contact the HR/admin team for support. For leave management, you can submit leave requests directly from the app by selecting leave dates and adding a valid reason. You can also track whether your leave request is pending, approved, or rejected by the management.

Vehicleecare also keeps you informed through notifications related to leave approvals, attendance updates, company announcements, and other important activities. To avoid missing any updates, it is recommended to keep app notifications enabled on your device. You can also update your personal information and change your password anytime through the profile and settings sections.

If you experience technical issues such as slow loading, app crashes, or login problems, try restarting the app, clearing the cache, or updating the application to the latest version. A stable internet connection will help ensure smooth performance while using the app. For any additional assistance or unresolved concerns, you can contact the HR or support team during official working hours.

The VehicleeCare Employee App is created to make your work experience more organized, transparent, and convenient by giving you quick access to all essential employee services in one secure platform.`)}
              />
            </View>
          </View>

          {/* <Text className="text-center text-slate-800 font-semibold text-[12px] mt-4 uppercase tracking-widest">
            Version 1.0.0
          </Text> */}
        </View>

      </ScrollView>

      {/* Consolidated Modal */}
      {/* Consolidated Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (showOTPModal) {
            setShowOTPModal(false);
          } else if (isPasswordFormVisible) {
            setIsPasswordFormVisible(false);
          } else {
            setModalVisible(false);
          }
        }}
      >
        {modalVisible && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (showOTPModal) {
                    // Do nothing
                  } else if (isPasswordFormVisible) {
                    setIsPasswordFormVisible(false);
                    setPasswordForm({ current: '', new: '', confirm: '' });
                  } else {
                    setModalVisible(false);
                    setPasswordForm({ current: '', new: '', confirm: '' });
                  }
                }}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
              />

              {/* SUPPORT INFO SHEET VIEW (BOTTOM SHEET) */}
              <View className="bg-white shadow-2xl overflow-hidden" style={{ height: (modalContent?.showEnable || modalContent?.showPasswordBtn) ? '65%' : '77%', width: '98%', borderRadius: 40, padding: 10 }}>
                <View style={{ paddingTop: 15, paddingBottom: 20, paddingHorizontal: 10 }} className="flex-row justify-between items-center relative">
                  <View style={{ width: 20 }} />
                  <Text className="text-[18px] font-bold text-[#011023] text-center uppercase tracking-wide flex-1">
                    {modalContent?.title}
                  </Text>
                  <TouchableOpacity onPress={() => { setModalVisible(false); setIsPasswordFormVisible(false); }}>
                    <X size={20} color="#011023" />
                  </TouchableOpacity>
                </View>
                <ScrollView bounces={false} style={{ paddingHorizontal: 12, paddingTop: 1 }} contentContainerStyle={{ paddingBottom: 1 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ fontSize: 12.75 }} className="text-slate-800 leading-5 font-semibold uppercase text-justify mb-4">
                    {modalContent?.text}
                  </Text>
                </ScrollView>
                {(modalContent?.showEnable || modalContent?.showPasswordBtn) && (
                  <View style={{ paddingHorizontal: 12, paddingBottom: 15, paddingTop: 5 }}>
                    <TouchableOpacity
                      onPress={async () => {
                        if (modalContent?.showPasswordBtn) {
                          setIsPasswordFormVisible(true);
                        } else if (modalContent?.title === 'Biometric Login') {
                          try {
                            const hasHardware = await LocalAuthentication.hasHardwareAsync();
                            if (!hasHardware) {
                              alert('Biometric hardware is not available on this device.');
                              return;
                            }
                            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                            if (!isEnrolled) {
                              alert('No biometrics registered on this device. Please set it up in your device settings.');
                              return;
                            }

                            const result = await LocalAuthentication.authenticateAsync({
                              promptMessage: biometricsEnabled ? 'Authenticate to disable Biometric Login' : 'Authenticate to enable Biometric Login',
                              cancelLabel: 'Cancel',
                            });

                            if (result.success) {
                              const newValue = !biometricsEnabled;
                              await SecureStore.setItemAsync('biometricsEnabled', newValue.toString());
                              setBiometricsEnabled(newValue);
                              setModalVisible(false);
                            }
                          } catch (error) {
                            console.log('Biometric auth error', error);
                          }
                        } else {
                          setModalVisible(false);
                        }
                      }}
                      style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 5, marginTop: 10 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>
                        {modalContent?.showPasswordBtn ? 'Change Password' : (modalContent?.title === 'Biometric Login' ? (biometricsEnabled ? 'Disable' : 'Enable') : (modalContent?.title === 'Enable MFA' ? 'Enable MFA' : 'Enable'))}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* CHANGE PASSWORD FORM VIEW (CENTERED CARD OVERLAY) */}
              {isPasswordFormVisible && (
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
                  <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                  <TouchableOpacity
                    activeOpacity={1}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                    onPress={() => {
                      if (!showOTPModal) {
                        setIsPasswordFormVisible(false);
                        setPasswordForm({ current: '', new: '', confirm: '' });
                      }
                    }}
                  />
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="bg-white rounded-[24px] shadow-2xl" style={{ backgroundColor: 'white', padding: 24, borderRadius: 24, width: 360, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <View className="items-center relative justify-center flex-row mb-10">
                        <Text className="text-[18px] font-bold text-[#011023] uppercase tracking-wide">Change Password</Text>
                        <TouchableOpacity
                          className="absolute right-0"
                          onPress={() => {
                            setIsPasswordFormVisible(false);
                            setPasswordForm({ current: '', new: '', confirm: '' });
                          }}
                        >
                          <X size={22} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>

                      <View className="w-full">
                        <View className="flex-row items-center justify-between mb-4">
                          <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 12.5 }} className="font-semibold text-slate-500 uppercase tracking-widest leading-5">Current</Text>
                            <Text style={{ fontSize: 12.5 }} className="font-semibold text-slate-500 uppercase tracking-widest leading-5">Password</Text>
                          </View>
                          <View
                            style={{ width: '65%', height: 40 }}
                            className="bg-[#f8fafc] border border-slate-200 rounded-xl px-4 flex-row items-center"
                          >
                            <TextInput
                              style={{ flex: 1, paddingVertical: 0 }}
                              className="font-semibold text-[#011023]"
                              secureTextEntry={!showCurrentPassword}
                              value={passwordForm.current}
                              onChangeText={(t) => setPasswordForm({ ...passwordForm, current: t })}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={{ paddingLeft: 8 }}>
                              {showCurrentPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between mb-4">
                          <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 12.5 }} className="font-semibold text-slate-500 uppercase tracking-widest leading-5">New</Text>
                            <Text style={{ fontSize: 12.5 }} className="font-semibold text-slate-500 uppercase tracking-widest leading-5">Password</Text>
                          </View>
                          <View
                            style={{ width: '65%', height: 40 }}
                            className="bg-[#f8fafc] border border-slate-200 rounded-xl px-4 flex-row items-center"
                          >
                            <TextInput
                              style={{ flex: 1, paddingVertical: 0 }}
                              className="font-semibold text-[#011023]"
                              secureTextEntry={!showNewPassword}
                              value={passwordForm.new}
                              onChangeText={(t) => setPasswordForm({ ...passwordForm, new: t })}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ paddingLeft: 8 }}>
                              {showNewPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between mb-4">
                          <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 12.5 }} className="font-semibold text-slate-500 uppercase tracking-widest leading-5">Confirm</Text>
                            <Text style={{ fontSize: 12.5 }} className="font-semibold text-slate-500 uppercase tracking-widest leading-5">Password</Text>
                          </View>
                          <View
                            style={{ width: '65%', height: 40 }}
                            className="bg-[#f8fafc] border border-slate-200 rounded-xl px-4 flex-row items-center"
                          >
                            <TextInput
                              style={{ flex: 1, paddingVertical: 0 }}
                              className="font-semibold text-[#011023]"
                              secureTextEntry={!showConfirmPassword}
                              value={passwordForm.confirm}
                              onChangeText={(t) => setPasswordForm({ ...passwordForm, confirm: t })}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ paddingLeft: 8 }}>
                              {showConfirmPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View className="flex-row justify-end mb-4" style={{ marginTop: -10, marginLeft: 2 }}>
                          <View style={{ width: '65%', height: 18, justifyContent: 'center' }}>
                            {passwordForm.confirm.length > 0 ? (
                              passwordForm.new === passwordForm.confirm ? (
                                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '600' }} className="uppercase tracking-wider">Password Matched</Text>
                              ) : (
                                <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '600' }} className="uppercase">Password Does Not Match</Text>
                              )
                            ) : null}
                          </View>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row border-t border-slate-100 justify-between items-center" style={{ paddingTop: 16, marginTop: 4, gap: 15 }}>
                        <TouchableOpacity
                          onPress={handleUpdatePasswordClick}
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#151a20ff', borderRadius: 12, paddingVertical: 12 }}
                        >
                          <Text style={{ fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Update Password</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              )}

              {/* OTP MODAL OVERLAY */}
              {showOTPModal && (
                <OTPModal
                  visible={showOTPModal}
                  onClose={() => setShowOTPModal(false)}
                  onVerify={handleVerifyOTP}
                  isSubmitting={isSubmittingOTP}
                  title="Verification"
                  subtitle="Enter the OTP sent to your email"
                />
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>

    </View>
  );
}
