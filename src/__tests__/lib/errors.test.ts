import { getFriendlyErrorMessage } from '@/lib/errors';

describe('getFriendlyErrorMessage', () => {
  it('returns fallback message when error is nil or undefined', () => {
    expect(getFriendlyErrorMessage(null)).toBe('Something went wrong. Please try again.');
    expect(getFriendlyErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    expect(getFriendlyErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });

  it('transforms low-level native and fetch exceptions into friendly server copy', () => {
    const nativeSwiftError =
      'fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)';
    expect(getFriendlyErrorMessage(nativeSwiftError)).toBe(
      'Unable to connect to SASE servers. Please check your internet connection and try again.',
    );

    expect(getFriendlyErrorMessage(new Error('Network request failed'))).toBe(
      'Unable to connect to SASE servers. Please check your internet connection and try again.',
    );

    expect(getFriendlyErrorMessage('failed to fetch')).toBe(
      'Unable to connect to SASE servers. Please check your internet connection and try again.',
    );

    expect(getFriendlyErrorMessage(new Error('Network error'))).toBe(
      'Unable to connect to SASE servers. Please check your internet connection and try again.',
    );

    expect(getFriendlyErrorMessage('Device is offline')).toBe(
      'Unable to connect to SASE servers. Please check your internet connection and try again.',
    );
  });

  it('transforms timeout errors into friendly timeout copy', () => {
    expect(getFriendlyErrorMessage(new Error('The connection timed out.'))).toBe(
      'The request took too long to complete. Please try again in a moment.',
    );
    expect(getFriendlyErrorMessage('Gateway timeout')).toBe(
      'The request took too long to complete. Please try again in a moment.',
    );
  });

  it('strips internal stack traces and database error codes', () => {
    expect(getFriendlyErrorMessage('PGRST301: JWT expired')).toBe(
      'Something went wrong. Please try again.',
    );
    expect(
      getFriendlyErrorMessage('TypeError at ExpoModulesCore: cannot read property of undefined'),
    ).toBe('Something went wrong. Please try again.');
    expect(getFriendlyErrorMessage('Error at Component.tsx:142')).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('preserves clean user-facing error messages', () => {
    expect(getFriendlyErrorMessage(new Error('Profile not found'))).toBe('Profile not found');
    expect(getFriendlyErrorMessage('This event is full.')).toBe('This event is full.');
  });

  it('handles object with message property', () => {
    expect(getFriendlyErrorMessage({ message: 'Could not find record' })).toBe(
      'Could not find record',
    );
  });
});
