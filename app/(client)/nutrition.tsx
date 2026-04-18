import { useAuth } from '@/lib/auth';
import { NutritionTab } from '@/components/nutrition/NutritionTab';
import { GuestLock } from '@/components/ui/GuestLock';

export default function ClientNutritionScreen() {
  const { clientId, isGuest } = useAuth();
  if (isGuest) {
    return (
      <GuestLock message="Sign up to track nutrition, view your meal plan, and get a personalised guide" />
    );
  }
  if (!clientId) return null;
  return <NutritionTab clientId={clientId} canEditGoal={false} />;
}
