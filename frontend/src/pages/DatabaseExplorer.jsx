import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Database, 
  Code, 
  Table, 
  Cpu, 
  GitBranch, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Key, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export default function DatabaseExplorer() {
  const [activeTab, setActiveTab] = useState('queries'); // 'queries', 'tables', 'objects', 'er-diagram'

  // Predefined queries state
  const [queriesList, setQueriesList] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState('query-1');
  const [queryExecution, setQueryExecution] = useState(null);
  const [runningQuery, setRunningQuery] = useState(false);

  // Tables overview state
  const [tablesData, setTablesData] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // Database objects state
  const [dbObjects, setDbObjects] = useState(null);
  const [objectsLoading, setObjectsLoading] = useState(false);

  // Load predefined queries
  useEffect(() => {
    const loadQueries = async () => {
      try {
        const res = await api.get('/explorer/queries');
        setQueriesList(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedQueryId(res.data.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching query catalog', err);
      }
    };
    loadQueries();
  }, []);

  // Load tables overview
  useEffect(() => {
    if (activeTab === 'tables' && tablesData.length === 0) {
      const loadTables = async () => {
        setTablesLoading(true);
        try {
          const res = await api.get('/explorer/tables');
          setTablesData(res.data.data);
        } catch (err) {
          console.error(err);
        } finally {
          setTablesLoading(false);
        }
      };
      loadTables();
    }
  }, [activeTab]);

  // Load database objects (views, procedures, triggers)
  useEffect(() => {
    if (activeTab === 'objects' && !dbObjects) {
      const loadObjects = async () => {
        setObjectsLoading(true);
        try {
          const res = await api.get('/explorer/objects');
          setDbObjects(res.data.data);
        } catch (err) {
          console.error(err);
        } finally {
          setObjectsLoading(false);
        }
      };
      loadObjects();
    }
  }, [activeTab]);

  const currentQuery = queriesList.find(q => q.id === selectedQueryId);

  // Execute Predefined Query
  const handleExecuteQuery = async () => {
    if (!selectedQueryId) return;
    setRunningQuery(true);
    setQueryExecution(null);
    try {
      const res = await api.post('/explorer/run-query', { queryId: selectedQueryId });
      setQueryExecution(res.data);
    } catch (err) {
      alert(`Query execution failed: ${err.message}`);
    } finally {
      setRunningQuery(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-600" />
              <span>Database Explorer & SQL Insights Module</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive demonstration of relational database design, joins, subqueries, views, procedures, and triggers on MySQL 8.0
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>RDBMS: MySQL 8.0 (InnoDB)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setActiveTab('queries')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'queries'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>SQL Query Library (17 Demos)</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'tables'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table Schema & Constraints</span>
          </button>

          <button
            onClick={() => setActiveTab('objects')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'objects'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Procedures, Triggers & Views</span>
          </button>

          <button
            onClick={() => setActiveTab('er-diagram')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'er-diagram'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>ER & Relational Model</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PREDEFINED SQL QUERIES */}
      {activeTab === 'queries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Query Selector Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-2 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Predefined Query Catalog ({queriesList.length})
            </h3>
            <div className="space-y-1">
              {queriesList.map((q) => {
                const isSelected = q.id === selectedQueryId;
                return (
                  <button
                    key={q.id}
                    onClick={() => { setSelectedQueryId(q.id); setQueryExecution(null); }}
                    className={`w-full text-left px-3 py-2.5 rounded text-xs transition-colors border ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold shadow-xs'
                        : 'border-transparent text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{q.category}</span>
                      <span className="text-[10px] text-slate-400">#{q.id}</span>
                    </div>
                    <div className="truncate mt-0.5">{q.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query Details & Execution Window */}
          <div className="lg:col-span-8 space-y-4">
            {currentQuery && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                      {currentQuery.category}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">{currentQuery.title}</h2>
                    <p className="text-xs text-slate-600 mt-1">{currentQuery.purpose}</p>
                  </div>

                  <button
                    onClick={handleExecuteQuery}
                    disabled={runningQuery}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {runningQuery ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Run Query on MySQL</span>
                  </button>
                </div>

                {/* Concepts & Tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Tables Involved</span>
                    <div className="flex flex-wrap gap-1">
                      {currentQuery.tablesInvolved.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">SQL Concepts Demonstrated</span>
                    <div className="flex flex-wrap gap-1">
                      {currentQuery.concepts.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded text-[11px] font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SQL Code View */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">Executed SQL Statement</span>
                    <span className="text-[10px] text-slate-400 font-mono">Parameterized Prepared Statement</span>
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto shadow-inner leading-relaxed">
                    {currentQuery.sql}
                  </pre>
                </div>

                {/* Live Query Results */}
                {queryExecution && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-900">Execution Successful</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                        <span>Time: <strong>{queryExecution.executionTimeMs} ms</strong></span>
                        <span>Rows: <strong>{queryExecution.rowCount}</strong></span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded overflow-hidden max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                          <tr>
                            {queryExecution.columns.map((col) => (
                              <th key={col} className="px-3 py-2 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {queryExecution.data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              {queryExecution.columns.map((col) => (
                                <td key={col} className="px-3 py-1.5 whitespace-nowrap text-slate-700">
                                  {row[col] === null ? <span className="text-slate-400 italic">NULL</span> : String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TABLE OVERVIEW & SCHEMA */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {tablesLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
              Inspecting MySQL information_schema...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tablesData.map((table) => (
                <div key={table.tableName} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-sky-600" />
                        <h3 className="text-sm font-bold text-slate-900 font-mono">{table.tableName}</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[10px] font-semibold">
                        {table.totalRows} Records
                      </span>
                    </div>

                    <div className="p-4 space-y-3">
                      <p className="text-xs text-slate-600">{table.description}</p>

                      <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-600 font-semibold">
                            <tr>
                              <th className="px-2.5 py-1.5">Column</th>
                              <th className="px-2.5 py-1.5">Type</th>
                              <th className="px-2.5 py-1.5">Key</th>
                              <th className="px-2.5 py-1.5">Nullable</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {table.columns.map((c) => (
                              <tr key={c.COLUMN_NAME} className="hover:bg-slate-50">
                                <td className="px-2.5 py-1.5 font-semibold text-slate-800">{c.COLUMN_NAME}</td>
                                <td className="px-2.5 py-1.5 text-slate-500">{c.COLUMN_TYPE}</td>
                                <td className="px-2.5 py-1.5">
                                  {c.COLUMN_KEY === 'PRI' ? (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">PK</span>
                                  ) : c.COLUMN_KEY === 'UNI' ? (
                                    <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded text-[9px] font-bold">UQ</span>
                                  ) : c.COLUMN_KEY === 'MUL' ? (
                                    <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold">FK</span>
                                  ) : '—'}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-500 text-[10px]">{c.IS_NULLABLE}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Foreign Key references */}
                  {table.keys.some(k => k.REFERENCED_TABLE_NAME) && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-600 font-mono">
                      <span className="font-semibold text-slate-700">Foreign Keys: </span>
                      {table.keys.filter(k => k.REFERENCED_TABLE_NAME).map((k, i) => (
                        <span key={i} className="mr-2">
                          {k.COLUMN_NAME} &rarr; {k.REFERENCED_TABLE_NAME}({k.REFERENCED_COLUMN_NAME})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATABASE OBJECTS (VIEWS, PROCEDURES, TRIGGERS, INDEXES) */}
      {activeTab === 'objects' && (
        <div className="space-y-6">
          {objectsLoading || !dbObjects ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mr-2" />
              Loading database objects from MySQL catalog...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Stored Procedures */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-600" />
                    <span>Stored Procedures ({dbObjects.procedures.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">ACID Transactions</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {dbObjects.procedures.map((p) => (
                    <div key={p.ProcedureName} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{p.ProcedureName}</span>
                        <span className="text-slate-400 text-[11px] block">Type: {p.RoutineType}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-mono text-[10px]">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Views */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span>SQL Views ({dbObjects.views.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">information_schema.VIEWS</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {dbObjects.views.map((v) => (
                    <div key={v.ViewName} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{v.ViewName}</span>
                        <span className="text-slate-400 text-[11px] block truncate max-w-sm">Virtual relation for reporting</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px]">
                        View
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Database Triggers ({dbObjects.triggers.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Declarative Integrity</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {dbObjects.triggers.map((t) => (
                    <div key={t.TriggerName} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{t.TriggerName}</span>
                        <span className="text-slate-500 text-[11px] block">
                          {t.Timing} {t.Event} ON <span className="font-mono font-medium">{t.TargetTable}</span>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px]">
                        Trigger
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indexes */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600" />
                    <span>Secondary Indexes ({dbObjects.indexes.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">B-Tree Optimization</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {dbObjects.indexes.map((idx, i) => (
                    <div key={i} className="py-2 flex justify-between items-center font-mono text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-900">{idx.IndexName}</span>
                        <span className="text-slate-400 text-[10px] block">Table: {idx.TableName} ({idx.Columns})</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {idx.IsUnique ? 'UNIQUE' : 'INDEX'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ER & RELATIONAL SCHEMA DIAGRAM */}
      {activeTab === 'er-diagram' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Entity-Relationship & Cardinality Diagram</h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing the 6 core entities, primary keys (PK), foreign keys (FK), and 1-to-Many relational cardinalities
              </p>
            </div>

            {/* Visual Schema Cards Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Publisher Entity */}
              <div className="border-2 border-sky-600 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-sky-600 text-white px-4 py-2 font-bold font-mono text-xs flex justify-between">
                  <span>Publisher</span>
                  <span className="text-[10px] opacity-80">Parent</span>
                </div>
                <div className="p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center gap-1 font-bold text-amber-700">
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>PublisherID (PK, INT)</span>
                  </div>
                  <div className="text-slate-700 pl-4">PublisherName (UQ, VARCHAR)</div>
                  <div className="text-slate-400 pl-4">CreatedAt (TIMESTAMP)</div>
                </div>
                <div className="bg-sky-50 px-3 py-1.5 border-t border-sky-100 text-[10px] text-sky-800 text-center font-medium">
                  1 : N &rarr; Books (Publishes)
                </div>
              </div>

              {/* Books Entity */}
              <div className="border-2 border-indigo-600 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-indigo-600 text-white px-4 py-2 font-bold font-mono text-xs flex justify-between">
                  <span>Books</span>
                  <span className="text-[10px] opacity-80">Catalog</span>
                </div>
                <div className="p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center gap-1 font-bold text-amber-700">
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>ISBN (PK, VARCHAR)</span>
                  </div>
                  <div className="text-slate-700 pl-4">Title (VARCHAR)</div>
                  <div className="text-slate-700 pl-4">AuthorName (VARCHAR)</div>
                  <div className="text-indigo-700 pl-4 font-semibold">PublisherID (FK &rarr; Publisher)</div>
                  <div className="text-slate-700 pl-4">Price (DECIMAL)</div>
                  <div className="text-slate-700 pl-4">TotalCopies (INT)</div>
                  <div className="text-emerald-700 pl-4 font-bold">AvailableCopies (INT)</div>
                </div>
                <div className="bg-indigo-50 px-3 py-1.5 border-t border-indigo-100 text-[10px] text-indigo-800 text-center font-medium">
                  1 : N &rarr; BookIssued (Circulation)
                </div>
              </div>

              {/* Staff Entity */}
              <div className="border-2 border-teal-600 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-teal-600 text-white px-4 py-2 font-bold font-mono text-xs flex justify-between">
                  <span>Staff</span>
                  <span className="text-[10px] opacity-80">Personnel</span>
                </div>
                <div className="p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center gap-1 font-bold text-amber-700">
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>StaffID (PK, INT)</span>
                  </div>
                  <div className="text-slate-700 pl-4">Name (VARCHAR)</div>
                  <div className="text-slate-700 pl-4">Post (VARCHAR)</div>
                  <div className="text-slate-700 pl-4">Email (UQ, VARCHAR)</div>
                  <div className="text-slate-700 pl-4">Role (ENUM)</div>
                  <div className="text-slate-700 pl-4">IsActive (BOOLEAN)</div>
                </div>
                <div className="bg-teal-50 px-3 py-1.5 border-t border-teal-100 text-[10px] text-teal-800 text-center font-medium">
                  Authorizes Issues, Returns & Receipts
                </div>
              </div>

              {/* Member Entity */}
              <div className="border-2 border-blue-600 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-blue-600 text-white px-4 py-2 font-bold font-mono text-xs flex justify-between">
                  <span>Member</span>
                  <span className="text-[10px] opacity-80">Patron</span>
                </div>
                <div className="p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center gap-1 font-bold text-amber-700">
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>MemberID (PK, INT)</span>
                  </div>
                  <div className="text-slate-700 pl-4">Name (VARCHAR)</div>
                  <div className="text-slate-700 pl-4">Email (UQ, VARCHAR)</div>
                  <div className="text-slate-700 pl-4">ContactNo (VARCHAR)</div>
                  <div className="text-slate-700 pl-4">MembershipStatus (ENUM)</div>
                  <div className="text-slate-400 pl-4">JoinDate (DATE)</div>
                </div>
                <div className="bg-blue-50 px-3 py-1.5 border-t border-blue-100 text-[10px] text-blue-800 text-center font-medium">
                  1 : N &rarr; BookIssued & Receipts
                </div>
              </div>

              {/* BookIssued (Associative Entity) */}
              <div className="border-2 border-amber-600 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-amber-600 text-white px-4 py-2 font-bold font-mono text-xs flex justify-between">
                  <span>BookIssued</span>
                  <span className="text-[10px] opacity-80">Associative</span>
                </div>
                <div className="p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center gap-1 font-bold text-amber-700">
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>IssueID (PK, INT)</span>
                  </div>
                  <div className="text-blue-700 pl-4 font-semibold">MemberID (FK &rarr; Member)</div>
                  <div className="text-indigo-700 pl-4 font-semibold">ISBN (FK &rarr; Books)</div>
                  <div className="text-teal-700 pl-4 font-semibold">IssuedBy (FK &rarr; Staff)</div>
                  <div className="text-teal-700 pl-4 font-semibold">ReturnedBy (FK &rarr; Staff)</div>
                  <div className="text-slate-700 pl-4">IssueDate, DueDate, ReturnDate</div>
                  <div className="text-slate-700 pl-4">Status (ENUM)</div>
                  <div className="text-rose-700 pl-4 font-bold">FineAmount, FinePaidAmount</div>
                </div>
                <div className="bg-amber-50 px-3 py-1.5 border-t border-amber-100 text-[10px] text-amber-800 text-center font-medium">
                  Resolves Many-to-Many Borrowing
                </div>
              </div>

              {/* Receipt Entity */}
              <div className="border-2 border-emerald-600 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-emerald-600 text-white px-4 py-2 font-bold font-mono text-xs flex justify-between">
                  <span>Receipt</span>
                  <span className="text-[10px] opacity-80">Financial Ledger</span>
                </div>
                <div className="p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center gap-1 font-bold text-amber-700">
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>ReceiptID (PK, INT)</span>
                  </div>
                  <div className="text-slate-700 pl-4">TransactionID (UQ, VARCHAR)</div>
                  <div className="text-blue-700 pl-4 font-semibold">MemberID (FK &rarr; Member)</div>
                  <div className="text-teal-700 pl-4 font-semibold">StaffID (FK &rarr; Staff)</div>
                  <div className="text-amber-700 pl-4 font-semibold">IssueID (FK &rarr; BookIssued)</div>
                  <div className="text-slate-700 pl-4">TransactionType (ENUM)</div>
                  <div className="text-emerald-700 pl-4 font-bold">Amount (DECIMAL)</div>
                  <div className="text-slate-700 pl-4">PaymentStatus (ENUM)</div>
                </div>
                <div className="bg-emerald-50 px-3 py-1.5 border-t border-emerald-100 text-[10px] text-emerald-800 text-center font-medium">
                  ACID Financial Transactions
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
