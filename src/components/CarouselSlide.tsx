import React from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface SlideItem {
	id: string;
	titulo: string;
	descripcion: string;
	portada: string;
	portadaWide?: string;
	tipo: string;
}

interface CarouselSlideProps {
	item: SlideItem;
	active: boolean;
}

const CarouselSlide: React.FC<CarouselSlideProps> = ({ item, active }) => {
	return (
		<div
			className={`
                absolute inset-0 transition-opacity duration-1000 
                ${active ? "opacity-100 z-10" : "opacity-0 z-0"}
            `}
		>
			{/* Imagen de fondo con responsive */}
			<div className="relative w-full h-full">
				{/* Imagen para desktop (oculta en móvil) */}
				{item.portadaWide && (
					<div
						className="hidden md:block w-full h-full bg-cover bg-center"
						style={{ backgroundImage: `url(${item.portadaWide})` }}
					/>
				)}
				{/* Imagen para móvil (visible solo en móvil o si no hay portadaWide) */}
				<div
					className={`w-full h-full bg-cover bg-center ${item.portadaWide ? 'md:hidden' : ''}`}
					style={{ backgroundImage: `url(${item.portada})` }}
				/>
			</div>

			{/* Overlay oscuro */}
			<div className="absolute inset-0 bg-black/50" />

			{/* Contenido */}
			<div className="absolute bottom-10 left-10 max-w-xl space-y-4 text-white">
				<h1 className="text-4xl font-bold">{item.titulo}</h1>
				<p className="text-lg opacity-80 line-clamp-3">
					{item.descripcion}
				</p>
				{/*<a
					href={`/ver/${item.id}`}
					className="inline-block bg-red-600 px-5 py-2 rounded-lg text-lg font-semibold hover:bg-red-700 transition"
				>
					Ver ahora
				</a>*/}
			</div>
		</div>
	);
};

export default CarouselSlide;