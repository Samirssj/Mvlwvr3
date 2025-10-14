import { useEffect, useState } from "react";
import { X, Megaphone, ShieldAlert } from "lucide-react";

// Floating notice shown only on first visit (per browser) using localStorage
export function FirstVisitNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const k = localStorage.getItem("first_visit_notice_shown");
      if (!k) setOpen(true);
    } catch {}
  }, []);

  const close = () => {
    try { localStorage.setItem("first_visit_notice_shown", "1"); } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:px-6 md:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="relative p-4 sm:p-5 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <button
            aria-label="Cerrar"
            onClick={close}
            className="absolute top-3 right-3 rounded-md p-1 hover:bg-secondary/60 border border-transparent hover:border-border transition"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Megaphone className="h-6 w-6" style={{ color: "#0040ff" }} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold" style={{ color: "#0040ff" }}>
                Hola Bienvenido/a
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#0040ff" }}>
                Las películas son traídas de un servidor externo que contiene anuncios. Te recomiendo usar un bloqueador de anuncios como <span className="font-semibold" style={{ color: "#ff1a1a" }}>AdBlock</span> para ver sin anuncios y disfrutar de una mejor experiencia, ¡GRACIAS!
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <ShieldAlert className="h-4 w-4" />
                <span>Este mensaje se muestra solo en tu primera visita.</span>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={close}
              className="px-3 py-1.5 text-sm rounded-md"
              style={{ backgroundColor: "#0040ff", color: "white" }}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
