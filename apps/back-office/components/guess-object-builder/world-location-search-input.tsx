import * as Ariakit from '@ariakit/react';
import {
  ChangeEventHandler,
  startTransition,
  useEffect,
  useState,
} from 'react';
import { searchWorldLocationByName } from './action';
import { WorldLocation } from '@cityborn/types';

export function WorldLocationSearchInput({
  type = 'text',
  id,
  name,
  placeholder = 'e.g., Paris',
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
  onSelect: (candidate: WorldLocation | undefined) => void;
  className?: string;
  popoverClassName?: string;
}) {
  const [searchValue, setSearchValue] = useState('');
  const [matches, setMatches] = useState<WorldLocation[]>([]);

  useEffect(() => {
    if (!searchValue) {
      setMatches([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const candidates = await searchWorldLocationByName(searchValue);
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
        autoComplete="off"
        onChange={onChange}
        className={className}
      />
      <Ariakit.ComboboxPopover
        gutter={8}
        sameWidth
        flip={false}
        portal
        className={popoverClassName}
      >
        {matches.length ? (
          matches.slice(0, 5).map((candidate) => (
            <Ariakit.ComboboxItem
              key={candidate.id}
              value={candidate.name}
              onClick={() => onSelect(candidate)}
              className="p-2 hover:bg-gray-300 hover:rounded-md hover:cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  <div>
                    {candidate.name}
                    {candidate.addresstype && (
                      <span className="font-thin text-gray-500 italic">
                        {' '}
                        ({candidate.addresstype})
                      </span>
                    )}
                  </div>
                </span>

                <span className="text-xs text-gray-500">
                  {candidate.display_name}
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
