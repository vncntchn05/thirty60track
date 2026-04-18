import { useAuth, GUEST_CLIENT_ID } from '@/lib/auth';
import { NutritionTab } from '@/components/nutrition/NutritionTab';
import { GuestLock } from '@/components/ui/GuestLock';

export default function ClientNutritionScreen() {
  const { clientId, isGuest } = useAuth();
  if (isGuest) {
    return (
      <GuestLock message="Sign up to track nutrition, view your meal plan, and get a personalised guide">
        <NutritionTab clientId={GUEST_CLIENT_ID} canEditGoal={false} />
      </GuestLock>
    );
  }
  if (!clientId) return null;
  return <NutritionTab clientId={clientId} canEditGoal={false} />;
}
