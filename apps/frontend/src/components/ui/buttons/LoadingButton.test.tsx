import { act, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, type Mock, vi } from 'vitest';
import LoadingButton from './LoadingButton';

describe('LoadingButton', () => {
  it('disables submission until the action finishes', async () => {
    const user: UserEvent = userEvent.setup();
    let finish: () => void = () => undefined;
    const pending: Promise<void> = new Promise((resolve) => {
      finish = resolve;
    });
    const save: Mock<() => Promise<void>> = vi.fn(() => pending);
    render(<LoadingButton onClick={save}>Enregistrer</LoadingButton>);
    const button: HTMLElement = screen.getByRole('button', {
      name: 'Enregistrer',
    });

    await user.click(button);

    expect(button).toHaveProperty('disabled', true);
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => finish());

    expect(button).toHaveProperty('disabled', false);
  });
});
