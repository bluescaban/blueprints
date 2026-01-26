import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the BluePrints heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', {
      name: /BluePrints by Blue/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('displays the workflow description', () => {
    render(<Home />);
    expect(
      screen.getByText(/spec → plan → tasks → flows/)
    ).toBeInTheDocument();
  });

  it('has a link to documentation', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: /View Documentation/i });
    expect(link).toHaveAttribute('href', '/docs');
  });
});
