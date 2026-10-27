import React, { useState, useEffect } from 'react';
import { X, Database, RefreshCw, Layers, ShieldCheck, Terminal, Copy, Check } from 'lucide-react';
import { DbInspectSummary, DynamoDBRecord } from '../types/ecommerce';
import { getDbInspect, resetDatabase } from '../services/api';

interface DynamoDbInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamoDbInspector: React.FC<DynamoDbInspectorProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<DbInspectSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DynamoDBRecord | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  const fetchInspector = async () => {
    setLoading(true);
    try {
      const summary = await getDbInspect();
      setData(summary);
      if (summary.recentRecords.length > 0 && !selectedRecord) {
        setSelectedRecord(summary.recentRecords[0]);
      }
    } catch (err) {
      console.error('Failed to inspect database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInspector();
    }
  }, [isOpen]);

  const handleReset = async () => {
    if (!confirm('Re-seed the DynamoDB table with default catalog data?')) return;
    setResetting(true);
    try {
      const res = await resetDatabase();
      setData(res);
      if (res.recentRecords.length > 0) setSelectedRecord(res.recentRecords[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  const awsCliCommand = `aws dynamodb create-table \\
  --table-name ApexMegastoreTable \\
  --attribute-definitions \\
      AttributeName=PK,AttributeType=S \\
      AttributeName=SK,AttributeType=S \\
      AttributeName=GSI1PK,AttributeType=S \\
      AttributeName=GSI1SK,AttributeType=S \\
  --key-schema \\
      AttributeName=PK,KeyType=HASH \\
      AttributeName=SK,KeyType=RANGE \\
  --global-secondary-indexes \\
      "[{\\"IndexName\\":\\"GSI1\\",\\"KeySchema\\":[{\\"AttributeName\\":\\"GSI1PK\\",\\"KeyType\\":\\"HASH\\"},{\\"AttributeName\\":\\"GSI1SK\\",\\"KeyType\\":\\"RANGE\\"}],\\"Projection\\":{\\"ProjectionType\\":\\"ALL\\"}}]" \\
  --billing-mode PAY_PER_REQUEST \\
  --region us-east-1`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(awsCliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/70 backdrop-blur-xs flex justify-end">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-850/50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>AWS DynamoDB DocumentClient Inspector</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Single-Table Design
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">Live persistence layer & partition inspector for internship evaluation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchInspector}
              disabled={loading}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Active Mode</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block truncate">
                {data?.activeMode === 'live_aws' ? 'Live AWS Cloud' : 'DocClient Fallback'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Table Name</span>
              <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block truncate">
                {data?.tableName || 'ApexMegastoreTable'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Region</span>
              <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                {data?.region || 'us-east-1'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Total Records</span>
              <span className="font-bold font-mono tabular-nums text-blue-600 mt-0.5 block text-sm">
                {data?.totalItems || 0}
              </span>
            </div>
          </div>

          {/* Entity Breakdown */}
          {data && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center justify-between">
                <span>Single-Table Entity Distribution</span>
                <span className="text-[11px] font-normal text-zinc-400">All entities mapped to PK/SK keys</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(data.entityCounts).map(([entity, count]) => (
                  <div key={entity} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-750">
                    <div className="text-[10px] text-zinc-400 font-medium truncate">{entity}</div>
                    <div className="text-base font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single-Table Schema Pattern Documentation */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/40 space-y-2">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>DynamoDB Single-Table Design Access Patterns</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400">
                    <th className="py-1">Entity</th>
                    <th className="py-1">Partition Key (PK)</th>
                    <th className="py-1">Sort Key (SK)</th>
                    <th className="py-1">GSI1 (PK / SK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                  <tr>
                    <td className="py-1 text-blue-600 font-semibold">Product</td>
                    <td>PRODUCT#&lt;id&gt;</td>
                    <td>METADATA</td>
                    <td>CATEGORY#&lt;cat&gt; / &lt;id&gt;</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-blue-600 font-semibold">Category</td>
                    <td>CATEGORY#&lt;slug&gt;</td>
                    <td>METADATA</td>
                    <td>CATEGORY / &lt;slug&gt;</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-blue-600 font-semibold">Cart Item</td>
                    <td>USER#&lt;userId&gt;</td>
                    <td>CART#&lt;productId&gt;</td>
                    <td>PRODUCT#&lt;pId&gt; / USER#&lt;uId&gt;</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-blue-600 font-semibold">Wishlist</td>
                    <td>USER#&lt;userId&gt;</td>
                    <td>WISH#&lt;productId&gt;</td>
                    <td>PRODUCT#&lt;pId&gt; / USER#&lt;uId&gt;</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-blue-600 font-semibold">Order</td>
                    <td>USER#&lt;userId&gt;</td>
                    <td>ORDER#&lt;orderId&gt;</td>
                    <td>ORDER#&lt;orderId&gt; / &lt;timestamp&gt;</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-amber-600 font-semibold">Amazon PA-API Item</td>
                    <td>PRODUCT#amz-&lt;asin&gt;</td>
                    <td>METADATA</td>
                    <td>CATEGORY#&lt;cat&gt; / &lt;asin&gt;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Records Table & Inspector */}
          {data && data.recentRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Live Table Items ({data.recentRecords.length} inspected)</h3>
                <span className="text-[11px] text-zinc-400">Select an item to view Document payload</span>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono sticky top-0">
                    <tr>
                      <th className="p-2">PK</th>
                      <th className="p-2">SK</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                    {data.recentRecords.map((r, i) => (
                      <tr
                        key={i}
                        onClick={() => setSelectedRecord(r)}
                        className={`cursor-pointer transition-colors ${
                          selectedRecord?.PK === r.PK && selectedRecord?.SK === r.SK
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-semibold'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <td className="p-2 truncate max-w-36">{r.PK}</td>
                        <td className="p-2 truncate max-w-36">{r.SK}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-700">
                            {r.entityType}
                          </span>
                        </td>
                        <td className="p-2 text-zinc-400">{new Date(r.updatedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selected JSON Item Viewer */}
              {selectedRecord && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="font-mono text-[11px]">
                      Selected: {selectedRecord.PK} // {selectedRecord.SK}
                    </span>
                    <span className="text-[10px]">DocumentClient JSON</span>
                  </div>
                  <pre className="p-3 bg-zinc-950 text-zinc-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-56 border border-zinc-800">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* AWS CLI Setup Script for Internship Submission */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-zinc-600" />
                <span>AWS CLI Provisioning Command (One-Click)</span>
              </span>
              <button
                onClick={copyToClipboard}
                className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 cursor-pointer flex items-center gap-1"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCli ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-zinc-900 text-zinc-300 rounded-lg text-[10px] font-mono overflow-x-auto">
              {awsCliCommand}
            </pre>
          </div>

          {/* Reset Action */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500">Need to restore original seed state?</span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold cursor-pointer transition-colors"
            >
              {resetting ? 'Resetting...' : 'Re-seed DynamoDB Table'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
