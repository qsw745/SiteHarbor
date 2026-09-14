"use client";

import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

type SortOption = { value: string; label: string };

export function DirectorySort({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    } else if (event.key === "Tab") {
      // Continue the normal tab order from the trigger when the menu unmounts.
      closeMenu();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setActiveIndex((index) => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return options.length - 1;
        return (
          (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
          options.length
        );
      });
    }
  };

  return (
    <div
      className="harbor-sort"
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="harbor-sort-trigger focus-ring"
        aria-label={`${label}：${options[selectedIndex]?.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((previous) => !previous);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(selectedIndex);
            setOpen(true);
          }
        }}
      >
        <ArrowDownWideNarrow size={14} aria-hidden />
        <span>{options[selectedIndex]?.label}</span>
        <ChevronDown size={13} aria-hidden className="harbor-sort-chevron" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="harbor-sort-menu"
          onKeyDown={handleMenuKey}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={value === option.value}
              tabIndex={-1}
              className="harbor-sort-option"
              onFocus={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option.value);
                closeMenu();
              }}
            >
              <span>{option.label}</span>
              {value === option.value ? <Check size={15} aria-hidden /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
