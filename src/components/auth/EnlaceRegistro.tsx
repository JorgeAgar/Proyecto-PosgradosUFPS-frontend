import { Link } from "react-router";

export default function EnlaceRegistro() {
  return (
    <p className="text-center text-sm text-gray-600">
      ¿Quieres inscribirte a un posgrado?{" "}
      <Link
        to="/registro"
        className="font-semibold text-red-700 hover:text-red-900 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      >
        Regístrate aquí
      </Link>
    </p>
  );
}
