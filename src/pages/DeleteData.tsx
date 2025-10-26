import { Header } from "@/components/Header";

export default function DeleteData() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Eliminación de Datos</h1>
        <div className="prose prose-invert max-w-none text-sm leading-6">
          <p>
            Si deseas eliminar los datos asociados a tu cuenta de Mvlwvr3, envía un correo a <a href="mailto:samircenfe17@gmail.com" className="text-primary hover:underline">samircenfe17@gmail.com</a> indicando tu nombre de usuario o correo registrado.
          </p>
          <p>
            Eliminaremos tu información en un plazo máximo de 48 horas.
          </p>
        </div>
      </div>
    </div>
  );
}
