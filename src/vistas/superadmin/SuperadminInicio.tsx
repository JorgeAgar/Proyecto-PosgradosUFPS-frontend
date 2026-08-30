import { useNavigate } from 'react-router';
import type { ComponentType } from 'react';
import { AcademicCapIcon, CalendarIcon } from '../../assets/icons';

function UserPlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7 shrink-0" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7 shrink-0" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-7 h-7 shrink-0" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V14.25z" />
    </svg>
  );
}

function HashtagIcon() {
  return (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
</svg>

  );
}

type ActionCard = {
  title: string;
  description: string;
  to: string;
  Icon: ComponentType<{ className?: string }>;
  delay: string;
};

const ACTION_CARDS: ActionCard[] = [
  {
    title: 'Usuarios',
    description: 'Gestionar usuarios del sistema',
    to: '/superadmin/usuarios',
    Icon: UserPlusIcon,
    delay: 'delay-100',
  },
  {
    title: 'Programas',
    description: 'Gestionar facultades, programas y cohortes académicas',
    to: '/superadmin/programas',
    Icon: AcademicCapIcon,
    delay: 'delay-200',
  },
  {
    title: 'Semestres',
    description: 'Administrar periodos académicos',
    to: '/superadmin/semestres',
    Icon: CalendarIcon,
    delay: 'delay-300',
  },
  {
    title: 'Valores globales',
    description: 'Configurar valores generales del sistema',
    to: '/superadmin/valores-globales',
    Icon: ClipboardIcon,
    delay: 'delay-400',
  },
  {
    title: 'Documentos consejo',
    description: 'Gestionar documentos requeridos por consejo',
    to: '/superadmin/documentos-consejo',
    Icon: DocumentIcon,
    delay: 'delay-500',
  },
  {
    title: 'Ultimos codigos',
    description: 'Actualizar consecutivos de codigo por programa',
    to: '/superadmin/ultimos-codigos',
    Icon: HashtagIcon,
    delay: 'delay-600',
  },
];

export default function SuperadminInicio() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-500 text-sm">Bienvenido al sistema de gestión de posgrados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {ACTION_CARDS.map(({ title, description, to, Icon, delay }) => (
          <div key={to} className={`animate-fade-in-up ${delay}`}>
            <button
              onClick={() => navigate(to)}
              className="group w-full h-full bg-white border border-gray-200 rounded-lg p-7 hover:border-gray-300 hover:shadow-md transition-colors text-left"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-900 transition-colors">
                <span className="text-slate-700 group-hover:text-white transition-colors">
                  <Icon className="w-7 h-7 shrink-0" />
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
              <p className="text-sm text-gray-500">{description}</p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
