import { useNavigate } from 'react-router';
import type { ComponentType } from 'react';
import { AcademicCapIcon, CalendarIcon, ClipboardIcon, DashboardDocumentIcon, HashtagIcon, UserPlusIcon } from '../../assets/icons';

type ActionCard = {
  title: string;
  description: string;
  to: string;
  Icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
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
    Icon: DashboardDocumentIcon,
    delay: 'delay-500',
  },
  {
    title: 'Ultimos codigos',
    description: 'Actualizar consecutivos de codigo por programa',
    to: '/superadmin/ultimos-codigos',
    Icon: HashtagIcon,
    iconClassName: 'size-6',
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
        {ACTION_CARDS.map(({ title, description, to, Icon, iconClassName, delay }) => (
          <div key={to} className={`animate-fade-in-up ${delay}`}>
            <button
              onClick={() => navigate(to)}
              className="group w-full h-full bg-white border border-gray-200 rounded-lg p-7 hover:border-gray-300 hover:shadow-md transition-colors text-left"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-900 transition-colors">
                <span className="text-slate-700 group-hover:text-white transition-colors">
                  <Icon className={iconClassName ?? "w-7 h-7 shrink-0"} />
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
