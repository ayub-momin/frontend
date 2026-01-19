import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { disconnectSocket } from "../../src/services/socket";
import api from "../../src/utils/axios";

import AttendanceScreen from './Student-Record.js';

const { width } = Dimensions.get('window');

const StudentProfile = ({  route }) => {
  const navigation = useNavigation();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadStudentData = async () => {
    try {
      // First, try to get data from route params (if navigated from login)
      if (route?.params?.studentData) {
        setStudentData(route.params.studentData);
        setLoading(false);
        return;
      }

      // If no route params, try to get from AsyncStorage (for persistent sessions)
      const storedStudentKey = await AsyncStorage.getItem('studentKey');
      if (storedStudentKey) {
        const studentRef = ref(db, `students/${storedStudentKey}`);
        const snapshot = await get(studentRef);
        
        if (snapshot.exists()) {
          const data = {
            ...snapshot.val(),
            firebaseKey: storedStudentKey
          };
          setStudentData(data);
        }
      }
    } catch (error) {
      console.error("Error loading student data:", error);
      alert("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const InfoCard = ({ label, value, icon }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Text style={styles.iconText}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No student data available</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.retryButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format the year display
  const getYearDisplay = (year) => {
    if (!year) return 'N/A';
    const yearNum = parseInt(year);
    const yearNames = {
      1: 'First Year',
      2: 'Second Year', 
      3: 'Third Year',
      4: 'Fourth Year'
    };
    return yearNames[yearNum] || `Year ${year}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Gradient Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Student Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Profile Image Card */}
          <View style={styles.profileCard}>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ 
                    uri: studentData.profileImage || 
                         studentData.photoURL || 
                         'https://i.pravatar.cc/300?img=33' 
                  }}
                  style={styles.profileImage}
                />
                <View style={styles.imageBorder} />
              </View>
            </View>
            
            <Text style={styles.studentName}>
              {studentData.name || 'Student Name'}
            </Text>
            <Text style={styles.studentCourse}>
              {studentData.course || 'Bachelor of Engineering'}
            </Text>
            <Text style={styles.studentDepartment}>
              {studentData.department || 'Computer Science'}
            </Text>
          </View>

          {/* Credentials Section */}
          <View style={styles.credentialsSection}>
            <Text style={styles.sectionTitle}>Academic Credentials</Text>
            
            <InfoCard
              label="PRN Number"
              value={studentData.prn}
              icon="🎓"
            />
            
            <InfoCard
              label="Student ID"
              value={studentData.id}
              icon="🆔"
            />
            
            <InfoCard
              label="Academic Year"
              value={getYearDisplay(studentData.year)}
              icon="📅"
            />
            
            <InfoCard
              label="Division"
              value={studentData.division}
              icon="📚"
            />
            
            <InfoCard
              label="Email Address"
              value={studentData.email}
              icon="✉️"
            />
          </View>

          {/* Subjects Section */}
          {studentData.subjects && Object.keys(studentData.subjects).length > 0 && (
            <View style={styles.credentialsSection}>
              <Text style={styles.sectionTitle}>Enrolled Subjects</Text>
              {Object.values(studentData.subjects).map((subject, index) => (
                <View key={index} style={styles.subjectCard}>
                  <Text style={styles.subjectText}>📖 {subject}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>

          <TouchableOpacity
  style={styles.logoutButton}
  onPress={() => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
  try {
    console.log(`🚪 STUDENT logging out: ${studentData?.id}`);

    // 🔌 1. Disconnect socket (SAFE)
    try {
      disconnectSocket();
    } catch (e) {
      console.log("Socket already disconnected");
    }

    // 🧹 2. Clear local session FIRST
    await AsyncStorage.multiRemove([
      "userType",
      "studentKey",
      "studentId",
    ]);

    // 🔁 3. FORCE navigation (NON-NEGOTIABLE)
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );

    // 🔥 4. Inform backend (DO NOT await)
    api.post("/api/users/logout", {
      userId: studentData?.id,
    }).catch(err =>
      console.log("Logout API failed (ignored):", err.message)
    );

  } catch (err) {
    console.error("Student logout fatal error:", err);

    // 🚨 LAST RESORT – still navigate
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  }
}
        }
      ]
    );
  }}
>
  <Text style={styles.logoutButtonText}>Logout</Text>
</TouchableOpacity>


 

          


          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#e53e3e',
    fontWeight: '600',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    marginTop: -20,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  imageBorder: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#667eea',
    top: -5,
    left: -5,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
    textAlign: 'center',
  },
  studentCourse: {
    fontSize: 16,
    fontWeight: '500',
    color: '#667eea',
    marginBottom: 2,
    textAlign: 'center',
  },
  studentDepartment: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
  },
  credentialsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 20,
    marginRight: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 30,
  },
  subjectCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  actionButtons: {
    marginTop: 10,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
});

export default StudentProfile;