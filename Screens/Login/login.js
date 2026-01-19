import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, get } from "firebase/database";
import { db } from "../firebase"; // path may change
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket } from '../../src/services/socket';
import api from "../../src/utils/axios";




export default function LoginScreen({ navigation }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
  if (!loginId || !password) {
    console.log("❌ Empty login attempt");
    alert("Please enter Login ID and Password");
    return;
  }

  try {
    console.log("🔍 Login attempt started for:", loginId);

    // ================= ADMIN =================
    // ================= ADMIN =================
const adminSnap = await get(ref(db, "Admin"));
if (adminSnap.exists()) {
  const admins = adminSnap.val();
  for (let key in admins) {
    const admin = admins[key];
    if (
      (admin.id === loginId || admin.email === loginId) &&
      admin.password === password
    ) {
      console.log("✅ ADMIN logged in:", admin.email || admin.id);

      await AsyncStorage.setItem("adminId", key);
      await AsyncStorage.setItem("userType", "admin");

      // 🔌 CONNECT SOCKET HERE
      connectSocket({
  firebaseKey: key,
  userId: admin.id,
  role: "admin"
  
});
await api.post("/api/users/login", {
  userId: admin.id,
  role: "admin",
});


      navigation.replace("AdminDashboard");
      return;
    }
  }
}

    // ================= TEACHERS =================
   // ================= TEACHERS =================
const teacherSnap = await get(ref(db, "teachers"));
if (teacherSnap.exists()) {
  const teachers = teacherSnap.val();
  for (let key in teachers) {
    const teacher = teachers[key];
    if (
      (teacher.id === loginId || teacher.email === loginId) &&
      teacher.password === password
    ) {
      console.log("✅ TEACHER logged in:", teacher.email || teacher.id);

      await AsyncStorage.setItem("teacherId", key);
      await AsyncStorage.setItem("userType", "teacher");

      // 🔌 CONNECT SOCKET HERE
      connectSocket({
  firebaseKey: key,
  userId: teacher.id,
  role: "teacher"
});

api.post("/api/users/login", {
  userId: teacher.id,
  role: "teacher",
}).catch(err =>
  console.log("Login API failed (ignored):", err.message)
);

      navigation.replace("TeacherDashboard", {
        teacherId: key,
        teacherData: {
          ...teacher,
          firebaseKey: key,
        },
      });
      return;
    }
  }
}


    // ================= STUDENTS =================
    // ================= STUDENTS =================
const studentSnap = await get(ref(db, "students"));
if (studentSnap.exists()) {
  const students = studentSnap.val();
  for (let key in students) {
    const student = students[key];
    if (
      (student.id === loginId ||
        student.email === loginId ||
        student.prn === loginId) &&
      student.password === password
    ) {
      console.log("✅ STUDENT logged in:", student.name || student.prn);

await AsyncStorage.setItem("studentKey", key);
await AsyncStorage.setItem("studentId", student.id); // 🔥 REQUIRED
await AsyncStorage.setItem("userType", "student");
await AsyncStorage.setItem("studentYear", String(student.year));
await AsyncStorage.setItem("studentDivision", String(student.division));


      // 🔌 CONNECT SOCKET HERE
      connectSocket({
  firebaseKey: key,
  userId: student.id,
  role: "student"
});

await api.post("/api/users/login", {
  userId: student.id,
  role: "student",
});

      navigation.replace("StudentDashboard", {
        studentData: {
          ...student,
          firebaseKey: key,
        },
      });
      return;
    }
  }
}


    // ❌ NO MATCH FOUND
    console.log("❌ Login failed: Invalid credentials for", loginId);
    alert("Invalid credentials ❌");

  } catch (error) {
    console.error("🔥 Login Error:", error);
    alert("Something went wrong. Please try again.");
  }
};




  return (
    <KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <ScrollView
    contentContainerStyle={{ flexGrow: 1 }}
    keyboardShouldPersistTaps="handled"
  >
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#7e22ce']}
      style={{ flex: 1 }}
    >
        
          {/* College Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
            <View style={styles.shadowWrapper}>
              <View style={styles.logoCircle}>
                <Image
                  source={{ uri: 'https://www.sguk.ac.in/assets/images/banner-image/new-banner-image1.png' }}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
            </View>



            </View>
            <Text style={styles.collegeName}>Sanjay Ghodawat University</Text>
            <Text style={styles.subtitle}>Attendance Management System</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.loginText}>Login to your account</Text>

            {/* Login ID Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Login ID</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your ID"
                  placeholderTextColor="#a0aec0"
                  value={loginId}
                  onChangeText={setLoginId}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#a0aec0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#7e22ce', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>LOGIN</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Additional Info */}
            
          </View>
       
      </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 60,
  },
  logoCircle: {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: 'white', // makes shadow visible
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
  
  // Shadow for iOS
  shadowColor: '#00000020', // semi-transparent shadow
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 10,

  // Shadow for Android
  elevation: 7,

  overflow: 'hidden', // clips the image inside the circle
},
shadowWrapper: {
  width: 120,
  height: 120,
  borderRadius: 60,
  justifyContent: 'center',
  alignItems: 'center',
  
  // Shadow "fake" effect
  backgroundColor: 'transparent',
  shadowColor: '#00000060', // darker, semi-transparent
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  elevation: 8,
},

logoCircle: {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: 'white', // actual circle
  overflow: 'hidden',
  justifyContent: 'center',
  alignItems: 'center',
},


  logo: {
    width: 120,
    height: 120,
      borderRadius: 40, 
  },
  collegeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  loginText: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 12,
  },
  eyeText: {
    fontSize: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#7e22ce',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7e22ce',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 25,
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
  },
});