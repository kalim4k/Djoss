import { ParseResult, WhatsAppParticipant } from '../types';

export function parseWhatsAppTxt(content: string): ParseResult {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: "Le fichier est vide. S'il te plaît, importe un vrai export de chat WhatsApp .txt.",
      participants: [],
      messageCount: 0,
      rawText: ""
    };
  }

  // Regex to detect message starts
  // Match Android: "15/03/2026, 14:32 - Moussa: Salut" or "15/03/26 14:32 - Moussa:"
  // Match iOS: "[15/03/2026, 14:32:10] Moussa: Salut" or "[15/03/2026, 14:32] Moussa:"
  // Standard format check: we look for timestamps and colon combinations
  const lines = content.split(/\r?\n/);
  
  const participantCountMap: Record<string, number> = {};
  let validMessageCount = 0;
  const processedLines: string[] = [];

  // Robust regex for various dates/times formatting (supporting à, at, spaces, commas, etc.)
  const messageRegex = /^(?:\[?(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4})(?:,\s+à\s+|,\s+at\s+|,\s+|\s+à\s+|\s+at\s+|\s+)(\d{1,2}[:.]\d{1,2}(?::\d{1,2})?)(?:\s*[APap][Mm])?\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*))$/;

  // Fallback regex for standard iOS brackets: [15/03/2026, 14:32:10] Sender: Message
  const bracketRegex = /^\[?(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}),?\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*)$/;

  // Ultimate fallback regex for any line starting with timestamp info followed by "Sender: Message"
  const fallbackRegex = /^\[?(?:\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{1,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}).*?\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*)$/;

  for (const line of lines) {
    // Remove LTR/RTL invisible markers common in iOS exports
    const cleanLine = line.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
    let sender = "";
    let text = "";
    let matched = false;

    // Try primary regex
    const match = cleanLine.match(messageRegex);
    if (match) {
      sender = match[3].trim();
      text = match[4].trim();
      matched = true;
    } else {
      // Try bracket regex
      const matchBracket = cleanLine.match(bracketRegex);
      if (matchBracket) {
        sender = matchBracket[3].trim();
        text = matchBracket[4].trim();
        matched = true;
      } else {
        // Try ultimate fallback
        const matchFallback = cleanLine.match(fallbackRegex);
        if (matchFallback) {
          sender = matchFallback[1].trim();
          text = matchFallback[2].trim();
          // Verify we don't have too many spaces in sender (sender is usually a short name or phone number)
          if (sender.length < 40 && sender.split(/\s+/).length <= 5 && !sender.includes('  ')) {
            matched = true;
          }
        }
      }
    }

    if (matched) {
      const senderLower = sender.toLowerCase();
      const textLower = text.toLowerCase();
      
      // Filter out system messages like "Les messages et les appels sont chiffres...", "Moussa a change le numero...", etc.
      if (
        senderLower.includes('whatsapp') || 
        senderLower.includes('système') ||
        senderLower.includes('chiffré') ||
        senderLower.includes('chiffre') ||
        textLower.includes('chiffrés') ||
        textLower.includes('chiffres') ||
        textLower.includes('a créé le groupe') ||
        textLower.includes('créé ce groupe') ||
        textLower.includes('a été ajouté') ||
        textLower.includes('vous a ajouté') ||
        textLower.includes('a quitté') ||
        textLower.includes('a rejoint') ||
        textLower.includes('supprimé')
      ) {
        continue;
      }

      participantCountMap[sender] = (participantCountMap[sender] || 0) + 1;
      validMessageCount++;
      processedLines.push(`${sender}: ${text}`);
    } else {
      // It might be a continuation of the previous message
      if (processedLines.length > 0 && cleanLine.length > 0) {
        processedLines[processedLines.length - 1] += ` ${cleanLine}`;
      }
    }
  }

  // Validate the parse results
  if (validMessageCount < 5) {
    return {
      isValid: false,
      error: "Nous n'avons pas pu détecter d'échanges de messages valides dans ce fichier. Assure-toi d'importer un fichier .txt généré par l'option 'Exporter la discussion' de WhatsApp sans médias.",
      participants: [],
      messageCount: 0,
      rawText: ""
    };
  }

  const participants: WhatsAppParticipant[] = Object.entries(participantCountMap).map(([name, count]) => ({
    name,
    messageCount: count,
    percentage: Math.round((count / validMessageCount) * 100)
  })).sort((a, b) => b.messageCount - a.messageCount);

  // Limit rawText to the last 400 messages to prevent hitting token limits
  // but keep the conversation flow order (oldest to newest)
  const maxMessages = 400;
  const sampleLines = processedLines.slice(-maxMessages);
  const sampleText = sampleLines.join('\n');

  return {
    isValid: true,
    participants,
    messageCount: validMessageCount,
    rawText: sampleText
  };
}
