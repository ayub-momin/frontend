import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ref, get } from "firebase/database";
import { db } from "../firebase"; // path may change
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { disconnectSocket } from "../../src/services/socket";
import api from "../../src/utils/axios";



export default function AdminProfile() {
  const navigation = useNavigation();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Get the stored admin identifier from AsyncStorage (if you stored it during login)
      // If not stored during login, we'll fetch the first admin or modify login.js to store it
      const storedAdminId = await AsyncStorage.getItem('adminId');
      
      const adminSnap = await get(ref(db, "Admin"));
      
      if (adminSnap.exists()) {
        const admins = adminSnap.val();
        
        // If we have a stored admin ID, find that specific admin
        if (storedAdminId && admins[storedAdminId]) {
          setAdmin({
            ...admins[storedAdminId],
            firebaseKey: storedAdminId,
          });
        } else {
          // Otherwise, get the first admin (or modify this logic as needed)
          const firstAdminKey = Object.keys(admins)[0];
          setAdmin({
            ...admins[firstAdminKey],
            firebaseKey: firstAdminKey,
          });
        }
      } else {
        Alert.alert('Error', 'No admin data found');
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const adminName =
              admin?.email
                ? admin.email.split('@')[0]
                : admin?.id || 'Unknown Admin';

            // ✅ LOGOUT LOG
            console.log(`🚪 ADMIN logged out: ${adminName}`);

            // 🔥 END SESSION COMPLETELY
            await AsyncStorage.multiRemove([
              'userType',
              'adminId',
            ]);

            // 🔁 RESET NAVIGATION STACK → LOGIN
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          } catch (error) {
            console.error('Admin logout error:', error);
          }
        },
      },
    ]
  );
};

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!admin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load admin data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAdminData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {admin.email
              ? admin.email.substring(0, 2).toUpperCase()
              : admin.id
              ? admin.id.substring(0, 2).toUpperCase()
              : 'AD'}
          </Text>
        </View>
        <Text style={styles.name}>
          {admin.email ? admin.email.split('@')[0] : 'Admin User'}
        </Text>
        <Text style={styles.role}>Administrator</Text>
      </View>

      {/* Profile Details */}
      <View style={styles.card}>
        <ProfileRow label="Branch" value={admin.branch || 'All Branches'} />
        <ProfileRow label="Email" value={admin.email || 'N/A'} />
        <ProfileRow label="Admin ID" value={admin.id || 'N/A'} />
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
              console.log(`🚪 ADMIN logged out: ${admin?.id}`);

              // 🔥 1. Update logout in DB
              await api.post("/api/users/logout", {
                userId: admin.id,
              });

              // 🔌 2. Disconnect socket
              disconnectSocket();

              // 🧹 3. Clear local session
              await AsyncStorage.multiRemove([
                "adminId",
                "userType",
              ]);

              // 🔁 4. Reset navigation
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                })
              );
            } catch (err) {
              console.error("Admin logout error:", err);
            }
          },
        },
      ]
    );
  }}
>
  <Text style={styles.logoutText}>Logout</Text>
</TouchableOpacity>


    </SafeAreaView>
  );
}

/* Small reusable row */
const ProfileRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
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

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },

  role: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
  },

  row: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },

  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});