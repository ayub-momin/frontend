import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,

  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { db } from '../firebase'; // Import your existing Firebase config
import { ref, onValue, get } from 'firebase/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClassAttendanceRecord from './Student-Attendance-Profile.js';

const StudentList = ({ route, navigation }) => {
  const { className, sectionName, year, division } = route.params;
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [year, division]);

  const fetchStudents = async () => {
    setLoading(true);
    
    try {
      console.log('📊 Fetching students for:', { year, division });
      
      // Reference to the students node in Firebase
      const studentsRef = ref(db, 'students');
      
      // Fetch all students
      const snapshot = await get(studentsRef);
      
      if (!snapshot.exists()) {
        console.log('❌ No students found in Firebase');
        setStudents([]);
        setLoading(false);
        return;
      }
      
      const data = snapshot.val();
      const studentsList = [];
      
      // Convert year to number for comparison
      const yearNumber = parseInt(year);

      // Filter students by year and division
      Object.keys(data).forEach((key) => {
        const student = data[key];
        
        // Handle both string and number year values from Firebase
        const studentYear = typeof student.year === 'string' 
          ? parseInt(student.year) 
          : student.year;
        
        console.log(`🔍 Checking student ${student.name}: year=${studentYear} (${typeof studentYear}), division=${student.division}`);
        
        // Check if the student's year and division match
        if (studentYear === yearNumber && 
            student.division && 
            student.division.toUpperCase() === division.toUpperCase()) {
          studentsList.push({
            id: key,
            name: student.name,
            email: student.email,
            studentId: student.id,
            prn: student.prn,
            subjects: student.subjects,
            year: student.year,
            division: student.division,
          });
        }
      });

      console.log(`✅ Found ${studentsList.length} students`);
      setStudents(studentsList);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setStudents([]);
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStudent = ({ item }) => (
    <TouchableOpacity 
      onPress={() =>
        navigation.navigate("StudentAttendanceProfile", {
          studentName: item.name,
          studentId: item.studentId,
          studentData: item,
        })
      }
      style={styles.studentCard} 
      activeOpacity={0.7}
    >
      <View style={styles.studentRow}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentId}>ID: {item.studentId}</Text>
          {item.prn && <Text style={styles.studentPrn}>PRN: {item.prn}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}

     

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{className} - {sectionName}</Text>
        <Text style={styles.headerSubtitle}>
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
        </Text>
      </View>
    

       <View style={styles.classRecordContainer}>
  <TouchableOpacity
    style={styles.classRecordButton}
    onPress={() =>
      navigation.navigate('ClassAttendanceRecord', {
        year,
        division,
        className,
        sectionName,
      })
    }
  >
    <Text style={styles.classRecordButtonText}>
      📊 View Whole Class Record
    </Text>
  </TouchableOpacity>
</View>


      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search student..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* List */}
      {filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No students found matching your search' : 'No students found in this class'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudent}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default StudentList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContainer: {
    padding: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
  },
  classRecordContainer: {
  backgroundColor: '#fff',
  paddingHorizontal: 20,
  paddingBottom: 12,
},

classRecordButton: {
  backgroundColor: '#4f46e5',
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: 'center',
  shadowColor: '#4f46e5',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 4,
},

classRecordButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '700',
  letterSpacing: 0.3,
},

  studentName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 13,
    color: '#6b7280',
  },
  studentPrn: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});