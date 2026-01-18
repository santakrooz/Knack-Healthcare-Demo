import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Stethoscope, X } from "lucide-react";

interface PhysicianResult {
  name: string;
  npi: string;
  type: string;
  address: string;
  phone: string;
}

interface PhysiciansMultiInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PhysiciansMultiInput({
  value,
  onChange,
  placeholder = "Search for physician by name...",
  className,
}: PhysiciansMultiInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<PhysicianResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Derive physicians from the value prop to avoid sync issues
  const physicians = value ? value.split(",").map(p => p.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=${encodeURIComponent(inputValue)}&maxList=10&df=name.full,NPI,provider_type,addr_practice.full,addr_practice.phone`
        );
        const data = await response.json();
        
        const [, , , displayData] = data;
        
        if (displayData && displayData.length > 0) {
          const formattedSuggestions: PhysicianResult[] = displayData.map((item: string[]) => ({
            name: item[0] || "",
            npi: item[1] || "",
            type: item[2] || "",
            address: item[3] || "",
            phone: item[4] || "",
          }));
          
          setSuggestions(formattedSuggestions);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching NPI data:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const formatPhysicianName = (name: string): string => {
    const parts = name.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      return `Dr. ${parts[1]} ${parts[0]}`;
    }
    return `Dr. ${name}`;
  };

  const addPhysician = (displayName: string) => {
    const trimmed = displayName.trim();
    if (!trimmed || physicians.includes(trimmed)) return;
    
    const newPhysicians = [...physicians, trimmed];
    onChange(newPhysicians.join(", "));
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const removePhysician = (index: number) => {
    const newPhysicians = physicians.filter((_, i) => i !== index);
    onChange(newPhysicians.join(", "));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addPhysician(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && physicians.length > 0) {
      removePhysician(physicians.length - 1);
    }
  };

  const handleSelectPhysician = (physician: PhysicianResult) => {
    const formattedName = formatPhysicianName(physician.name);
    const displayValue = physician.phone 
      ? `${formattedName} - ${physician.phone}` 
      : formattedName;
    addPhysician(displayValue);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {physicians.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {physicians.map((physician, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              data-testid={`physician-tag-${index}`}
            >
              <span className="max-w-[200px] truncate">{physician}</span>
              <button
                type="button"
                onClick={() => removePhysician(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                data-testid={`button-remove-physician-${index}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pr-10"
          data-testid="input-other-physicians"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="border-b px-3 py-2">
            <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span>NPI</span>
              <span>Type</span>
              <span>Practice Address</span>
            </div>
          </div>
          <ul className="max-h-80 overflow-auto py-1">
            {suggestions.map((physician, index) => (
              <li
                key={`${physician.npi}-${index}`}
                onClick={() => handleSelectPhysician(physician)}
                className="cursor-pointer px-3 py-2 hover-elevate"
                data-testid={`suggestion-physician-${index}`}
              >
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="font-medium truncate" title={physician.name}>
                    {physician.name}
                  </div>
                  <div className="text-muted-foreground truncate">
                    {physician.npi}
                  </div>
                  <div className="text-muted-foreground truncate" title={physician.type}>
                    {physician.type}
                  </div>
                  <div className="text-muted-foreground truncate" title={physician.address}>
                    {physician.address}
                  </div>
                </div>
                {physician.phone && (
                  <div className="mt-1 text-xs text-primary">
                    Phone: {physician.phone}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {inputValue.length >= 2 && !loading && suggestions.length === 0 && isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="px-3 py-2">
            <p className="text-sm text-muted-foreground">No physicians found</p>
            <button
              type="button"
              className="mt-1 text-sm text-primary hover:underline"
              onClick={() => addPhysician(inputValue)}
              data-testid="add-custom-physician"
            >
              Add "{inputValue}" manually
            </button>
          </div>
        </div>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        Type to search NPI registry. Press Enter to add a name manually.
      </p>
    </div>
  );
}
