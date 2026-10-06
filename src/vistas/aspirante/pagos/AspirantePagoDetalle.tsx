import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router';
import {
  CreditCardIcon,
  DocumentCurrencyDollarIcon,
  InformationCircleIcon,
  PrinterIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  TagIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { fetchInscripcionResumen, fetchInscripcionCheckout, uploadInscripcionFactura, patchInscripcionFactura } from '../../../services/aspirante/aspirantePagosInscripcionService';
import { fetchMatriculaResumen, fetchMatriculaCheckout, uploadMatriculaFactura, patchMatriculaFactura } from '../../../services/aspirante/aspirantePagosMatriculaService';
import { getAspiranteRealId } from '../../../services/aspirante/aspiranteService';
import type { ResumenPagoResponse, WompiCheckoutResponse, PaymentReceipt } from '../../../services/aspirante/aspirantePagosService';
import type { AspiranteOutletContext } from '../../../layouts/AspiranteLayout';
import { SpinnerIcon } from "../../../assets/icons";
import Cargando from "../../../components/Cargando";
import { DialogoConfirmacion } from "../../../components/Dialogo";

export type TipoPagoAspirante = 'inscripcion' | 'matricula';

const CONFIG: Record<TipoPagoAspirante, {
  /** Nombre visible: "Inscripción" / "Matrícula". */
  nombre: string;
  resumen: (aspiranteId: string) => Promise<ResumenPagoResponse>;
  checkout: (aspiranteId: string, montoCentavos: number) => Promise<WompiCheckoutResponse>;
  subirFactura: (aspiranteId: string, file: File) => Promise<void>;
  reemplazarFactura: (aspiranteId: string, file: File) => Promise<void>;
  redirectUrlPorDefecto: string;
  /** La matrícula permite elegir el monto a pagar (entre valorminimo y valormatricula). */
  conMonto: boolean;
}> = {
  inscripcion: {
    nombre: 'Inscripción',
    resumen: fetchInscripcionResumen,
    checkout: (aspiranteId) => fetchInscripcionCheckout(aspiranteId),
    subirFactura: uploadInscripcionFactura,
    reemplazarFactura: patchInscripcionFactura,
    redirectUrlPorDefecto: '',
    conMonto: false,
  },
  matricula: {
    nombre: 'Matrícula',
    resumen: fetchMatriculaResumen,
    checkout: fetchMatriculaCheckout,
    subirFactura: uploadMatriculaFactura,
    reemplazarFactura: patchMatriculaFactura,
    redirectUrlPorDefecto: 'https://transaction-redirect.wompi.co/check',
    conMonto: true,
  },
};

function EstadoPagoBadge({ estado }: { estado: string }) {
  const norm = estado.trim().toUpperCase();
  const styles: Record<string, string> = {
    COMPLETADO: 'bg-green-100 text-green-700 border border-green-200',
    PAGADO:     'bg-green-100 text-green-700 border border-green-200',
    'EN CURSO': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    PENDIENTE:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
    RECHAZADO:  'bg-red-100 text-red-700 border border-red-200',
  };
  const labels: Record<string, string> = {
    COMPLETADO: 'Completado',
    PAGADO:     'Pagado',
    'EN CURSO': 'En curso',
    PENDIENTE:  'Pendiente',
    RECHAZADO:  'Rechazado',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg ${styles[norm] ?? 'bg-neutral-200 text-neutral-600 border border-gray-200'}`}>
      {labels[norm] ?? estado}
    </span>
  );
}

export default function AspirantePagoDetalle({ tipo }: { tipo: TipoPagoAspirante }) {
  const cfg = CONFIG[tipo];
  const nombreMinuscula = cfg.nombre.toLowerCase();
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<AspiranteOutletContext>();
  const navigate = useNavigate();

  const [aspiranteId, setAspiranteId]           = useState('');
  const [resumen, setResumen]                   = useState<ResumenPagoResponse | null>(null);
  const [loadingResumen, setLoadingResumen]     = useState(true);
  const [receiptGenerated, setReceiptGenerated] = useState(false);
  const [loadingCheckout, setLoadingCheckout]   = useState(false);
  const [wompiCheckout, setWompiCheckout]       = useState<WompiCheckoutResponse | null>(null);
  const [miniReceipt, setMiniReceipt]           = useState<PaymentReceipt | null>(null);
  const [montoElegido, setMontoElegido]         = useState<string>('');
  const [downloadingRecibo, setDownloadingRecibo]   = useState(false);
  const [downloadingFactura, setDownloadingFactura] = useState(false);
  const [facturaFile, setFacturaFile]               = useState<File | null>(null);
  const [uploadingFactura, setUploadingFactura]     = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [cerrandoConfirmar, setCerrandoConfirmar] = useState(false);
  const [mostrarConfirmarSubida, setMostrarConfirmarSubida] = useState(false);
  const [cerrandoConfirmarSubida, setCerrandoConfirmarSubida] = useState(false);

  const wompiWidgetRef = useRef<HTMLDivElement | null>(null);

  const estadoNorm     = resumen?.estado?.trim().toUpperCase() ?? '';
  const pagoCompletado = estadoNorm === 'COMPLETADO';
  const pagoRechazado  = estadoNorm === 'RECHAZADO';
  const puedeSubirFactura = estadoNorm === 'EN CURSO' || estadoNorm === 'RECHAZADO';

  const cargarResumen = () => {
    setLoadingResumen(true);
    cfg.resumen(aspiranteId)
      .then(setResumen)
      .catch(e => mostrarAlerta(e instanceof Error ? e.message : `No se pudo cargar el resumen de ${nombreMinuscula}.`))
      .finally(() => setLoadingResumen(false));
  };

  useEffect(() => {
    getAspiranteRealId()
      .then(id => setAspiranteId(String(id)))
      .catch(e => {
        mostrarAlerta(e instanceof Error ? e.message : 'No se pudo obtener los datos del aspirante.');
        setLoadingResumen(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!aspiranteId) return;
    cargarResumen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspiranteId]);

  useEffect(() => {
    if (!receiptGenerated) return;
    const handle = (event: MessageEvent) => {
      const d = event.data;
      if (d && typeof d === 'object' && typeof d.type === 'string' &&
        (d.type === 'wompi.transaction' || d.type.startsWith('wompi'))) {
        cargarResumen();
      }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptGenerated]);

  useEffect(() => {
    if (!receiptGenerated || !wompiWidgetRef.current || pagoCompletado || !wompiCheckout) return;
    const container = wompiWidgetRef.current;
    container.innerHTML = '';
    const redirectUrl = wompiCheckout.redirectUrl ?? cfg.redirectUrlPorDefecto;
    const script = document.createElement('script');
    script.src = wompiCheckout.widgetScriptUrl;
    script.setAttribute('data-render', 'button');
    script.setAttribute('data-public-key', wompiCheckout.publicKey);
    script.setAttribute('data-currency', wompiCheckout.currency);
    script.setAttribute('data-amount-in-cents', String(wompiCheckout.amountInCents));
    script.setAttribute('data-reference', wompiCheckout.reference);
    script.setAttribute('data-signature:integrity', wompiCheckout.signatureIntegrity);
    script.setAttribute('data-redirect-url', redirectUrl);
    container.appendChild(script);
    return () => { container.innerHTML = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptGenerated, wompiCheckout]);

  const handleUploadFactura = async () => {
    if (!facturaFile) return;
    try {
      setUploadingFactura(true);
      if (resumen?.urlfactura) {
        await cfg.reemplazarFactura(aspiranteId, facturaFile);
        mostrarConfirm('Factura reemplazada con éxito.');
      } else {
        await cfg.subirFactura(aspiranteId, facturaFile);
        mostrarConfirm('Factura subida con éxito.');
      }
      setFacturaFile(null);
      cargarResumen();
    } catch (e) {
      mostrarAlerta(e instanceof Error ? e.message : 'No se pudo subir la factura.');
    } finally {
      setUploadingFactura(false);
    }
  };

  const cerrarConfirmar = () => {
    setCerrandoConfirmar(true);
    setTimeout(() => { setMostrarConfirmar(false); setCerrandoConfirmar(false); }, 170);
  };

  const cerrarConfirmarSubida = () => {
    setCerrandoConfirmarSubida(true);
    setTimeout(() => { setMostrarConfirmarSubida(false); setCerrandoConfirmarSubida(false); }, 170);
  };

  const handleGenerarRecibo = async (montoCentavos: number) => {
    try {
      setLoadingCheckout(true);
      const checkout = await cfg.checkout(aspiranteId, montoCentavos);
      setWompiCheckout(checkout);
      setMiniReceipt({
        id:       String(checkout.paymentId ?? '0'),
        number:   String(checkout.reference ?? 'N/A'),
        date:     checkout.creationDate ?? new Date().toISOString(),
        dueDate:  checkout.pagoreciboinscripcion?.fechavencimiento ?? undefined,
        amount:   typeof checkout.amount === 'number' ? checkout.amount : Math.round((checkout.amountInCents ?? 0) / 100),
        currency: checkout.currency ?? 'COP',
        pdfUrl:   checkout.pagoreciboinscripcion?.urlrecibo ?? checkout.checkoutUrl ?? undefined,
      });
      setReceiptGenerated(true);
      mostrarConfirm('Recibo generado con éxito.');
      // Refrescar resumen para obtener urlrecibo/urlfactura/estado actualizados
      cfg.resumen(aspiranteId).then(setResumen).catch(() => {});
    } catch (e) {
      mostrarAlerta(e instanceof Error ? e.message : 'No se pudo generar el recibo de pago.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const encabezado = (
    <div className="flex items-center gap-3 animate-fade-in">
      <button
        onClick={() => navigate('/aspirante/pagos')}
        className="flex items-center gap-1 text-sm text-neutral-400 hover:text-red-700 transition-colors"
      >
        <ArrowLeftIcon className="h-4.5 w-4.5 shrink-0" />
      </button>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pagos</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Gestiona tus pagos de inscripción y matrícula</p>
      </div>
    </div>
  );

  if (loadingResumen || loadingCheckout) {
    return (
      <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <div className="">
          {encabezado}
          <Cargando texto="Cargando información del pago..." />
        </div>
      </div>
    );
  }

  const now = new Date();
  const receiptDate = now.toLocaleDateString('es-CO');
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO');

  // Estado EN CURSO: usa resumen.valor directamente sin pedir monto
  const enCurso = resumen?.estado?.toUpperCase() === 'EN CURSO';

  // Validación de monto (solo aplica si NO es EN CURSO)
  const minMonto    = resumen?.valorminimo    ?? 0;
  const maxMonto    = resumen?.valormatricula ?? 0;
  const montoNum    = parseFloat(montoElegido) || 0;
  const montoFuera  = montoElegido !== '' && (montoNum < minMonto || montoNum > maxMonto);
  const montoValido = montoElegido !== '' && !montoFuera;

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <div className="space-y-6">
        {encabezado}

        {/* Información */}
        {resumen && (
          <div className="space-y-2 animate-fade-in-up delay-200">
            <h3 className="flex text-sm font-semibold text-gray-900 gap-2 items-center">
              <DocumentTextIcon className="w-5 h-5" /> Información de la {cfg.nombre}
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-start gap-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-neutral-400">Facultad</p><p className="text-sm font-medium text-gray-900 mt-0.5">{resumen.facultad}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <AcademicCapIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-neutral-400">Programa</p><p className="text-sm font-medium text-gray-900 mt-0.5">{resumen.programa}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-neutral-400">Periodo</p><p className="text-sm font-medium text-gray-900 mt-0.5">{resumen.periodo}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <TagIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-neutral-400">Tipo</p><p className="text-sm font-medium text-gray-900 mt-0.5">{resumen.tipo}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <IdentificationIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-neutral-400">Documento</p><p className="text-sm font-medium text-gray-900 mt-0.5">{resumen.documento}</p></div>
                </div>
                {resumen.valormatricula != null && (
                  <div className="flex items-start gap-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                    <div><p className="text-xs text-neutral-400">Valor general</p><p className="text-lg font-bold text-gray-700 mt-0.5">${resumen.valormatricula.toLocaleString('es-CO')} COP</p></div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <UserIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-neutral-400">Aspirante</p><p className="text-sm font-medium text-gray-900 mt-0.5">{resumen.aspirante}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <CurrencyDollarIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-neutral-400">Valor a pagar</p><p className="text-lg font-bold text-red-700 mt-0.5">${resumen.valor.toLocaleString('es-CO')} COP</p></div>
                </div>
                {resumen.estado && (
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                    <div><p className="text-xs text-neutral-400">Estado</p><div className="mt-1"><EstadoPagoBadge estado={resumen.estado} /></div></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subir / reemplazar factura de pago físico */}
        {resumen && puedeSubirFactura && (
          <div className="space-y-2 animate-fade-in-up delay-300">
            <h3 className="flex text-sm font-semibold text-gray-900 gap-2 items-center">
              <DocumentArrowUpIcon className="w-5 h-5" />
              {resumen.urlfactura ? 'Reemplazar Factura' : 'Subir Factura'}
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="flex items-start gap-3 bg-amber-100 border border-amber-200 rounded-lg p-4">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  {resumen.urlfactura
                    ? 'Puedes reemplazar tu factura anteriormente subida con una versión corregida. Formatos permitidos: PDF, PNG, JPG y JPEG.'
                    : '¿Pagaste físicamente? Sube la factura en formato PDF, PNG, JPG o JPEG para realizar la verificación de tu pago.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Archivo de factura <span className="text-red-700">*</span>
                </label>
                <label className={`flex items-center gap-3 w-full px-4 py-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-neutral-50 ${uploadingFactura ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
                        mostrarAlerta('Solo se permiten archivos PDF, PNG, JPG o JPEG.');
                        e.target.value = '';
                        return;
                      }
                      setFacturaFile(file);
                    }}
                    disabled={uploadingFactura}
                  />
                  <DocumentArrowUpIcon className="w-5 h-5 text-neutral-400 shrink-0" />
                  <span className={`text-sm truncate ${facturaFile ? 'text-gray-900 font-medium' : 'text-neutral-400'}`}>
                    {facturaFile ? facturaFile.name : 'Haz clic para seleccionar un archivo (PDF, PNG, JPG o JPEG)'}
                  </span>
                </label>
              </div>
              <button
                onClick={() => setMostrarConfirmarSubida(true)}
                disabled={!facturaFile || uploadingFactura}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-700 text-white font-semibold text-sm rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {uploadingFactura
                  ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" /> Subiendo factura...</>
                  : <><DocumentArrowUpIcon className="w-4 h-4 shrink-0" /> {resumen.urlfactura ? 'Reemplazar Factura' : 'Subir Factura'}</>}
              </button>
            </div>
          </div>
        )}

        {/* Ver factura subida — color según estado */}
        {resumen && resumen.urlfactura && !pagoCompletado && (
          <div className="space-y-2 animate-fade-in-up delay-300">
            <h3 className="flex text-sm font-semibold text-gray-900 gap-2 items-center">
              <DocumentTextIcon className="w-5 h-5" /> Factura de Pago
            </h3>
            {pagoRechazado ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg shrink-0">
                      <XCircleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-700">Factura rechazada</p>
                      <p className="text-sm text-red-600">Tu factura fue rechazada. Contacta con el equipo administrativo.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setDownloadingFactura(true); window.open(resumen.urlfactura!, '_blank'); setTimeout(() => setDownloadingFactura(false), 800); }}
                    disabled={downloadingFactura}
                    className="relative shrink-0 flex items-center justify-center px-5 py-2.5 bg-red-700 text-white font-semibold text-sm rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className={`flex items-center gap-2 ${downloadingFactura ? 'invisible' : ''}`}>
                      <DocumentTextIcon className="w-4 h-4 shrink-0" /> Ver Factura
                    </span>
                    {downloadingFactura && (
                      <span className="absolute inset-0 flex items-center justify-center gap-2">
                        <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" /> Cargando...
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                      <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-700">Factura en verificación</p>
                      <p className="text-sm text-amber-600">Tu factura ha sido recibida y está siendo revisada por el equipo administrativo.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setDownloadingFactura(true); window.open(resumen.urlfactura!, '_blank'); setTimeout(() => setDownloadingFactura(false), 800); }}
                    disabled={downloadingFactura}
                    className="relative shrink-0 flex items-center justify-center px-5 py-2.5 bg-amber-400 text-white font-semibold text-sm rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className={`flex items-center gap-2 ${downloadingFactura ? 'invisible' : ''}`}>
                      <DocumentTextIcon className="w-4 h-4 shrink-0" /> Ver Factura
                    </span>
                    {downloadingFactura && (
                      <span className="absolute inset-0 flex items-center justify-center gap-2">
                        <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" /> Cargando...
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pago completado */}
        {pagoCompletado && resumen && (
          <div className="space-y-2 animate-fade-in-up delay-300">
            <h3 className="flex text-sm font-semibold text-gray-900 gap-2 items-center">
              <DocumentCurrencyDollarIcon className="w-5 h-5" /> Estado del Pago
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg shrink-0"><CheckCircleIcon className="w-6 h-6 text-green-700" /></div>
                  <div>
                    <p className="font-semibold text-green-700">Pago realizado</p>
                    <p className="text-sm text-green-600">El pago ha sido procesado exitosamente.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  {resumen.urlrecibo && (
                    <button
                      onClick={() => { setDownloadingRecibo(true); window.open(resumen.urlrecibo!, '_blank'); setTimeout(() => setDownloadingRecibo(false), 800); }}
                      disabled={downloadingRecibo}
                      className="relative flex items-center justify-center px-5 py-2.5 bg-green-700 text-white font-semibold text-sm rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className={`flex items-center gap-2 ${downloadingRecibo ? 'invisible' : ''}`}>
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 shrink-0" /> Ver recibo
                      </span>
                      {downloadingRecibo && (
                        <span className="absolute inset-0 flex items-center justify-center gap-2">
                          <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" /> Abriendo...
                        </span>
                      )}
                    </button>
                  )}
                  {resumen.urlfactura && (
                    <button
                      onClick={() => { setDownloadingFactura(true); window.open(resumen.urlfactura!, '_blank'); setTimeout(() => setDownloadingFactura(false), 800); }}
                      disabled={downloadingFactura}
                      className="relative flex items-center justify-center px-5 py-2.5 border border-green-200 text-green-700 font-semibold text-sm rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className={`flex items-center gap-2 ${downloadingFactura ? 'invisible' : ''}`}>
                        <DocumentTextIcon className="w-4 h-4 shrink-0" /> Ver factura
                      </span>
                      {downloadingFactura && (
                        <span className="absolute inset-0 flex items-center justify-center gap-2">
                          <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-green-700" /> Abriendo...
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generar recibo */}
        {!pagoCompletado && (
          <div className="space-y-2 animate-fade-in-up delay-300">
            <h3 className="flex text-sm font-semibold text-gray-900 gap-2 items-center">
              <DocumentCurrencyDollarIcon className="w-5 h-5" /> Generar Recibo de Pago
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center space-y-3">
              <p className="text-sm text-neutral-400">Genera tu recibo de pago para continuar con la {nombreMinuscula}.</p>
              <button
                onClick={() => {
                  if (cfg.conMonto && (enCurso || (pagoRechazado && resumen?.urlrecibo))) {
                    handleGenerarRecibo(Math.round((resumen?.valor ?? 0) * 100));
                  } else {
                    setMostrarConfirmar(true);
                  }
                }}
                disabled={receiptGenerated || loadingCheckout}
                className={`font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 w-full transition ${receiptGenerated ? 'bg-green-700 text-white cursor-not-allowed' : 'bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed'}`}
              >
                {receiptGenerated ? <><CheckCircleIcon className="w-5 h-5" /> Recibo Generado</>
                  : loadingCheckout ? <><SpinnerIcon className="animate-spin shrink-0 h-5 w-5 text-white" /> Generando recibo...</>
                  : <><DocumentCurrencyDollarIcon className="w-5 h-5" /> Generar Recibo de Pago</>}
              </button>
            </div>
          </div>
        )}

        {/* Recibo + Wompi */}
        {receiptGenerated && !pagoCompletado && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 animate-fade-in-up">
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`border-2 border-dashed rounded-lg p-5 space-y-4 ${pagoCompletado ? 'border-green-300' : 'border-gray-300'}`}>
                <div className="flex justify-between border-b-2 border-dashed border-gray-300 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-gray-900">{cfg.nombre}</h4>
                    <p className={`font-semibold text-sm mt-0.5 ${pagoCompletado ? 'text-green-700' : 'text-red-700'}`}>N° {miniReceipt?.number ?? '—'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-1 text-neutral-400 shrink-0"><AcademicCapIcon className="w-4 h-4" /> Programa</span>
                    <span className="font-medium text-gray-900 text-right text-xs">{resumen?.programa ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-1 text-neutral-400 shrink-0"><UserIcon className="w-4 h-4" /> Aspirante</span>
                    <span className="font-medium text-gray-900 text-right text-xs">{resumen?.aspirante ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-1 text-neutral-400 shrink-0"><CalendarIcon className="w-4 h-4" /> Fecha generación</span>
                    <span className="font-medium text-gray-900 text-right text-xs">{miniReceipt ? new Date(miniReceipt.date).toLocaleDateString('es-CO') : receiptDate}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex items-center gap-1 text-neutral-400 shrink-0"><CalendarIcon className="w-4 h-4" /> Vencimiento</span>
                    <span className="font-medium text-gray-900 text-right text-xs">{miniReceipt?.dueDate ? new Date(miniReceipt.dueDate).toLocaleDateString('es-CO') : dueDate}</span>
                  </div>
                </div>
                <div className="flex justify-between border-t-2 border-dashed border-gray-300 pt-3">
                  <p className="font-bold text-sm text-gray-900">VALOR A PAGAR:</p>
                  <p className={`font-bold flex items-center gap-1 ${pagoCompletado ? 'text-green-700' : 'text-red-700'}`}>
                    <CurrencyDollarIcon className="w-4 h-4 shrink-0" />
                    ${(miniReceipt?.amount ?? (montoNum || (resumen?.valor ?? 0))).toLocaleString('es-CO')} {miniReceipt?.currency ?? 'COP'}
                  </p>
                </div>
                <div className="flex justify-between border-t-2 border-dashed border-gray-300 pt-3">
                  <p className="font-bold text-sm text-gray-900">ESTADO:</p>
                  {pagoCompletado
                    ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-200"><CheckCircleIcon className="w-3.5 h-3.5" /> Pagado</span>
                    : <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-yellow-200"><InformationCircleIcon className="w-3.5 h-3.5" /> Pendiente</span>}
                </div>
              </div>

              <div className="space-y-4">
                {resumen && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5 text-center space-y-3">
                    <h4 className="font-semibold flex items-center justify-center gap-2 text-gray-900 text-sm"><PrinterIcon className="w-4 h-4 text-red-700" /> Descargar / Imprimir</h4>
                    <p className="text-xs text-neutral-400">Descarga tu recibo en formato PDF</p>
                    <button
                      onClick={() => { const url = resumen.urlrecibo ?? miniReceipt?.pdfUrl ?? wompiCheckout?.checkoutUrl; if (!url) return; setDownloadingRecibo(true); window.open(url, '_blank'); setTimeout(() => setDownloadingRecibo(false), 800); }}
                      disabled={downloadingRecibo || !(resumen.urlrecibo ?? miniReceipt?.pdfUrl ?? wompiCheckout?.checkoutUrl)}
                      className="font-semibold text-sm text-red-700 border border-red-200 bg-white flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingRecibo ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-red-700" /> Abriendo...</> : <><ArrowTopRightOnSquareIcon className="w-4 h-4 shrink-0" /> Ver recibo</>}
                    </button>
                  </div>
                )}
                {!resumen?.urlfactura && (
                  <div className="bg-white rounded-lg border border-gray-200 p-5 text-center space-y-3">
                    <h4 className="font-semibold flex items-center justify-center gap-2 text-gray-900 text-sm"><CreditCardIcon className="w-4 h-4 text-red-700" /> Pagar en Línea</h4>
                    <p className="text-xs text-neutral-400">Realiza el pago de forma segura</p>
                    {pagoCompletado
                      ? <div className="font-semibold flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm"><CheckCircleIcon className="w-4 h-4 shrink-0" /> Pagado</div>
                      : <form><div ref={wompiWidgetRef} /></form>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal confirmar subida de factura */}
      <DialogoConfirmacion
        abierto={mostrarConfirmarSubida}
        cerrando={cerrandoConfirmarSubida}
        titulo={resumen?.urlfactura ? 'Confirmar reemplazo de factura' : 'Confirmar subida de factura'}
        onCancelar={cerrarConfirmarSubida}
        onConfirmar={() => { cerrarConfirmarSubida(); handleUploadFactura(); }}
        textoConfirmar={resumen?.urlfactura ? 'Sí, reemplazar' : 'Sí, subir factura'}
        textoProcesando="Subiendo..."
        procesando={uploadingFactura}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            {resumen?.urlfactura
              ? <>¿Deseas reemplazar la factura existente con <strong>{facturaFile?.name}</strong>?</>
              : <>¿Deseas subir el archivo <strong>{facturaFile?.name}</strong> como factura de pago?</>}
          </p>
          <p className="text-xs text-neutral-400">Formatos permitidos: PDF, PNG, JPG y JPEG.</p>
        </div>
      </DialogoConfirmacion>

      {/* Modal confirmar recibo (con monto en matrícula) */}
      <DialogoConfirmacion
        abierto={mostrarConfirmar}
        cerrando={cerrandoConfirmar}
        titulo="Confirmar generación de recibo"
        onCancelar={cerrarConfirmar}
        onConfirmar={() => {
          cerrarConfirmar();
          handleGenerarRecibo(cfg.conMonto ? Math.round(parseFloat(montoElegido) * 100) : 0);
        }}
        textoConfirmar="Sí, generar recibo"
        textoProcesando="Generando..."
        procesando={loadingCheckout}
        confirmarDeshabilitado={cfg.conMonto && !montoValido}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">¿Deseas generar el recibo de pago para <strong>la {nombreMinuscula}</strong>?</p>
          {cfg.conMonto && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Monto a pagar <span className="text-red-700">*</span>
              </label>
              <input
                type="number"
                min={minMonto}
                max={maxMonto}
                placeholder={`Mín. $${minMonto.toLocaleString('es-CO')}`}
                value={montoElegido}
                disabled={loadingCheckout}
                onChange={(e) => setMontoElegido(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 outline-none transition disabled:bg-gray-50 disabled:text-neutral-400 disabled:cursor-not-allowed ${montoFuera ? 'border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-200' : 'border-gray-200 hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200'}`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-neutral-400">
                <span>Mínimo: <span className="font-medium">${minMonto.toLocaleString('es-CO')} COP</span></span>
                <span>Máximo: <span className="font-medium">${maxMonto.toLocaleString('es-CO')} COP</span></span>
              </div>
              {montoFuera && (
                <p className="mt-1 text-xs text-red-700">El monto debe estar entre ${minMonto.toLocaleString('es-CO')} y ${maxMonto.toLocaleString('es-CO')} COP.</p>
              )}
            </div>
          )}
        </div>
      </DialogoConfirmacion>
    </div>
  );
}
