import React, { useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

// Import các ảnh banner từ assets
import banner1 from "../../../assets/images/Black-Friday-2.jpg";
import banner2 from "../../../assets/images/77-discount-flash-sale-background-260nw-2648902255.webp";
import banner3 from "../../../assets/images/black-friday-dien-thoai-vui.webp";

const slides = [
  { 
    image: banner1, 
    alt: "iPhone 15 Pro Max - Titan mạnh mẽ. Hiệu năng đỉnh cao.",
    title: "iPhone 15 Pro Max",
    subtitle: "Titan mạnh mẽ. Hiệu năng đỉnh cao.",
    badge: "Mới"
  },
  { 
    image: banner2, 
    alt: "MacBook Pro M3 - Sức mạnh cho mọi công việc sáng tạo",
    title: "Flash Sale",
    subtitle: "Giảm đến 77% - Chỉ trong hôm nay!",
    badge: "Hot"
  },
  { 
    image: banner3, 
    alt: "Samsung Galaxy S24 Ultra - AI thông minh. Hiệu suất vượt trội.",
    title: "Siêu Sale Điện Thoại",
    subtitle: "Ưu đãi khủng cuối năm",
    badge: "Sale"
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const goToPrev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrent((prev) => (prev + 1) % slides.length);

  return (
    <div 
      className="relative h-[280px] sm:h-[380px] md:h-[480px] lg:h-[520px] mx-4 md:mx-8 lg:mx-12 mt-6 rounded-3xl overflow-hidden shadow-2xl group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glassmorphism Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 z-[5] pointer-events-none" />
      
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${
            current === i 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-105"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.alt}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          
          {/* Content Overlay */}
          <div className={`absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-20 transition-all duration-700 delay-300 ${
            current === i ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
          }`}>
            {/* Badge */}
            <span className="inline-flex items-center w-fit px-2.5 py-0.5 sm:px-3 sm:py-1 mb-2 sm:mb-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#137fec] to-[#0ea5e9] rounded-full shadow-lg">
              {slide.badge}
            </span>
            
            {/* Title */}
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-1.5 sm:mb-2 md:mb-4 drop-shadow-lg leading-tight">
              {slide.title}
            </h2>
            
            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-white/90 max-w-xs sm:max-w-md md:max-w-lg drop-shadow-md leading-relaxed">
              {slide.subtitle}
            </p>
            
            {/* CTA Button */}
            <button className="mt-3 sm:mt-4 md:mt-6 w-fit px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 text-xs sm:text-sm md:text-base bg-white text-gray-900 font-semibold rounded-full hover:bg-[#137fec] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              Khám phá ngay
            </button>
          </div>
        </div>
      ))}

      {/* Navigation Dots - Glassmorphism style */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${
              current === i 
                ? "bg-white w-8 h-2.5" 
                : "bg-white/40 w-2.5 h-2.5 hover:bg-white/70"
            }`}
            aria-label={`Chuyển đến slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Previous Button - Glassmorphism */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
        aria-label="Slide trước"
      >
        <HiChevronLeft className="w-6 h-6" />
      </button>

      {/* Next Button - Glassmorphism */}
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
        aria-label="Slide tiếp theo"
      >
        <HiChevronRight className="w-6 h-6" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
        <div 
          className="h-full bg-gradient-to-r from-[#137fec] to-[#0ea5e9] transition-all duration-300"
          style={{ width: `${((current + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}