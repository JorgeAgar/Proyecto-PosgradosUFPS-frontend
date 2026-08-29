import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDownIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { SpinnerIcon } from "../assets/icons";

export type SelectOption = { value: string; label: string };

function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
	return (
		<label htmlFor={htmlFor} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
			{children}
		</label>
	);
}

type DropdownPos = {
	top?: number;
	bottom?: number;
	left: number;
	width: number;
	maxHeight: number;
};

export function Select({
	id,
	label,
	value,
	onChange,
	options,
	error,
	loading,
	disabled,
	fixedLabel,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	error?: string;
	loading?: boolean;
	disabled?: boolean;
	fixedLabel?: string;
}) {
	const [open, setOpen] = useState(false);
	const [closing, setClosing] = useState(false);
	const [search, setSearch] = useState("");
	const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLUListElement>(null);

	const isDisabled = loading || disabled;
	const selectedLabel = options.find((o) => o.value === value)?.label;
	const filteredOptions = search.trim()
		? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
		: options;

	function computePos(): DropdownPos | null {
		if (!triggerRef.current) return null;
		const rect = triggerRef.current.getBoundingClientRect();
		const vh = window.innerHeight;
		const maxH = 224;
		const gap = 4;
		const margin = 8;
		const spaceBelow = vh - rect.bottom - margin;
		const spaceAbove = rect.top - margin;
		if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
			return { top: rect.bottom + gap, left: rect.left, width: rect.width, maxHeight: Math.max(80, Math.min(maxH, spaceBelow)) };
		}
		return { bottom: vh - rect.top + gap, left: rect.left, width: rect.width, maxHeight: Math.max(80, Math.min(maxH, spaceAbove)) };
	}

	function closeDropdown() {
		setClosing(true);
		setTimeout(() => {
			setOpen(false);
			setClosing(false);
			setSearch("");
		}, 120);
	}

	useEffect(() => {
		if (!open) return;
		triggerRef.current?.focus();
		function handleOutside(e: MouseEvent) {
			const t = e.target as Node;
			if (!containerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
				closeDropdown();
			}
		}
		function updatePos() {
			setDropdownPos(computePos());
		}
		document.addEventListener("mousedown", handleOutside);
		window.addEventListener("scroll", updatePos, true);
		window.addEventListener("resize", updatePos);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			window.removeEventListener("scroll", updatePos, true);
			window.removeEventListener("resize", updatePos);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	function handleToggle() {
		if (isDisabled) return;
		if (open) closeDropdown();
		else { setDropdownPos(computePos()); setOpen(true); }
	}

	function handleSelect(optionValue: string) {
		onChange(optionValue);
		closeDropdown();
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
		if (!open) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
				e.preventDefault();
				setDropdownPos(computePos());
				setOpen(true);
			}
			return;
		}

		if (e.key === "Escape") {
			e.preventDefault();
			closeDropdown();
			return;
		}

		if (e.key === "Backspace") {
			e.preventDefault();
			setSearch((s) => s.slice(0, -1));
			return;
		}

		if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			e.preventDefault();
			setSearch((s) => s + e.key);
		}
	}

	const triggerClass = [
		"mt-1 flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition outline-none",
		isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-gray-300",
		error ? "border-red-200" : open ? "border-red-300 ring-2 ring-red-200" : "border-gray-200",
	].join(" ");

	return (
		<div ref={containerRef}>
			<Label htmlFor={id}>{label}</Label>
			<button
				ref={triggerRef}
				id={id}
				type="button"
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				disabled={isDisabled}
				aria-haspopup="listbox"
				aria-expanded={open}
				className={triggerClass}
			>
				{loading ? (
					<span className="flex items-center gap-2 text-neutral-400">
						<SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
						Cargando opciones...
					</span>
				) : fixedLabel && isDisabled ? (
					<span className="text-gray-900">{fixedLabel}</span>
				) : (
					<span className={value && selectedLabel ? "text-gray-900" : "text-neutral-400"}>
						{selectedLabel ?? "Selecciona una opción"}
					</span>
				)}
				<ChevronDownIcon className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
			</button>

			{(open || closing) && dropdownPos && createPortal(
				<ul
					ref={dropdownRef}
					role="listbox"
					style={{
						position: "fixed",
						top: dropdownPos.top,
						bottom: dropdownPos.bottom,
						left: dropdownPos.left,
						width: dropdownPos.width,
						maxHeight: dropdownPos.maxHeight,
						zIndex: 9999,
						overflow: "auto",
					}}
					className={`rounded-lg border border-gray-200 bg-white shadow-lg ${closing ? (dropdownPos?.bottom !== undefined ? "animate-dropdown-out-up" : "animate-dropdown-out") : (dropdownPos?.bottom !== undefined ? "animate-dropdown-in-up" : "animate-dropdown-in")}`}
				>
					{!search.trim() && (
						<li
							role="option"
							aria-selected={value === ""}
							onMouseDown={(e) => { e.preventDefault(); handleSelect(""); }}
							className={`cursor-pointer px-3 py-2 text-sm transition-colors ${value === "" ? "bg-red-100 font-medium text-red-700" : "text-neutral-400 hover:bg-gray-50"}`}
						>
							Selecciona una opción
						</li>
					)}
					{filteredOptions.length > 0 ? filteredOptions.map((option) => (
						<li
							key={option.value}
							role="option"
							aria-selected={value === option.value}
							onMouseDown={(e) => { e.preventDefault(); handleSelect(option.value); }}
							className={`cursor-pointer px-3 py-2 text-sm transition-colors ${value === option.value ? "bg-red-100 font-medium text-red-700" : "text-gray-900 hover:bg-gray-50"}`}
						>
							{option.label}
						</li>
					)) : (
						<li className="px-3 py-2 text-sm text-neutral-400">Sin resultados</li>
					)}
				</ul>,
				document.body
			)}

			{error && (
				<p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">
					<ExclamationCircleIcon className="h-4 w-4 shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}
