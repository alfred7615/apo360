import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  "data-testid"?: string;
}

export function AutocompleteInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  maxSuggestions = 8,
  "data-testid": testId,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value && isOpen) {
      const filtered = options
        .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
        .slice(0, maxSuggestions);
      setFilteredOptions(filtered);
      setHighlightedIndex(-1);
    } else if (isOpen && options.length > 0) {
      setFilteredOptions(options.slice(0, maxSuggestions));
    } else {
      setFilteredOptions([]);
    }
  }, [value, options, isOpen, maxSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
        data-testid={testId}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              onMouseDown={() => handleSelectOption(option)}
              className={cn(
                "relative flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                highlightedIndex === index && "bg-accent",
                value === option && "font-semibold"
              )}
            >
              {option}
              {value === option && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
