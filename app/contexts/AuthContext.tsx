import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      // 若缺少邀请码则生成并补齐
      if (!data.invite_code) {
        const code = generateInviteCode();
        const { data: updated, error: updErr } = await supabase
          .from('profiles')
          .update({ invite_code: code })
          .eq('id', userId)
          .select()
          .single();
        if (!updErr && updated) {
          setProfile(updated as Profile);
        } else if (updErr) {
          console.error('更新邀请码失败:', updErr);
        }
      }
    } else {
      // 如果没有 profile，尝试创建一个
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const code = generateInviteCode();
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userData.user.email || '',
            full_name: userData.user.user_metadata?.full_name || '',
            credits: 50,
            invite_code: code,
          })
          .select()
          .single();

        if (!error && newProfile) {
          setProfile(newProfile);
        } else {
          console.error('创建 profile 失败:', error);
        }
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      // 创建 profile，带邀请码
      const inviteCode = generateInviteCode();
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        credits: 50,
        invite_code: inviteCode,
      });

      if (profileError) {
        console.error('创建profile失败:', profileError);
      } else {
        // 处理邀请奖励（如果存在 referrer_code）- 走服务端 API，绕过 RLS
        try {
          const refCode = typeof window !== 'undefined' ? localStorage.getItem('referrer_code') : null;
          if (refCode && refCode !== inviteCode) {
            await fetch('/api/invite/claim', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ invitee_id: data.user.id, ref_code: refCode }),
            }).catch(() => {});
            localStorage.removeItem('referrer_code');
          }
        } catch (e) {
          console.warn('邀请奖励处理失败（已忽略）:', e);
        }
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// 生成邀请码（6位大写字母数字）
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
