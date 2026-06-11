import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import { StorageUnavailableNotice } from './StorageUnavailableNotice';

const renderWithChakra = (ui: ReactElement) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe('StorageUnavailableNotice', () => {
  it('renders the heading', () => {
    renderWithChakra(<StorageUnavailableNotice />);
    expect(screen.getByRole('heading', { name: /cookies are required/i })).toBeInTheDocument();
  });

  it('renders a link for Chrome', () => {
    renderWithChakra(<StorageUnavailableNotice />);
    expect(screen.getByRole('link', { name: /chrome/i })).toBeInTheDocument();
  });

  it('renders a link for Firefox', () => {
    renderWithChakra(<StorageUnavailableNotice />);
    expect(screen.getByRole('link', { name: /firefox/i })).toBeInTheDocument();
  });

  it('renders a link for Safari', () => {
    renderWithChakra(<StorageUnavailableNotice />);
    expect(screen.getByRole('link', { name: /safari/i })).toBeInTheDocument();
  });
});
