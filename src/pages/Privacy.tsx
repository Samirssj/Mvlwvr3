import { Header } from "@/components/Header";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Política de Privacidad</h1>
        <div className="prose prose-invert max-w-none text-sm leading-6">
          <p>
            Esta aplicación (Mvlwvr3) utiliza el inicio de sesión con Facebook únicamente para autenticar usuarios. No almacenamos contraseñas ni compartimos información personal con terceros.
          </p>
          <p>
            Si deseas eliminar tus datos, contáctanos en <a href="mailto:samircenfe17@gmail.com" className="text-primary hover:underline">samircenfe17@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
