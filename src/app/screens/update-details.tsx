import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, ScrollView, TextInput, Switch, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function UpdateDetailsScreen() {
  const { title } = useLocalSearchParams();
  const screenTitle = title ? (title as string).toUpperCase() : 'UPDATE DETAILS';

  // Notifications State
  const [turnOffNotifications, setTurnOffNotifications] = useState(false);
  const [administration, setAdministration] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [leaveAlertsEnabled, setLeaveAlertsEnabled] = useState(true);
  const [newRelease, setNewRelease] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [rating, setRating] = useState(true);
  const [taskAlertsEnabled, setTaskAlertsEnabled] = useState(true);

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState('English(default)');

  // Form States
  const [personalForm, setPersonalForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [legalForm, setLegalForm] = useState({ aadhar: '', pan: '', voter: '', emergencyContact: '' });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const turnOffStr = await SecureStore.getItemAsync('turnOffNotifications');
        const adminStr = await SecureStore.getItemAsync('administration');
        const emailStr = await SecureStore.getItemAsync('emailEnabled');
        const leaveStr = await SecureStore.getItemAsync('leaveAlertsEnabled');
        const releaseStr = await SecureStore.getItemAsync('newRelease');
        const pushStr = await SecureStore.getItemAsync('pushEnabled');
        const ratingStr = await SecureStore.getItemAsync('rating');
        const taskStr = await SecureStore.getItemAsync('taskAlertsEnabled');

        if (turnOffStr !== null) setTurnOffNotifications(turnOffStr === 'true');
        if (adminStr !== null) setAdministration(adminStr === 'true');
        if (emailStr !== null) setEmailEnabled(emailStr === 'true');
        if (leaveStr !== null) setLeaveAlertsEnabled(leaveStr === 'true');
        if (releaseStr !== null) setNewRelease(releaseStr === 'true');
        if (pushStr !== null) setPushEnabled(pushStr === 'true');
        if (ratingStr !== null) setRating(ratingStr === 'true');
        if (taskStr !== null) setTaskAlertsEnabled(taskStr === 'true');

        const lang = await SecureStore.getItemAsync('appLanguage');
        if (lang) {
          setSelectedLanguage(lang);
        }
      } catch (e) {
        console.log('Error loading settings', e);
      }
    };
    loadSettings();
  }, []);

  const toggleSetting = async (key: string, value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(value);
    try {
      await SecureStore.setItemAsync(key, value.toString());
    } catch (e) {
      console.log('Error saving setting', e);
    }
  };

  const selectLanguageSetting = async (langName: string) => {
    setSelectedLanguage(langName);
    try {
      await SecureStore.setItemAsync('appLanguage', langName);
    } catch (e) {
      console.log('Error saving language', e);
    }
  };

  const renderNotifications = () => (
    <View className="" style={{  }}>

      <View style={{paddingTop: 15 }} className="mb-2">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Turn Off Notifications</Text>
          <Switch style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('turnOffNotifications', val, setTurnOffNotifications)} value={turnOffNotifications} />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={3}>A centralized master control that temporarily suspends all incoming application notifications and alerts across the platform.</Text>
      </View>
      
      <View style={{ opacity: turnOffNotifications ? 0.5 : 1 }} pointerEvents={turnOffNotifications ? 'none' : 'auto'}>
        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Administration</Text>
            <Switch disabled={turnOffNotifications} style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('administration', val, setAdministration)} value={administration} />
          </View>
          <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={2}>Receive all alerts for the administrative updates policy changes, and portal announcements.</Text>
        </View>

        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Email Alerts</Text>
            <Switch disabled={turnOffNotifications} style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('emailEnabled', val, setEmailEnabled)} value={emailEnabled} />
          </View>
          <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={2}>Receive important summaries, reports, and alerts directly to your registered email address.</Text>
        </View>

        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Leave Updates</Text>
            <Switch disabled={turnOffNotifications} style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('leaveAlertsEnabled', val, setLeaveAlertsEnabled)} value={leaveAlertsEnabled} />
          </View>
          <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={2}>Stay updated on your requested leave approvals rejections, and balance adjustments.</Text>
        </View>

        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">New Release</Text>
            <Switch disabled={turnOffNotifications} style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('newRelease', val, setNewRelease)} value={newRelease} />
          </View>
          <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={2}>Stay informed about the latest version updates platform enhancements, and system upgrades.</Text>
        </View>

        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Push Notifications</Text>
            <Switch disabled={turnOffNotifications} style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('pushEnabled', val, setPushEnabled)} value={pushEnabled} />
          </View>
          <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={2}>Allow instant push notifications on your device for real-time critical alerts.</Text>
        </View>

        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Rating </Text>
            <Switch disabled={turnOffNotifications} style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('rating', val, setRating)} value={rating} />
          </View>
          <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={2}>Get notified when you receive new performance ratings or customer feedback.</Text>
        </View>

        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Task Assigned</Text>
            <Switch disabled={turnOffNotifications} style={{ transform: [{ scale: 0.9 }] }} trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor="#ffffff" onValueChange={(val) => toggleSetting('taskAlertsEnabled', val, setTaskAlertsEnabled)} value={taskAlertsEnabled} />
          </View>
          <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-3 mr-2 text-justify" numberOfLines={2}>Receive immediate updates when new tasks is being assigned, modified, or completed.</Text>
        </View>
      </View>
    </View>
  );

  const renderLanguage = () => (
    <View className="" style={{  }}>
      <View style={{paddingTop: 13 }} className="mb-2">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">English (Indian)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('English(default)'); }} 
            value={selectedLanguage === 'English(default)'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>Configure English as the default language for all menus, forms, and system logs.</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Hindi (हिंदी)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Hindi'); }} 
            value={selectedLanguage === 'Hindi'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>सभी डैशबोर्ड, मेनू और सूचनाओं के अनुवाद के लिए हिंदी को अपनी प्राथमिक भाषा के रूप में सेट करें।</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Bengali (বাংলা)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Bengali'); }} 
            value={selectedLanguage === 'Bengali'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>সমস্ত ড্যাশবোর্ড, মেনু এবং বিজ্ঞপ্তিগুলির অনুবাদের জন্য বাংলাকে আপনার প্রাথমিক ভাষা হিসাবে সেট করুন।</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Marathi (मराठी)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Marathi'); }} 
            value={selectedLanguage === 'Marathi'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>सर्व डॅशबोर्ड, मेनू आणि अधिसूचनांच्या अनुवादासाठी मराठीला तुमची प्राथमिक भाषा म्हणून सेट करा.</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Telugu (తెలుగు)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Telugu'); }} 
            value={selectedLanguage === 'Telugu'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>అన్ని డ్యాష్‌బోర్డ్‌లు, మెనూలు మరియు నోటిఫಿಕేషన్‌ల అనువాదం కోసం తెలుగును మీ ప్రాథమిక భాషగా సెట్ చేయండి.</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Tamil (தமிழ்)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Tamil'); }} 
            value={selectedLanguage === 'Tamil'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>அனைத்து டாஷ்போர்டுகள், மெனுக்கள் மற்றும் அறிவிப்புகளின் மொழிபெயர்ப்பிற்கு தமிழை உங்கள் முதன்மை மொழியாக அமைக்கவும்.</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Kannada (ಕನ್ನಡ)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Kannada'); }} 
            value={selectedLanguage === 'Kannada'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>ಎಲ್ಲಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗಳು, ಮೆನುಗಳು ಮತ್ತು ಅಧಿಸೂಚನೆಗಳ ಅನುವಾದಕ್ಕಾಗಿ ಕನ್ನಡವನ್ನು ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಭಾಷೆಯಾಗಿ ಹೊಂದಿಸಿ.</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Punjabi (ਪੰਜਾਬੀ)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Punjabi'); }} 
            value={selectedLanguage === 'Punjabi'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={2}>ਸਾਰੇ ਡੈਸ਼ਬੋਰਡ, ਮੀਨੂ ਅਤੇ ਸੂਚਨਾਵਾਂ ਦੇ ਅਨੁਵਾਦ ਲਈ ਪੰਜਾਬੀ ਨੂੰ ਆਪਣੀ ਮੁਢਲੀ ਭਾਸ਼ਾ ਵਜੋਂ ਸੈੱਟ ਕਰੋ।</Text>
      </View>

      <View className="py-1">
        <View className="flex-row items-center justify-between">
          <Text style={{fontSize: 16}} className="font-semibold text-slate-800 uppercase tracking-wide">Malayalam (മലയാളം)</Text>
          <Switch 
            style={{ transform: [{ scale: 0.9 }] }} 
            trackColor={{ false: '#cbd5e1', true: '#10b981' }} 
            thumbColor="#ffffff" 
            onValueChange={(val) => { if (val) selectLanguageSetting('Malayalam'); }} 
            value={selectedLanguage === 'Malayalam'} 
          />
        </View>
        <Text style={{fontSize: 12.5}} className="text-slate-500 uppercase mt-2 mr-2 text-justify" numberOfLines={3}>എല്ലാ ഡാഷ്‌ബോർഡുകളും മെനുകളും അറിയിപ്പുകളും വിവർത്തനം ചെയ്യുന്നതിനായി മലയാളം നിങ്ങളുടെ പ്രാഥമിക ഭാഷയായി സജ്ജീകരിക്കുക.</Text>
      </View>
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'none' }: any) => (
    <View className="mb-5">
      <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</Text>
      <TextInput 
        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-semibold text-[#011023]"
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );

  const renderPersonalDetails = () => (
    <View className="mt-4 mx-5 bg-white rounded-2xl border border-slate-200" style={{ elevation: 3, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, padding: 20 }}>
      <InputField label="Full Name" placeholder="Enter full name" value={personalForm.name} onChangeText={(t: string) => setPersonalForm({...personalForm, name: t})} autoCapitalize="words" />
      <InputField label="Email Address" placeholder="Enter email" value={personalForm.email} onChangeText={(t: string) => setPersonalForm({...personalForm, email: t})} keyboardType="email-address" />
      <InputField label="Phone Number" placeholder="Enter phone" value={personalForm.phone} onChangeText={(t: string) => setPersonalForm({...personalForm, phone: t})} keyboardType="phone-pad" />
      <InputField label="Home Address" placeholder="Enter address" value={personalForm.address} onChangeText={(t: string) => setPersonalForm({...personalForm, address: t})} autoCapitalize="words" />
      
      <TouchableOpacity style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginTop: 10 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLegalDetails = () => (
    <View className="mt-4 mx-5 bg-white rounded-2xl border border-slate-200" style={{ elevation: 3, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, padding: 20 }}>
      <InputField label="Aadhar Card Number" placeholder="Enter 12-digit Aadhar" value={legalForm.aadhar} onChangeText={(t: string) => setLegalForm({...legalForm, aadhar: t})} keyboardType="numeric" />
      <InputField label="PAN Card Number" placeholder="Enter PAN number" value={legalForm.pan} onChangeText={(t: string) => setLegalForm({...legalForm, pan: t})} autoCapitalize="characters" />
      <InputField label="Voter ID" placeholder="Enter Voter ID" value={legalForm.voter} onChangeText={(t: string) => setLegalForm({...legalForm, voter: t})} autoCapitalize="characters" />
      <InputField label="Emergency Contact" placeholder="Emergency phone" value={legalForm.emergencyContact} onChangeText={(t: string) => setLegalForm({...legalForm, emergencyContact: t})} keyboardType="phone-pad" />
      
      <TouchableOpacity style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginTop: 10 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Update Legal Info</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
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
              <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/settings')} className="flex-row items-center">
                <ArrowLeft size={22} color="#011023" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            
            {/* Center: Title */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text 
                style={{ fontSize: 20 }} 
                className="font-bold text-[#011023] tracking-[-0.5px] uppercase"
                numberOfLines={1}
              >
                {screenTitle}
              </Text>
            </View>

            {/* Right: Placeholder */}
            <View style={{ width: 70, alignItems: 'flex-end' }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0, paddingTop: 0, marginHorizontal: 20 }} bounces={false}>
          {title === 'Notifications' && renderNotifications()}
          {title === 'Personal Details' && renderPersonalDetails()}
          {title === 'Legal Details' && renderLegalDetails()}
          {title === 'Language' && renderLanguage()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
