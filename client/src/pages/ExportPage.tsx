import { useState } from 'react';
import { Download, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/axios';
import { DatePicker } from '../components/ui/DatePicker';

export default function ExportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setError(null);
    setNoData(false);

    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const response = await api.get(`/export/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
    } catch (err: any) {
      console.error('Export error:', err);
      if (err.response?.status === 404) {
        setNoData(true);
      } else {
        let message = 'Failed to export data. Please try again.';
        if (err.response?.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const json = JSON.parse(text);
            message = json.message || message;
          } catch {}
        } else if (err.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 z-30 backdrop-blur-sm bg-background/95">
        <h1 className="text-xl font-bold">Export Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download your transaction history
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 pb-24">
        {/* Info Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">CSV Format</h3>
              <p className="text-xs text-muted-foreground">
                Your data will be exported in CSV format, which can be opened in Excel, Google Sheets, or any spreadsheet application.
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Select Date Range
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              max={toDate || undefined}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              min={fromDate || undefined}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Leave empty to export all transactions
          </p>
        </div>

        {/* No Transactions Message */}
        {noData && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                  No Transactions Found
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  There are no transactions in the selected date range. Try adjusting your dates or leave them empty to export all.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-sm text-red-900 dark:text-red-100">
                  Export Failed
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {exportSuccess && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
                  Export Successful!
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Your file has been downloaded to your device.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Transactions
            </>
          )}
        </button>

        {/* What's Included */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-3">What's Included</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Transaction date, type, and amount</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Purpose/category information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Account details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Notes and descriptions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
