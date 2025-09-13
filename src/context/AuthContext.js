import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Fetch profile when session is available
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
          .then(({ data: profileData, error }) => {
            if (error && error.code !== 'PGRST116') {
              console.error("Error fetching profile on auth change:", error);
              setProfile(null);
            } else {
              setProfile(profileData);
            }
            setLoading(false);
          });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
          .then(({ data: profileData, error }) => {
            if (error && error.code !== 'PGRST116') {
              console.error("Error fetching profile:", error);
              setProfile(null);
            } else {
              setProfile(profileData);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session) {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error refreshing profile:", error);
        setProfile(null);
      } else {
        setProfile(profileData);
      }
    }
  };

  const value = {
    session,
    user: session?.user,
    profile,
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
      return { error };
    },
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};