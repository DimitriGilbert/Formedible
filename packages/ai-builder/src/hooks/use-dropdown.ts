import { useEffect, useRef, useState } from "react";

export interface UseDropdownReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

export function useDropdown(initialOpen = false): UseDropdownReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return {
    isOpen,
    setIsOpen,
    containerRef,
    toggle,
    close,
    open,
  };
}