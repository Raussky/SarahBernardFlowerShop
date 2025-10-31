import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle(); // Changed to maybeSingle()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found", which maybeSingle handles by returning null data
          logger.error('Error fetching profile', error, { context: 'AuthContext', userId: session.user.id });
          setProfile(null);
        } else {
          setProfile(profileData); // profileData will be null if no profile found
        }
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle(); // Changed to maybeSingle()
        
        if (error && error.code !== 'PGRST116') {
          logger.error('Error fetching profile on auth change', error, { context: 'AuthContext', userId: session.user.id });
          setProfile(null);
        } else {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session) {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        logger.error('Error refreshing profile', error, { context: 'AuthContext', userId: session.user.id });
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

      // We only care about errors that are NOT AuthSessionMissingError
      if (error && error.name !== 'AuthSessionMissingError') {
        logger.error('Error signing out', error, { context: 'AuthContext', userId: session?.user?.id });
        return { error };
      }
      
      // In case of success (error is null) or AuthSessionMissingError,
      // we manually clear the session and profile to ensure the UI updates.
      setSession(null);
      setProfile(null);
      return { error: null };
    },
    refreshProfile,
    showAuthError: (message) => {
      showToast(message || 'Для этого действия требуется авторизация.', 'error');
    },
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