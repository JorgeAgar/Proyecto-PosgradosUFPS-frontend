import { SpinnerIcon } from "../assets/icons";

export const BOTON_PRIMARIO =
  "flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed";
export const BOTON_SECUNDARIO =
  "px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60";

const ANCHOS = { md: "max-w-md", lg: "max-w-lg" } as const;

interface DialogoProps {
  /** Monta el diálogo. */
  abierto: boolean;
  /** Reproduce la animación de salida (el padre desmonta tras ~170 ms). */
  cerrando?: boolean;
  titulo: React.ReactNode;
  tamano?: keyof typeof ANCHOS;
  /** Si se pasa, un clic en el fondo cierra el diálogo. */
  onClickFondo?: () => void;
  children: React.ReactNode;
  /** Botones del pie. */
  pie?: React.ReactNode;
}

/** Diálogo modal con cabecera, cuerpo y pie separados por bordes. */
export function Dialogo({ abierto, cerrando = false, titulo, tamano = "md", onClickFondo, children, pie }: DialogoProps) {
  if (!abierto) return null;
  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrando ? "animate-overlay-out" : "animate-overlay-in"}`}
      onClick={onClickFondo}
    >
      <div
        className={`bg-white rounded-lg border border-gray-200 shadow-xl ${ANCHOS[tamano]} w-full mx-4 ${cerrando ? "animate-modal-out" : "animate-modal-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
        </div>
        <div className="p-6">{children}</div>
        {pie && (
          <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">{pie}</div>
        )}
      </div>
    </div>
  );
}

interface DialogoConfirmacionProps extends Omit<DialogoProps, "pie"> {
  onCancelar: () => void;
  onConfirmar: () => void;
  textoCancelar?: string;
  textoConfirmar?: string;
  /** Texto mostrado junto al spinner mientras `procesando` es true. */
  textoProcesando?: string;
  procesando?: boolean;
  /** Deshabilita solo el botón de confirmar (además de mientras se procesa). */
  confirmarDeshabilitado?: boolean;
}

/** Diálogo "¿Está seguro…?" con botones Cancelar / Confirmar. */
export function DialogoConfirmacion({
  onCancelar,
  onConfirmar,
  textoCancelar = "Cancelar",
  textoConfirmar = "Confirmar",
  textoProcesando = "Procesando...",
  procesando = false,
  confirmarDeshabilitado = false,
  children,
  ...dialogo
}: DialogoConfirmacionProps) {
  return (
    <Dialogo
      {...dialogo}
      pie={
        <>
          <button type="button" onClick={onCancelar} disabled={procesando} className={BOTON_SECUNDARIO}>
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando || confirmarDeshabilitado}
            className={BOTON_PRIMARIO}
          >
            {procesando ? (
              <>
                <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" />
                {textoProcesando}
              </>
            ) : (
              textoConfirmar
            )}
          </button>
        </>
      }
    >
      {typeof children === "string" ? <p className="text-sm text-gray-700">{children}</p> : children}
    </Dialogo>
  );
}
