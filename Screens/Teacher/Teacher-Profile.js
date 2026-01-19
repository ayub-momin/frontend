import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { disconnectSocket } from "../../src/services/socket";
import api from "../../src/utils/axios";



export default function TeacherProfile() {
  const navigation = useNavigation();

  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // Get teacher ID from AsyncStorage (stored during login)
      const teacherId = await AsyncStorage.getItem('teacherId');
      
      if (!teacherId) {
        setError("Teacher ID not found. Please login again.");
        setLoading(false);
        return;
      }

      // Fetch teacher data from Firebase
      const teacherSnap = await get(ref(db, `teachers/${teacherId}`));
      
      if (teacherSnap.exists()) {
        const data = teacherSnap.val();
        setTeacherData(data);
      } else {
        setError("Teacher data not found");
      }
    } catch (err) {
      console.error("Error fetching teacher data:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

const handleLogout = () => {
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
            const teacherName = teacherData?.name || 'Unknown Teacher';

            // ✅ LOGOUT LOG
            console.log(`🚪 TEACHER logged out: ${teacherName}`);

            // 🔥 END SESSION
            await AsyncStorage.multiRemove([
              'teacherId',
              'userType',
            ]);

            // 🔁 RESET NAVIGATION STACK → LOGIN
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]
  );
};


  const renderDivisions = () => {
    if (!teacherData?.divisions) return null;
    
    return Object.entries(teacherData.divisions).map(([key, division]) => (
      <View key={key} style={styles.divisionChip}>
        <Text style={styles.divisionText}>{division}</Text>
      </View>
    ));
  };

  const renderYears = () => {
    if (!teacherData?.years) return null;
    
    return Object.entries(teacherData.years).map(([key, year]) => (
      <View key={key} style={styles.yearChip}>
        <Text style={styles.yearText}>Year {year}</Text>
      </View>
    ));
  };

  const renderSubjects = () => {
    if (!teacherData?.subjects) return null;
    
    const year1Subjects = teacherData.subjects.year1 || [];
    const year2Subjects = teacherData.subjects.year2 || [];
    
    return (
      <View>
        {year1Subjects.length > 0 && (
          <View style={styles.subjectYearSection}>
            <Text style={styles.subjectYearTitle}>Year 1 Subjects</Text>
            {year1Subjects.map((subject, index) => (
              <View key={index} style={styles.subjectItem}>
                <Text style={styles.subjectText}>• {subject}</Text>
              </View>
            ))}
          </View>
        )}
        
        {year2Subjects.length > 0 && (
          <View style={styles.subjectYearSection}>
            <Text style={styles.subjectYearTitle}>Year 2 Subjects</Text>
            {year2Subjects.map((subject, index) => (
              <View key={index} style={styles.subjectItem}>
                <Text style={styles.subjectText}>• {subject}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCourseCodes = () => {
    if (!teacherData?.course_codes) return null;
    
    const year1Codes = teacherData.course_codes.year1 || [];
    const year2Codes = teacherData.course_codes.year2 || [];
    
    return (
      <View>
        {year1Codes.length > 0 && (
          <View style={styles.courseYearSection}>
            <Text style={styles.courseYearTitle}>Year 1 Course Codes</Text>
            <View style={styles.courseCodesContainer}>
              {year1Codes.map((code, index) => (
                <View key={index} style={styles.courseCodeChip}>
                  <Text style={styles.courseCodeText}>{code}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {year2Codes.length > 0 && (
          <View style={styles.courseYearSection}>
            <Text style={styles.courseYearTitle}>Year 2 Course Codes</Text>
            <View style={styles.courseCodesContainer}>
              {year2Codes.map((code, index) => (
                <View key={index} style={styles.courseCodeChip}>
                  <Text style={styles.courseCodeText}>{code}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTeacherData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Header Section */}
      <LinearGradient colors={['#ffffffff', '#ffffffff']} style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {teacherData?.name?.charAt(0)?.toUpperCase() || 'T'}
            </Text>
          </View>
        </View>
        <Text style={styles.nameText}>{teacherData?.name || 'Teacher Name'}</Text>
        <Text style={styles.idText}>ID: {teacherData?.id || 'N/A'}</Text>
        <Text style={styles.emailText}>{teacherData?.email || 'No email'}</Text>
      </LinearGradient>

      {/* Profile Details Card */}
      <View style={styles.detailsCard}>
        
        {/* Divisions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📚</Text>
            <Text style={styles.sectionTitle}>Divisions</Text>
          </View>
          <View style={styles.chipsContainer}>
            {teacherData?.divisions ? renderDivisions() : (
              <Text style={styles.noDataText}>No divisions assigned</Text>
            )}
          </View>
        </View>

        {/* Years Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📅</Text>
            <Text style={styles.sectionTitle}>Teaching Years</Text>
          </View>
          <View style={styles.chipsContainer}>
            {teacherData?.years ? renderYears() : (
              <Text style={styles.noDataText}>No years assigned</Text>
            )}
          </View>
        </View>

        {/* Subjects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📖</Text>
            <Text style={styles.sectionTitle}>Subjects</Text>
          </View>
          {teacherData?.subjects ? renderSubjects() : (
            <Text style={styles.noDataText}>No subjects assigned</Text>
          )}
        </View>

        {/* Course Codes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔢</Text>
            <Text style={styles.sectionTitle}>Course Codes</Text>
          </View>
          {teacherData?.course_codes ? renderCourseCodes() : (
            <Text style={styles.noDataText}>No course codes assigned</Text>
          )}
        </View>

        {/* Logout Button */}
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
    console.log(`🚪 TEACHER logging out: ${teacherData?.id}`);

    // 🔌 Disconnect socket safely
    try {
      disconnectSocket();
    } catch (e) {
      console.log("Socket already disconnected");
    }

    // 🧹 Clear local session FIRST
    await AsyncStorage.multiRemove([
      "teacherId",
      "userType",
    ]);

    // 🔁 RESET NAVIGATION (THIS MUST ALWAYS RUN)
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );

    // 🔥 Call API in background (DON'T BLOCK UI)
    api.post("/api/users/logout", {
      userId: teacherData?.id,
    }).catch(err => {
      console.log("Logout API failed (ignored):", err.message);
    });

  } catch (err) {
    console.error("Teacher logout fatal error:", err);

    // 🚨 FORCE NAVIGATION EVEN IF EVERYTHING FAILS
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  }
}
        },
      ]
    );
  }}
>
  <Text style={styles.logoutButtonText}>Logout</Text>
</TouchableOpacity>




      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    color: '#4A90E2',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  nameText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  idText: {
    fontSize: 16,
    color: '#413b3bff',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#5e6367ff',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  divisionChip: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  divisionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  yearChip: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  yearText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subjectYearSection: {
    marginBottom: 16,
  },
  subjectYearTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  subjectItem: {
    paddingVertical: 6,
  },
  subjectText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  courseYearSection: {
    marginBottom: 16,
  },
  courseYearTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  courseCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  courseCodeChip: {
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#D1DCE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  courseCodeText: {
    color: '#4A5568',
    fontSize: 13,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});