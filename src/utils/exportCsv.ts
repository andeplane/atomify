import { Data1D } from "../types";

/**
 * Converts plot data to CSV format
 * @param data1D - The 1D plot data containing data rows and column labels
 * @param filename - Optional filename for the downloaded CSV file
 * @returns CSV string
 */
export function plotDataToCsv(data1D: Data1D): string {
  const { data, labels } = data1D;
  
  // Handle empty data
  if (!data || data.length === 0) {
    return labels.join(",") + "\n";
  }
  
  // Create CSV header from labels
  const header = labels.join(",");
  
  // Create CSV rows from data
  const rows = data.map((row) => row.join(","));
  
  // Combine header and rows
  return [header, ...rows].join("\n");
}

/**
 * Exports plot data to a CSV file and triggers download
 * @param data1D - The 1D plot data containing data rows and column labels
 * @param filename - The filename for the downloaded CSV file (default: "plot-data.csv")
 */
export function exportPlotDataToCsv(data1D: Data1D, filename = "plot-data.csv"): void {
  const csv = plotDataToCsv(data1D);
  
  // Create a blob from the CSV string
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  
  // Create a temporary link element to trigger download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}
