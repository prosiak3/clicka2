import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { SessionsScreen } from './src/screens/SessionsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SessionDetailsScreen } from './src/screens/SessionDetailsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const HistoryStack = createNativeStackNavigator();

function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen 
        name="HistoryList" 
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <HistoryStack.Screen 
        name="SessionDetails" 
        component={SessionDetailsScreen}
        options={{ title: 'Session Details' }}
      />
    </HistoryStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'Sessions') {
              iconName = 'activity';
            } else if (route.name === 'History') {
              iconName = 'clock';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            }

            return <Feather name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen 
          name="Sessions" 
          component={SessionsScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryStackScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}