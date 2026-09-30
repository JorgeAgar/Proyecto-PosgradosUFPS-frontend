import { LockIcon } from "../../../assets/icons";

/** Aviso mostrado en secciones del aspirante que requieren el pago de inscripción (Paz y salvo). */
export default function SeccionBloqueada() {
  return (
    <div className="p-6 bg-gray-100 min-h-full flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-sm w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
            <LockIcon className="w-8 h-8 text-neutral-400" />
          </div>
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">Sección no disponible</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Esta sección estará disponible una vez hayas completado el pago de inscripción{" "}
          <span className="font-medium text-gray-600">(Paz y salvo)</span>.
        </p>
      </div>
    </div>
  );
}
