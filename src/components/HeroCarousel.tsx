// src/components/HeroCarousel.tsx
import React, { useEffect, useRef, useState } from "react";
import CarouselSlide, {/*SlideItem*/} from "./CarouselSlide";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Item {
	id: string;
	titulo: string;
	descripcion: string;
	portada: string; // URL de la portada normal
	portadaWide?: string; // URL de la portada wide para desktop
	tipo: string;
}

interface HeroCarouselProps {
	items: Item[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
	const [currentIndex, setCurrentIndex] = useState(0);

	// Cambio automático cada 5 segundos
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % items.length);
		}, 5000);
		return () => clearInterval(interval);
	}, [items.length]);

	if (!items.length) return null;

	return (
		<div className="relative w-full h-[70vh] overflow-hidden rounded-xl">
			{items.map((item, index) => (
				<CarouselSlide
					key={item.id}
					item={item}
					active={index === currentIndex}
				/>
			))}

			{/* Indicadores (puntos) */}
			<div className="absolute bottom-5 w-full flex justify-center gap-2">
				{items.map((_, i) => (
					<button
						key={i}
						className={`w-3 h-3 rounded-full transition-all ${
							i === currentIndex ? "bg-white" : "bg-gray-500"
						}`}
						onClick={() => setCurrentIndex(i)}
					/>
				))}
			</div>
		</div>
	);
};

export default HeroCarousel;