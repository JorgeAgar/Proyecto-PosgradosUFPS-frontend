import { Link } from "react-router";
import PaginaAuth from "../components/auth/PaginaAuth";

export default function NoEncontrado() {
  return (
    <PaginaAuth>
      <main className="flex flex-col gap-5 text-center">
        <p className="text-7xl font-bold tracking-tight text-red-700">404</p>
        <h1 className="text-2xl font-bold text-gray-900">Página no encontrada</h1>
        <p className="text-sm text-gray-600">
          La página que buscas no existe o fue movida. Verifica la dirección o vuelve al inicio para continuar.
        </p>
        <Link
          to="/"
          className="rounded-md bg-red-700 p-3 font-bold text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Volver al inicio
        </Link>
      </main>
    </PaginaAuth>
  );
}
