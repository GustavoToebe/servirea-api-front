import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session;
  }
}
