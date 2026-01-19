import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import api from '../../src/utils/axios';

// Circular Progress Component
const AttendanceCircle = ({ percentage, size = 120 }) => {
  const getColor = () => {
    if (percentage < 60) return '#EF4444';
    if (percentage < 80) return '#F59E0B';
    return '#10B981';
  };

  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.circleContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="12"
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.percentageContainer}>
        <Text style={[styles.percentageText, { fontSize: size / 4, color: getColor() }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

// Subject Card Component
const SubjectCard = ({ subject, present, total }) => {
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  
  return (
    <View style={styles.subjectCard}>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{subject}</Text>
        <Text style={styles.subjectStats}>
          {present}/{total} classes
        </Text>
      </View>
      <AttendanceCircle percentage={percentage} size={70} />
    </View>
  );
};

// Main Attendance Screen
export default function AttendanceScreen() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    year: '',
    division: ''
  });

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      // Get student data from AsyncStorage
      const studentId = await AsyncStorage.getItem('studentId');
      const studentYear = await AsyncStorage.getItem('studentYear');
      const studentDivision = await AsyncStorage.getItem('studentDivision');
      const studentKey = await AsyncStorage.getItem('studentKey');

      if (!studentId || !studentYear || !studentDivision || !studentKey) {
        console.log('❌ Student data missing in AsyncStorage');
        return;
      }

      console.log('📱 Fetching student data from Firebase for key:', studentKey);

      // Fetch student data from Firebase to get subjects
      const studentRef = ref(db, `students/${studentKey}`);
      const snapshot = await get(studentRef);

      if (!snapshot.exists()) {
        console.log('❌ Student not found in Firebase');
        return;
      }

      const studentData = snapshot.val();
      console.log('✅ Student data from Firebase:', studentData);

      // Extract subjects from Firebase
      // subjects is stored as: { 0: "Mathematics", 1: "Physics", 2: "Chemistry", ... }
      const subjectsObj = studentData.subjects || {};
      const subjectsList = Object.values(subjectsObj);

      console.log('📚 Student subjects:', subjectsList);

      if (subjectsList.length === 0) {
        console.log('⚠️ No subjects assigned to student');
        setStudentInfo({
          name: studentData.name || 'Student',
          year: studentYear,
          division: studentDivision
        });
        setLoading(false);
        return;
      }

      console.log('📊 Fetching attendance for:', {
        studentId,
        year: studentYear,
        division: studentDivision,
        subjects: subjectsList
      });

      // Call backend API to get attendance summary
      const response = await api.post('/api/attendance/student-summary', {
        studentId,
        year: Number(studentYear),
        division: studentDivision,
        subjects: subjectsList
      });

      console.log('✅ Attendance data received:', response.data);

      setSubjects(response.data.subjects);
      setStudentInfo({
        name: studentData.name || 'Student',
        year: studentYear,
        division: studentDivision
      });

    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      console.log('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendanceData();
  };

  const calculateOverallAttendance = () => {
    if (subjects.length === 0) return 0;
    
    const totalPresent = subjects.reduce((sum, sub) => sum + sub.present, 0);
    const totalClasses = subjects.reduce((sum, sub) => sum + sub.total, 0);
    
    return totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
  };

  const overallAttendance = calculateOverallAttendance();
  const totalPresent = subjects.reduce((sum, sub) => sum + sub.present, 0);
  const totalClasses = subjects.reduce((sum, sub) => sum + sub.total, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your attendance...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Overview</Text>
        <Text style={styles.headerSubtitle}>
          {studentInfo.name} • Year {studentInfo.year} • Division {studentInfo.division}
        </Text>
      </View>

      {/* Overall Attendance Section */}
      <View style={styles.overallSection}>
        <Text style={styles.overallLabel}>Overall Attendance</Text>
        <AttendanceCircle percentage={overallAttendance} size={160} />
        <Text style={styles.overallSubtext}>
          {totalPresent} / {totalClasses} classes attended
        </Text>
        {overallAttendance < 75 && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>
              ⚠️ Below 75% - Attendance shortage
            </Text>
          </View>
        )}
      </View>

      {/* Subject-wise Attendance */}
      <View style={styles.subjectsSection}>
        <Text style={styles.sectionTitle}>Subject-wise Attendance</Text>
        
        {subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Attendance Records Yet</Text>
            <Text style={styles.emptyStateText}>
              Your attendance will appear here once your teacher takes attendance
            </Text>
          </View>
        ) : (
          subjects.map((subject, index) => (
            <SubjectCard
              key={index}
              subject={subject.subject}
              present={subject.present}
              total={subject.total}
            />
          ))
        )}
      </View>

      {/* Pull to refresh hint */}
      <View style={styles.refreshHint}>
        <Text style={styles.refreshHintText}>
          Pull down to refresh attendance data
        </Text>
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  overallSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  overallLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
  },
  overallSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 15,
  },
  warningBadge: {
    marginTop: 15,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  circleContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: 'bold',
  },
  subjectsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 15,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  subjectStats: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#F3F4F6',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  refreshHint: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  refreshHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});