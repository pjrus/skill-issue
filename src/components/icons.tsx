import type { ImgHTMLAttributes } from "react";

export const Icons = {
  logo: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    <img 
      src="/skilliton.png" 
      alt="Skill Issue Logo" 
      {...props} 
    />
  ),
};
