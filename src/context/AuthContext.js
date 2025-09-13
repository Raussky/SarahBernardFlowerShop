import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
          console.error("Error fetching profile:", error);
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
          console.error("Error fetching profile on auth change:", error);
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
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error signing out:", error);
        }
      }
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