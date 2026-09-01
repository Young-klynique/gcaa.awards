export interface EventSettings {
  id: string;
  event_name: string;
  event_date: string | null;
  nomination_start: string | null;
  nomination_end: string | null;
  voting_start: string | null;
  voting_end: string | null;
  vote_cost_pesewas: number;
  allow_multiple_votes: boolean;
  max_votes_per_person: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Nomination {
  id: string;
  category_id: string;
  nominee_name: string;
  nominee_phone: string | null;
  nominee_email: string | null;
  reason: string | null;
  nominator_name: string;
  nominator_phone: string | null;
  nominator_email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  category?: Category;
}

export interface Nominee {
  id: string;
  category_id: string;
  name: string;
  code: string;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  vote_count: number;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Vote {
  id: string;
  nominee_id: string;
  category_id: string;
  voter_name: string | null;
  voter_phone: string | null;
  voter_email: string;
  amount_pesewas: number;
  quantity: number;
  paystack_reference: string;
  payment_status: 'pending' | 'success' | 'failed';
  verified_at: string | null;
  created_at: string;
  nominee?: Nominee;
  category?: Category;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}
