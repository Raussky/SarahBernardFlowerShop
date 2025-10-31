import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, AuthContext } from '../AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../components/ToastProvider';

// Mock dependencies
jest.mock('../../integrations/supabase/client');
jest.mock('../../components/ToastProvider');

// Mock toast
const mockShowToast = jest.fn();
useToast.mockReturnValue({ showToast: mockShowToast });

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock supabase auth methods
    supabase.auth = {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    };

    supabase.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    }));
  });

  test('should initialize with null session and profile when not logged in', async () => {
    // Mock no session
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeUndefined();
    expect(result.current.profile).toBeNull();
  });

  test('should fetch session and profile on initialization when logged in', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    const mockProfile = {
      id: 'user-123',
      first_name: 'Test',
      last_name: 'User',
      phone_number: '+77001234567',
    };

    // Mock session exists
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock profile fetch
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: mockProfile,
      error: null,
    });

    supabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.profile).toEqual(mockProfile);
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  test('should handle profile fetch error gracefully', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    // Mock session exists
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock profile fetch error
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Network error', code: 'NETWORK' },
    });

    supabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.profile).toBeNull(); // Should set profile to null on error
  });

  test('should refresh profile successfully', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    const mockProfile = {
      id: 'user-123',
      first_name: 'Updated',
      last_name: 'User',
      phone_number: '+77001234567',
    };

    // Initial setup
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: mockProfile,
      error: null,
    });

    supabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refreshProfile
    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(result.current.profile).toEqual(mockProfile);
  });

  test('should sign out successfully', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    // Initial setup with session
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Mock signOut
    supabase.auth.signOut.mockResolvedValue({ error: null });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Sign out
    let signOutResult;
    await act(async () => {
      signOutResult = await result.current.signOut();
    });

    expect(signOutResult.error).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  test('should handle AuthSessionMissingError gracefully on sign out', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    // Initial setup
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Mock signOut with AuthSessionMissingError
    supabase.auth.signOut.mockResolvedValue({
      error: { name: 'AuthSessionMissingError', message: 'Session missing' },
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Sign out
    let signOutResult;
    await act(async () => {
      signOutResult = await result.current.signOut();
    });

    // Should not return error for AuthSessionMissingError
    expect(signOutResult.error).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  test('should handle actual sign out errors', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    // Initial setup
    supabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Mock signOut with actual error
    const mockError = { name: 'NetworkError', message: 'Network failed' };
    supabase.auth.signOut.mockResolvedValue({ error: mockError });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Sign out
    let signOutResult;
    await act(async () => {
      signOutResult = await result.current.signOut();
    });

    // Should return the error
    expect(signOutResult.error).toEqual(mockError);
  });
});
