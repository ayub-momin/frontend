import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ref, get } from "firebase/database";
import { db } from "../firebase"; // Adjust path as needed

const StudentListScreen = ({ navigation, route }) => {
  const { className, sectionName } = route.params;
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Convert className from "1st Year" to number 1
      const yearNumber = parseInt(className.match(/\d+/)[0]);
      
      // Convert sectionName from "Div A" to "A"
      const division = sectionName.split(' ')[1];

      console.log('📚 Fetching students for:', { year: yearNumber, division });

      // Fetch all students from Firebase
      const studentsRef = ref(db, 'students');
      const snapshot = await get(studentsRef);

      if (snapshot.exists()) {
        const allStudentsData = snapshot.val();
        
        // Filter students by year and division
        const filteredStudents = Object.entries(allStudentsData)
          .filter(([studentId, studentData]) => {
            // Handle both string and number year values from Firebase
            const studentYear = typeof studentData.year === 'string' 
              ? parseInt(studentData.year) 
              : studentData.year;
            
            console.log(`🔍 Checking student ${studentData.name}: year=${studentYear} (${typeof studentYear}), division=${studentData.division}`);
            
            return studentYear === yearNumber && 
                   studentData.division === division;
          })
          .map(([studentId, studentData]) => ({
            id: studentData.id || studentId,
            name: studentData.name || 'Unknown',
            email: studentData.email || '',
            prn: studentData.prn || '',
            division: studentData.division || '',
            year: studentData.year || '',
            subjects: studentData.subjects || [],
          }));

        setStudents(filteredStudents);
        console.log(`✅ Found ${filteredStudents.length} students`);

        if (filteredStudents.length === 0) {
          Alert.alert(
            'No Students Found',
            `No students found for ${className} - ${sectionName}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('❌ No students data found in Firebase');
        Alert.alert('Error', 'No students data found');
      }

    } catch (error) {
      console.error('❌ Error fetching students:', error);
      Alert.alert('Error', 'Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('StudentRecordTeacher', {
          studentId: item.id,
          studentName: item.name,
          studentData: item,
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>

      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>PRN: {item.prn}</Text>
        <Text style={styles.studentDetails}>
          {className} - {sectionName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No students found</Text>
      <Text style={styles.emptySubtext}>
        {className} - {sectionName}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Students</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Students</Text>
        <Text style={styles.headerSubtitle}>
          {className} - {sectionName}
        </Text>
      </View>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
      />
    </SafeAreaView>
  );
};

export default StudentListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
  },
});