import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { WarningBanner } from '../components/common/WarningBanner';

describe('WarningBanner', () => {
  it('renders nothing when warnings is empty', () => {
    const { container } = render(<WarningBanner warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a single warning message', () => {
    render(<WarningBanner warnings={['Missing revenue column detected.']} />);
    expect(screen.getByText('Missing revenue column detected.')).toBeInTheDocument();
    expect(screen.getByText('Data Quality Notice')).toBeInTheDocument();
  });

  it('renders plural header for multiple warnings', () => {
    render(<WarningBanner warnings={['Warning one', 'Warning two']} />);
    expect(screen.getByText('2 Data Quality Notices')).toBeInTheDocument();
    expect(screen.getByText('Warning one')).toBeInTheDocument();
    expect(screen.getByText('Warning two')).toBeInTheDocument();
  });

  it('dismisses banner when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<WarningBanner warnings={['Test warning']} />);
    expect(screen.getByText('Test warning')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissBtn);

    expect(screen.queryByText('Test warning')).not.toBeInTheDocument();
  });

  it('has role=alert for assistive technology', () => {
    render(<WarningBanner warnings={['Test']} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
