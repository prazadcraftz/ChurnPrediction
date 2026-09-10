import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from '../components/dashboard/FilterBar';
import type { FilterOption } from '../types/analysis';

const mockFilters: FilterOption[] = [
  { column: 'Contract', label: 'Contract', options: ['Month-to-month', 'One year', 'Two year'] },
  { column: 'InternetService', label: 'Internet Service', options: ['DSL', 'Fiber optic', 'No'] },
];

describe('FilterBar', () => {
  it('renders nothing when filterOptions is empty', () => {
    const { container } = render(
      <FilterBar filterOptions={[]} selectedFilters={{}} onFilterChange={vi.fn()} onReset={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a select for each filter option', () => {
    render(
      <FilterBar filterOptions={mockFilters} selectedFilters={{}} onFilterChange={vi.fn()} onReset={vi.fn()} />
    );
    expect(screen.getByLabelText('Filter by Contract')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by Internet Service')).toBeInTheDocument();
  });

  it('renders All option and specific options for each filter', () => {
    render(
      <FilterBar filterOptions={mockFilters} selectedFilters={{}} onFilterChange={vi.fn()} onReset={vi.fn()} />
    );
    expect(screen.getByRole('option', { name: 'All Contracts' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Month-to-month' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'DSL' })).toBeInTheDocument();
  });

  it('calls onFilterChange with correct column and value when changed', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(
      <FilterBar filterOptions={mockFilters} selectedFilters={{}} onFilterChange={onFilterChange} onReset={vi.fn()} />
    );
    const select = screen.getByLabelText('Filter by Contract');
    await user.selectOptions(select, 'One year');
    expect(onFilterChange).toHaveBeenCalledWith('Contract', 'One year');
  });

  it('shows reset button when filters are active and hides otherwise', () => {
    const { rerender } = render(
      <FilterBar filterOptions={mockFilters} selectedFilters={{}} onFilterChange={vi.fn()} onReset={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();

    rerender(
      <FilterBar
        filterOptions={mockFilters}
        selectedFilters={{ Contract: 'One year' }}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
      <FilterBar
        filterOptions={mockFilters}
        selectedFilters={{ Contract: 'One year' }}
        onFilterChange={vi.fn()}
        onReset={onReset}
      />
    );
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
