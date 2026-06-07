// Endereço: apps/frontend/src/app/dashboard/certificates-list-skeleton.tsx

export function CertificatesListSkeleton() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}