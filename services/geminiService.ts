import { GoogleGenAI } from "@google/genai";
import { LogEntry, Service } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeLogFailure = async (log: LogEntry, service?: Service): Promise<string> => {
  if (!apiKey) return "API Key not configured. Unable to analyze.";

  try {
    const prompt = `
      You are a Senior System Administrator and Reliability Engineer (SRE).
      A critical service has failed in our monitoring system (UptimeSHIELD).
      
      Service Details:
      Name: ${service?.name || 'Unknown'}
      Description: ${service?.description || 'N/A'}
      Current Status: ${service?.status || 'Unknown'}
      Failure Count: ${service?.failCount || 0}
      
      Log Entry:
      [${log.timestamp.toISOString()}] [${log.level}] ${log.message}
      
      Please provide a concise analysis:
      1. Likely Root Cause (Technical explanation).
      2. Recommended Troubleshooting Steps (3-4 bullet points).
      3. Severity Assessment (Low/Medium/High/Critical).
      
      Keep the tone professional and technical. Format with Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert IT diagnostics tool embedded in a dashboard.",
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI diagnostics service. Please check your API key and connection.";
  }
};

export const generateHealthReport = async (services: Service[], logs: LogEntry[]): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  try {
    const serviceSummary = services.map(s => `${s.name}: ${s.status} (Failures: ${s.failCount})`).join('\n');
    const recentErrors = logs.filter(l => l.level === 'ERROR').slice(0, 5).map(l => l.message).join('\n');

    const prompt = `
      Generate a brief system health report for the UptimeSHIELD.
      
      Services Status:
      ${serviceSummary}
      
      Recent Critical Errors:
      ${recentErrors}
      
      Provide a summary paragraph on overall system stability and any specific recommendations for maintenance.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Report generation failed.";
  } catch (error) {
    return "Failed to generate health report.";
  }
};