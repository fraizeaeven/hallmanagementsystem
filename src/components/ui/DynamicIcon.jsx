import * as Icons from 'lucide-react';

export default function DynamicIcon({ name, size = 16, className = "", ...props }) {
  const IconComponent = Icons[name];
  
  if (!IconComponent) {
    // Fallback if icon name is invalid
    return <Icons.HelpCircle size={size} className={className} {...props} />;
  }

  return <IconComponent size={size} className={className} {...props} />;
}
