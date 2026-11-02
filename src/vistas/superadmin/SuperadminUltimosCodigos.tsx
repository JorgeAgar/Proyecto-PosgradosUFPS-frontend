import { Link } from 'react-router';

export default function SuperadminUltimosCodigos() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-xl font-bold text-gray-900">Últimos códigos</h1>
      <p className="mt-3 text-sm text-gray-600">Esta opción no está disponible actualmente.</p>
      <Link to="/superadmin/inicio" className="mt-4 inline-block text-sm font-medium text-slate-700 underline">Volver al inicio</Link>
    </div>
  );
}
