import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import ClassSectionSelector from './Teacher-Classselection.js';
import TeacherRecord from './Teacher-Record.js';
import { SafeAreaView } from 'react-native-safe-area-context';

import TeacherProfile from './Teacher-Profile.js';


const Tab = createBottomTabNavigator();


const TeacherDashboard = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
<Tab.Navigator
  screenOptions={({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ color, size }) => {
      let iconName;

      if (route.name === 'Attendance') iconName = 'how-to-reg';
      else if (route.name === 'AttendanceRecord') iconName = 'assignment';
      else if (route.name === 'Records') iconName = 'folder';
      else iconName = 'person';

      return <MaterialIcons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#4A90E2',
    tabBarInactiveTintColor: '#8E8E93',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E5EA',
      height: 80,
      paddingBottom: 8,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '600',
    },
    headerStyle: {
      backgroundColor: '#4A90E2',
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: 'bold',
      fontSize: 18,
    },
    tabBarLabelStyle: {
  fontSize: 11,
  fontWeight: '600',
  textAlign: 'center',
},

  })}
>
  
<Tab.Screen 
  name="Attendance" 
  component={ClassSectionSelector}
  options={{
    title: 'Mark Attendance',
    tabBarLabel: 'Mark Attendance',   // ✅ FULL NAME
  }}
/>



<Tab.Screen 
  name="Records" 
  component={TeacherRecord}
  options={{
    title: 'Student Records',
    tabBarLabel: 'Student Records',   // ✅ FULL NAME
  }}
/>

<Tab.Screen 
  name="Profile" 
  component={TeacherProfile}
  options={{
    title: 'My Profile',
    tabBarLabel: 'My Profile',        // ✅ FULL NAME
  }}
/>


</Tab.Navigator>
</SafeAreaView>

  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
 tabBarLabelStyle: {
  fontSize: 10,
  fontWeight: '600',
  textAlign: 'center',
},

});

export default TeacherDashboard;
