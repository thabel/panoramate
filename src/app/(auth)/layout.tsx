export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
            Panoramate
          </div>
          <p className="text-dark-400">Create stunning 360° virtual tours</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
