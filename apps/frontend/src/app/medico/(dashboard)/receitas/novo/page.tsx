'use client';

import { PrescriptionForm } from '@/components/PrescriptionForm';

export default function NewPrescriptionPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-8">Emitir nova receita</h1>
      <div className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <PrescriptionForm />
      </div>
    </div>
  );
}

