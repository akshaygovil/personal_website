// lib/formatText.tsx
import React from "react";

/**
 * Parses text with formatting:
 * - \n for line breaks
 * - **text** for bold text
 * 
 * Returns an array of React elements
 */
export function parseFormattedText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split("\n");
  
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<br key={`br-${lineIndex}`} />);
    }
    
    // Parse bold text (**text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    
    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before the bold
      if (match.index > lastIndex) {
        parts.push(
          <React.Fragment key={`text-${lineIndex}-${keyCounter++}`}>
            {line.substring(lastIndex, match.index)}
          </React.Fragment>
        );
      }
      
      // Add bold text
      parts.push(
        <strong key={`bold-${lineIndex}-${keyCounter++}`} style={{ fontWeight: 600 }}>
          {match[1]}
        </strong>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last bold
    if (lastIndex < line.length) {
      parts.push(
        <React.Fragment key={`text-${lineIndex}-${keyCounter++}`}>
          {line.substring(lastIndex)}
        </React.Fragment>
      );
    }
  });
  
  return parts;
}
