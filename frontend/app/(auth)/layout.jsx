export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 font-sans">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <footer className="text-center text-xs text-muted-foreground">
          2026 © STEM Universitas Prasetiya Mulya
        </footer>
      </div>
      <div className="bg-red-800 relative hidden lg:block">
        {/* <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        /> */}
      </div>
    </div>
  );
}
