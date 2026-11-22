// src/components/ValidationResult.tsx
"use client";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ValidationResultContent {
  patientName?: string | null;
  doctorName?: string | null;
  doctorCrm?: string | null;
  durationInDays?: number | null;
  issuedAt?: string | null;
  startDate?: string | null;
  pdfUrl?: string | null;
}

interface ValidationResultProps {
  result: ValidationResultContent | null;
  error: string | null;
}

const formatIssuedAt = (value: string): string => {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";

    const day = get("day");
    const month = get("month");
    const year = get("year");
    const hour = get("hour") === "24" ? "00" : get("hour");
    const minute = get("minute");
    const second = get("second");

    if (day && month && year && hour && minute && second) {
      return `${day}/${month}/${year} - ${hour}:${minute}:${second} (GMT-03)`;
    }

    const fallback = formatter
      .format(date)
      .replace(", ", " - ")
      .replace(" ", " - ");
    return `${fallback} (GMT-03)`;
  } catch {
    return value;
  }
};

const formatStartDate = (value: string): string => {
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      const [year, month, day] = value.trim().split("-");
      return `${day}/${month}/${year}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return value;
  }
};

export const ValidationResult = ({ result, error }: ValidationResultProps) => {
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center w-full">
        <AlertTriangle className="mx-auto mb-2 h-10 w-10 text-red-500" />
        <p className="font-semibold text-red-800">{error}</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const resolvePdfUrl = (url?: string | null): string | null => {
    if (!url || url.trim().length === 0) {
      return null;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const baseEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
    const runtimeBase =
      typeof window !== "undefined" ? window.location.origin : "";

    const buildBaseFromRuntime = (): string | null => {
      if (!runtimeBase) {
        return null;
      }

      try {
        const parsed = new URL(runtimeBase);
        if (parsed.hostname === "localhost") {
          parsed.port =
            parsed.port && parsed.port !== "" ? parsed.port : "3000";
          if (parsed.port === "3000" || parsed.port === "3001") {
            parsed.port = "3333";
          }
          return parsed.origin;
        }
        return parsed.origin;
      } catch {
        return runtimeBase.replace(/\/+$/, "");
      }
    };

    const buildBaseFromEnv = (): string | null => {
      if (!baseEnv || baseEnv.length === 0) {
        return null;
      }

      try {
        const parsed = new URL(baseEnv);
        if (
          parsed.hostname === "localhost" &&
          (!parsed.port || parsed.port === "3000")
        ) {
          parsed.port = "3333";
        }
        return parsed.origin;
      } catch {
        return baseEnv.replace(/\/+$/, "");
      }
    };

    const base =
      buildBaseFromEnv() ?? buildBaseFromRuntime() ?? "http://localhost:3333";

    const normalized = url.startsWith("/") ? url : `/${url}`;
    return `${base}${normalized}`;
  };

  const pdfSrc = resolvePdfUrl(result.pdfUrl);
  const patientName = result.patientName?.trim() || "Não informado";
  const doctorName = result.doctorName?.trim() || "Não informado";
  const doctorCrm = result.doctorCrm?.trim();
  const issuedAtLabel = result.issuedAt ? formatIssuedAt(result.issuedAt) : null;
  const startDateLabel = result.startDate ? formatStartDate(result.startDate) : null;
  const isCertificate =
    typeof result.durationInDays === "number" || Boolean(result.startDate);
  const documentTitle = isCertificate ? "Atestado original" : "Receita original";

  return (
    <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center w-full">
      <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-600" />
      <h2 className="text-lg font-bold text-green-900">Documento Válido!</h2>
      <div className="mt-4 text-left text-sm text-gray-700 space-y-1">
        <p>
          <strong>Emitido para:</strong> {patientName}
        </p>
        <p>
          <strong>Médico Responsável:</strong> {doctorName}
          {doctorCrm ? ` (CRM: ${doctorCrm})` : ""}
        </p>
        {issuedAtLabel && (
          <p>
            <strong>Data de Emissão:</strong> {issuedAtLabel}
          </p>
        )}
        {startDateLabel && (
          <p>
            <strong>Início do Afastamento:</strong> {startDateLabel}
          </p>
        )}
        {typeof result.durationInDays === "number" && (
          <p>
            <strong>Dias de afastamento:</strong> {result.durationInDays}
          </p>
        )}
      </div>

      {pdfSrc ? (
        <div className="mt-6 text-left">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            {documentTitle}
          </h3>
          <div className="h-[640px] w-full overflow-hidden rounded-md border border-gray-200 shadow-sm bg-white">
            <iframe
              title={documentTitle}
              src={`${pdfSrc}#toolbar=0`}
              className="h-full w-full"
            />
          </div>
          <div className="mt-2 text-sm">
            <a
              href={pdfSrc}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Abrir em nova aba
            </a>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-600">
          Arquivo do documento não disponível para visualização.
        </p>
      )}
    </div>
  );
};
