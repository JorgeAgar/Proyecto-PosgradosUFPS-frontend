import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { SpinnerIcon } from "../../../assets/icons";

export type SelectSAOption = { value: string; label: string };

function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
	return (
		<label htmlFor={htmlFor} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
			{children}
		</label>
	);
}

export function SelectSA({
	id,
	label,
	value,
	onChange,
	options,
	error,
	loading,
	disabled,
}: {
	id: string;
	label: ReactNode;
	value: string;
	onChange: (value: string) => void;
	options: SelectSAOption[];
	error?: string;
	loading?: boolean;
	disabled?: boolean;
}) {
	const [open, setOpen]           = useState(false);
	const [closing, setClosing]     = useState(false);
	const [search, setSearch]       = useState("");
	const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
	const [openUpward, setOpenUpward] = useState(false);
	const containerRef              = useRef<HTMLDivElement>(null);
	const triggerRef                = useRef<HTMLButtonElement>(null);
	const dropdownRef               = useRef<HTMLUListElement>(null);

	const isDisabled    = loading || disabled;
	const selectedLabel = options.find((o) => o.value === value)?.label;
	const filteredOptions = search.trim()
		? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
		: options;

	function closeDropdown() {
		setClosing(true);
		setTimeout(() => { setOpen(false); setClosing(false); setSearch(""); }, 120);
	}

	function updateDropdownPosition() {
		const rect = triggerRef.current?.getBoundingClientRect();
		if (!rect) return;

		const maxHeight = 224; // max-h-56
		const gap = 4;
		const spaceBelow = window.innerHeight - rect.bottom - gap;
		const spaceAbove = rect.top - gap;
		const shouldOpenUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;

		setOpenUpward(shouldOpenUpward);
		setDropdownStyle({
			position: "fixed",
			...(shouldOpenUpward
				? { bottom: window.innerHeight - rect.top + gap }
				: { top: rect.bottom + gap }
			),
			left: rect.left,
			width: rect.width,
			zIndex: 70,
		});
	}

	useEffect(() => {
		if (!open) return;
		triggerRef.current?.focus();
		function handleOutside(e: MouseEvent) {
			const target = e.target as Node;
			if (
				containerRef.current &&
				!containerRef.current.contains(target) &&
				!dropdownRef.current?.contains(target)
			) closeDropdown();
		}
		window.addEventListener("resize", updateDropdownPosition);
		window.addEventListener("scroll", updateDropdownPosition, true);
		document.addEventListener("mousedown", handleOutside);
		return () => {
			window.removeEventListener("resize", updateDropdownPosition);
			window.removeEventListener("scroll", updateDropdownPosition, true);
			document.removeEventListener("mousedown", handleOutside);
		};
	}, [open]);

	function handleToggle() {
		if (isDisabled) return;
		if (open) {
			closeDropdown();
		} else {
			updateDropdownPosition();
			setOpen(true);
		}
	}

	function handleSelect(optionValue: string) {
		onChange(optionValue);
		closeDropdown();
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
		if (!open) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); updateDropdownPosition(); setOpen(true); }
			return;
		}
		if (e.key === "Escape") { e.preventDefault(); closeDropdown(); return; }
		if (e.key === "Backspace") { e.preventDefault(); setSearch((s) => s.slice(0, -1)); return; }
		if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setSearch((s) => s + e.key); }
	}

	const triggerClass = [
		"mt-1 flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition outline-none",
		isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-gray-400",
		error ? "border-red-300" : open ? "border-slate-400 ring-2 ring-slate-200" : "border-gray-300",
	].join(" ");

	const animationClass = closing
		? (openUpward ? "animate-dropdown-out-up" : "animate-dropdown-out")
		: (openUpward ? "animate-dropdown-in-up" : "animate-dropdown-in");

	return (
		<div ref={containerRef} className="relative">
			{label && <Label htmlFor={id}>{label}</Label>}
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
				) : (
					<span className={value && selectedLabel ? "text-gray-900" : "text-neutral-400"}>
						{selectedLabel ?? "Selecciona una opción"}
					</span>
				)}
				<ChevronDownIcon className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
			</button>

			{(open || closing) && createPortal(
				<ul
					ref={dropdownRef}
					role="listbox"
					style={dropdownStyle}
					className={`max-h-56 overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg ${animationClass}`}
				>
					{!search.trim() && (
						<li
							role="option"
							aria-selected={value === ""}
							onMouseDown={(e) => { e.preventDefault(); handleSelect(""); }}
							className={`cursor-pointer px-3 py-2 text-sm transition-colors ${value === "" ? "bg-slate-100 font-medium text-slate-700" : "text-neutral-400 hover:bg-gray-50"}`}
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
							className={`cursor-pointer px-3 py-2 text-sm transition-colors ${value === option.value ? "bg-slate-100 font-medium text-slate-700" : "text-gray-900 hover:bg-gray-50"}`}
						>
							{option.label}
						</li>
					)) : (
						<li className="px-3 py-2 text-sm text-neutral-400">Sin resultados</li>
					)}
				</ul>,
				document.body,
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
