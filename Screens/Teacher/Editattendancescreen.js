import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import api from "../../src/utils/axios";

export default function EditAttendanceScreen({ route, navigation }) {
  const { sessionId, className, sectionName, date } = route.params;
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch students from Firebase based on year and division
  const fetchStudentsFromFirebase = async (year, division) => {
    try {
      const snapshot = await get(ref(db, "students"));

      if (!snapshot.exists()) return [];

      const data = snapshot.val();

      // Filter students by year + division
      return Object.entries(data)
        .map(([key, student]) => ({
          ...student,
          studentId: student.id || key, // Ensure studentId exists
        }))
        .filter(student =>
          String(student.year) === String(year) &&
          student.division === division
        );
    } catch (error) {
      console.error("Error fetching students from Firebase:", error);
      return [];
    }
  };

  // Load attendance data on mount
  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);

      // Extract year from className (e.g., "3rd Year" -> 3)
      const year =
        className.startsWith("1") ? 1 :
        className.startsWith("2") ? 2 :
        className.startsWith("3") ? 3 : 4;

      // Extract division from sectionName (e.g., "Section A" -> "A")
      const division = sectionName.split(" ")[1] || sectionName;

      console.log(`Loading attendance for Year ${year}, Division ${division}, Session ${sessionId}`);

      // 1. Get all students from Firebase
      const allStudents = await fetchStudentsFromFirebase(year, division);

      if (allStudents.length === 0) {
        Alert.alert("No Students", "No students found for this class.");
        setLoading(false);
        return;
      }

      // 2. Get present students from MongoDB
      const res = await api.get(`/api/attendance/session/${sessionId}`);
      const presentIds = res.data.presentStudents || [];

      console.log(`Found ${allStudents.length} students, ${presentIds.length} present`);

      // 3. Merge data
      const merged = allStudents.map(student => ({
        id: student.studentId,
        studentId: student.studentId,
        rollNo: student.prn?.slice(-2) || student.rollNo || "--",
        name: student.name || "Unknown",
        status: presentIds.includes(student.studentId) ? "present" : "absent",
      }));

      setStudents(merged);
    } catch (err) {
      console.error("Load attendance error:", err);
      Alert.alert("Error", `Failed to load attendance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle individual student attendance
  const toggleAttendance = async (studentId, isPresent) => {
    try {
      setUpdating(true);

      if (isPresent) {
        // Make absent
        await api.post("/api/attendance/manual/remove", {
          sessionId,
          studentId,
        });
      } else {
        // Make present
        await api.post("/api/attendance/manual/add", {
          sessionId,
          studentId,
        });
      }

      // Update UI instantly
      setStudents(prev =>
        prev.map(s =>
          s.studentId === studentId
            ? { ...s, status: isPresent ? "absent" : "present" }
            : s
        )
      );

      console.log(`✅ Toggled attendance for ${studentId}`);
    } catch (err) {
      console.error("Toggle attendance error:", err);
      Alert.alert("Error", `Failed to update attendance: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Mark all students present
  const handleMarkAllPresent = async () => {
    try {
      if (students.length === 0) {
        Alert.alert("No Students", "No students to mark present.");
        return;
      }

      setUpdating(true);

      const studentIds = students.map(s => s.studentId);

      await api.post("/api/attendance/manual/mark-all-present", {
        sessionId,
        studentIds,
      });

      // Update UI after DB success
      setStudents(prev =>
        prev.map(s => ({ ...s, status: "present" }))
      );

      Alert.alert("Success", "All students marked present");
      console.log(`✅ Marked all ${studentIds.length} students present`);
    } catch (err) {
      console.error("Mark all present error:", err);
      Alert.alert("Error", `Failed to mark all present: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Mark all students absent
  const handleMarkAllAbsent = async () => {
    try {
      if (students.length === 0) {
        Alert.alert("No Students", "No students to mark absent.");
        return;
      }

      setUpdating(true);

      await api.post("/api/attendance/manual/mark-all-absent", {
        sessionId,
      });

      // Update UI after DB success
      setStudents(prev =>
        prev.map(s => ({ ...s, status: "absent" }))
      );

      Alert.alert("Success", "All students marked absent");
      console.log(`✅ Marked all students absent`);
    } catch (err) {
      console.error("Mark all absent error:", err);
      Alert.alert("Error", `Failed to mark all absent: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Get present count
  const getPresentCount = () => {
    return students.filter(s => s.status === 'present').length;
  };

  // Get absent count
  const getAbsentCount = () => {
    return students.filter(s => s.status === 'absent').length;
  };

  // Handle save (optional - attendance is already saved to backend)
  const handleSave = () => {
    Alert.alert(
      'Attendance Saved',
      'All changes have been automatically saved to the system.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Edit Attendance</Text>
          <Text style={styles.headerSubtitle}>
            {className} - {sectionName}
          </Text>
          {date && <Text style={styles.dateText}>{date}</Text>}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{students.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, styles.presentBox]}>
          <Text style={[styles.statNumber, styles.presentText]}>{getPresentCount()}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statBox, styles.absentBox]}>
          <Text style={[styles.statNumber, styles.absentText]}>{getAbsentCount()}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, updating && styles.disabledButton]}
          onPress={handleMarkAllPresent}
          disabled={updating}
        >
          <Text style={styles.quickActionText}>
            {updating ? "Updating..." : "Mark All Present"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, styles.quickActionButtonSecondary, updating && styles.disabledButton]}
          onPress={handleMarkAllAbsent}
          disabled={updating}
        >
          <Text style={styles.quickActionTextSecondary}>
            {updating ? "Updating..." : "Mark All Absent"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Student List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No students found</Text>
          </View>
        ) : (
          students.map((student) => (
            <View key={student.studentId} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <View style={styles.rollNoContainer}>
                  <Text style={styles.rollNo}>{student.rollNo}</Text>
                </View>
                <Text style={styles.studentName}>{student.name}</Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  student.status === 'present' ? styles.presentButton : styles.absentButton,
                  updating && styles.disabledButton,
                ]}
                onPress={() => toggleAttendance(student.studentId, student.status === "present")}
                disabled={updating}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusText,
                    student.status === 'present' ? styles.presentStatusText : styles.absentStatusText,
                  ]}
                >
                  {student.status === 'present' ? 'Present' : 'Absent'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Extra space at bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, updating && styles.disabledButton]}
          onPress={handleSave}
          disabled={updating}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {updating ? "Saving..." : "Done"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: {
    alignItems: 'center',
  },
  presentBox: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
  },
  absentBox: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  presentText: {
    color: '#16a34a',
  },
  absentText: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionTextSecondary: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
    marginTop: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rollNoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rollNo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  presentButton: {
    backgroundColor: '#dcfce7',
  },
  absentButton: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presentStatusText: {
    color: '#16a34a',
  },
  absentStatusText: {
    color: '#dc2626',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});