import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, Keyboard, 
  TouchableWithoutFeedback, ActivityIndicator 
} from 'react-native';
import { Loader2, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface OTPModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void | boolean | Promise<void | boolean>;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
}

export default function OTPModal({
  visible,
  onClose,
  onVerify,
  isSubmitting = false,
  title = "Verification",
  subtitle = "Enter the OTP sent to customer"
}: OTPModalProps) {
  const [otpInput, setOtpInput] = useState('');
  const otpInputRef = useRef<TextInput>(null);

  // Reset and focus input when modal is visible
  useEffect(() => {
    if (visible) {
      setOtpInput('');
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const handleVerify = async (code: string) => {
    try {
      const success = await onVerify(code);
      if (success === false) {
        setOtpInput('');
        otpInputRef.current?.focus();
      }
    } catch (e) {
      setOtpInput('');
      otpInputRef.current?.focus();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100 }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View className="bg-[#f5f7f9] shadow-2xl relative items-center" style={{ width: '92%', borderRadius: 32, padding: 24, paddingTop: 32, paddingBottom: 24 }}>
            
            {/* Header */}
            <View className="w-full relative items-center mb-8">
              <Text className="text-[19px] font-bold text-[#011023] uppercase tracking-wide">{title}</Text>
              <TouchableOpacity 
                onPress={onClose} 
                className="absolute right-0 top-0 p-1"
              >
                <X size={20} color="#011023" />
              </TouchableOpacity>
              <Text style={{ fontSize: 13.25 }} className="text-slate-500 font-semibold mt-2 uppercase tracking-wider text-center">{subtitle}</Text>
            </View>

            {/* Hidden Input for handling keyboard reliably */}
            <TextInput
              ref={otpInputRef}
              value={otpInput}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                setOtpInput(cleaned);
                if (cleaned.length === 6) {
                  handleVerify(cleaned);
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
              style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 20, marginTop: 7, marginBottom: 25 }}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <View 
                  key={index}
                  style={{ 
                    width: 36, 
                    height: 40, 
                    borderRadius: 12, 
                    borderWidth: 1,
                    borderColor: otpInput.length === index ? '#10b981' : (otpInput[index] ? '#f8fafc' : '#e2e8f0')
                  }}
                  className={`bg-white items-center justify-center shadow-sm ${otpInput.length === index ? 'bg-emerald-50/20' : ''}`}
                >
                  <Text style={{fontSize: 28, marginTop: 8, marginLeft: 2, fontWeight: '500'}} className="font-semibold text-[#011023]">
                    {otpInput[index] ? '*' : ''}
                  </Text>
                </View>
              ))}
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </KeyboardAvoidingView>
  );
}
