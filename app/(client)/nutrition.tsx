import { useAuth } from '@/lib/auth';
import { NutritionTab } from '@/components/nutrition/NutritionTab';

export default function ClientNutritionScreen() {
  const { clientId } = useAuth();
  if (!clientId) return null;
  return <NutritionTab clientId={clientId} canEditGoal={false} />;
}
