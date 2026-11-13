import { act, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('restores its label when the submitted action finishes', async () => {
    const user: UserEvent = userEvent.setup();
    let finish: () => void = () => undefined;
    const pending: Promise<void> = new Promise((resolve) => {
      finish = resolve;
    });
    const save: Mock<() => Promise<void>> = vi.fn(() => pending);
    render(<Button onClick={save}>Enregistrer</Button>);

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(save).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Enregistrer')).toBeNull();

    await act(async () => finish());

    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDefined();
  });
});
