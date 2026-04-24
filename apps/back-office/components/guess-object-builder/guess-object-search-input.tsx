import * as Ariakit from '@ariakit/react';
import type { GuessObjectCandidate } from '@cityborn/types';
import {
  type ChangeEventHandler,
  startTransition,
  useEffect,
  useState,
} from 'react';
import { searchGuessObjectByName } from './action';

export function GuessObjectSearchInput({
  type = 'text',
  id,
  name,
  placeholder = 'e.g., Pomme',
  value,
  disabled,
  onChange,
  onSelect,
  className = 'bg-white',
  popoverClassName = 'bg-white',
}: {
  type: string;
  id: string;
  name: string | undefined;
  placeholder?: string;
  value: string | undefined;
  disabled: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
  onSelect: (candidate: GuessObjectCandidate | undefined) => void;
  className?: string;
  popoverClassName?: string;
}) {
  const [searchValue, setSearchValue] = useState('');
  const [matches, setMatches] = useState<GuessObjectCandidate[]>([]);

  useEffect(() => {
    if (!searchValue) {
      setMatches([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const candidates = await searchGuessObjectByName(searchValue);
        setMatches(candidates);
      } catch (error) {
        console.error('Search error:', error);
        setMatches([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  return (
    <Ariakit.ComboboxProvider
      setValue={(value) => {
        startTransition(() => setSearchValue(value));
      }}
    >
      <Ariakit.Combobox
        type={type}
        id={id}
        name={name ?? id}
        placeholder={placeholder}
        value={value ?? ''}
        disabled={disabled}
        autoComplete="off"
        onChange={onChange}
        className={className}
      />
      <Ariakit.ComboboxPopover
        gutter={8}
        sameWidth
        portal
        className={popoverClassName}
      >
        {matches.length ? (
          matches.slice(0, 5).map((candidate) => (
            <Ariakit.ComboboxItem
              key={candidate.source?.external_id}
              value={candidate.name}
              onClick={() => onSelect(candidate)}
              className="p-2 hover:bg-gray-300 hover:rounded-md hover:cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {candidate.name}
                </span>
                <span className="text-xs text-gray-500">
                  {candidate.short_description}
                </span>
              </div>
            </Ariakit.ComboboxItem>
          ))
        ) : searchValue ? (
          <div className="p-2 text-gray-800 bg-white rounded-md shadow-md min-w-full">
            No results found
          </div>
        ) : (
          <div></div>
        )}
      </Ariakit.ComboboxPopover>
    </Ariakit.ComboboxProvider>
  );
}
