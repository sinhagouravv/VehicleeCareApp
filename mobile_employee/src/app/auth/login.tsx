import React, { useState, useEffect, useRef } from 'react';
import { 
  Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator, 
  Keyboard, TouchableWithoutFeedback, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';

import { router } from 'expo-router';
import { Lock, User, Eye, EyeOff, X, Check } from 'lucide-react-native';
import axios from 'axios';

import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// Dynamically grab the exact IP address the Expo packager is using
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0 = hidden, 1 = enter employee email, 2 = verify OTP, 3 = new pass
  const [resetEmployeeId, setResetEmployeeId] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [successMessage, setSuccessMessage] = useState('');
  
  const otpInputRef = useRef<TextInput>(null);

  // Show native Alert when error or successMessage is set
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: () => setError('') }]);
    }
  }, [error]);

  // Focus hidden input when forgotPasswordStep goes to Step 2
  useEffect(() => {
    if (forgotPasswordStep === 2) {
      setResetOtp('');
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [forgotPasswordStep]);

  const handleLogin = async () => {
    if (!employeeId || !password) {
      setError('Please fill in all fields');
      return;
    }

    Keyboard.dismiss();
    setError('');
    // setSuccessMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/employee-login`, { employeeId, password }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        await SecureStore.setItemAsync('employeeToken', data.token);
        await SecureStore.setItemAsync('employeeUser', JSON.stringify(data.employee));
        router.replace('/tabs'); // Route to main app after auth
        // setSuccessMessage('Login Successful!');
      } else {
        setError(`Invalid employeeId or password mentioned for the ${employeeId}. Kindly fill the correct credentials.`);
      }
    } catch (err) {
      console.error('LOGIN FETCH ERROR:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async () => {
    if (!resetEmployeeId || !resetEmail) {
      setError('Please fill in all fields');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/employee-forgot-password`, { employeeId: resetEmployeeId, email: resetEmail }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        setForgotPasswordStep(2);
      } else {
        setError(data.msg || 'The email you entered is not registered');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otpString = code || resetOtp;
    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/employee-verify-reset-otp`, { email: resetEmail, otp: otpString }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        setForgotPasswordStep(3);
      } else {
        setError(data.msg || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const otpString = resetOtp;
      const res = await axios.post(`${API_URL}/api/auth/employee-reset-password`, { email: resetEmail, otp: otpString, newPassword }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        setForgotPasswordStep(0);
        Alert.alert('Success', 'Password updated successfully. Please log in.');
        setEmployeeId('');
        setResetEmployeeId('');
        setResetOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetEmail('');
      } else {
        setError(data.msg || 'Failed to update password');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };



  return (
    <View className="flex-1 bg-slate-50">
      {/* Background Gradients mimicking Web CSS */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-blue-400/20" />
        <View className="absolute -bottom-[10%] -right-[10%] w-[90vw] h-[90vw] rounded-full bg-emerald-400/15" />
        <View className="absolute top-[40%] right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-400/10" />
      </View>



      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView className="flex-1 justify-center items-center p-4">
            
            <View className={`w-full max-w-[420px] bg-white rounded-[40px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden ${forgotPasswordStep > 0 ? 'scale-95 opacity-40' : 'scale-100 opacity-100'}`} style={{ transform: [{ translateY: -28 }] }}>
              <View className="items-center mb-10">
                <View className="mb-4 justify-center items-center" style={{ width: 70, height: 60 }}>
                  <Image 
                    source={require('../../../assets/images/logo.svg')} 
                    style={{ width: '100%', height: '100%' }} 
                    contentFit="contain" 
                  />
                </View>
                <Text className="text-slate-800 font-bold text-[15px] tracking-[1.5px] uppercase mb-2">vehicleecare</Text>
                <Text className="text-[28px] font-bold text-[#011023] tracking-[-0.5px] uppercase">Employee Portal</Text>
              </View>

              <View className="mb-6">
                {/* <Text className="text-[13.5px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3">Employee ID</Text> */}
                <View className="relative justify-center">
                  <View className="absolute left-5 z-10 h-full justify-center">
                    <User size={18} color="#94a3b8" /> 
                  </View>
                  <TextInput
                    className="w-full bg-white border border-slate-100 shadow-sm rounded-[18px] pr-4 text-[15px] font-semibold text-[#011023] tracking-wider"
                    style={{ paddingLeft: 46, paddingVertical: 12.5 }}
                    placeholder="Employee ID"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="number-pad"
                    maxLength={9}
                    value={employeeId}
                    onChangeText={(text) => setEmployeeId(text.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </View>

              <View className="mb-8">
                {/* <Text className="text-[13.5px] font-semibold text-slate-400 uppercase tracking-widest ml-1 mb-3">Password</Text> */}
                <View className="relative justify-center">
                  <View className="absolute left-5 z-10 h-full justify-center">
                    <Lock size={18} color="#94a3b8" />
                  </View>
                  <TextInput
                    className="w-full bg-white border border-slate-100 shadow-sm rounded-[18px] pr-12 text-[15px] font-semibold text-[#011023] tracking-widest"
                    style={{ paddingLeft: 46, paddingVertical: 12 }}
                    placeholder="Password"
                    placeholderTextColor="#cbd5e1"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <View className="absolute right-5 z-10 h-full justify-center">
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                      {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-8 px-1">
                <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} activeOpacity={1} className="flex-row items-center gap-2 group">
                  <View className={`justify-center items-center shadow-sm bg-white border ${rememberMe ? 'border-slate-100' : 'border-slate-100'}`} style={{ width: 22.5, height: 20, borderRadius: 9 }}>
                    {rememberMe && <Check size={15} color="#000000" strokeWidth={2.5} />} 
                  </View>
                  <Text className="text-[#052558] font-semibold text-[13.25px] tracking-tight" style={{ marginLeft: 2}}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setForgotPasswordStep(1); setError(''); }}>
                  <Text className="text-[#052558] font-semibold text-[13px] tracking-tight">Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity className="w-full rounded-[20px] overflow-hidden shadow-[0_8px_15px_rgba(5,37,88,0.15)] elevation-5" onPress={handleLogin} disabled={loading}>
                <LinearGradient
                  colors={['#1c3a63', '#396395']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full py-[18px] items-center"
                >
                  <Text className="text-white font-bold text-[13px] p-4 text-center tracking-[2.5px] uppercase">
                    {loading ? 'Logging in...' : 'Login'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* FORGOT PASSWORD MODAL */}
      <Modal visible={forgotPasswordStep > 0} transparent={true} animationType="fade" onRequestClose={() => setForgotPasswordStep(0)}>
        {forgotPasswordStep > 0 ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="flex-1 justify-center items-center">
              <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
              <TouchableOpacity activeOpacity={1} className="absolute inset-0" onPress={() => setForgotPasswordStep(0)} />
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="bg-white rounded-[24px] shadow-2xl" style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 24, borderRadius: 24, width: 350, marginTop: 30 }}>
                  
                  <View className="flex-row justify-center items-center relative" style={{ marginBottom: 20 }}>
                    <Text className="text-[19px] font-bold text-[#011023] tracking-[-0.5px]">ACCOUNT RECOVERY</Text>
                    <TouchableOpacity onPress={() => setForgotPasswordStep(0)} className="absolute right-0 p-2 bg-slate-50 rounded-full">
                      {/* <X size={20} color="#94a3b8" /> */}
                    </TouchableOpacity>
                  </View>

                  {/* Step 1: ID & Email */}
                  {forgotPasswordStep === 1 && (
                    <View className="items-center">
                      <Text className="text-[13px] text-slate-400 text-center uppercase font-semibold mb-[30px] px-1 leading-5">
                        Kindly Enter your Employee ID and registered email to receive an OTP
                      </Text>
                      
                      <View className="flex-row items-center justify-between mb-4 w-full relative">
                        <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">emp_ID</Text>
                        <TextInput
                          className="bg-white border border-slate-200 text-[#011023]"
                          style={{ width: 220, height: 32, borderRadius: 14, paddingHorizontal: 16, fontSize: 13, fontWeight: '600' }}
                          // placeholder="Enter 9-digit ID"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numeric"
                          maxLength={9}
                          value={resetEmployeeId}
                          onChangeText={(text) => setResetEmployeeId(text.replace(/[^0-9]/g, ''))}
                        />
                      </View>

                      <View className="flex-row items-center justify-between mb-6 w-full relative">
                        <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">Email</Text>
                        <TextInput
                          className="bg-white border border-slate-200 text-[#011023]"
                          style={{ width: 220, height: 32, borderRadius: 14, paddingHorizontal: 16, fontSize: 13, fontWeight: '600' }}
                          // placeholder="e.g. employee@vc.com"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={resetEmail}
                          onChangeText={setResetEmail}
                        />
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row justify-between items-center w-full" style={{ marginTop: 12, gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => setForgotPasswordStep(0)} 
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 12, paddingVertical: 10 }}
                        >
                          <Text style={{ fontWeight: 'bold', color: '#3c4655ff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => setForgotPasswordStep(2)} 
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#052558', borderRadius: 12, paddingVertical: 10 }}
                        >
                          <Text style={{ fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Send OTP</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Step 2: Verify OTP */}
                  {forgotPasswordStep === 2 && (
                    <View className="items-center">
                      <Text className="text-[13px] text-slate-400 text-center font-semibold uppercase px-1 mb-1">
                        Kindly Enter the 6-digit code sent to
                      </Text>
                      <Text className="text-[#052558] font-semibold text-[13px] text-center uppercase px-1 mb-[30px]">
                        {resetEmail}
                      </Text>
                      
                      {/* Hidden Input for handling keyboard reliably */}
                      <TextInput
                        ref={otpInputRef}
                        value={resetOtp}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                          setResetOtp(cleaned);
                          if (cleaned.length === 6) {
                            handleVerifyOtp(cleaned);
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        className="absolute opacity-0 w-0 h-0"
                      />

                      {/* Visual OTP Boxes */}
                      <TouchableOpacity 
                        activeOpacity={1} 
                        onPress={() => otpInputRef.current?.focus()}
                        style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 15, marginTop: 0, marginBottom: 25 }}
                      >
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <View 
                            key={index}
                            style={{ 
                              width: 36, 
                              height: 40, 
                              borderRadius: 12, 
                              borderWidth: 1,
                              borderColor: resetOtp.length === index ? '#10b981' : (resetOtp[index] ? '#f8fafc' : '#e2e8f0')
                            }}
                            className={`bg-white items-center justify-center shadow-sm ${resetOtp.length === index ? 'bg-emerald-50/20' : ''}`}
                          >
                            <Text style={{fontSize: 28, marginTop: 8, marginLeft: 2, fontWeight: '500'}} className="font-semibold text-[#011023]">
                              {resetOtp[index] ? '*' : ''}
                            </Text>
                          </View>
                        ))}
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleSendResetOtp} className="mb-5">
                        <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-[1px]">Didn't get the code? <Text className="text-[#052558] font-bold">Resend OTP</Text></Text>
                      </TouchableOpacity>

                      {/* Action Buttons */}
                      <View className="flex-row justify-between items-center w-full" style={{ marginTop: 12, gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => setForgotPasswordStep(1)} 
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 12, paddingVertical: 10 }}
                        >
                          <Text style={{ fontWeight: 'bold', color: '#3c4655ff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Back</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => handleVerifyOtp()} 
                          disabled={loading || resetOtp.length !== 6}
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#052558', borderRadius: 12, paddingVertical: 10 }}
                        >
                          <Text style={{ fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                            {loading ? 'Verifying...' : 'Verify'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Step 3: New Password */}
                  {forgotPasswordStep === 3 && (
                    <View className="items-center">
                      <Text className="text-slate-400 text-center font-semibold mb-[30px] uppercase w-full" style={{ fontSize: 12.45 }}>Create a new password for your account</Text>
                      
                      <View className="flex-row items-center justify-between mb-4 w-full relative">
                        <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">New{"\n"}Password</Text>
                        <View className="relative justify-center" style={{ width: 190 }}>
                          <TextInput
                            className="bg-white border border-slate-200 text-[#011023]"
                            style={{ width: '100%', height: 32, borderRadius: 14, paddingLeft: 16, paddingRight: 40, fontSize: 13, fontWeight: '500' }}
                            placeholderTextColor="#cbd5e1"
                            secureTextEntry={!showNewPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                          />
                          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: 10, zIndex: 10 }} className="p-1">
                            {showNewPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between mb-2 w-full relative">
                        <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">Confirm{"\n"}Password</Text>
                        <View className="relative justify-center" style={{ width: 190 }}>
                          <TextInput
                            className="bg-white border border-slate-200 text-[#011023]"
                            style={{ width: '100%', height: 32, borderRadius: 14, paddingLeft: 16, paddingRight: 40, fontSize: 13, fontWeight: '500' }}
                            placeholderTextColor="#cbd5e1"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                          />
                          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 10, zIndex: 10 }} className="p-1">
                            {showConfirmPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Password Match Indicator */}
                      <View className="flex-row justify-end mb-4 w-full">
                        <View style={{ width: 190, height: 18, justifyContent: 'center' }}>
                          {confirmNewPassword.length > 0 ? (
                            newPassword === confirmNewPassword ? (
                              <Text style={{ fontSize: 9.5, color: '#16a34a', fontWeight: '700' }} className="uppercase tracking-wider">Password Matched</Text>
                            ) : (
                              <Text style={{ fontSize: 9.5, color: '#dc2626', fontWeight: '700' }} className="uppercase tracking-wide">Password Does Not Match</Text>
                            )
                          ) : null}
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row justify-between items-center w-full" style={{ marginTop: 12, gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => setForgotPasswordStep(0)} 
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 12, paddingVertical: 10 }}
                        >
                          <Text style={{ fontWeight: 'bold', color: '#3c4655ff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={handleResetPassword} 
                          disabled={loading || !newPassword}
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#052558', borderRadius: 12, paddingVertical: 10 }}
                        >
                          <Text style={{ fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                            {loading ? 'Updating...' : 'Update'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                </View>
              </TouchableWithoutFeedback>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </Modal>

    </View>
  );
}


