import React from 'react';
import { motion } from 'motion/react';

interface MascotAvatarProps {
  expression?: 'wise' | 'shocked' | 'laughing' | 'cool' | 'thinking';
  className?: string;
  size?: number;
}

export function MascotAvatar({ expression = 'wise', className = '', size = 160 }: MascotAvatarProps) {
  // Map expressions to high-quality user-provided Djoss mascot images
  const expressionImages: Record<string, string> = {
    wise: "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/98b01db6-cf72-478f-9d34-69f85001f5f6.png",
    laughing: "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/d21d85fe-33db-421f-8903-a1ad6d1b36b8.png",
    cool: "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/964a6cfd-c113-4aa3-a10e-6d261348cf97.png",
    thinking: "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/92fb26ce-b1a9-4bf7-ac15-53929c4789b2.png",
    shocked: "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/92fb26ce-b1a9-4bf7-ac15-53929c4789b2.png",
  };

  const imageUrl = expressionImages[expression] || expressionImages.wise;

  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: expression === 'thinking' ? [0, -6, 0] : 0 }}
      transition={{ repeat: expression === 'thinking' ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
      id={`mascot-container-${expression}`}
    >
      <img
        src={imageUrl}
        alt={`Djoss ${expression}`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
        id={`mascot-svg-${expression}`}
      />
    </motion.div>
  );
}
