import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProfilePicker from '../../features/onboarding/ProfilePicker';
import WelcomeScreen from '../../features/onboarding/WelcomeScreen';
import FamilySetup from '../../features/onboarding/FamilySetup';
import JoinFamily from '../../features/onboarding/JoinFamily';
import HomeScreen from '../../features/tasks/HomeScreen';
import TaskDetailScreen from '../../features/tasks/TaskDetailScreen';
import RewardsScreen from '../../features/rewards/RewardsScreen';
import StreakScreen from '../../features/levels/StreakScreen';
import AchievementsScreen from '../../features/levels/AchievementsScreen';
import ParentDashboard from '../../features/parent/ParentDashboard';
import TaskFormScreen from '../../features/tasks/TaskFormScreen';
import ManageRewardsScreen from '../../features/rewards/ManageRewardsScreen';
import ManageKidsScreen from '../../features/profiles/ManageKidsScreen';
import BonusComposer from '../../features/parent/BonusComposer';
import DemeritComposer from '../../features/parent/DemeritComposer';

const router = createBrowserRouter([
  // Onboarding
  { path: '/welcome', element: <WelcomeScreen /> },
  { path: '/setup',   element: <FamilySetup /> },
  { path: '/join',    element: <JoinFamily /> },

  // Child routes
  { path: '/', element: <ProfilePicker /> },
  { path: '/child/:childId', element: <HomeScreen /> },
  { path: '/child/:childId/task/:instanceId', element: <TaskDetailScreen /> },
  { path: '/child/:childId/rewards', element: <RewardsScreen /> },
  { path: '/child/:childId/streak', element: <StreakScreen /> },
  { path: '/child/:childId/achievements', element: <AchievementsScreen /> },

  // Parent routes
  { path: '/parent', element: <ParentDashboard /> },
  { path: '/parent/task/new', element: <TaskFormScreen /> },
  { path: '/parent/task/:templateId/edit', element: <TaskFormScreen /> },
  { path: '/parent/rewards', element: <ManageRewardsScreen /> },
  { path: '/parent/kids', element: <ManageKidsScreen /> },
  { path: '/parent/bonus', element: <BonusComposer /> },
  { path: '/parent/demerit', element: <DemeritComposer /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
