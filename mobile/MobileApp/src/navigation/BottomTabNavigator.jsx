// File: src/navigation/BottomTabNavigator.jsx
import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Platform, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  Dimensions,
  Animated
} from 'react-native';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import OrdersScreen from '../screens/home/Surveyspage';
const WarrantyScreen = () => <View><Text>Warranty</Text></View>;
import ProfileScreen from '../screens/home/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== Custom Tab Button với Animation =====
const CustomTabButton = ({ children, onPress, accessibilityState }) => {
  const focused = accessibilityState?.selected || false;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.customButton}
    >
      {children}
    </TouchableOpacity>
  );
};

// ===== Custom Tab Icon với Animation nổi lên =====
const TabBarIcon = ({ emoji, focused, badge }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const badgeScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: focused ? -22 : 0,
        friction: 9,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.2 : 1,
        friction: 9,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  useEffect(() => {
    Animated.spring(badgeScaleAnim, {
      toValue: badge > 0 ? 1 : 0,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [badge]);

  return (
    <View style={styles.iconWrapper}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { translateY },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View style={[
          styles.iconBackground, 
          focused && styles.iconBackgroundFocused
        ]}>
          <Text style={[
            styles.emojiIcon, 
            { fontSize: focused ? 30 : 24 }
          ]}>
            {emoji}
          </Text>
          {focused && <View style={styles.whiteFilter} />}
        </View>
      </Animated.View>
      
      {badge > 0 && (
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [
                { translateY },
                { scale: badgeScaleAnim }
              ],
            },
          ]}
        >
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// ===== Bottom Tab Navigator =====
export default function BottomTabNavigator() {
  const [orderBadge, setOrderBadge] = React.useState(0);
  const [warrantyBadge, setWarrantyBadge] = React.useState(0);

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 100 : 80,
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
          paddingTop: 15,
          paddingHorizontal: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 8,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingHorizontal: 5,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarButton: (props) => <CustomTabButton {...props} />,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              emoji="🏠"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Khảo sát',
          tabBarButton: (props) => <CustomTabButton {...props} />,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              emoji="📋"
              focused={focused}
              badge={orderBadge}
            />
          ),
        }}
      />
      <Tab.Screen
        name="WarrantyTab"
        component={WarrantyScreen}
        options={{
          tabBarLabel: 'Bảo hành',
          tabBarButton: (props) => <CustomTabButton {...props} />,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              emoji="🛡️"
              focused={focused}
              badge={warrantyBadge}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarButton: (props) => <CustomTabButton {...props} />,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              emoji="👤"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  customButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 60,
    height: 50,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: 'transparent',
  },
  iconBackgroundFocused: {
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  whiteFilter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 27,
    mixBlendMode: 'color',
  },
  emojiIcon: {
    textAlign: 'center',
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});