import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import { StorageDegradedBanner } from './StorageDegradedBanner';

const renderWithChakra = (ui: ReactElement) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe('StorageDegradedBanner', () => {
  it('renders the warning message', () => {
    renderWithChakra(<StorageDegradedBanner />);
    expect(screen.getByText(/browser is blocking site storage/i)).toBeInTheDocument();
  });

  it('hides the banner when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    renderWithChakra(<StorageDegradedBanner />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    expect(screen.queryByText(/browser is blocking site storage/i)).not.toBeInTheDocument();
  });
});
