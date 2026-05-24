// Описываем структуру ответа от Supabase для нашей Матрицы Доступности
export type AvailabilityItem = {
  id: string;
  is_available: boolean;
  approval_probability: 'High' | 'Medium' | 'Low' | null;
  notes: string | null;
  products: {
    name: string;
    category: string;
    banks: {
      name: string;
      official_site: string | null;
    };
  };
};