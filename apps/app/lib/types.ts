export type Trip = {
  id: string;
  user_id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  solar_summary: string | null;
  sentiment_badge: string | null;
  total_distance: number | null;
  is_public: boolean;
  created_at: string;
};

export type Place = {
  id: string;
  trip_id: string;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  visit_order: number | null;
  memo: string | null;
  rating: number | null;
  visited_at: string | null;
};

export type Photo = {
  id: string;
  place_id: string;
  photo_url: string;
  created_at: string;
};
