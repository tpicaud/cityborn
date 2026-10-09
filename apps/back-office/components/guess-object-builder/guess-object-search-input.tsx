import * as Ariakit from '@ariakit/react';
import type { GuessObjectSearchResult } from '@cityborn/api';
import { type NameSearch, useGuessObjectSearch } from '@cityborn/client/admin';
import { type ChangeEventHandler, startTransition, useState } from 'react';

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
  onSelect: (draft: GuessObjectSearchResult | undefined) => void;
  className?: string;
  popoverClassName?: string;
}) {
  const [searchValue, setSearchValue] = useState('');
  const {
    searchResults: matches,
    searchErrorMessage,
  }: NameSearch<GuessObjectSearchResult> = useGuessObjectSearch(searchValue);

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
        {searchErrorMessage ? (
          <div className="p-2 text-red-700 bg-white rounded-md shadow-md min-w-full">
            {searchErrorMessage}
          </div>
        ) : matches.length ? (
          matches.slice(0, 5).map((draft) => (
            <Ariakit.ComboboxItem
              key={draft.id ?? draft.source?.external_id}
              value={draft.name}
              onClick={() => onSelect(draft)}
              className="p-2 hover:bg-gray-300 hover:rounded-md hover:cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {draft.name}
                </span>
                <span className="text-xs text-gray-500">
                  {draft.short_description}
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
