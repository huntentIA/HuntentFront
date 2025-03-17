import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface CustomMultiSelectProps {
  selectedUsers: string[];
  handleUserChange: (event: { target: { options: { value: string; selected: boolean }[]; value: string[] } }) => void;
  businessAccounts: { id: string; short_description?: string; accountName?: string }[];
  isDarkMode: boolean;
}

const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({ selectedUsers, handleUserChange, businessAccounts, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(selectedUsers);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Handle clicks outside the dropdown to close it
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update component state when props change
  useEffect(() => {
    setSelectedOptions(selectedUsers);
  }, [selectedUsers]);

  // Update parent component when selections change, but only after initial mount
  useEffect(() => {
    // Skip the first render to prevent unnecessary filter execution
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only trigger handleUserChange if selectedOptions is different from selectedUsers
    if (JSON.stringify(selectedOptions) !== JSON.stringify(selectedUsers)) {
      const event = {
        target: {
          options: selectedOptions.map(option => ({ value: option, selected: true })),
          value: selectedOptions
        }
      };
      handleUserChange(event);
    }
  }, [selectedOptions, handleUserChange, selectedUsers]);

  const toggleOption = (value: string) => {
    setSelectedOptions(prev => {
      if (value === "") {
        // If "Todos los creadores" is clicked, clear all other selections
        return [""];
      } else {
        // If any other option is selected, remove "Todos los creadores"
        const newSelection = prev.includes(value)
          ? prev.filter(item => item !== value)
          : [...prev.filter(item => item !== ""), value];
        
        return newSelection.length > 0 ? newSelection : [""];
      }
    });
  };

  // Get display name for each account
  const getAccountDisplayName = (id: string) => {
    const account = businessAccounts.find(acc => acc.id === id || acc.short_description === id || acc.accountName === id);
    return account ? (account.short_description || account.accountName) : id;
  };

  return (
    <div className="w-64 relative" ref={dropdownRef}>
      <div 
        className={`w-full rounded-md p-2 border flex items-center justify-between cursor-pointer ${
          isDarkMode
            ? 'border-gray-700 bg-gray-800 text-white hover:border-gray-500'
            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
        } transition-colors duration-150`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1 max-h-20 overflow-y-auto">
          {selectedOptions.length === 0 || (selectedOptions.length === 1 && selectedOptions[0] === "") ? (
            <span className="text-gray-500">Todos los creadores</span>
          ) : (
            selectedOptions.map(option => (
              <div 
                key={option} 
                className={`px-2 py-1 rounded-md text-xs flex items-center ${
                  isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                } border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
              >
                {getAccountDisplayName(option)}
                <X 
                  size={12} 
                  className={`ml-1 cursor-pointer hover:text-red-500 transition-colors duration-150`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(option);
                  }}
                />
              </div>
            ))
          )}
        </div>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''} ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} 
        />
      </div>

      {isOpen && (
        <div className={`absolute mt-1 w-full rounded-md border shadow-lg z-50 max-h-60 overflow-y-auto ${
          isDarkMode
            ? 'border-gray-700 bg-gray-800 text-white'
            : 'border-gray-300 bg-white text-gray-900'
        } scrollbar-thin ${isDarkMode ? 'scrollbar-thumb-gray-600' : 'scrollbar-thumb-gray-300'}`}>
          <div 
            className={`px-4 py-2 cursor-pointer ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } ${selectedOptions.includes("") ? (isDarkMode ? 'bg-orange-900 font-medium' : 'bg-orange-100 font-medium') : ''} transition-colors duration-150`}
            onClick={() => toggleOption("")}
          >
            Todos los creadores
          </div>
          {businessAccounts.map((account) => {
            const displayName = account.short_description || account.accountName || '';
            return (
              <div 
                key={account.short_description} 
                className={`px-4 py-2 cursor-pointer ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } ${selectedOptions.includes(account.accountName || '') || selectedOptions.includes(displayName) ? 
                    (isDarkMode ? 'bg-orange-900 font-medium' : 'bg-orange-100 font-medium') : ''} 
                  transition-colors duration-150`}
                onClick={() => toggleOption(account.accountName || '')}
              >
                {displayName}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomMultiSelect;