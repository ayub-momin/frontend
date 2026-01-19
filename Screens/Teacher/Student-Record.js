import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import api from "../../src/utils/axios";

export default function StudentRecordTeacher({ route, navigation }) {
  const { studentId, studentName, studentData } = route.params;

  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStudentAttendance();
  }, []);

  const fetchStudentAttendance = async () => {
    try {
      console.log('📊 Fetching attendance for student:', studentId);
      console.log('📚 Student data:', studentData);

      // Extract subjects from student data
      const subjectsObj = studentData.subjects || {};
      const subjectsList = Object.values(subjectsObj);

      console.log('📖 Student subjects:', subjectsList);

      if (subjectsList.length === 0) {
        console.log('⚠️ No subjects assigned to student');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Call backend API to get attendance summary
      const response = await api.post('/api/attendance/student-summary', {
        studentId: studentData.id,
        year: Number(studentData.year),
        division: String(studentData.division),
        subjects: subjectsList
      });

      console.log('✅ Attendance data received:', response.data);

      // Format data for display
      const formattedData = response.data.subjects.map((item, index) => ({
        id: String(index + 1),
        subject: item.subject,
        attended: item.present,
        total: item.total,
      }));

      setSubjectAttendance(formattedData);

    } catch (error) {
      console.error('❌ Error fetching student attendance:', error);
      console.log('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentAttendance();
  };

  // Calculate totals
  const totalLectures = subjectAttendance.reduce((sum, s) => sum + s.total, 0);
  const totalAttended = subjectAttendance.reduce((sum, s) => sum + s.attended, 0);
  const overallPercentage = totalLectures > 0 
    ? Math.round((totalAttended / totalLectures) * 100) 
    : 0;

  const getOverallColor = () => {
    if (overallPercentage >= 75) return '#16a34a';
    if (overallPercentage >= 60) return '#f59e0b';
    return '#dc2626';
  };

  const getStatusText = () => {
    if (overallPercentage >= 75) return 'Good Standing ✅';
    if (overallPercentage >= 60) return 'Below Average ⚠️';
    return 'Attendance Shortage ❌';
  };

  const renderItem = ({ item }) => {
    const percentage = item.total > 0 
      ? Math.round((item.attended / item.total) * 100) 
      : 0;

    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.subject]}>{item.subject}</Text>
        <Text style={styles.cell}>{item.attended}</Text>
        <Text style={styles.cell}>{item.total}</Text>
        <Text
          style={[
            styles.cell,
            { 
              color: percentage < 75 ? '#dc2626' : '#16a34a', 
              fontWeight: '700' 
            },
          ]}
        >
          {percentage}%
        </Text>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No Attendance Records</Text>
      <Text style={styles.emptySubtext}>
        Attendance data will appear here once classes are conducted
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.subtitle}>
          Year {studentData.year} • Division {studentData.division}
        </Text>
        <Text style={styles.prnText}>PRN: {studentData.prn}</Text>
      </View>

      {/* Overall Attendance Card */}
      <View style={styles.overallCard}>
        <Text style={[styles.overallPercentage, { color: getOverallColor() }]}>
          {overallPercentage}%
        </Text>

        <Text style={styles.overallText}>
          Attended {totalAttended} out of {totalLectures} lectures
        </Text>

        <Text style={[styles.statusText, { color: getOverallColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {/* Subject Table Header */}
      <View style={[styles.row, styles.tableHeader]}>
        <Text style={[styles.cell, styles.subject, styles.headerText]}>
          Subject
        </Text>
        <Text style={[styles.cell, styles.headerText]}>Attended</Text>
        <Text style={[styles.cell, styles.headerText]}>Total</Text>
        <Text style={[styles.cell, styles.headerText]}>%</Text>
      </View>

      {/* Subject Table */}
      <FlatList
        data={subjectAttendance}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4f46e5']}
          />
        }
      />

      {/* Pull to refresh hint */}
      <View style={styles.refreshHint}>
        <Text style={styles.refreshHintText}>
          Pull down to refresh attendance data
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  backButton: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  prnText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  overallCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overallPercentage: {
    fontSize: 52,
    fontWeight: 'bold',
  },
  overallText: {
    fontSize: 16,
    color: '#475569',
    marginTop: 6,
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  tableHeader: {
    backgroundColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
  },
  subject: {
    flex: 2,
    textAlign: 'left',
  },
  headerText: {
    fontWeight: '700',
    color: '#334155',
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  refreshHint: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshHintText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});